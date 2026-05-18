

namespace BusinessTransport.Backend.Models
{
    public class Train
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Number { get; set; }
        public int TotalSeats { get; set; }
        public int CompanyId { get; set; }

        // Зв'язки
        public List<RouteStop> Route { get; set; } = new();
        public List<TripInstance> Trips { get; set; } = new(); // Всі згенеровані дати для цього автобуса
    }
}
