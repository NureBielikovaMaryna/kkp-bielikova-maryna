import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function SeatSelection() {
  const { tripInstanceId } = useParams();
  const navigate = useNavigate();
  
  const [bookedSeats, setBookedSeats] = useState([]);
  const [totalSeats, setTotalSeats] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // НОВЕ: Стан для повідомлень на сайті
  const [message, setMessage] = useState({ text: '', type: '' });

  // Функція для показу повідомлення, яке зникає через 3 секунди
  const showStatus = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  useEffect(() => {
    // 1. Отримуємо місця
    api.get(`/Public/trip-seats/${tripInstanceId}`)
      .then(response => {
        setTotalSeats(response.data.totalSeats || 0);
        setBookedSeats(Array.isArray(response.data.takenSeats) ? response.data.takenSeats : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Помилка завантаження місць:", err);
        setLoading(false);
      });

    // 2. Історія переглядів (перевіряємо дані безпосередньо з sessionStorage
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && (user.id || user.Id)) {
      api.post('/Client/add-view-history', {
        UserId: user.id || user.Id,
        TrainId: parseInt(tripInstanceId)
      }).catch(e => console.error("Не вдалося зберегти перегляд"));
    }
  }, [tripInstanceId]);

  const handleBooking = () => {
  const userRaw = sessionStorage.getItem('user');
  if (!userRaw) {
    showStatus("Будь ласка, увійдіть в акаунт!");
    return;
  }

  const user = JSON.parse(userRaw);
  
  // Твій бекенд у логіні повертає 'userId'
  const currentUserId = user.userId || user.UserId;

  if (!currentUserId) {
    showStatus("Помилка: ID користувача не знайдено. Перезайдіть в акаунт.");
    return;
  }

  // Формуємо об'єкт точно під твій CreateBookingDto
  const payload = {
    userId: parseInt(currentUserId),
    tripInstanceId: parseInt(tripInstanceId),
    seatNumber: parseInt(selectedSeat)
  };

  console.log("Відправляємо на бронювання:", payload);

  api.post('/Public/book-seat', payload)
    .then((res) => {
      // Показуємо успішне повідомлення з бекенду
      showStatus(res.data.message, 'success');
      setTimeout(() => window.location.reload(), 2000);
    })
    .catch(err => {
      console.error("Помилка сервера:", err.response?.data);
      showStatus(err.response?.data?.message || "Тільки клієнти можуть бронювати");
    });
};

  if (loading) return <h2 style={{ textAlign: 'center' }}>Завантаження...</h2>;

  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      
      {/* ПОВІДОМЛЕННЯ НА САЙТІ (Замість alert) */}
      {message.text && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 'bold', animation: 'fadeIn 0.3s'
        }}>
          {message.text}
        </div>
      )}

      <button onClick={() => navigate(-1)} style={redBackBtn}>← Назад</button>

      <h1>Оберіть місце (Всього місць: {totalSeats})</h1>

      <div style={busContainerStyle}>
        {[...Array(totalSeats)].map((_, index) => {
          const seatNumber = index + 1;
          const isBooked = bookedSeats.includes(seatNumber);
          const isSelected = selectedSeat === seatNumber;

          return (
            <div
              key={seatNumber}
              onClick={() => !isBooked && setSelectedSeat(seatNumber)}
              style={{
                width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', cursor: isBooked ? 'not-allowed' : 'pointer',
                backgroundColor: isBooked ? '#dc3545' : (isSelected ? '#ffc107' : '#28a745'),
                color: 'white', fontWeight: 'bold', transition: '0.2s',
                boxShadow: isSelected ? '0 0 10px #000' : 'none'
              }}
            >
              {seatNumber}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '30px' }}>
        <p>🟢 - Вільно | 🔴 - Зайнято | 🟡 - Ваш вибір</p>
        <h3>Ваше місце: {selectedSeat || 'не обрано'}</h3>
        <button onClick={handleBooking} disabled={!selectedSeat} style={bookBtnStyle}>
          Підтвердити бронювання
        </button>
      </div>
    </div>
  );
}

// СТИЛІ
const redBackBtn = { marginBottom: '20px', padding: '8px 15px', background: 'none', border: '2px solid #dc3545', color: '#dc3545', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const bookBtnStyle = { padding: '15px 40px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' };
const busContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 60px)', gap: '15px', justifyContent: 'center', padding: '30px', backgroundColor: '#f4f4f4', borderRadius: '20px', width: 'fit-content', margin: '0 auto', border: '3px solid #333' };

export default SeatSelection;