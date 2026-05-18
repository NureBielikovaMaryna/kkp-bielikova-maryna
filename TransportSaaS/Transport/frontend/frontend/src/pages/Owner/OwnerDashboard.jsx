import { useState, useEffect } from 'react';
import api from '../../services/api';
import OwnerNavbar from '../../components/OwnerNavbar';

function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ CompanyName: '', AdminName: '', AdminEmail: '' });

  const showMessage = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, compRes, topRes] = await Promise.all([
        api.get('/Owner/system-stats'),
        api.get('/Owner/all-companies'),
        api.get('/Owner/top-performers')
      ]);
      setStats(statsRes.data);
      setCompanies(compRes.data || []);
      setTopPerformers(topRes.data || []);
      setLoading(false);
    } catch (err) {
      showMessage("Помилка завантаження даних", "error");
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      await api.post('/Owner/create-business', newBusiness);
      showMessage(`Бізнес ${newBusiness.CompanyName} успішно створено!`);
      setNewBusiness({ CompanyName: '', AdminName: '', AdminEmail: '' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Помилка створення";
      showMessage(errorMsg, "error");
    }
  };

  const handleDeleteBusiness = async (companyId, companyName) => {
    if (!window.confirm(`🔥 УВАГА: Видалення компанії "${companyName}" призведе до повного стирання всіх її даних, персоналу та рейсів. Продовжити?`)) return;
    
    try {
      await api.delete(`/Owner/delete-business/${companyId}`);
      showMessage(`Компанію ${companyName} видалено з системи.`);
      fetchData();
    } catch (err) {
      showMessage("Не вдалося видалити компанію", "error");
    }
  };

  if (loading) return <div style={loaderStyle}>Синхронізація платформи...</div>;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <OwnerNavbar />

      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#1a237e' }}>
          {toast.text}
        </div>
      )}

      <div style={{ padding: '40px', maxWidth: '1300px', margin: '0 auto' }}>
        
        <header style={headerFlex}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', color: '#1a237e' }}>Марина Бєлікова</h1>
            <p style={{ margin: '5px 0 0', color: '#666' }}>Головна панель керування платформою SaaS</p>
          </div>
          <button onClick={() => setShowModal(true)} style={addBtn}>➕ Створити бізнес</button>
        </header>

        {/* СТАТИСТИКА */}
        {stats && (
          <section style={{ marginBottom: '40px' }}>
            <div style={statsGrid}>
              <div style={statCard}>
                <div style={statLabel}>Компаній у системі</div>
                <div style={statValue}>{stats.platformOverview?.totalCompanies || stats.PlatformOverview?.TotalCompanies}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Продано квитків (Total)</div>
                <div style={{...statValue, color: '#28a745'}}>{stats.systemActivity?.totalTicketsSold || stats.SystemActivity?.TotalTicketsSold}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Активність сьогодні</div>
                <div style={{fontSize: '18px', fontWeight: 'bold', marginTop: '10px'}}>
                   🎫 Квитків: {stats.systemActivity?.ticketsSoldToday || stats.SystemActivity?.TicketsSoldToday} <br/>
                   🏁 Рейсів: {stats.systemActivity?.tripsCompletedToday || stats.SystemActivity?.TripsCompletedToday}
                </div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Користувачі за ролями</div>
                <div style={roleRow}>
                  <div>👤 {stats.userBreakdown?.admins} <br/> <small>Адміни</small></div>
                  <div>🚍 {stats.userBreakdown?.drivers} <br/> <small>Водії</small></div>
                  <div>👫 {stats.userBreakdown?.clients} <br/> <small>Клієнти</small></div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div style={mainContentLayout}>
          {/* СПИСОК КОМПАНІЙ */}
          <section style={{ flex: 2 }}>
            <h2 style={sectionTitle}>🏢 Підключені бізнеси ({companies.length})</h2>
            <div style={gridContainer}>
              {companies.map(comp => (
                <div key={comp.id || comp.Id} style={cardStyle}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px', color: '#333' }}>{comp.name || comp.Name}</h3>
                    <div style={adminInfo}>
                      <span>👤 {comp.adminName || comp.AdminName}</span>
                      <span style={{ color: '#007bff' }}>📧 {comp.adminEmail || comp.AdminEmail}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteBusiness(comp.id || comp.Id, comp.name || comp.Name)} 
                    style={deleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ТОП-5 КОМПАНІЙ */}
          <aside style={{ flex: 1, marginLeft: '30px' }}>
            <h2 style={sectionTitle}>🏆 Топ за масштабом</h2>
            <div style={topListCard}>
              {topPerformers.map((top, idx) => (
                <div key={idx} style={topItem}>
                  <span style={topRank}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{top.companyName || top.CompanyName}</div>
                    <div style={{ fontSize: '12px', color: '#777' }}>
                      Персонал: {top.staffCount} | Автобуси: {top.busCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* МОДАЛКА */}
        {showModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h2 style={{marginTop: 0}}>Новий бізнес-партнер</h2>
              <p style={{fontSize: '14px', color: '#666', marginBottom: '20px'}}>
                Після створення, адмін отримає доступ до налаштувань своєї компанії.
              </p>
              <form onSubmit={handleCreateBusiness} style={formStyle}>
                <div style={inputGroup}>
                  <label style={inputLabel}>Назва компанії</label>
                  <input 
                    style={inputStyle} 
                    value={newBusiness.CompanyName} 
                    onChange={e => setNewBusiness({...newBusiness, CompanyName: e.target.value})} 
                    required 
                  />
                </div>
                <div style={inputGroup}>
                  <label style={inputLabel}>Ім'я головного адміна</label>
                  <input 
                    style={inputStyle} 
                    value={newBusiness.AdminName} 
                    onChange={e => setNewBusiness({...newBusiness, AdminName: e.target.value})} 
                    required 
                  />
                </div>
                <div style={inputGroup}>
                  <label style={inputLabel}>Email адміна</label>
                  <input 
                    type="email"
                    style={inputStyle} 
                    value={newBusiness.AdminEmail} 
                    onChange={e => setNewBusiness({...newBusiness, AdminEmail: e.target.value})} 
                    required 
                  />
                </div>
                <div style={modalActions}>
                  <button type="submit" style={saveBtn}>Запустити бізнес</button>
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

// --- НОВІ ТА ОНОВЛЕНІ СТИЛІ ---
const headerFlex = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #eee', paddingBottom: '20px' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' };
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #edf2f7' };
const statLabel = { fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' };
const statValue = { fontSize: '32px', fontWeight: '900', color: '#1a237e', marginTop: '10px' };
const roleRow = { display: 'flex', justifyContent: 'space-between', marginTop: '15px', textAlign: 'center' };

const mainContentLayout = { display: 'flex', alignItems: 'flex-start' };
const sectionTitle = { fontSize: '18px', color: '#333', marginBottom: '20px', fontWeight: '800' };
const gridContainer = { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' };
const cardStyle = { backgroundColor: '#fff', padding: '15px 25px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0' };
const adminInfo = { display: 'flex', gap: '20px', fontSize: '13px', fontWeight: '500' };

const topListCard = { backgroundColor: '#fff', padding: '10px', borderRadius: '16px', border: '1px solid #eee' };
const topItem = { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderBottom: '1px solid #f8f9fa' };
const topRank = { backgroundColor: '#1a237e', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' };

const toastStyle = { position: 'fixed', top: '25px', right: '25px', padding: '15px 30px', color: 'white', borderRadius: '10px', zIndex: 4000, fontWeight: 'bold', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' };
const deleteBtn = { background: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2', cursor: 'pointer', padding: '10px', borderRadius: '10px', fontSize: '16px' };
const addBtn = { backgroundColor: '#1a237e', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(26, 35, 126, 0.2)' };

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26, 35, 126, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000 };
const modalContent = { backgroundColor: '#fff', padding: '40px', borderRadius: '24px', width: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputLabel = { fontSize: '12px', fontWeight: 'bold', color: '#666' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', fontSize: '15px' };
const modalActions = { display: 'flex', gap: '12px', marginTop: '20px' };
const saveBtn = { backgroundColor: '#1a237e', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', flex: 2 };
const cancelBtn = { backgroundColor: '#f4f7f6', color: '#666', border: 'none', padding: '14px', borderRadius: '10px', cursor: 'pointer', flex: 1 };
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#1a237e', fontWeight: 'bold' };

export default OwnerDashboard;