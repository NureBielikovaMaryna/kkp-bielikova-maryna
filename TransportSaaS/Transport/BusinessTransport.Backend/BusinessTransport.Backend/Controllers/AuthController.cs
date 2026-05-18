using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Data;
using BusinessTransport.Backend.Models;
using BusinessTransport.Backend.DTOs;

namespace BusinessTransport.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // 1. ЗВИЧАЙНА РЕЄСТРАЦІЯ (Тільки для Клієнтів)
        [HttpPost("register-client")]
        public async Task<IActionResult> RegisterClient([FromBody] ActivateAccountDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Цей Email вже використовується!" });
            }

            var client = new User
            {
                Name = request.Name,
                Email = request.Email,
                Password = request.Password, // В реальному проєкті тут має бути хеш, але для курсової піде так
                Role = UserRole.Client,
                IsActivated = true // Клієнт активований одразу
            };

            _context.Users.Add(client);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Реєстрація успішна!" });
        }

        // 2. ПЕРЕВІРКА EMAIL (Для Адмінів та Водіїв, яких додали в базу)
        [HttpPost("check-email")]
        public async Task<IActionResult> CheckEmail([FromBody] CheckEmailDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
                return NotFound(new { message = "Користувача з таким Email не знайдено. Зверніться до адміністратора." });

            if (user.IsActivated)
                return BadRequest(new { message = "Цей акаунт вже активовано! Будь ласка, увійдіть." });

            return Ok(new { message = "Email знайдено. Можете придумати пароль.", role = user.Role.ToString() });
        }

        // 3. АКТИВАЦІЯ АКАУНТА (Для Адмінів та Водіїв)
        [HttpPost("activate")]
        public async Task<IActionResult> ActivateAccount([FromBody] ActivateAccountDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || user.IsActivated)
                return BadRequest(new { message = "Помилка активації." });

            // Оновлюємо дані
            user.Name = request.Name;
            user.Password = request.Password;
            user.IsActivated = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Акаунт успішно активовано! Тепер ви можете увійти." });
        }

        // 4. ЛОГІН (Для всіх)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.Password == request.Password);

            if (user == null)
                return Unauthorized(new { message = "Невірний Email або Пароль!" });

            if (!user.IsActivated)
                return Unauthorized(new { message = "Ваш акаунт ще не активовано!" });

            // НОВЕ: Дістаємо назву компанії окремо, щоб не мучитись з Include
            string companyName = "Транспортна компанія"; // Значення за замовчуванням
            if (user.CompanyId.HasValue)
            {
                var company = await _context.Companies.FindAsync(user.CompanyId);
                if (company != null)
                {
                    companyName = company.Name;
                }
            }

            return Ok(new
            {
                message = $"Вітаємо, {user.Name}!",
                userId = user.Id,
                email = user.Email,
                role = user.Role.ToString(),
                companyId = user.CompanyId,
                companyName = companyName // ТЕПЕР МИ ВІДДАЄМО НАЗВУ!
            });
        }

        // СЕКРЕТНИЙ МЕТОД: Створення головного Власника (Owner)
        [HttpPost("init-owner")]
        public async Task<IActionResult> InitOwner()
        {
            // Перевіряємо, чи вже є хоча б один Owner
            if (await _context.Users.AnyAsync(u => u.Role == UserRole.Owner))
            {
                return BadRequest(new { message = "Власник вже існує в системі!" });
            }

            var owner = new User
            {
                Name = "Марина (Головний Адмін)",
                Email = "marina@gmail.com",
                Password = "123123123", // Твій пароль для входу
                Role = UserRole.Owner,
                IsActivated = true
            };

            _context.Users.Add(owner);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Супер-користувача створено! Email: marina@gmail.com, Pass: 123123123" });
        }
    }
}