namespace BusinessTransport.Backend.DTOs
{
    public class CreateBookingDto
    {
        public int UserId { get; set; }

        // ТЕПЕР КЛІЄНТ КУПУЄ КВИТОК НА КОНКРЕТНИЙ TripInstance!
        public int TripInstanceId { get; set; }

        public int SeatNumber { get; set; }
    }
}
