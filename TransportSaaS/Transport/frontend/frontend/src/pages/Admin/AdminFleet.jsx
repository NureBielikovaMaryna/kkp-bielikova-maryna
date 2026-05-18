import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

function AdminFleet() {
  const [activeTab, setActiveTab] = useState('trains'); 
  const [trains, setTrains] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [trainModal, setTrainModal] = useState({ isOpen: false, isEdit: false, data: { name: '', number: '', totalSeats: '' } });
  const [stationModal, setStationModal] = useState({ isOpen: false, isEdit: false, data: { name: '' } });
  const [stopModal, setStopModal] = useState({ 
    isOpen: false, 
    isEdit: false, 
    data: { stationId: '', scheduledArrival: '', scheduledDeparture: '', order: '' } 
  });

  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const adminId = savedUser?.userId || savedUser?.UserId;

  const showMessage = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  const fetchBaseData = async () => {
    try {
      const [trainsRes, stationsRes] = await Promise.all([
        api.get(`/Admin/my-trains/${adminId}`),
        api.get(`/Admin/my-stations/${adminId}`)
      ]);
      setTrains(trainsRes.data || []);
      setStations(stationsRes.data || []);
      setLoading(false);
    } catch (err) {
      showMessage("Помилка завантаження", "error");
      setLoading(false);
    }
  };

  // --- СТАНЦІЇ ---
  const handleSaveStation = async (e) => {
    e.preventDefault();
    const stId = stationModal.data.id || stationModal.data.Id;
    try {
      if (stationModal.isEdit) {
        await api.put(`/Admin/edit-station/${adminId}/${stId}`, { 
          NewName: stationModal.data.name || stationModal.data.Name 
        });
        showMessage("Станцію оновлено");
      } else {
        await api.post('/Admin/add-station', { adminId: parseInt(adminId), name: stationModal.data.name });
        showMessage("Станцію додано");
      }
      setStationModal({ isOpen: false, isEdit: false, data: { name: '' } });
      fetchBaseData();
    } catch (err) {
      showMessage("Помилка збереження", "error");
    }
  };

  const handleDeleteStation = async (id) => {
    try {
      await api.delete(`/Admin/delete-station/${adminId}/${id}`);
      showMessage("Станцію видалено");
      fetchBaseData();
    } catch (err) {
      showMessage("Помилка видалення", "error");
    }
  };

  // --- АВТОБУСИ ---
  const handleSaveTrain = async (e) => {
    e.preventDefault();
    const tId = trainModal.data.id || trainModal.data.Id;
    try {
      if (trainModal.isEdit) {
        const editPayload = {
          NewName: trainModal.data.name || trainModal.data.Name,
          NewNumber: trainModal.data.number || trainModal.data.Number,
          NewTotalSeats: parseInt(trainModal.data.totalSeats || trainModal.data.TotalSeats || 0)
        };
        await api.put(`/Admin/edit-train/${adminId}/${tId}`, editPayload);
        showMessage("Дані оновлено");
      } else {
        await api.post('/Admin/add-train', { 
          adminId: parseInt(adminId), 
          name: trainModal.data.name,
          number: trainModal.data.number,
          totalSeats: parseInt(trainModal.data.totalSeats)
        });
        showMessage("Автобус додано");
      }
      setTrainModal({ isOpen: false, isEdit: false, data: { name: '', number: '', totalSeats: '' } });
      fetchBaseData();
    } catch (err) {
      showMessage("Помилка збереження", "error");
    }
  };

  const handleDeleteTrain = async (id) => {
    try {
      await api.delete(`/Admin/delete-train/${adminId}/${id}`);
      showMessage("Автобус видалено");
      if ((selectedTrain?.id || selectedTrain?.Id) === id) setSelectedTrain(null);
      fetchBaseData();
    } catch (err) {
      showMessage("Помилка видалення", "error");
    }
  };

  // --- ЗУПИНКИ ---
  const loadTrainStops = async (train) => {
    setSelectedTrain(train);
    try {
      const res = await api.get(`/Admin/train-stops/${adminId}/${train.id || train.Id}`);
      setRouteStops(res.data || []);
    } catch (err) {
      showMessage("Помилка завантаження маршруту", "error");
    }
  };

  const handleSaveStop = async (e) => {
    e.preventDefault();
    try {
      if (stopModal.isEdit) {
        const stopId = stopModal.data.id || stopModal.data.Id;
        const editPayload = {
          newArrival: stopModal.data.scheduledArrival || stopModal.data.ScheduledArrival,
          newDeparture: stopModal.data.scheduledDeparture || stopModal.data.ScheduledDeparture,
          newOrder: parseInt(stopModal.data.order || stopModal.data.Order)
        };
        await api.put(`/Admin/edit-route-stop/${adminId}/${stopId}`, editPayload);
        showMessage("Зупинку змінено");
      } else {
        const addPayload = {
          adminId: parseInt(adminId),
          trainId: parseInt(selectedTrain.id || selectedTrain.Id),
          stationId: parseInt(stopModal.data.stationId || stopModal.data.StationId),
          scheduledArrival: stopModal.data.scheduledArrival,
          scheduledDeparture: stopModal.data.scheduledDeparture,
          order: parseInt(stopModal.data.order)
        };
        await api.post('/Admin/add-route-stop', addPayload);
        showMessage("Зупинку додано");
      }
      setStopModal({ isOpen: false, isEdit: false, data: { stationId: '', scheduledArrival: '', scheduledDeparture: '', order: '' } });
      loadTrainStops(selectedTrain);
    } catch (err) {
      showMessage("Перевірте дані", "error");
    }
  };

  const handleDeleteStop = async (stopId) => {
    try {
      await api.delete(`/Admin/delete-route-stop/${adminId}/${stopId}`);
      showMessage("Зупинку прибрано");
      loadTrainStops(selectedTrain);
    } catch (err) {
      showMessage("Помилка видалення", "error");
    }
  };

  if (loading) return <div style={loaderStyle}>Завантаження...</div>;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <AdminNavbar />

      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#198754' }}>
          {toast.text}
        </div>
      )}

      <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
        
        <div style={tabsContainer}>
          <button style={activeTab === 'trains' ? activeTabBtn : inactiveTabBtn} onClick={() => setActiveTab('trains')}>🚌 Автобуси та Маршрути</button>
          <button style={activeTab === 'stations' ? activeTabBtn : inactiveTabBtn} onClick={() => setActiveTab('stations')}>🚏 База Станцій</button>
        </div>

        {activeTab === 'stations' && (
          <div>
            <div style={headerRow}>
              <h2 style={{ margin: 0 }}>Наявні Станції</h2>
              <button onClick={() => setStationModal({ isOpen: true, isEdit: false, data: { name: '' } })} style={addBtn}>➕ Додати станцію</button>
            </div>
            <div style={gridContainer}>
              {stations.map(st => (
                <div key={st.id || st.Id} style={cardStyle}>
                  <h3>{st.name || st.Name}</h3>
                  <div style={cardActions}>
                    <button onClick={() => setStationModal({ isOpen: true, isEdit: true, data: st })} style={editBtn}>✏️</button>
                    <button onClick={() => handleDeleteStation(st.id || st.Id)} style={deleteBtn}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trains' && (
          <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={headerRow}>
                <h2 style={{ margin: 0 }}>Автобуси</h2>
                <button onClick={() => setTrainModal({ isOpen: true, isEdit: false, data: { name: '', number: '', totalSeats: '' } })} style={addBtn}>➕ Додати</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trains.map(t => {
                  const isSelected = selectedTrain && (String(selectedTrain.id || selectedTrain.Id) === String(t.id || t.Id));
                  return (
                    <div 
                      key={t.id || t.Id} 
                      style={isSelected ? selectedTrainCard : trainCard}
                      onClick={() => loadTrainStops(t)}
                    >
                      <div>
                        <h3 style={{ margin: '0 0 5px' }}>Маршрут №{t.name || t.Name}</h3>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                          <div><b>Держ. номер:</b> {t.number || t.Number}</div>
                          <div><b>Місць:</b> {t.totalSeats || t.TotalSeats || 0}</div>
                        </div>
                      </div>
                      <div style={cardActions}>
                        <button onClick={(e) => { e.stopPropagation(); setTrainModal({ isOpen: true, isEdit: true, data: t }); }} style={editBtn}>✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTrain(t.id || t.Id); }} style={deleteBtn}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1.6, backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              {!selectedTrain ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '60px 0' }}>👈 Оберіть автобус для налаштування зупинок</div>
              ) : (
                <div>
                  <div style={headerRow}>
                    <h3 style={{ margin: 0 }}>Зупинки для №{selectedTrain.name || selectedTrain.Name}</h3>
                    <button onClick={() => setStopModal({ isOpen: true, isEdit: false, data: { stationId: '', scheduledArrival: '', scheduledDeparture: '', order: '' } })} style={addBtn}>➕ Додати зупинку</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    {[...routeStops]
                      .sort((a, b) => (a.order || a.Order) - (b.order || b.Order))
                      .map(stop => (
                      <div key={stop.id || stop.Id} style={stopCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={orderBadge}>{stop.order || stop.Order}</div>
                          <div>
                            <h4 style={{ margin: '0 0 3px' }}>{stop.stationName || stop.Name}</h4>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              ⬇️ {stop.scheduledArrival || stop.ScheduledArrival} — ⬆️ {stop.scheduledDeparture || stop.ScheduledDeparture}
                            </span>
                          </div>
                        </div>
                        <div style={cardActions}>
                          <button onClick={() => setStopModal({ isOpen: true, isEdit: true, data: stop })} style={editBtn}>✏️</button>
                          <button onClick={() => handleDeleteStop(stop.id || stop.Id)} style={deleteBtn}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- МОДАЛКИ --- */}
        {stationModal.isOpen && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>{stationModal.isEdit ? 'Редагувати станцію' : 'Додати станцію'}</h3>
              <form onSubmit={handleSaveStation} style={formStyle}>
                <input placeholder="Назва станції" style={inputStyle} value={stationModal.data.name || stationModal.data.Name || ''} onChange={e => setStationModal({...stationModal, data: {...stationModal.data, name: e.target.value}})} required />
                <div style={modalActions}>
                  <button type="submit" style={saveBtn}>Зберегти</button>
                  <button type="button" onClick={() => setStationModal({ isOpen: false, isEdit: false, data: { name: '' } })} style={cancelBtn}>Скасувати</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {trainModal.isOpen && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>{trainModal.isEdit ? 'Редагувати автобус' : 'Додати автобус'}</h3>
              <form onSubmit={handleSaveTrain} style={formStyle}>
                <input placeholder="Номер маршруту (напр. 13)" style={inputStyle} value={trainModal.data.name || trainModal.data.Name || ''} onChange={e => setTrainModal({...trainModal, data: {...trainModal.data, name: e.target.value}})} required />
                <input placeholder="Держ. номер" style={inputStyle} value={trainModal.data.number || trainModal.data.Number || ''} onChange={e => setTrainModal({...trainModal, data: {...trainModal.data, number: e.target.value}})} required />
                <input type="number" placeholder="Кількість місць" style={inputStyle} value={trainModal.data.totalSeats || trainModal.data.TotalSeats || ''} onChange={e => setTrainModal({...trainModal, data: {...trainModal.data, totalSeats: e.target.value}})} required />
                <div style={modalActions}>
                  <button type="submit" style={saveBtn}>Зберегти</button>
                  <button type="button" onClick={() => setTrainModal({ isOpen: false, isEdit: false, data: { name: '', number: '', totalSeats: '' } })} style={cancelBtn}>Скасувати</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {stopModal.isOpen && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>{stopModal.isEdit ? 'Редагувати зупинку' : 'Нова зупинка'}</h3>
              <form onSubmit={handleSaveStop} style={formStyle}>
                {!stopModal.isEdit && (
                  <select style={inputStyle} value={stopModal.data.stationId || stopModal.data.StationId || ''} onChange={e => setStopModal({...stopModal, data: {...stopModal.data, stationId: e.target.value}})} required>
                    <option value="">-- Оберіть станцію --</option>
                    {stations.map(st => <option key={st.id || st.Id} value={st.id || st.Id}>{st.name || st.Name}</option>)}
                  </select>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Прибуття:</label>
                    <input type="time" style={inputStyle} value={stopModal.data.scheduledArrival || stopModal.data.ScheduledArrival || ''} onChange={e => setStopModal({...stopModal, data: {...stopModal.data, scheduledArrival: e.target.value}})} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Відправлення:</label>
                    <input type="time" style={inputStyle} value={stopModal.data.scheduledDeparture || stopModal.data.ScheduledDeparture || ''} onChange={e => setStopModal({...stopModal, data: {...stopModal.data, scheduledDeparture: e.target.value}})} required />
                  </div>
                </div>
                <input type="number" placeholder="Порядок (1, 2...)" style={inputStyle} value={stopModal.data.order || stopModal.data.Order || ''} onChange={e => setStopModal({...stopModal, data: {...stopModal.data, order: e.target.value}})} required />
                <div style={modalActions}>
                  <button type="submit" style={saveBtn}>Зберегти</button>
                  <button type="button" onClick={() => setStopModal({ isOpen: false, isEdit: false, data: { stationId: '', scheduledArrival: '', scheduledDeparture: '', order: '' } })} style={cancelBtn}>Скасувати</button>
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
const tabsContainer = { display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #e9ecef', paddingBottom: '10px' };
const activeTabBtn = { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#212529', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const inactiveTabBtn = { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e9ecef', color: '#495057', cursor: 'pointer' };
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' };
const cardStyle = { backgroundColor: '#fff', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 3px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s', border: '2px solid transparent' };

// СТИЛІ ДЛЯ ПІДСВІТКИ (Тільки обводка)
const trainCard = { ...cardStyle, cursor: 'pointer' };
const selectedTrainCard = { ...cardStyle, cursor: 'pointer', border: '2px solid #007bff' };

const stopCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f1f3f5' };
const orderBadge = { backgroundColor: '#e7f1ff', color: '#0d6efd', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' };
const cardActions = { display: 'flex', gap: '10px' };
const addBtn = { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const editBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' };
const deleteBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', filter: 'grayscale(0.5)' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const labelStyle = { fontSize: '13px', color: '#666', marginBottom: '5px', display: 'block' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%' };
const modalActions = { display: 'flex', gap: '10px', marginTop: '10px' };
const saveBtn = { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1 };
const cancelBtn = { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', flex: 1 };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '380px' };
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#666' };

export default AdminFleet;