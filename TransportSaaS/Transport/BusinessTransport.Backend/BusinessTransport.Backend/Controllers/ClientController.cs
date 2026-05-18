
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;
using BusinessTransport.Backend.DTOs;

namespace BusinessTransport.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientController(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // БЛОК 1: НАЛАШТУВАННЯ ПРОФІЛЮ
        // ==========================================

        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound(new { message = "Користувача не знайдено." });

            return Ok(new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhotoUrl
            });
        }

        [HttpPut("update-profile/{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound(new { message = "Користувача не знайдено." });

            // 1. Оновлюємо ім'я
            user.Name = request.Name;

            // 2. Оновлюємо Email (з перевіркою на унікальність)
            if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
            {
                // Перевіряємо, чи не зайнятий цей Email іншим користувачем
                var emailExists = await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId);
                if (emailExists) return BadRequest(new { message = "Цей Email вже зайнятий іншим користувачем!" });

                user.Email = request.Email;
            }

            // 3. Оновлюємо пароль та фото
            if (!string.IsNullOrEmpty(request.Password))
                user.Password = request.Password;

            if (!string.IsNullOrEmpty(request.PhotoUrl))
                user.PhotoUrl = request.PhotoUrl;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Профіль успішно оновлено!" });
        }

        // ==========================================
        // БЛОК 2: МОЇ КВИТКИ (БРОНЮВАННЯ)
        // ==========================================

        // БЛОК 2: МОЇ КВИТКИ (БРОНЮВАННЯ) - З СОРТУВАННЯМ!
        [HttpGet("my-bookings/{userId}")]
        public async Task<IActionResult> GetMyBookings(int userId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Trip) // Підтягуємо рейс
                .ThenInclude(t => t.Train) // З рейсу підтягуємо автобус
                .Where(b => b.UserId == userId)
                // СОРТУВАННЯ: Спочатку майбутні (Scheduled/InProgress), потім завершені
                .OrderBy(b => b.Trip.Status == TripStatus.Completed ? 1 : 0)
                .ThenBy(b => b.Trip.Date)
                .Select(b => new
                {
                    BookingId = b.Id,
                    SeatNumber = b.SeatNumber,
                    BookedAt = b.BookedAt.ToString("yyyy-MM-dd HH:mm"),
                    TripStatus = b.Trip.Status.ToString(), // Показуємо статус клієнту!
                    TripInfo = new
                    {
                        Date = b.Trip.Date.ToString("yyyy-MM-dd"),
                        TrainName = b.Trip.Train.Name,
                        TrainNumber = b.Trip.Train.Number
                    }
                })
                .ToListAsync();

            return Ok(bookings);
        }

        

        // ==========================================
        // БЛОК 3: ІСТОРІЯ ПЕРЕГЛЯДІВ
        // ==========================================

        

        [HttpPost("add-view-history")] // (або який там у тебе шлях)
        public async Task<IActionResult> AddViewHistory([FromBody] AddViewHistoryDto request)
        {
            // Дістаємо ID з об'єкта request
            var existingHistory = await _context.ViewHistories
                .FirstOrDefaultAsync(v => v.UserId == request.UserId && v.TrainId == request.TrainId);

            if (existingHistory != null)
            {
                // Якщо дивився, просто оновлюємо час на "зараз"
                existingHistory.ViewedAt = DateTime.Now;
            }
            else
            {
                // Якщо ні - створюємо новий запис (тут теж використовуємо request)
                var history = new ViewHistory
                {
                    UserId = request.UserId,
                    TrainId = request.TrainId,
                    ViewedAt = DateTime.Now
                };
                _context.ViewHistories.Add(history);
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("my-view-history/{userId}")]
        public async Task<IActionResult> GetMyViewHistory(int userId)
        {
            var history = await _context.ViewHistories
                .Include(v => v.Train)
                .Where(v => v.UserId == userId)
                .OrderByDescending(v => v.ViewedAt)
                .Take(10) // Показуємо тільки останні 10 переглядів, щоб не перевантажувати сайт
                .Select(v => new
                {
                    ViewId = v.Id,
                    ViewedAt = v.ViewedAt.ToString("yyyy-MM-dd HH:mm"),
                    TrainInfo = new
                    {
                        v.Train.Id,
                        v.Train.Name,
                        v.Train.Number
                    }
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpGet("my-active-trip/{clientId}")]
        public async Task<IActionResult> GetMyActiveTrip(int clientId)
        {
            // 1. Шукаємо активне бронювання. 
            // УВАГА: Використовуємо .Trip (як у твоїй моделі), а не .TripInstance
            var activeBooking = await _context.Bookings
                .Include(b => b.Trip)
                    .ThenInclude(t => t.Train)
                        .ThenInclude(tr => tr.Route) // Переконайся, що в класі Train є List<RouteStop> Route
                            .ThenInclude(r => r.Station)
                .Where(b => b.UserId == clientId && b.Trip.Status == TripStatus.InProgress)
                .FirstOrDefaultAsync();

            if (activeBooking == null) return Ok(new { hasActiveTrip = false });

            var trip = activeBooking.Trip;

            // Сортуємо зупинки по порядку (Order)
            var sortedStops = trip.Train.Route.OrderBy(r => r.Order).ToList();

            return Ok(new
            {
                hasActiveTrip = true,
                TripInfo = new
                {
                    trip.Id,
                    trip.DelayMinutes,
                    trip.CurrentStopOrder,
                     IsAtStop = DriverController._atStopTrips.Contains(trip.Id)
                },
                TrainName = trip.Train.Name,
                SeatNumber = activeBooking.SeatNumber,
                Stops = sortedStops.Select(r => new {
                    StationName = r.Station.Name,
                    r.ScheduledArrival,   // Додай це
                 
                    r.ScheduledDeparture,
                    r.Order
                })
            });
        }
        

        
        
    }
}