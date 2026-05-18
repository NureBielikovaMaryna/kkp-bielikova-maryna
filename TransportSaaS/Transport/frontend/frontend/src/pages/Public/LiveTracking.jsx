import { useState, useEffect } from 'react';
import api from '../../services/api';

const calculateEstimatedTime = (scheduledTime, delay) => {
  if (!scheduledTime || scheduledTime === "--:--") return "--:--";
  if (delay <= 0) return scheduledTime;

  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes + delay);

  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};

function LiveTracking() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(sessionStorage.getItem('user'));
  const clientId = user?.userId || user?.UserId;

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000); 
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStatus = async () => {
    try {
      const res = await api.get(`/Client/my-active-trip/${clientId}`);
      if (res.data && res.data.hasActiveTrip) {
        setData(res.data);
      } else {
        setData(null);
      }
      setLoading(false);
    } catch (e) {
      console.error("Live tracking error", e);
      setLoading(false);
    }
  };

  if (loading) return <div style={centerText}>З'єднання з супутником...</div>;

  if (!data) {
    return (
      <div style={container}>
        <div style={emptyStateCard}>
          <h2 style={{color: '#ccc', fontSize: '40px'}}>🛸</h2>
          <h3>Немає активних поїздок</h3>
          <p>Як тільки водій розпочне рейс, на який у вас є квиток, інформація з'явиться тут.</p>
        </div>
      </div>
    );
  }

  const tripInfo = data.TripInfo || data.tripInfo;
  const stops = data.Stops || data.stops || [];
  const currentOrder = tripInfo?.CurrentStopOrder || tripInfo?.currentStopOrder || 0;
  const delay = tripInfo?.DelayMinutes || tripInfo?.delayMinutes || 0;
  const isAtStop = tripInfo?.IsAtStop || tripInfo?.isAtStop;

  return (
    <div style={container}>
      <div style={header}>
        <h1 style={{margin: 0}}>🛰️ Моя поїздка</h1>
        <div style={liveBadge}>🔴 LIVE</div>
      </div>

      <div style={mainCard}>
        <div style={topInfoGrid}>
          <div style={infoItem}>
            <span style={label}>Транспорт</span>
            <span style={value}>{data.TrainName || data.trainName || "Автобус"}</span>
          </div>
          <div style={infoItem}>
            <span style={label}>Ваше місце</span>
            <span style={seatValue}>{data.SeatNumber || data.seatNumber}</span>
          </div>
          <div style={infoItem}>
            <span style={label}>Затримка</span>
            <span style={delayValue(delay)}>{delay > 0 ? `+${delay} хв` : "В графіку"}</span>
          </div>
        </div>

        <div style={timeline}>
          {stops.map((stop, i) => {
            const order = stop.Order || stop.order;
            const isPassed = order < currentOrder;
            const isCurrent = order === currentOrder;
            
            const estimatedArrival = calculateEstimatedTime(stop.ScheduledArrival || stop.scheduledArrival, delay);
            const estimatedDeparture = calculateEstimatedTime(stop.ScheduledDeparture || stop.scheduledDeparture, delay);

            return (
              <div key={i} style={stopRow}>
                {/* Час: План + Прогноз */}
                <div style={timeColumn}>
                  <div style={{ ...timeArrival, opacity: isPassed ? 0.5 : 1 }}>
                    {stop.ScheduledArrival || stop.scheduledArrival || "--:--"}
                    {!isPassed && delay > 0 && <span style={estLabel}> (~{estimatedArrival})</span>}
                  </div>
                  <div style={{ ...timeDeparture, opacity: isPassed ? 0.5 : 1 }}>
                    {stop.ScheduledDeparture || stop.scheduledDeparture || "--:--"}
                    {!isPassed && delay > 0 && <span style={estLabel}> (~{estimatedDeparture})</span>}
                  </div>
                </div>

                {/* Лінія */}
                <div style={indicatorColumn}>
                  <div style={dot(isPassed, isCurrent)}>
                    {isCurrent && <div style={pulseDot}></div>}
                  </div>
                  {i !== stops.length - 1 && <div style={line(isPassed)}></div>}
                </div>

                {/* Назва станції */}
                <div style={stationInfo(isCurrent)}>
                  <b style={{fontSize: '16px', color: isPassed ? '#999' : '#333'}}>
                    {stop.StationName || stop.stationName}
                  </b>
                  
                  {isCurrent && (
                    <div style={isAtStop ? atStopBadge : movingBadge}>
                      {isAtStop ? "🏠 На зупинці (посадка)" : "🚌 В дорозі до цієї зупинки"}
                    </div>
                  )}
                  
                  {isPassed && <div style={{color: '#28a745', fontSize: '12px', marginTop: '5px'}}>✓ Пройдено</div>}
                  
                  {!isPassed && !isCurrent && delay > 0 && (
                    <small style={{color: '#999', fontSize: '11px', marginTop: '5px'}}>* Можлива затримка</small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p style={autoUpdateNote}>Дані оновлюються автоматично кожні 10 секунд</p>
    </div>
  );
}

// --- СТИЛІ ---
const container = { padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const liveBadge = { backgroundColor: '#ff4757', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const mainCard = { backgroundColor: '#fff', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const topInfoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', paddingBottom: '25px', borderBottom: '1px solid #f0f0f0', marginBottom: '25px' };
const infoItem = { display: 'flex', flexDirection: 'column', gap: '5px' };
const label = { fontSize: '11px', color: '#999', textTransform: 'uppercase', fontWeight: 'bold' };
const value = { fontSize: '18px', fontWeight: 'bold', color: '#333' };
const seatValue = { fontSize: '20px', fontWeight: '900', color: '#007bff' };
const delayValue = (d) => ({ fontSize: '16px', fontWeight: 'bold', color: d > 0 ? '#ff4757' : '#28a745' });
const timeline = { display: 'flex', flexDirection: 'column' };
const stopRow = { display: 'flex', gap: '20px', minHeight: '90px' };
const timeColumn = { width: '120px', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' };
const timeArrival = { fontSize: '12px', color: '#888' };
const timeDeparture = { fontSize: '14px', fontWeight: 'bold', color: '#333' };
const estLabel = { color: '#ff4757', fontWeight: 'bold', fontSize: '11px' };
const indicatorColumn = { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' };
const dot = (p, c) => ({ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c ? '#007bff' : p ? '#28a745' : '#eee', zIndex: 2, marginTop: '22px', border: c ? '3px solid #fff' : 'none', boxShadow: c ? '0 0 10px rgba(0,123,255,0.5)' : 'none' });
const line = (p) => ({ width: '2px', flex: 1, backgroundColor: p ? '#28a745' : '#eee', margin: '-5px 0' });
const pulseDot = { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#007bff', opacity: 0.6, animation: 'pulse 2s infinite' };
const stationInfo = (c) => ({ flex: 1, padding: '15px 20px', borderRadius: '15px', backgroundColor: c ? '#f0f7ff' : 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'center' });
const atStopBadge = { marginTop: '5px', fontSize: '10px', backgroundColor: '#f1c40f', color: '#000', padding: '3px 10px', borderRadius: '6px', fontWeight: 'bold', width: 'fit-content' };
const movingBadge = { marginTop: '5px', fontSize: '10px', backgroundColor: '#007bff', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontWeight: 'bold', width: 'fit-content' };
const emptyStateCard = { textAlign: 'center', padding: '100px 40px', backgroundColor: '#fff', borderRadius: '20px', border: '2px dashed #eee' };
const centerText = { textAlign: 'center', marginTop: '100px', color: '#888' };
const autoUpdateNote = { textAlign: 'center', fontSize: '11px', color: '#bbb', marginTop: '20px' };

export default LiveTracking;