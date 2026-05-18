namespace BusinessTransport.Backend.DTOs
{
    public class ActivateAccountDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Name { get; set; } // Може оновити ім'я при активації
    }
}
