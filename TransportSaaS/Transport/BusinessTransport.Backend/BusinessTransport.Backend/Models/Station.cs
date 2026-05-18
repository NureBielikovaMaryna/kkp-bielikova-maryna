namespace BusinessTransport.Backend.Models
{
    public class Station
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CompanyId { get; set; } // Кожен адмін створює свої станції
    }

}
