using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;

namespace BusinessTransport.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DriverController : ControllerBase
    {
        private readonly AppDbContext _context;

        
        // Зміни private на public
        public static readonly HashSet<int> _atStopTrips = new HashSet<int>();

        public DriverController(AppDbContext context)
        {
            _context = context;
        }

        // 1. РОЗКЛАД НА МІСЯЦЬ (Всі його майбутні рейси)
        [HttpGet("my-schedule/{driverId}")]
        public async Task<IActionResult> GetMySchedule(int driverId)
        {
            var trips = await _context.TripInstances
                .Include(t => t.Train)
                .Where(t => t.DriverId == driverId && t.Status == TripStatus.Scheduled)
                .OrderBy(t => t.Date)
                .Select(t => new {
                    t.Id,
                    Date = t.Date.ToString("yyyy-MM-dd"),
                    TrainName = t.Train.Name,
                    TrainNumber = t.Train.Number
                })
                .ToListAsync();

            return Ok(trips);
        }


        // Онови також GetMyCurrentTrip, щоб він віддавав цей статус
        

        // 2. ДАТЧИК: Найближча або поточна поїздка (Тільки ОДНА)
        [HttpGet("my-current-trip/{driverId}")]
        public async Task<IActionResult> GetMyCurrentTrip(int driverId)
        {
            var trip = await _context.TripInstances
                .Include(t => t.Train)
                .ThenInclude(tr => tr.Route.OrderBy(r => r.Order))
                .ThenInclude(r => r.Station)
                .Where(t => t.DriverId == driverId && t.Status != TripStatus.Completed)
                .OrderBy(t => t.Date)
                .FirstOrDefaultAsync(); // Беремо найпершу актуальну поїздку!

            if (trip == null) return Ok(new { hasTrip = false, message = "У вас немає активних рейсів." });

            return Ok(new
            {
                hasTrip = true,
                TripInfo = new
                {
                    trip.Id,
                    Date = trip.Date.ToString("yyyy-MM-dd"),
                    trip.Status,
                    trip.CurrentStopOrder,
                    trip.DelayMinutes,
                    IsAtStop = _atStopTrips.Contains(trip.Id) // Перевіряємо наш "блокнот"
                },
                TrainInfo = new { trip.Train.Name, trip.Train.Number },
                Stops = trip.Train.Route.Select(r => new { r.Id, StationName = r.Station.Name, r.ScheduledDeparture, r.Order })
            });
        }

        // 3. ПОЧАТИ РЕЙС (Кнопка 1 - водій вирушає на маршрут)
        [HttpPost("start-trip/{tripInstanceId}")]
        public async Task<IActionResult> StartTrip(int tripInstanceId)
        {
            var trip = await _context.TripInstances.FindAsync(tripInstanceId);
            if (trip == null) return NotFound(new { message = "Рейс не знайдено." });

            trip.Status = TripStatus.InProgress;
            trip.CurrentStopOrder = 1; // Чекаємо на першу зупинку
            trip.ActualStartTime = DateTime.Now; // Фіксуємо реальний час старту

            await _context.SaveChangesAsync();

            return Ok(new { message = "Рейс розпочато! Щасливої дороги." });
        }




        

            // 4a. ПРИБУТТЯ НА ЗУПИНКУ (Тепер без помилок)
            [HttpPost("arrived-at-stop/{tripInstanceId}")]
            public IActionResult ArrivedAtStop(int tripInstanceId)
            {
                // Просто додаємо ID рейсу в наш "список тих, хто стоїть"
                _atStopTrips.Add(tripInstanceId);
                return Ok(new { message = "Прибуття зафіксовано. Статус: На зупинці." });
            }

            // 4b. ВІДПРАВЛЕННЯ (Оновлено)
            [HttpPost("departed-from-stop/{tripInstanceId}/{routeStopId}")]
            public async Task<IActionResult> DepartedFromStop(int tripInstanceId, int routeStopId)
            {
                var trip = await _context.TripInstances.FindAsync(tripInstanceId);
                var stop = await _context.RouteStops.FindAsync(routeStopId);

                if (trip == null || stop == null) return NotFound();

                if (TimeSpan.TryParse(stop.ScheduledDeparture, out TimeSpan scheduledTime))
                {
                    DateTime scheduledFullDateTime = trip.Date.Date.Add(scheduledTime);
                    var delay = (int)(DateTime.Now - scheduledFullDateTime).TotalMinutes;

                    trip.DelayMinutes = delay > 0 ? delay : 0;
                    trip.CurrentStopOrder++;

                    // МАГІЯ: Видаляємо рейс зі списку тих, хто стоїть, бо він поїхав
                    _atStopTrips.Remove(tripInstanceId);

                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Відправлення зафіксовано!", currentDelay = trip.DelayMinutes });
                }
                return BadRequest();
            }

            
        


        // 5. ЗАВЕРШИТИ МАРШРУТ (Фіксуємо фінальне запізнення на останній зупинці)
        [HttpPost("end-trip/{tripInstanceId}")]
        public async Task<IActionResult> EndTrip(int tripInstanceId)
        {
            var trip = await _context.TripInstances
                .Include(t => t.Train)
                .ThenInclude(tr => tr.Route) // Завантажуємо маршрут
                .FirstOrDefaultAsync(t => t.Id == tripInstanceId);

            if (trip == null) return NotFound(new { message = "Рейс не знайдено." });

            trip.Status = TripStatus.Completed;
            trip.ActualEndTime = DateTime.Now;

            // 1. БЕЗПЕЧНИЙ ПІДРАХУНОК ТРИВАЛОСТІ (Duration)
            // Якщо ActualStartTime порожній, використовуємо дату рейсу як точку відліку
            var startTime = trip.ActualStartTime ?? trip.Date;
            var duration = (int)(trip.ActualEndTime.Value - startTime).TotalMinutes;

            // 2. ФІКСАЦІЯ ЗАПІЗНЕННЯ НА ОСТАННІЙ ЗУПИНЦІ
            var lastStop = trip.Train.Route.OrderByDescending(r => r.Order).FirstOrDefault();

            if (lastStop != null && TimeSpan.TryParse(lastStop.ScheduledArrival, out TimeSpan scheduledTime))
            {
                var currentTime = DateTime.Now.TimeOfDay;
                var delay = (int)(currentTime - scheduledTime).TotalMinutes;

                // Записуємо фінальне запізнення в рейс
                trip.DelayMinutes = delay > 0 ? delay : 0;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Рейс завершено!",
                finalDelay = trip.DelayMinutes,
                durationMinutes = duration
            });
        }

        // 6. ІСТОРІЯ ПОЇЗДОК ВОДІЯ
        [HttpGet("my-history/{driverId}")]
        public async Task<IActionResult> GetMyHistory(int driverId)
        {
            var history = await _context.TripInstances
                .Include(t => t.Train)
                .Where(t => t.DriverId == driverId && t.Status == TripStatus.Completed && t.ActualStartTime != null && t.ActualEndTime != null)
                .OrderByDescending(t => t.Date)
                .Select(t => new
                {
                    t.Id,
                    TrainName = t.Train.Name,
                    Date = t.Date.ToString("yyyy-MM-dd"),
                    // Рахуємо реальну тривалість поїздки у хвилинах
                    Duration = (int)(t.ActualEndTime.Value - t.ActualStartTime.Value).TotalMinutes + " хвилин",
                    DelayMinutes = t.DelayMinutes
                })
                .ToListAsync();

            return Ok(history);
        }
    }
}