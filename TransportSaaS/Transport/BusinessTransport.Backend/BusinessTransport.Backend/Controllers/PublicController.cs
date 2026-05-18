using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;
using BusinessTransport.Backend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace BusinessTransport.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PublicController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PublicController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. КОМПАНІЇ (Як було раніше)
        // ==========================================
        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies()
        {
            var companies = await _context.Companies
                .Select(c => new { c.Id, c.Name, c.Description })
                .ToListAsync();

            return Ok(companies);
        }

        // ==========================================
        // 2. РОЗКЛАД КОНКРЕТНОЇ КОМПАНІЇ (PRO-логіка)
        // ==========================================
        [HttpGet("schedule/{companyId}")]
        public async Task<IActionResult> GetCompanySchedule(int companyId)
        {
            var today = DateTime.Today;
            var endOfNextMonth = new DateTime(today.Year, today.Month, 1).AddMonths(2).AddDays(-1);

            var trips = await _context.TripInstances
                .Include(t => t.Train)
                .ThenInclude(tr => tr.Route.OrderBy(r => r.Order))
                .ThenInclude(r => r.Station)
                .Where(t => t.Train.CompanyId == companyId) // ТІЛЬКИ ЦЯ КОМПАНІЯ!
                .Where(t => t.Date >= today && t.Date <= endOfNextMonth)
                .Where(t => t.DriverId != null && t.Status == TripStatus.Scheduled) // Тільки майбутні рейси з водіями
                .OrderBy(t => t.Date)
                .Select(t => new
                {
                    TripInstanceId = t.Id,
                    trainId = t.TrainId,
                    Date = t.Date.ToString("yyyy-MM-dd"),
                    TrainName = t.Train.Name,
                    TrainNumber = t.Train.Number,
                    TotalSeats = t.Train.TotalSeats,
                    AvailableSeats = t.Train.TotalSeats - _context.Bookings.Count(b => b.TripInstanceId == t.Id),

                    // Клієнт бачить саме ЗУПИНКИ конкретного маршруту
                    Stops = t.Train.Route.Select(r => new
                    {
                        StationName = r.Station.Name,
                        r.ScheduledArrival,
                        r.ScheduledDeparture,
                        r.Order
                    })
                })
                .ToListAsync();

            return Ok(trips);
        }

        // ==========================================
        // 3. СПИСОК ЗАЙНЯТИХ МІСЦЬ (Для червоних/зелених крісел на сайті)
        // ==========================================
        [HttpGet("trip-seats/{tripInstanceId}")]
        public async Task<IActionResult> GetTripSeats(int tripInstanceId)
        {
            var trip = await _context.TripInstances
                .Include(t => t.Train)
                .FirstOrDefaultAsync(t => t.Id == tripInstanceId);

            if (trip == null) return NotFound(new { message = "Рейс не знайдено." });

            // Шукаємо, які саме місця вже куплені
            var takenSeats = await _context.Bookings
                .Where(b => b.TripInstanceId == tripInstanceId)
                .Select(b => b.SeatNumber)
                .ToListAsync();

            return Ok(new
            {
                TotalSeats = trip.Train.TotalSeats,
                TakenSeats = takenSeats // Фронтенд отримає масив, наприклад: [1, 2, 14, 15]
            });
        }

        // ==========================================
        // 4. БРОНЮВАННЯ (З перевіркою зайнятості)
        // ==========================================
     
        [AllowAnonymous] // Дозволяємо вхід без токенів
        [HttpPost("book-seat")]
        public async Task<IActionResult> BookSeat([FromBody] CreateBookingDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId && u.Role == UserRole.Client);
            if (user == null) return Unauthorized(new { message = "Тільки зареєстровані клієнти можуть купувати квитки." });

            var trip = await _context.TripInstances.Include(t => t.Train).FirstOrDefaultAsync(t => t.Id == request.TripInstanceId);
            if (trip == null) return NotFound(new { message = "Рейс не знайдено." });

            if (trip.Status != TripStatus.Scheduled)
                return BadRequest(new { message = "Бронювання на цей рейс вже закрито (він в дорозі або завершився)." });

            if (request.SeatNumber <= 0 || request.SeatNumber > trip.Train.TotalSeats)
                return BadRequest(new { message = $"Оберіть місце від 1 до {trip.Train.TotalSeats}." });

            // Перевірка на подвійне бронювання
            var isSeatTaken = await _context.Bookings
                .AnyAsync(b => b.TripInstanceId == request.TripInstanceId && b.SeatNumber == request.SeatNumber);

            if (isSeatTaken) return BadRequest(new { message = "На жаль, це місце вже зайняте! Оберіть інше." });

            var booking = new Booking
            {
                UserId = request.UserId,
                TripInstanceId = request.TripInstanceId,
                SeatNumber = request.SeatNumber
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Місце №{request.SeatNumber} успішно заброньовано на {trip.Date:dd.MM.yyyy}! Щасливої дороги." });
        }

        // 4. РОЗУМНИЙ СПИСОК СТАНЦІЙ (Для пошуку "Звідки - Куди")
        [HttpGet("active-stations")]
        public async Task<IActionResult> GetActiveStations()
        {
            // Ми беремо назви тільки тих станцій, які задіяні в маршрутах
            var stations = await _context.RouteStops
                .Include(rs => rs.Station)
                .Select(rs => new { rs.Station.Id, rs.Station.Name })
                .Distinct() // Прибираємо дублікати
                .ToListAsync();

            return Ok(stations);
        }
    }
}



