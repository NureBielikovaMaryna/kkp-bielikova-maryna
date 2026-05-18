import { useState, useEffect } from 'react';
import api from '../../services/api';
import DriverNavbar from '../../components/DriverNavbar';

function DriverCurrentTrip() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const driverId = savedUser?.userId || savedUser?.UserId;

  const showStatus = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (driverId) fetchCurrentTrip();
  }, [driverId]);

  const fetchCurrentTrip = async () => {
    try {
      const res = await api.get(`/Driver/my-current-trip/${driverId}`);
      if (res.data.hasTrip) {
        setTripData(res.data);
      } else {
        setTripData(null);
      }
      setLoading(false);
    } catch (err) {
      showStatus("Помилка зв'язку з сервером", "error");
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    try {
      await api.post(`/Driver/start-trip/${tripData.tripInfo.id}`);
      showStatus("Рейс розпочато! Щасливої дороги.");
      fetchCurrentTrip();
    } catch (err) {
      showStatus("Не вдалося почати рейс", "error");
    }
  };

  // НОВА ФУНКЦІЯ: Прибуття на зупинку
  const handleArrived = async () => {
    try {
      await api.post(`/Driver/arrived-at-stop/${tripData.tripInfo.id}`);
      showStatus("Прибуття зафіксовано. Посадка пасажирів...");
      fetchCurrentTrip();
    } catch (err) {
      showStatus("Помилка прибуття", "error");
    }
  };

  const handleDeparted = async (stopId) => {
    try {
      const res = await api.post(`/Driver/departed-from-stop/${tripData.tripInfo.id}/${stopId}`);
      showStatus(res.data.message);
      fetchCurrentTrip(); 
    } catch (err) {
      showStatus("Помилка відмітки відправлення", "error");
    }
  };

  const handleEndTrip = async () => {
    try {
      const res = await api.post(`/Driver/end-trip/${tripData.tripInfo.id}`);
      showStatus(`Рейс завершено! Фінальне запізнення: ${res.data.finalDelay} хв.`);
      setTripData(null);
    } catch (err) {
      showStatus("Не вдалося завершити рейс", "error");
    }
  };

  if (loading) return <div style={centerText}>Зчитування датчиків...</div>;

  // Витягуємо IsAtStop з нашого об'єкта
  const isAtStop = tripData?.tripInfo?.isAtStop || tripData?.tripInfo?.IsAtStop;

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <DriverNavbar />

      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#198754' }}>
          {toast.text}
        </div>
      )}

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        {!tripData ? (
          <div style={emptyCard}>
            <div style={{ fontSize: '40px' }}>🛰️</div>
            <h3>Активних рейсів не виявлено</h3>
            <p>Перевірте розклад або зверніться до диспетчера.</p>
          </div>
        ) : (
          <>
            {/* КАРТКА РЕЙСУ */}
            <div style={tripHeaderCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '22px', color: '#1a1a1a' }}> Маршрут №{tripData.trainInfo.name}</h1>
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>Державний номер: <b>{tripData.trainInfo.number}</b></div>
                </div>
                <div style={delayBadge(tripData.tripInfo.delayMinutes)}>
                  {tripData.tripInfo.delayMinutes > 0 ? `⏱ +${tripData.tripInfo.delayMinutes} хв` : '⏱ В графіку'}
                </div>
              </div>

              <div style={routeSummaryBar}>
                <div style={summaryItem}>
                  <span style={summaryLabel}>📅 Дата</span>
                  <span style={summaryValue}>{tripData.tripInfo.date}</span>
                </div>
                <div style={verticalDivider}></div>
                <div style={summaryItem}>
                  <span style={summaryLabel}>🏁 Виїзд</span>
                  <span style={summaryValue}>{tripData.stops[0]?.scheduledDeparture || '--:--'}</span>
                </div>
                <div style={arrowIcon}>➔</div>
                <div style={summaryItem}>
                  <span style={summaryLabel}>🏆 Прибуття</span>
                  <span style={summaryValue}>{tripData.stops[tripData.stops.length - 1]?.scheduledDeparture || '--:--'}</span>
                </div>
              </div>

              {tripData.tripInfo.status === 0 ? ( 
                <button onClick={handleStartTrip} style={startBtn}>ВИЙТИ НА МАРШРУТ</button>
              ) : (
                <div style={progressInfo}>
                    {isAtStop ? "🏠 СТОЇМО НА ЗУПИНЦІ" : "🟢 РЕЙС У РУСІ"}
                </div>
              )}
            </div>

            {/* СПИСОК ЗУПИНОК */}
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginLeft: '10px', color: '#444' }}>Маршрутний лист</h3>
              <div style={timeline}>
                {tripData.stops.map((stop, index) => {
                  const currentOrder = tripData.tripInfo.currentStopOrder;
                  const isCurrent = stop.order === currentOrder;
                  const isPassed = stop.order < currentOrder;
                  const isLast = index === tripData.stops.length - 1;

                  return (
                    <div key={stop.id} style={stopRow}>
                      <div style={indicatorCol}>
                        <div style={dot(isCurrent, isPassed)}></div>
                        {!isLast && <div style={line(isPassed)}></div>}
                      </div>
                      
                      <div style={{ ...stopContent, opacity: isPassed ? 0.6 : 1, borderLeft: isCurrent ? '5px solid #007bff' : 'none' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{stop.stationName}</div>
                          <div style={{ fontSize: '13px', color: '#777' }}>За розкладом: {stop.scheduledDeparture}</div>
                        </div>

                        {/* ЛОГІКА КНОПОК ДЛЯ ВОДІЯ */}
                        {isCurrent && (
                          !isAtStop ? (
                            <button onClick={handleArrived} style={arriveBtn}>Я прибув 🏁</button>
                          ) : (
                            !isLast ? (
                              <button onClick={() => handleDeparted(stop.id)} style={departBtn}>Відправляюсь ➔</button>
                            ) : (
                              <button onClick={handleEndTrip} style={endBtn}>Завершити рейс 🏁</button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- СТИЛІ ---
const toastStyle = { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', padding: '12px 25px', color: 'white', borderRadius: '30px', zIndex: 3000, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const tripHeaderCard = { backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', marginBottom: '20px' };
const delayBadge = (d) => ({ backgroundColor: d > 0 ? '#fff0f0' : '#f0fff4', color: d > 0 ? '#d63031' : '#27ae60', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', border: `1px solid ${d > 0 ? '#fab1a0' : '#b2bec3'}` });
const startBtn = { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' };
const progressInfo = { marginTop: '15px', textAlign: 'center', color: '#007bff', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.5px' };
const timeline = { display: 'flex', flexDirection: 'column', gap: '0' };
const stopRow = { display: 'flex', minHeight: '80px' };
const indicatorCol = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' };
const dot = (curr, passed) => ({ width: curr ? '18px' : '12px', height: curr ? '18px' : '12px', borderRadius: '50%', backgroundColor: curr ? '#007bff' : passed ? '#27ae60' : '#ccc', border: curr ? '4px solid #fff' : 'none', boxShadow: curr ? '0 0 10px rgba(0,123,255,0.5)' : 'none', zIndex: 2, marginTop: '5px' });
const line = (passed) => ({ width: '3px', flex: 1, backgroundColor: passed ? '#27ae60' : '#ddd', margin: '-5px 0' });
const stopContent = { flex: 1, backgroundColor: '#fff', margin: '0 0 15px 10px', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };

const arriveBtn = { backgroundColor: '#f1c40f', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const departBtn = { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const endBtn = { backgroundColor: '#000', color: '#ffd700', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };

const emptyCard = { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '20px', color: '#888' };
const centerText = { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#666' };

const routeSummaryBar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #edf2f7', marginTop: '10px' };
const summaryItem = { display: 'flex', flexDirection: 'column', gap: '4px' };
const summaryLabel = { fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' };
const summaryValue = { fontSize: '15px', fontWeight: '700', color: '#2d3436' };
const verticalDivider = { width: '1px', height: '30px', backgroundColor: '#e2e8f0' };
const arrowIcon = { color: '#cbd5e0', fontSize: '18px', fontWeight: 'bold' };

export default DriverCurrentTrip;