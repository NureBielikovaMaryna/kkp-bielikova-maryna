
namespace BusinessTransport.Backend.DTOs
{
    public class UpdateProfileDto
    {
        public string Name { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; } // Може бути порожнім, якщо клієнт не хоче міняти пароль
        public string? PhotoUrl { get; set; } // Сюди можна буде передавати Base64 рядок з фотографією
    }
}