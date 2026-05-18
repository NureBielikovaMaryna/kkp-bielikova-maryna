namespace BusinessTransport.Backend.DTOs
{
    
    
    

    // 3. Для призначення водія на автобус
    public class AssignDriverDto
    {
        public int AdminId { get; set; }
        public int TrainId { get; set; }
        public int DriverId { get; set; }
    }
}
