using BusinessTransport.Backend.Models;

namespace BusinessTransport.Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; } // Ключ, за яким ми шукаємо людину
        public string? Password { get; set; } // Може бути null, поки не активовано

        // Шлях до фото (наприклад, "images/user1.jpg") або Base64
        public string? PhotoUrl { get; set; }
        public UserRole Role { get; set; }

        // Для Owner - null. Для інших - ID їхньої компанії
        public int? CompanyId { get; set; }

        // Нове поле: показує, чи людина вже створила собі пароль і зайшла в систему
        public bool IsActivated { get; set; } = false;
    }
}
