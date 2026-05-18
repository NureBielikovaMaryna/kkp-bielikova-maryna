import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

function AdminFullSchedule() {
  const [trains, setTrains] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ trainId: '', date: '' });
  const [expandedTrips, setExpandedTrips] = useState({});

  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const adminId = savedUser?.userId || savedUser?.UserId || savedUser?.id || savedUser?.Id;

  const showMessage = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const statusTranslations = {
    'Scheduled': 'Очікується', 'InProgress': 'У дорозі', 'Completed': 'Завершено', 'Cancelled': 'Скасовано'
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [driversRes, trainsRes] = await Promise.all([
        api.get(`/Admin/drivers-list/${adminId}`),
        api.get(`/Admin/my-trains/${adminId}`)
      ]);
      setDrivers(driversRes.data || []);
      setTrains(trainsRes.data || []);

      const allSchedules = await Promise.all(
        (trainsRes.data || []).map(async (train) => {
          const tId = train.id || train.Id;
          const [scheduleRes, stopsRes] = await Promise.all([
            api.get(`/Admin/train-schedule/${adminId}/${tId}`),
            api.get(`/Admin/train-stops/${adminId}/${tId}`)
          ]);

          return scheduleRes.data.map(trip => ({
            ...trip,
            trainName: train.name || train.Name,
            trainNumber: train.number || train.Number,
            stops: stopsRes.data || [] 
          }));
        })
      );

      let flatSchedule = allSchedules.flat();
      flatSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSchedule(flatSchedule);
      setLoading(false);
    } catch (err) {
      console.error("Помилка завантаження даних:", err);
      setLoading(false);
    }
  };

  const toggleStops = (id) => {
    setExpandedTrips(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      await api.delete(`/Admin/delete-trip/${adminId}/${tripId}`);
      showMessage("Рейс видалено з системи");
      fetchInitialData();
    } catch (err) {
      showMessage("Не вдалося видалити рейс", "error");
    }
  };

  const handleAssignDriver = async (tripId, driverId) => {
    if (!driverId || !tripId || !adminId) return;

    const payload = {
      AdminId: parseInt(adminId),
      TripInstanceId: parseInt(tripId),
      DriverId: parseInt(driverId)
    };

    try {
      await api.post('/Admin/assign-driver-to-trip', payload);
      showMessage("Водія призначено!");
      fetchInitialData();
    } catch (err) {
      // ВИПРАВЛЕНО: Беремо текст помилки прямо з відповіді сервера
      const serverMessage = err.response?.data?.message || "Помилка призначення";
      showMessage(serverMessage, "error");
      console.error("Server declined:", serverMessage);
    }
  };

  const handleUnassign = async (tripId) => {
    try {
      await api.post(`/Admin/unassign-driver-from-trip/${adminId}/${tripId}`);
      showMessage("Водія знято з рейсу");
      fetchInitialData();
    } catch (err) {
      showMessage("Помилка при знятті", "error");
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/Admin/generate-schedule', {
        adminId: parseInt(adminId),
        trainId: parseInt(newSchedule.trainId),
        dates: [newSchedule.date]
      });
      showMessage("Новий рейс створено!");
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      showMessage("Помилка створення", "error");
    }
  };

  if (loading) return <div style={loaderStyle}>Завантаження розкладу...</div>;

  const now = new Date().setHours(0,0,0,0);
  let currentDateLine = null;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <AdminNavbar />

      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#198754' }}>
          {toast.text}
        </div>
      )}
      
      <div style={{ padding: '30px', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h1 style={{ margin: 0 }}>📅 Диспетчер розкладу</h1>
          <button onClick={() => setShowModal(true)} style={generateBtn}>➕ Новий рейс</button>
        </div>

        {showModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h3>Створити рейс</h3>
              <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select style={inputStyle}  value={newSchedule.trainId} 
                onChange={e => setNewSchedule({...newSchedule, trainId: e.target.value})} required>
                  <option value="">-- Оберіть транспорт --</option>
                  {trains.map(t => (<option key={`tr-${t.id || t.Id}`} value={t.id || t.Id}>
                    Маршрут №{t.name || t.Name} | ({t.number || t.Number})</option>
                    ))} 
                </select>
                <input type="date" style={inputStyle} value={newSchedule.date} onChange={e => setNewSchedule({...newSchedule, date: e.target.value})} required />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={saveBtn}>Створити</button>
                  <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>Скасувати</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {schedule.map((trip, idx) => {
            const tripDate = new Date(trip.date).setHours(0,0,0,0);
            const isPast = tripDate < now;
            const currentTripId = trip.id || trip.Id;
            const isDriverAssigned = trip.hasDriver === true;
            const isExpanded = expandedTrips[currentTripId];

            const showDateHeader = trip.date !== currentDateLine;
            currentDateLine = trip.date;

            return (
              <div key={`trip-block-${currentTripId || idx}`}>
                {showDateHeader && (
                  <h2 style={{ ...dateHeaderStyle, color: isPast ? '#adb5bd' : '#212529' }}>
                    {isPast ? '📜' : '🗓️'} {trip.date} {isPast && '(Архів)'}
                  </h2>
                )}

                <div style={{ ...tripCard, opacity: isPast ? 0.7 : 1, borderLeft: isPast ? '5px solid #adb5bd' : '5px solid #007bff' }}>
                  <div style={tripHeader}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px' }}> Маршрут №{trip.trainName} <small>({trip.trainNumber})</small></h3>
                      {trip.status === 'Completed' && (
                        <div style={{ marginTop: '5px', fontSize: '13px', fontWeight: 'bold', color: trip.delayMinutes > 0 ? '#dc3545' : '#198754' }}>
                          ⏱ Затримка: {trip.delayMinutes} хв
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={statusBadge(trip.status, isPast)}>{statusTranslations[trip.status] || trip.status}</span>
                      <button onClick={() => handleDeleteTrip(currentTripId)} style={deleteBtnStyle}>🗑️</button>
                    </div>
                  </div>
                  
                  <div style={driverSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px' }}>
                        👤 <b>Водій:</b> <span style={{ color: isDriverAssigned ? '#333' : '#dc3545' }}>{isDriverAssigned ? trip.driverName : "Не призначено"}</span>
                      </span>
                      
                      {!isPast && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isDriverAssigned ? (
                            <button onClick={() => handleUnassign(currentTripId)} style={unassignBtn}>❌ Зняти</button>
                          ) : (
                            <select style={selectStyle} onChange={(e) => handleAssignDriver(currentTripId, e.target.value)} value="">
                              <option value="" disabled>Призначити водія...</option>
                              {drivers.map((d, dIdx) => {
                                const dId = d.driverId || d.Id || d.userId || d.id;
                                return <option key={`d-opt-${currentTripId}-${dId || dIdx}`} value={dId}>{d.driverName || d.Name}</option>;
                              })}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                    <button onClick={() => toggleStops(currentTripId)} style={toggleStopsBtn}>
                      {isExpanded ? '🔼 Сховати зупинки' : '🔽 Показати зупинки'}
                    </button>
                    
                    {isExpanded && (
                      <div style={stopsListStyle}>
                        {trip.stops && trip.stops.length > 0 ? 
                          [...trip.stops]
                          .sort((a, b) => (a.order || a.Order) - (b.order || b.Order))
                          .map((stop, sIdx) => (
                          <div key={sIdx} style={stopItemStyle}>
                            <span><b>{stop.order || stop.Order}.</b> {stop.stationName || stop.Name}</span>
                            <span style={{ color: '#007bff', fontWeight: 'bold' }}>{stop.arrivalTime || stop.Time}</span>
                          </div>
                        )) : <div style={{ fontSize: '12px', color: '#999', padding: '5px' }}>Зупинки не налаштовані</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// СТИЛІ 
const toastStyle = { position: 'fixed', top: '25px', right: '25px', padding: '15px 30px', color: 'white', borderRadius: '10px', zIndex: 3000, boxShadow: '0 5px 15px rgba(0,0,0,0.2)', fontWeight: 'bold' };
const dateHeaderStyle = { margin: '25px 0 10px', fontSize: '18px', borderBottom: '2px solid #e9ecef', paddingBottom: '8px', fontWeight: 'bold' };
const tripCard = { backgroundColor: '#fff', padding: '18px 22px', borderRadius: '12px', boxShadow: '0 3px 12px rgba(0,0,0,0.06)', border: '1px solid #eee' };
const tripHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' };
const statusBadge = (s, past) => ({ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', backgroundColor: past ? '#f1f3f5' : (s === 'Completed' ? '#d1e7dd' : '#e7f1ff'), color: past ? '#6c757d' : (s === 'Completed' ? '#0f5132' : '#084298') });
const deleteBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', filter: 'grayscale(0.5)' };
const driverSection = { borderTop: '1px solid #f8f9fa', paddingTop: '15px' };
const selectStyle = { padding: '6px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px' };
const generateBtn = { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const saveBtn = { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: 'bold' };
const cancelBtn = { backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', flex: 1 };
const unassignBtn = { background: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '6px', cursor: 'pointer', padding: '4px 12px', fontSize: '12px', fontWeight: 'bold' };
const toggleStopsBtn = { background: 'none', border: 'none', color: '#6c757d', fontSize: '12px', cursor: 'pointer', padding: '0' };
const stopsListStyle = { marginTop: '10px', paddingLeft: '10px', borderLeft: '2px solid #e7f1ff' };
const stopItemStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #f9f9f9' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '380px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' };
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#666' };

export default AdminFullSchedule;