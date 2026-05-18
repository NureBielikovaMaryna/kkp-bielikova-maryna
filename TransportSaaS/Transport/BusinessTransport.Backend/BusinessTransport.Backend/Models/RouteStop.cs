
namespace BusinessTransport.Backend.Models
{
    public class RouteStop
    {
        public int Id { get; set; }

        public int TrainId { get; set; }
        // ОСЬ ЦЬОГО РЯДКА БРАКУВАЛО:
        public Train Train { get; set; }

        public int StationId { get; set; }
        public Station Station { get; set; }

        public string ScheduledArrival { get; set; }   // "10:30"
        public string ScheduledDeparture { get; set; } // "10:45"
        public int Order { get; set; } // Порядок у маршруті
    }
}
