using BusinessTransport.Backend.Models;

namespace BusinessTransport.Backend.DTOs
{
    // Для створення простої Станції
    public class CreateStationDto
    {
        public int AdminId { get; set; }
        public string Name { get; set; }
    }

    // Для додавання Станції до маршруту Автобуса (Зупинка)
    public class CreateRouteStopDto
    {
        public int AdminId { get; set; }
        public int TrainId { get; set; }
        public int StationId { get; set; }
        public string ScheduledArrival { get; set; }   // Наприклад "14:00"
        public string ScheduledDeparture { get; set; } // Наприклад "14:15"
        public int Order { get; set; }                 // Порядок (1, 2, 3...)
    }

    
}
