import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

function AdminStaff() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', email: '' });

  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const adminId = savedUser?.userId || savedUser?.UserId || savedUser?.id || savedUser?.Id;

  const showMessage = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get(`/Admin/drivers-list/${adminId}`);
      setDrivers(res.data || []);
      setLoading(false);
    } catch (err) {
      showMessage("Помилка завантаження списку водіїв", "error");
      setLoading(false);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    const payload = {
      AdminId: parseInt(adminId),
      DriverName: newDriver.name,
      DriverEmail: newDriver.email
    };

    try {
      await api.post('/Admin/add-driver', payload);
      showMessage(`Запрошення надіслано водію ${newDriver.name}`);
      setNewDriver({ name: '', email: '' });
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      const msg = err.response?.data?.message || "Помилка при додаванні";
      showMessage(msg, "error");
    }
  };

  const handleFireDriver = async (driverId, name) => {
    try {
      await api.delete(`/Admin/fire-driver/${adminId}/${driverId}`);
      showMessage(`Водія ${name} звільнено`);
      fetchDrivers();
    } catch (err) {
      showMessage("Не вдалося звільнити водія", "error");
    }
  };

  if (loading) return <div style={loaderStyle}>Завантаження персоналу...</div>;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <AdminNavbar />

      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#198754' }}>
          {toast.text}
        </div>
      )}

      <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0 }}>👥 Керування водіями</h1>
          <button onClick={() => setShowModal(true)} style={addBtn}>➕ Додати водія</button>
        </div>

        <div style={gridContainer}>
          {drivers.length > 0 ? drivers.map(driver => (
            <div key={driver.driverId || driver.DriverId} style={driverCard}>
              <div style={cardHeader}>
                <div style={statusBadge(driver.isActivated || driver.IsActivated)}>
                  {(driver.isActivated || driver.IsActivated) ? "Активний" : "Очікує активації"}
                </div>
                <button 
                  onClick={() => handleFireDriver(driver.driverId || driver.DriverId, driver.driverName || driver.DriverName)} 
                  style={fireBtn}
                >
                  🗑️
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <div style={avatarCircle}>
                  {(driver.driverName || driver.DriverName || "В").charAt(0).toUpperCase()}
                </div>
                <h3 style={{ margin: '10px 0 5px' }}>{driver.driverName || driver.DriverName}</h3>
                <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{driver.driverEmail || driver.DriverEmail}</p>
              </div>

              <div style={tripsStats}>
                <div style={{ textAlign: 'center' }}>
                  <div style={statsNum}>{driver.upcomingTripsCount || driver.UpcomingTripsCount || 0}</div>
                  <div style={statsLabel}>Майбутніх рейсів</div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#999' }}>
              У вашій компанії поки немає водіїв.
            </div>
          )}
        </div>

        {/* MODAL ADD DRIVER */}
        {showModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Запросити нового водія</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                Після додавання водій зможе активувати акаунт за своїм Email.
              </p>
              <form onSubmit={handleAddDriver} style={formStyle}>
                <input 
                  placeholder="Ім'я водія" 
                  style={inputStyle} 
                  value={newDriver.name} 
                  onChange={e => setNewDriver({...newDriver, name: e.target.value})} 
                  required 
                />
                <input 
                  type="email" 
                  placeholder="Електронна пошта" 
                  style={inputStyle} 
                  value={newDriver.email} 
                  onChange={e => setNewDriver({...newDriver, email: e.target.value})} 
                  required 
                />
                <div style={modalActions}>
                  <button type="submit" style={saveBtn}>Додати</button>
                  <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>Скасувати</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- СТИЛІ ---
const toastStyle = { position: 'fixed', top: '25px', right: '25px', padding: '15px 30px', color: 'white', borderRadius: '10px', zIndex: 3000, fontWeight: 'bold' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' };
const driverCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative', border: '1px solid #eee' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const statusBadge = (active) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: active ? '#d1e7dd' : '#fff3cd', color: active ? '#0f5132' : '#856404' });
const fireBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', opacity: 0.6 };
const avatarCircle = { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '24px', fontWeight: 'bold', color: '#007bff' };
const tripsStats = { borderTop: '1px solid #f8f9fa', paddingTop: '15px', marginTop: '5px' };
const statsNum = { fontSize: '20px', fontWeight: 'bold', color: '#212529' };
const statsLabel = { fontSize: '12px', color: '#6c757d' };
const addBtn = { backgroundColor: '#212529', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '360px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' };
const modalActions = { display: 'flex', gap: '10px', marginTop: '10px' };
const saveBtn = { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 };
const cancelBtn = { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', flex: 1 };
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#666' };

export default AdminStaff;