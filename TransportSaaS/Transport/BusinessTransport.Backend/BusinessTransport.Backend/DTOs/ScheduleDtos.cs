namespace BusinessTransport.Backend.DTOs
{
    // Адмін передає список дат (наприклад, 1, 3, 5 травня), щоб створити рейси
    public class GenerateScheduleDto
    {
        public int AdminId { get; set; }
        public int TrainId { get; set; }
        public List<DateTime> Dates { get; set; }
    }

    // Адмін призначає водія на конкретний згенерований рейс
    public class AssignDriverToTripDto
    {
        public int AdminId { get; set; }
        public int TripInstanceId { get; set; } // ID конкретної дати
        public int DriverId { get; set; }
    }
}