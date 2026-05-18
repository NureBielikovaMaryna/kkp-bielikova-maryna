namespace BusinessTransport.Backend.DTOs
{
    // 1. Для створення Водія
    public class CreateDriverDto
    {
        public int AdminId { get; set; } // Хто створює
        public string DriverEmail { get; set; }
        public string DriverName { get; set; }
    }

    
    

    
   
}
