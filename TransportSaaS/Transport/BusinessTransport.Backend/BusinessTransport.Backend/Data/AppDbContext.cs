using Microsoft.EntityFrameworkCore;
using BusinessTransport.Backend.Models;

// ОСЬ ЦЯ СТРОЧКА ВИРІШУЄ ПРОБЛЕМУ:
namespace BusinessTransport.Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }

        public DbSet<Company> Companies { get; set; }
        public DbSet<Train> Trains { get; set; }
        public DbSet<Station> Stations { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<ViewHistory> ViewHistories { get; set; }

        //public DbSet<TripLog> TripLogs { get; set; }

        public DbSet<TripInstance> TripInstances { get; set; }
    }
}

