import { useState, useEffect } from 'react';
import api from '../../services/api';
import DriverNavbar from '../../components/DriverNavbar';

function DriverSchedule() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Отримуємо ID водія з sessionStorage
  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const driverId = savedUser?.userId || savedUser?.UserId || savedUser?.id;

  useEffect(() => {
    if (driverId) {
      fetchSchedule();
    }
  }, [driverId]);

  const fetchSchedule = async () => {
    try {
      const res = await api.get(`/Driver/my-schedule/${driverId}`);
      setTrips(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Помилка завантаження розкладу:", err);
      setError("Не вдалося завантажити розклад.");
      setLoading(false);
    }
  };

  if (loading) return <div style={loaderStyle}>Завантаження графіка...</div>;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <DriverNavbar />

      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>📅 Мій розклад</h1>
          <div style={tripCountBadge}>{trips.length} запланованих рейсів</div>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={listContainer}>
          {trips.length > 0 ? trips.map((trip) => (
            <div key={trip.id} style={scheduleCard}>
              <div style={dateBox}>
                <span style={dateDay}>{trip.date.split('-')[2]}</span>
                <span style={dateMonth}>
                  {new Date(trip.date).toLocaleString('uk-UA', { month: 'short' })}
                </span>
              </div>

              <div style={infoBox}>
                <div style={trainNameStyle}> Маршрут №{trip.trainName}</div>
                <div style={trainNumberStyle}>Транспортний засіб: {trip.trainNumber}</div>
              </div>

              <div style={actionBox}>
                <div style={statusTag}>Заплановано</div>
                <small style={{ color: '#999', fontSize: '11px' }}>ID: {trip.id}</small>
              </div>
            </div>
          )) : (
            <div style={emptyState}>
              <div style={{ fontSize: '50px', marginBottom: '10px' }}>☕</div>
              <h3>На найближчий час рейсів немає</h3>
              <p>Відпочивайте, ми повідомимо, коли адмін призначить новий виїзд.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- СТИЛІ (Premium Driver Look) ---
const listContainer = { display: 'flex', flexDirection: 'column', gap: '15px' };

const scheduleCard = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '1px solid #eee',
  transition: 'transform 0.2s'
};

const dateBox = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '70px',
  height: '70px',
  backgroundColor: '#e7f1ff',
  borderRadius: '12px',
  marginRight: '20px',
  color: '#007bff'
};

const dateDay = { fontSize: '24px', fontWeight: 'bold', lineHeight: '1' };
const dateMonth = { fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' };

const infoBox = { flex: 1 };
const trainNameStyle = { fontSize: '18px', fontWeight: 'bold', color: '#222', marginBottom: '4px' };
const trainNumberStyle = { fontSize: '14px', color: '#666' };

const actionBox = { textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' };
const statusTag = { 
  backgroundColor: '#fff3cd', 
  color: '#856404', 
  padding: '4px 12px', 
  borderRadius: '20px', 
  fontSize: '11px', 
  fontWeight: 'bold',
  textTransform: 'uppercase'
};

const tripCountBadge = { backgroundColor: '#333', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '12px' };
const emptyState = { textAlign: 'center', padding: '60px 20px', color: '#888', backgroundColor: '#fff', borderRadius: '20px' };
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#666' };
const errorStyle = { backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '10px', marginBottom: '20px' };

export default DriverSchedule;