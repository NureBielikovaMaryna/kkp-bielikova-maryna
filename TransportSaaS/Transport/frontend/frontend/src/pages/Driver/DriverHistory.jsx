import { useState, useEffect } from 'react';
import api from '../../services/api';
import DriverNavbar from '../../components/DriverNavbar';

function DriverHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ totalTrips: 0, totalMinutes: 0, totalDelay: 0 });
  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const driverId = savedUser?.userId || savedUser?.UserId;


  
  useEffect(() => {
    if (driverId) fetchHistory();
  }, [driverId]);

  const fetchHistory = async () => {
  try {
    const res = await api.get(`/Driver/my-history/${driverId}`);
    const data = res.data || [];
    setHistory(data);

    // Рахуємо сумарну статистику
    let totalMin = 0;
    let totalDel = 0;

    data.forEach(trip => {
      totalMin += parseInt(trip.duration || trip.Duration) || 0;
      totalDel += parseInt(trip.delayMinutes || trip.DelayMinutes) || 0; // Підсумовуємо затримки
    });

    setStats({
      totalTrips: data.length,
      totalMinutes: totalMin,
      totalDelay: totalDel
    });
    
    setLoading(false);
  } catch (err) {
    console.error("Помилка історії:", err);
    setLoading(false);
  }
};

  const formatTotalTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}г ${m}хв`;
  };

  if (loading) return <div style={centerText}>Завантаження архіву...</div>;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <DriverNavbar />

      <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '25px', fontSize: '24px', color: '#333' }}>📜 Архів виконаних рейсів</h1>

        {/* ПАНЕЛЬ СТАТИСТИКИ */}
<div style={statsRow}>
  <div style={statCard}>
    <div style={statLabel}>Всього рейсів</div>
    <div style={statValue}>{stats.totalTrips}</div>
  </div>

  <div style={statCard}>
    <div style={statLabel}>Час у дорозі</div>
    <div style={{ ...statValue, color: '#28a745' }}>{formatTotalTime(stats.totalMinutes)}</div>
  </div>

  <div style={statCard}>
    <div style={statLabel}>Сумарна затримка</div>
    {/* Якщо затримка > 0, робимо її червоною, якщо 0 — сірою */}
    <div style={{ ...statValue, color: stats.totalDelay > 0 ? '#dc3545' : '#6c757d' }}>
      {stats.totalDelay} хв
    </div>
  </div>
</div>

        {/* СПИСОК РЕЙСІВ */}
        <div style={listContainer}>
          {history.length > 0 ? history.map((trip) => (
            <div key={trip.id} style={historyCard}>
              <div style={infoSection}>
                <div style={tripTitle}>{trip.trainName}</div>
                <div style={tripDate}>🏁 Завершено: {trip.date}</div>
              </div>
              
              <div style={timeSection}>
                <div style={durationLabel}>Тривалість</div>
                <div style={durationValue}>{trip.duration}</div>
              </div>

              <div style={checkIcon}>✅</div>
            </div>
          )) : (
            <div style={emptyHistory}>
              <h3>Архів порожній</h3>
              <p>Тут з'являтимуться ваші завершені рейси після того, як ви натиснете "Завершити рейс" у датчику.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- СТИЛІ ---
const statsRow = { 
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr 1fr', // Змінено на 3 рівні колонки
  gap: '20px', 
  marginBottom: '30px' 
};
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #eee' };
const statLabel = { fontSize: '13px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' };
const statValue = { fontSize: '26px', fontWeight: '900', color: '#007bff' };

const listContainer = { display: 'flex', flexDirection: 'column', gap: '12px' };
const historyCard = { 
  backgroundColor: '#fff', 
  padding: '18px 25px', 
  borderRadius: '15px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  borderLeft: '5px solid #28a745' // Зелена лінія підкреслює статус "Завершено"
};

const infoSection = { flex: 2 };
const tripTitle = { fontSize: '18px', fontWeight: 'bold', color: '#333' };
const tripDate = { fontSize: '13px', color: '#999', marginTop: '4px' };

const timeSection = { flex: 1, textAlign: 'right', paddingRight: '20px' };
const durationLabel = { fontSize: '11px', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' };
const durationValue = { fontSize: '15px', color: '#333', fontWeight: 'bold' };

const checkIcon = { fontSize: '20px' };

const emptyHistory = { textAlign: 'center', padding: '50px', color: '#999', backgroundColor: '#fff', borderRadius: '20px' };
const centerText = { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#666' };

export default DriverHistory;