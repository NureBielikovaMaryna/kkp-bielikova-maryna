using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;
using BusinessTransport.Backend.DTOs;

namespace BusinessTransport.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OwnerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OwnerController(AppDbContext context)
        {
            _context = context;
        }

        // 1. СТВОРЕННЯ БІЗНЕСУ (Компанія + запрошення Адміна)
        [HttpPost("create-business")]
        public async Task<IActionResult> CreateBusiness([FromBody] CreateCompanyDto request)
        {
            // Перевірка, чи не зайнятий Email
            if (await _context.Users.AnyAsync(u => u.Email == request.AdminEmail))
                return BadRequest(new { message = "Цей Email вже зареєстрований в системі!" });

            // 1. Створюємо компанію
            var newCompany = new Company
            {
                Name = request.CompanyName
            };
            _context.Companies.Add(newCompany);
            await _context.SaveChangesAsync(); // Зберігаємо, щоб отримати ID компанії

            // 2. Створюємо неактивованого Адміна
            var newAdmin = new User
            {
                Name = request.AdminName,
                Email = request.AdminEmail,
                Role = UserRole.Admin,
                CompanyId = newCompany.Id, // Прив'язуємо до щойно створеної компанії
                IsActivated = false // Чекає на активацію
            };
            _context.Users.Add(newAdmin);
            await _context.SaveChangesAsync();

            // 3. Оновлюємо AdminId в компанії (зворотній зв'язок)
            newCompany.AdminId = newAdmin.Id;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Компанія '{request.CompanyName}' створена. Адмін може активувати акаунт." });
        }


        // 2. ВИДАЛИТИ КОМПАНІЮ ТА ВСІ ЇЇ ДАНІ (Червона кнопка Owner-а)
        [HttpDelete("delete-business/{companyId}")]
        public async Task<IActionResult> DeleteBusiness(int companyId)
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId);
            if (company == null) return NotFound(new { message = "Компанію не знайдено." });

            // 1. Знаходимо та видаляємо всіх співробітників (Адміна та всіх Водіїв цієї компанії)
            var users = await _context.Users.Where(u => u.CompanyId == companyId).ToListAsync();
            _context.Users.RemoveRange(users);

            // 2. Знаходимо та видаляємо всі станції цієї компанії
            var stations = await _context.Stations.Where(s => s.CompanyId == companyId).ToListAsync();
            _context.Stations.RemoveRange(stations);

            // 3. Знаходимо та видаляємо всі автобуси
            var trains = await _context.Trains.Where(t => t.CompanyId == companyId).ToListAsync();
            _context.Trains.RemoveRange(trains);

            // МАГІЯ: Коли EF Core видаляє автобуси, він автоматично (через Cascade Delete)
            // видалить всі зупинки (RouteStops), всі квитки (Bookings) та історії переглядів!

            // 4. Нарешті, видаляємо саму компанію
            _context.Companies.Remove(company);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Компанію '{company.Name}', її персонал та весь автопарк успішно стерто з системи!" });
        }

        // 3. СТАТИСТИКА ДЛЯ МЕНЕ (Власника)
       
        [HttpGet("system-stats")]
        public async Task<IActionResult> GetStats()
        {
            var today = DateTime.Today;

            var stats = new
            {
                PlatformOverview = new
                {
                    TotalCompanies = await _context.Companies.CountAsync(),
                    TotalUsersInSystem = await _context.Users.CountAsync()
                },

                UserBreakdown = new
                {
                    Admins = await _context.Users.CountAsync(u => u.Role == UserRole.Admin),
                    Drivers = await _context.Users.CountAsync(u => u.Role == UserRole.Driver),
                    Clients = await _context.Users.CountAsync(u => u.Role == UserRole.Client)
                },

                

                SystemActivity = new
                {
                    TotalTrainsInSystem = await _context.Trains.CountAsync(),
                    TotalTicketsSold = await _context.Bookings.CountAsync(),
                    TicketsSoldToday = await _context.Bookings.CountAsync(b => b.BookedAt >= today),

                    // ВИПРАВЛЕНО ТУТ:
                    TotalCompletedTrips = await _context.TripInstances.CountAsync(t => t.Status == TripStatus.Completed),
                    TripsCompletedToday = await _context.TripInstances.CountAsync(t => t.Status == TripStatus.Completed && t.Date.Date == today)
                }
            };

            return Ok(stats);
        }




        // 4. СПИСОК ВСІХ КОМПАНІЙ (Оновлено: додано пошту та ім'я адміна)
     
        [HttpGet("all-companies")]
        public async Task<IActionResult> GetAllCompanies()
        {
            var companies = await _context.Companies
                .Select(c => new {
                    Id = c.Id,
                    Name = c.Name,
                    AdminId = c.AdminId,
                    // Шукаємо ім'я адміна в таблиці Users за його Id
                    AdminName = _context.Users
                        .Where(u => u.Id == c.AdminId)
                        .Select(u => u.Name)
                        .FirstOrDefault() ?? "Не призначено",
                    // Шукаємо пошту адміна
                    AdminEmail = _context.Users
                        .Where(u => u.Id == c.AdminId)
                        .Select(u => u.Email)
                        .FirstOrDefault() ?? "Пошта відсутня"
                }).ToListAsync();

            return Ok(companies);
        }

        // 5. ДОДАТКОВО: ТОП-3 КОМПАНІЇ (За кількістю проданих квитків)
        [HttpGet("top-performers")]
        public async Task<IActionResult> GetTopCompanies()
        {
            var topCompanies = await _context.Companies
                .Select(c => new {
                    CompanyName = c.Name,
                    // Рахуємо квитки через зв'язки (якщо налаштовані)
                    // Або рахуємо всіх користувачів цієї компанії
                    StaffCount = _context.Users.Count(u => u.CompanyId == c.Id),
                    BusCount = _context.Trains.Count(t => t.CompanyId == c.Id)
                })
                .OrderByDescending(x => x.StaffCount)
                .Take(5)
                .ToListAsync();

            return Ok(topCompanies);
        }
    }
}
