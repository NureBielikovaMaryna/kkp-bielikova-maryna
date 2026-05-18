import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = JSON.parse(sessionStorage.getItem('user'));
    const adminId = savedUser?.userId || savedUser?.UserId;

    if (adminId) {
      api.get(`/Admin/analytics/${adminId}`) 
        .then(res => {
          setStats(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Помилка аналітики:", err);
          setLoading(false);
        });
    }
  }, []);

  if (loading) return <div style={loaderStyle}>Аналізуємо дані компанії...</div>;
  if (!stats) return <div style={loaderStyle}>Дані відсутні</div>;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '25px', color: '#212529' }}>📊 Аналітика компанії {stats.companyName}</h1>

        {/* 1. ВЕРХНІЙ РЯДОК: ЗАГАЛЬНІ ПОКАЗНИКИ */}
        <div style={statsGrid}>
          <div style={statCard}>
            <span style={statLabel}>🚌 Всього автобусів</span>
            <span style={statValue}>{stats.fleet.totalTrains}</span>
          </div>
          <div style={statCard}>
            <span style={statLabel}>👥 Персонал (водії)</span>
            <span style={statValue}>{stats.personnel.totalDrivers}</span>
          </div>
          <div style={statCard}>
            <span style={statLabel}>🎟️ Продано квитків</span>
            <span style={statValue}>{stats.sales.totalBookings}</span>
          </div>
          <div style={statCard}>
            <span style={statLabel}>⏱️ Сер. затримка (хв)</span>
            <span style={{ ...statValue, color: stats.globalCompanyAverageDelay > 300 ? '#dc3545' : '#28a745' }}>
              {(stats.globalCompanyAverageDelay / 60).toFixed(1)}
            </span>
          </div>
        </div>

        {/* НОВЕ: СЕКЦІЯ ЗА СЬОГОДНІ */}
        <h2 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '20px', color: '#495057' }}>📅 Показники за сьогодні</h2>
        <div style={statsGrid}>
          <div style={{ ...statCard, borderLeft: '4px solid #ffc107' }}>
            <span style={statLabel}>⚠️ Затримок зараз</span>
            <span style={statValue}>{stats.fleet.delayedTrips}</span>
          </div>
          <div style={{ ...statCard, borderLeft: '4px solid #007bff' }}>
            <span style={statLabel}>🛣️ Водіїв на рейсі</span>
            <span style={statValue}>{stats.personnel.driversOnRouteToday}</span>
          </div>
          <div style={{ ...statCard, borderLeft: '4px solid #28a745' }}>
            <span style={statLabel}>💰 Квитків сьогодні</span>
            <span style={statValue}>{stats.sales.bookingsToday}</span>
          </div>
          <div style={{ ...statCard, borderLeft: '4px solid #6c757d' }}>
            <span style={statLabel}>✅ Завершено сьогодні</span>
            <span style={statValue}>{stats.operations.tripsCompletedToday}</span>
          </div>
        </div>

        {/* 2. СЕКЦІЯ РЕЙТИНГІВ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginTop: '30px' }}>
          
          {/* Рейтинг водіїв */}
          <div style={tableContainer}>
            <h3 style={tableTitle}>🏆 Ефективність водіїв</h3>
            <table style={tableStyle}>
              <thead>
                <tr style={headerRow}>
                  <th>Водій</th>
                  <th>Рейси</th>
                  <th>Затримка</th>
                </tr>
              </thead>
              <tbody>
                {stats.driverPerformanceRanking.map((driver, index) => (
                  <tr key={index} style={rowStyle}>
                    <td style={{ fontWeight: 'bold' }}>{driver.name}</td>
                    <td>{driver.totalCompletedTrips}</td>
                    <td style={{ color: driver.averageDelayMinutes > 400 ? '#dc3545' : '#555' }}>
                      {driver.averageDelayMinutes.toFixed(0)} хв
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ефективність флоту */}
          <div style={tableContainer}>
            <h3 style={tableTitle}>🚍 Показники автобусів</h3>
            <table style={tableStyle}>
              <thead>
                <tr style={headerRow}>
                  <th>Транспорт</th>
                  <th>Квитки</th>
                  <th>Завантаження</th>
                </tr>
              </thead>
              <tbody>
                {stats.fleetPerformanceRanking.map((item, index) => (
                  <tr key={index} style={rowStyle}>
                    <td style={{ fontWeight: 'bold' }}>{item.trainInfo}</td>
                    <td>{item.totalBookings}</td>
                    <td>
                      <div style={occupancyBar(item.occupancyRate)}>
                        {item.occupancyRate.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Стилі для Dashboard ---
const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
};

const statCard = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  border: '1px solid #eee',
  transition: '0.3s'
};

const statLabel = { fontSize: '14px', color: '#6c757d', marginBottom: '5px' };
const statValue = { fontSize: '24px', fontWeight: 'bold', color: '#212529' };

const tableContainer = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
};

const tableTitle = { marginBottom: '15px', fontSize: '18px', color: '#333' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerRow = { textAlign: 'left', borderBottom: '2px solid #f4f7f6', color: '#888', fontSize: '14px' };
const rowStyle = { borderBottom: '1px solid #f8f9fa' };
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#666' };

const occupancyBar = (rate) => ({
  backgroundColor: rate > 5 ? '#28a745' : '#ffc107',
  color: 'white',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  display: 'inline-block',
  width: '50px',
  textAlign: 'center'
});

export default AdminDashboard;