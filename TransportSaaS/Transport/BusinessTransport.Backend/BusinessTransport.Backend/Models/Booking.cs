
namespace BusinessTransport.Backend.Models
{
    public class Booking
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        // ТЕПЕР БРОНЮЄМО КОНКРЕТНИЙ РЕЙС (замість TrainId та TravelDate)
        public int TripInstanceId { get; set; }
        public TripInstance Trip { get; set; }

        public int SeatNumber { get; set; }
        public DateTime BookedAt { get; set; } = DateTime.Now;
    }
}