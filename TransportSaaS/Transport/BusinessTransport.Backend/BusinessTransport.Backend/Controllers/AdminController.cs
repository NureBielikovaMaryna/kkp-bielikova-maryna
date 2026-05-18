using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;
using BusinessTransport.Backend.DTOs;

namespace BusinessTransport.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // ДОПОМІЖНИЙ МЕТОД: Шукаємо компанію Адміна
        private async Task<Company?> GetAdminCompany(int adminId)
        {
            return await _context.Companies.FirstOrDefaultAsync(c => c.AdminId == adminId);
        }

        // ==========================================
        // БЛОК 1: КЕРУВАННЯ ВОДІЯМИ
        // ==========================================

        // 1. ЗАПРОСИТИ ВОДІЯ

        [HttpPost("add-driver")]
        public async Task<IActionResult> AddDriver([FromBody] CreateDriverDto request)
        {
            var company = await GetAdminCompany(request.AdminId);
            if (company == null) return Unauthorized(new { message = "Компанію для цього адміна не знайдено." });

            if (await _context.Users.AnyAsync(u => u.Email == request.DriverEmail))
                return BadRequest(new { message = "Цей Email вже є в системі!" });

            var newDriver = new User
            {
                Name = request.DriverName,
                Email = request.DriverEmail,
                Role = UserRole.Driver,
                CompanyId = company.Id,
                IsActivated = false
            };

            _context.Users.Add(newDriver);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Водія {request.DriverName} додано. Він може активувати свій акаунт." });
        }

        // 2 ЗВІЛЬНИТИ (ВИДАЛИТИ) ВОДІЯ ЗОВСІМ
        [HttpDelete("fire-driver/{adminId}/{driverId}")]
        public async Task<IActionResult> FireDriver(int adminId, int driverId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var driver = await _context.Users.FirstOrDefaultAsync(u => u.Id == driverId && u.CompanyId == company.Id && u.Role == UserRole.Driver);
            if (driver == null) return NotFound(new { message = "Водія не знайдено." });

            // Шукаємо всі майбутні рейси цього водія і знімаємо його з них
            var trips = await _context.TripInstances.Where(t => t.DriverId == driver.Id && t.Status == TripStatus.Scheduled).ToListAsync();
            foreach (var trip in trips)
            {
                trip.DriverId = null;
            }

            _context.Users.Remove(driver);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Водія {driver.Name} успішно звільнено." });
        }

        // 3. СПИСОК ВОДІЇВ ТА ЇХНІ АВТОБУСИ
        [HttpGet("drivers-list/{adminId}")]
        public async Task<IActionResult> GetDriversList(int adminId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var drivers = await _context.Users
                .Where(u => u.CompanyId == company.Id && u.Role == UserRole.Driver)
                .Select(d => new
                {
                    DriverId = d.Id,
                    DriverName = d.Name,
                    DriverEmail = d.Email,
                    IsActivated = d.IsActivated,
                    // Замість одного автобуса, тепер показуємо кількість майбутніх рейсів у водія
                    UpcomingTripsCount = _context.TripInstances.Count(t => t.DriverId == d.Id && t.Status == TripStatus.Scheduled)
                })
                .ToListAsync();

            return Ok(drivers);
        }

        

        // ==========================================
        // БЛОК 2: РОЗКЛАДИ ТА ПРИЗНАЧЕННЯ (PRO-ЛОГІКА)
        // ==========================================
        
        // ГЕНЕРАЦІЯ РОЗКЛАДУ (Створення конкретних рейсів по датах)
        // Диспетчер (Адмін) вибирає дати в календарі, а система автоматично 
        // створює фізичні "Екземпляри рейсів" (TripInstance) для автобуса.
        [HttpPost("generate-schedule")]
        public async Task<IActionResult> GenerateSchedule([FromBody] GenerateScheduleDto request)
        {
            var company = await GetAdminCompany(request.AdminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var train = await _context.Trains.FirstOrDefaultAsync(t => t.Id == request.TrainId && t.CompanyId == company.Id);
            if (train == null) return NotFound(new { message = "Автобус не знайдено." });

            int createdCount = 0;
            foreach (var date in request.Dates)
            {
                bool exists = await _context.TripInstances.AnyAsync(t => t.TrainId == train.Id && t.Date.Date == date.Date);
                if (!exists)
                {
                    _context.TripInstances.Add(new TripInstance
                    {
                        TrainId = train.Id,
                        Date = date.Date,
                        Status = TripStatus.Scheduled
                    });
                    createdCount++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Успішно створено {createdCount} нових рейсів для автобуса {train.Number}!" });
        }

        // DELETE: api/Admin/delete-trip/{adminId}/{tripId}
        [HttpDelete("delete-trip/{adminId}/{tripId}")]
        public async Task<IActionResult> DeleteTripInstance(int adminId, int tripId)
        {
            // Знаходимо рейс у базі
            var tripInstance = await _context.TripInstances.FindAsync(tripId);

            if (tripInstance == null)
            {
                return NotFound(new { message = "Рейс не знайдено" });
            }

            // Додаткова перевірка безпеки (опціонально: чи належить рейс цьому адміну)
            // if (tripInstance.AdminId != adminId) return Forbid();

            _context.TripInstances.Remove(tripInstance);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Рейс успішно видалено" });
        }

        // ПЕРЕГЛЯД РОЗКЛАДУ АВТОБУСА (Для панелі Адміністратора)
        // Повертає всі дати, на які цей автобус має виїхати, і показує статус 
        // укомплектованості персоналом (чи призначено водія на конкретний день).
        [HttpGet("train-schedule/{adminId}/{trainId}")]
        public async Task<IActionResult> GetTrainSchedule(int adminId, int trainId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var trips = await _context.TripInstances
                .Include(t => t.Driver)
                .Where(t => t.TrainId == trainId && t.Train.CompanyId == company.Id)
                .OrderBy(t => t.Date)
                .Select(t => new
                {
                    t.Id,
                    Date = t.Date.ToString("yyyy-MM-dd"),
                    Status = t.Status.ToString(),
                    HasDriver = t.DriverId != null,
                    DriverName = t.Driver != null ? t.Driver.Name : "НЕ ПРИЗНАЧЕНО",
                    t.DelayMinutes
                })
                .ToListAsync();

            return Ok(trips);
        }

        // 4. ПРИЗНАЧИТИ ВОДІЯ НА АВТОБУС
        [HttpPost("assign-driver-to-trip")]
        public async Task<IActionResult> AssignDriverToTrip([FromBody] AssignDriverToTripDto request)
        {
            var company = await GetAdminCompany(request.AdminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var trip = await _context.TripInstances.FirstOrDefaultAsync(t => t.Id == request.TripInstanceId && t.Train.CompanyId == company.Id);
            var driver = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.DriverId && u.CompanyId == company.Id && u.Role == UserRole.Driver);

            if (trip == null || driver == null) return NotFound(new { message = "Рейс або Водія не знайдено." });

            bool isDriverBusy = await _context.TripInstances.AnyAsync(t => t.DriverId == driver.Id && t.Date.Date == trip.Date.Date);
            if (isDriverBusy) return BadRequest(new { message = "Цей водій вже призначений на інший рейс у цю дату!" });

            trip.DriverId = driver.Id;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Водія {driver.Name} успішно призначено на рейс {trip.Date:dd.MM.yyyy}!" });
        }

        // 5 ЗНЯТИ ВОДІЯ З МАРШРУТУ
        [HttpPost("unassign-driver-from-trip/{adminId}/{tripInstanceId}")]
        public async Task<IActionResult> UnassignDriverFromTrip(int adminId, int tripInstanceId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var trip = await _context.TripInstances.FirstOrDefaultAsync(t => t.Id == tripInstanceId && t.Train.CompanyId == company.Id);
            if (trip == null) return NotFound(new { message = "Рейс не знайдено." });

            trip.DriverId = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Водія знято з цього рейсу." });
        }

        // ==========================================
        // БЛОК 3: АНАЛІТИКА
        // ==========================================
        [HttpGet("analytics/{adminId}")]
        public async Task<IActionResult> GetAnalytics(int adminId)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.AdminId == adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            // 1. ЗАГАЛЬНЕ СЕРЕДНЄ ЗАПІЗНЕННЯ ВСІЄЇ КОМПАНІЇ
            var companyAverageDelay = await _context.TripInstances
                .Where(t => t.Train.CompanyId == company.Id && t.Status == TripStatus.Completed)
                .AnyAsync()
                ? Math.Round(await _context.TripInstances
                    .Where(t => t.Train.CompanyId == company.Id && t.Status == TripStatus.Completed)
                    .AverageAsync(t => t.DelayMinutes), 1)
                : 0;

            // 2. РЕЙТИНГ ВОДІЇВ (За середнім запізненням)
            var driverPerformance = await _context.Users
                .Where(u => u.CompanyId == company.Id && u.Role == UserRole.Driver)
                .Select(d => new
                {
                    d.Name,
                    TotalCompletedTrips = _context.TripInstances.Count(t => t.DriverId == d.Id && t.Status == TripStatus.Completed),
                    AverageDelayMinutes = _context.TripInstances
                        .Where(t => t.DriverId == d.Id && t.Status == TripStatus.Completed)
                        .Any()
                        ? Math.Round(_context.TripInstances.Where(t => t.DriverId == d.Id && t.Status == TripStatus.Completed).Average(t => t.DelayMinutes), 1)
                        : 0
                })
                .OrderBy(d => d.AverageDelayMinutes)
                .ToListAsync();

            // 3. РЕЙТИНГ АВТОБУСІВ (Популярність + запізнення самого автобуса)
            var fleetPerformance = await _context.Trains
                .Where(t => t.CompanyId == company.Id)
                .Select(t => new
                {
                    TrainInfo = $"{t.Name} ({t.Number})",
                    TotalBookings = _context.Bookings.Count(b => b.Trip.TrainId == t.Id),
                    // СЕРЕДНЄ ЗАПІЗНЕННЯ САМЕ ЦЬОГО АВТОБУСА
                    AverageDelayMinutes = _context.TripInstances
                        .Where(ti => ti.TrainId == t.Id && ti.Status == TripStatus.Completed)
                        .Any()
                        ? Math.Round(_context.TripInstances.Where(ti => ti.TrainId == t.Id && ti.Status == TripStatus.Completed).Average(ti => ti.DelayMinutes), 1)
                        : 0,
                    OccupancyRate = t.TotalSeats > 0
                        ? Math.Round((double)_context.Bookings.Count(b => b.Trip.TrainId == t.Id) / (Math.Max(1, _context.TripInstances.Count(ti => ti.TrainId == t.Id)) * t.TotalSeats) * 100, 1)
                        : 0
                })
                .OrderByDescending(f => f.TotalBookings)
                .ToListAsync();

            // 4. ФІНАЛЬНИЙ ОБ'ЄКТ (Твоя база + нова аналітика)
            var stats = new
            {
                CompanyName = company.Name,
                GlobalCompanyAverageDelay = companyAverageDelay, // Загальний показник фірми

                Fleet = new
                {
                    TotalTrains = await _context.Trains.CountAsync(t => t.CompanyId == company.Id),
                    DelayedTrips = await _context.TripInstances.CountAsync(t => t.Train.CompanyId == company.Id && t.DelayMinutes > 0 && t.Status == TripStatus.InProgress)
                },
                Personnel = new
                {
                    TotalDrivers = await _context.Users.CountAsync(u => u.CompanyId == company.Id && u.Role == UserRole.Driver),
                    DriversOnRouteToday = await _context.TripInstances.CountAsync(t => t.Train.CompanyId == company.Id && t.Date.Date == today && t.DriverId != null && t.Status == TripStatus.InProgress)
                },
                Sales = new
                {
                    TotalBookings = await _context.Bookings.CountAsync(b => b.Trip.Train.CompanyId == company.Id),
                    BookingsToday = await _context.Bookings.CountAsync(b => b.Trip.Train.CompanyId == company.Id && b.BookedAt.Date == today)
                },
                Operations = new
                {
                    TotalCompletedTrips = await _context.TripInstances.CountAsync(t => t.Train.CompanyId == company.Id && t.Status == TripStatus.Completed),
                    TripsCompletedToday = await _context.TripInstances.CountAsync(t => t.Train.CompanyId == company.Id && t.Status == TripStatus.Completed && t.ActualEndTime.Value.Date == today)
                },

                DriverPerformanceRanking = driverPerformance,
                FleetPerformanceRanking = fleetPerformance
            };

            return Ok(stats);
        }

        

        // ==========================================
        // БЛОК 4: КЕРУВАННЯ АВТОБУСАМИ (Залізо)
        // ==========================================

        // ДОДАТИ АВТОБУС 
        [HttpPost("add-train")]
        public async Task<IActionResult> AddTrain([FromBody] CreateTrainDto request)
        {
            var company = await GetAdminCompany(request.AdminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var newTrain = new Train
            {
                Name = request.Name,
                Number = request.Number,
                TotalSeats = request.TotalSeats,
                CompanyId = company.Id
            };

            _context.Trains.Add(newTrain);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Автобус '{request.Name}' ({request.Number}) успішно створено!", trainId = newTrain.Id });
        }

        //РЕДАГУВАТИ АВТОБУС
        [HttpPut("edit-train/{adminId}/{trainId}")]

        public async Task<IActionResult> EditTrain(int adminId, int trainId, [FromBody] EditTrainDto request)

        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var train = await _context.Trains.FirstOrDefaultAsync(t => t.Id == trainId && t.CompanyId == company.Id);
            if (train == null) return NotFound(new { message = "Автобус не знайдено." });

            train.Name = request.NewName;
            train.Number = request.NewNumber;
            train.TotalSeats = request.NewTotalSeats;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Дані автобуса оновлено! Назва: {train.Name}, Номер: {train.Number}, Місць: {train.TotalSeats}" });
        }


        //ВИДАЛИТИ АВТОБУС
        [HttpDelete("delete-train/{adminId}/{trainId}")]
        public async Task<IActionResult> DeleteTrain(int adminId, int trainId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var train = await _context.Trains.FirstOrDefaultAsync(t => t.Id == trainId && t.CompanyId == company.Id);
            if (train == null) return NotFound(new { message = "Автобус не знайдено." });

            _context.Trains.Remove(train);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Автобус {train.Number} та всі його дані успішно видалено." });
        }

        // ПОСМОТРЕТЬ ВСЕ АВТОБУСЫ КОМПАНИИ
        [HttpGet("my-trains/{adminId}")]
        public async Task<IActionResult> GetMyTrains(int adminId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var trains = await _context.Trains
                .Where(t => t.CompanyId == company.Id)
                .Select(t => new {
                    t.Id,
                    t.Name,
                    t.Number,
                    t.TotalSeats
                    // DelayMinutes та DriverId тут більше немає, бо вони тепер у TripInstance
                })
                .ToListAsync();

            return Ok(trains);
        }

        // ==========================================
        // БЛОК 5: КЕРУВАННЯ СТАНЦІЯМИ
        // ==========================================

        [HttpPost("add-station")]
        public async Task<IActionResult> AddStation([FromBody] CreateStationDto request)
        {
            var company = await GetAdminCompany(request.AdminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var station = new Station
            {
                Name = request.Name,
                CompanyId = company.Id
            };

            _context.Stations.Add(station);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Станцію '{station.Name}' створено!", stationId = station.Id });
        }

        [HttpGet("my-stations/{adminId}")]
        public async Task<IActionResult> GetMyStations(int adminId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var stations = await _context.Stations
                .Where(s => s.CompanyId == company.Id)
                .ToListAsync();

            return Ok(stations);
        }


        [HttpPut("edit-station/{adminId}/{stationId}")]
        public async Task<IActionResult> EditStation(int adminId, int stationId, [FromBody] EditStationDto request)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var station = await _context.Stations.FirstOrDefaultAsync(s => s.Id == stationId && s.CompanyId == company.Id);
            if (station == null) return NotFound(new { message = "Станцію не знайдено." });

            // Беремо нову назву з нашого DTO
            station.Name = request.NewName;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Назву станції оновлено!" });
        }

        

        [HttpDelete("delete-station/{adminId}/{stationId}")]
        public async Task<IActionResult> DeleteStation(int adminId, int stationId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var station = await _context.Stations.FirstOrDefaultAsync(s => s.Id == stationId && s.CompanyId == company.Id);
            if (station == null) return NotFound(new { message = "Станцію не знайдено." });

            _context.Stations.Remove(station);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Станцію видалено." });
        }

        // ==========================================
        // БЛОК 6: КЕРУВАННЯ МАРШРУТАМИ (Зупинки автобуса)
        // ==========================================

        [HttpPost("add-route-stop")]
        public async Task<IActionResult> AddRouteStop([FromBody] CreateRouteStopDto request)
        {
            var company = await GetAdminCompany(request.AdminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var train = await _context.Trains.FirstOrDefaultAsync(t => t.Id == request.TrainId && t.CompanyId == company.Id);
            var station = await _context.Stations.FirstOrDefaultAsync(s => s.Id == request.StationId && s.CompanyId == company.Id);

            if (train == null || station == null)
                return BadRequest(new { message = "Автобус або Станцію не знайдено (або вони вам не належать)." });

            var routeStop = new RouteStop
            {
                TrainId = request.TrainId,
                StationId = request.StationId,
                ScheduledArrival = request.ScheduledArrival,
                ScheduledDeparture = request.ScheduledDeparture,
                Order = request.Order
            };

            _context.RouteStops.Add(routeStop);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Зупинку успішно додано до маршруту!" });
        }

        [HttpGet("train-stops/{adminId}/{trainId}")]
        public async Task<IActionResult> GetTrainStops(int adminId, int trainId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var stops = await _context.RouteStops
                .Include(r => r.Station)
                .Where(r => r.TrainId == trainId && r.Train.CompanyId == company.Id)
                .OrderBy(r => r.Order)
                .Select(r => new {
                    r.Id,
                    StationName = r.Station.Name,
                    r.ScheduledArrival,
                    r.ScheduledDeparture,
                    r.Order
                })
                .ToListAsync();

            return Ok(stops);
        }

        [HttpPut("edit-route-stop/{adminId}/{stopId}")]
        public async Task<IActionResult> EditRouteStop(int adminId, int stopId, [FromBody] EditRouteStopDto request)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            // Шукаємо зупинку конкретного маршруту. 
            // Зверни увагу: перевір, як точно називається твоя таблиця (RouteStops чи TrainStops)
            var routeStop = await _context.RouteStops
                .Include(rs => rs.Train) // Підтягуємо автобус, щоб перевірити, чи він належить нашій компанії
                .FirstOrDefaultAsync(rs => rs.Id == stopId && rs.Train.CompanyId == company.Id);

            if (routeStop == null) return NotFound(new { message = "Зупинку маршруту не знайдено." });

            // Змінюємо дані розкладу
            routeStop.ScheduledArrival = request.NewArrival;
            routeStop.ScheduledDeparture = request.NewDeparture;
            routeStop.Order = request.NewOrder;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Розклад зупинки успішно оновлено!" });
        }

        [HttpDelete("delete-route-stop/{adminId}/{stopId}")]
        public async Task<IActionResult> DeleteRouteStop(int adminId, int stopId)
        {
            var company = await GetAdminCompany(adminId);
            if (company == null) return Unauthorized(new { message = "Компанію не знайдено." });

            var stop = await _context.RouteStops
                .Include(r => r.Train)
                .FirstOrDefaultAsync(r => r.Id == stopId && r.Train.CompanyId == company.Id);

            if (stop == null) return NotFound(new { message = "Зупинку маршруту не знайдено." });

            _context.RouteStops.Remove(stop);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Зупинку видалено з маршруту." });
        }
    }
}