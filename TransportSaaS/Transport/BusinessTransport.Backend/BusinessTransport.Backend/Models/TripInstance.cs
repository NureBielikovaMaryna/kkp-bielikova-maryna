namespace BusinessTransport.Backend.Models
{
    // Статуси нашого рейсу
    public enum TripStatus { Scheduled, InProgress, Completed }

    public class TripInstance
    {
        public int Id { get; set; }

        // Який автобус їде
        public int TrainId { get; set; }
        public Train Train { get; set; }

        // Який водій за кермом (може бути порожнім, поки адмін не призначить)
        public int? DriverId { get; set; }
        public User Driver { get; set; }

        // Дата саме цього виїзду
        public DateTime Date { get; set; }

        // Статус поїздки (Заплановано, В дорозі, Завершено)
        public TripStatus Status { get; set; } = TripStatus.Scheduled;

        // Для датчика водія: на якій він зараз зупинці (порядок)
        public int CurrentStopOrder { get; set; } = 0;

        // Запізнення ТЕПЕР ТУТ, бо запізнюється конкретний рейс, а не залізо
        public int DelayMinutes { get; set; } = 0;


        // ДОДАЙ ЦІ ДВА РЯДКИ:
        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }
    }
}
