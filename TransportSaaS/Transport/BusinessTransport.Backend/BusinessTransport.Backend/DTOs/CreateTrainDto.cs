namespace BusinessTransport.Backend.DTOs
{
    

    // 2. Для створення Автобуса
    public class CreateTrainDto
    {
        public int AdminId { get; set; }

        public string Name { get; set; }
        public string Number { get; set; } // Наприклад, "АХ 1234 ВС"
        public int TotalSeats { get; set; } // Кількість місць
    }

    
}

