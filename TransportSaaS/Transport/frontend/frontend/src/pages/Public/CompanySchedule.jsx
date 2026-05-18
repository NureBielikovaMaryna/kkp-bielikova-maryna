import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function CompanySchedule() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Стан для зберігання інформації, які саме зупинки відкриті
  const [expandedTrips, setExpandedTrips] = useState({});

  useEffect(() => {
    api.get(`/Public/schedule/${companyId}`)
      .then(response => {
        // Сортуємо за датою, щоб було як у адміна
        let sortedTrips = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setTrips(sortedTrips);
        setLoading(false);
      })
      .catch(error => {
        console.error("Помилка завантаження розкладу:", error);
        setLoading(false);
      });
  }, [companyId]);

  const toggleStops = (tripId) => {
    setExpandedTrips(prev => ({
      ...prev,
      [tripId]: !prev[tripId]
    }));
  };

  const handleToggleStops = (trip) => {
    const tripId = trip.tripInstanceId || trip.id;
    const isOpening = !expandedTrips[tripId];

    toggleStops(tripId); 

    if (isOpening) {
      const savedUser = JSON.parse(sessionStorage.getItem('user'));
      const currentUserId = savedUser?.userId || savedUser?.UserId;

      if (currentUserId) {
        const actualId = trip.trainId || tripId; 
        console.log("DEBUG: Відправляю userId:", currentUserId, "та ID:", actualId);

        api.post('/Client/add-view-history', {
          userId: parseInt(currentUserId),
          trainId: parseInt(actualId) 
        })
        .then(() => console.log("✅ Історію записано!"))
        .catch(err => {
          console.error("❌ Помилка бази! Можливо, ID", actualId, "не існує в таблиці Trains.");
        });
      }
    }
  };

  if (loading) return <div style={loaderStyle}>Шукаємо автобуси...</div>;

  // Логіка для групування рейсів за датою (як у адміна)
  let currentDateLine = null;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Навігація в стилі адмінки */}
      <div style={{ backgroundColor: '#fff', padding: '15px 30px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          ← Назад до компаній
        </button>
      </div>

      <div style={{ padding: '0 30px', maxWidth: '850px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '25px', color: '#212529' }}>📅 Розклад рейсів</h1>

        {trips.length === 0 ? (
          <div style={cardEmptyStyle}>На найближчі дати рейсів немає.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {trips.map(trip => {
              const currentTripId = trip.tripInstanceId || trip.id;
              const isExpanded = expandedTrips[currentTripId];

              // Групування по датах
              const showDateHeader = trip.date !== currentDateLine;
              currentDateLine = trip.date;

              return (
                <div key={currentTripId}>
                  {showDateHeader && (
                    <h2 style={dateHeaderStyle}>🗓️ {trip.date}</h2>
                  )}

                  <div style={tripCardStyle}>
                    {/* ВЕРХНЯ ЧАСТИНА */}
                    <div style={tripHeaderStyle}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#333' }}>
                          Транспорт: №{trip.trainName} 
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={seatsBadgeStyle}>
                            Місць вільно: {trip.availableSeats} з {trip.totalSeats}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '14px', fontWeight: '500' }}>
                          {trip.stops && trip.stops[0]?.stationName} ({trip.stops && trip.stops[0]?.scheduledDeparture}) 
                          {' — '} 
                          {trip.stops && trip.stops[trip.stops.length - 1]?.stationName} ({trip.stops && trip.stops[trip.stops.length - 1]?.scheduledArrival})
                        </p>
                      </div>

                      <button 
                        onClick={() => navigate(`/booking/${currentTripId}`)}
                        style={bookBtnStyle}
                      >
                        🎟️ Вибрати місце
                      </button>
                    </div>

                    {/* СЕКЦІЯ ЗУПИНОК */}
                    <div style={stopsToggleSection}>
                      <button onClick={() => handleToggleStops(trip)} style={toggleStopsBtn}>
                        {isExpanded ? '🔼 Сховати зупинки' : '🔽 Показати всі зупинки'}
                      </button>
                      
                      {isExpanded && (
                        <div style={stopsListStyle}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Детальний маршрут:</h4>
                          {trip.stops && trip.stops.length > 0 ? (
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                              {/* Сортуємо зупинки по order, як у адмінки */}
                              {[...trip.stops].sort((a, b) => a.order - b.order).map((stop, index) => (
                                <li key={stop.order} style={{ 
                                  padding: '8px 0', 
                                  borderBottom: index === trip.stops.length - 1 ? 'none' : '1px solid #f1f3f5',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '13px'
                                }}>
                                  <span><b>{stop.order}.</b> {stop.stationName}</span>
                                  <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                                    {stop.scheduledArrival && `Приб: ${stop.scheduledArrival}`}
                                    {stop.scheduledArrival && stop.scheduledDeparture && ' | '}
                                    {stop.scheduledDeparture && `Відпр: ${stop.scheduledDeparture}`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div style={{ fontSize: '13px', color: '#999' }}>Інформація про зупинки відсутня</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- СТИЛІ З АДМІНКИ ---
const loaderStyle = { textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#666' };
const backBtnStyle = { padding: '8px 15px', background: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' };
const cardEmptyStyle = { backgroundColor: '#fff', padding: '40px', textAlign: 'center', borderRadius: '12px', color: '#888', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const dateHeaderStyle = { margin: '25px 0 10px', fontSize: '18px', borderBottom: '2px solid #e9ecef', paddingBottom: '8px', fontWeight: 'bold', color: '#333' };
const tripCardStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 3px 12px rgba(0,0,0,0.06)', border: '1px solid #eee', borderLeft: '5px solid #28a745' };
const tripHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const seatsBadgeStyle = { backgroundColor: '#e9ecef', color: '#495057', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' };
const bookBtnStyle = { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 5px rgba(40,167,69,0.3)' };
const stopsToggleSection = { marginTop: '15px', borderTop: '1px dashed #dee2e6', paddingTop: '15px' };
const toggleStopsBtn = { background: 'none', border: 'none', color: '#6c757d', fontSize: '13px', cursor: 'pointer', padding: '0', fontWeight: 'bold' };
const stopsListStyle = { marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #007bff' };

export default CompanySchedule; 