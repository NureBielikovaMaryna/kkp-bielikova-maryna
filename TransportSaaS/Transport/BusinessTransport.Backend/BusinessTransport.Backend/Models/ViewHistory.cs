namespace BusinessTransport.Backend.Models
{
    public class ViewHistory
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int TrainId { get; set; }

        public Train? Train { get; set; }
        public DateTime ViewedAt { get; set; } = DateTime.Now;
    }
}