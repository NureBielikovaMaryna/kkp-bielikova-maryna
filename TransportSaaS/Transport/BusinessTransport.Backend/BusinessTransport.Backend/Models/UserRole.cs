namespace BusinessTransport.Backend.Models
{
    public enum UserRole
    {
        Owner,  // Ти (керуєш адмінами)
        Admin,  // Бізнесмен (керує компанією, водіями, автобусами)
        Driver, // Водій (бачить графік, тисне "датчик")
        Client  // Пасажир (бронює місця)
    }
}
