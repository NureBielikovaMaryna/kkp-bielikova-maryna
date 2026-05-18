namespace BusinessTransport.Backend.Models
{

    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }

        // Робимо null, бо спочатку ми створюємо компанію, 
        // а потім створюємо Адміна і прив'язуємо сюди його ID
        public int? AdminId { get; set; }
    }
}
