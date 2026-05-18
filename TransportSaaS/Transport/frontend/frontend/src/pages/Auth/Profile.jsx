import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ImageUploader from '../../components/ImageUploader';

const statusTranslations = {
  'Scheduled': 'Очікується',
  'InProgress': 'У дорозі',
  'Completed': 'Завершено',
  'Cancelled': 'Скасовано'
};

function Profile() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({ name: '', email: '', password: '', photoUrl: '' });
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [driverHistory, setDriverHistory] = useState([]);

  const [editPart, setEditPart] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const savedUser = JSON.parse(sessionStorage.getItem('user'));
  const userRole = savedUser?.role || savedUser?.Role;
  const companyName = savedUser?.companyName || savedUser?.CompanyName;
  
  const isClient = userRole === 'Client';
  const isDriver = userRole === 'Driver';
  const isAdmin = userRole === 'Admin';

  const showMessage = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const currentUserId = savedUser?.userId || savedUser?.UserId;
    if (!currentUserId) { navigate('/login'); return; }

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const resProf = await api.get(`/Client/profile/${currentUserId}`);
        setUserProfile({
          name: resProf.data.name || resProf.data.Name || '',
          email: resProf.data.email || resProf.data.Email || '',
          photoUrl: resProf.data.photoUrl || resProf.data.PhotoUrl || '',
          password: ''
        });
      } catch (err) {
        setUserProfile(prev => ({ ...prev, name: savedUser?.name, email: savedUser?.email }));
      }

      if (isClient) {
        try {
          const [resBook, resHist] = await Promise.all([
            api.get(`/Client/my-bookings/${currentUserId}`),
            api.get(`/Client/my-view-history/${currentUserId}`)
          ]);
          setBookings(resBook.data || []);
          setHistory(resHist.data || []);
        } catch (e) { console.error("Client data error"); }
      }


      

      if (isDriver) {
        try {
          const resDriverHist = await api.get(`/Driver/my-history/${currentUserId}`);
          setDriverHistory(resDriverHist.data || []);
        } catch (e) { console.error("Driver history error"); }
      }
      setLoading(false);
    };
    fetchAllData();
  }, [navigate, isClient, isDriver, savedUser?.userId, savedUser?.UserId]);

  const handleUpdate = async (type) => {
    const currentUserId = savedUser?.userId || savedUser?.UserId;

    let payload = {
      Name: userProfile.name,
      Email: userProfile.email,
      PhotoUrl: userProfile.photoUrl || "", // Порожній рядок тепер затирає фото в базі
      Password: userProfile.password || null
    };

    if (type === 'password' && (userProfile.password !== passwordConfirm)) {
      showMessage("Паролі не збігаються!", "error");
      return;
    }

    try {
      await api.put(`/Client/update-profile/${currentUserId}`, payload);
      
      sessionStorage.setItem('user', JSON.stringify({ 
        ...savedUser, 
        name: userProfile.name, 
        email: userProfile.email,
        photoUrl: userProfile.photoUrl 
      }));

      showMessage("Дані успішно оновлено!");
      setEditPart(null);
      setPasswordConfirm('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Помилка оновлення даних";
      showMessage(errorMsg, "error");
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.tripStatus === 'Completed' && b.tripStatus !== 'Completed') return 1;
    if (a.tripStatus !== 'Completed' && b.tripStatus === 'Completed') return -1;
    return 0;
  });

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '100px', color: '#666' }}>Синхронізація...</h2>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#198754' }}>
          {toast.text}
        </div>
      )}

      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Повернутися</button>

      {/* ШАПКА КАРТКИ */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', width: '85px', height: '85px' }}>
            <div style={avatarStyle}>
              {userProfile.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
              ) : (
                userProfile.name?.charAt(0).toUpperCase() || "👤"
              )}
            </div>
            <button onClick={() => setEditPart('photo')} style={pencilOverlayStyle}>✏️</button>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>{userProfile.name || "Користувач"}</h2>
            <span style={roleBadgeStyle}>{userRole}</span>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px', color: '#333' }}>👤 Особиста інформація</h3>
          
          <div style={rowStyle}>
            <div><b>Ім'я:</b> {userProfile.name}</div>
            <button onClick={() => setEditPart('name')} style={editBtnSmall}>📝 Змінити</button>
          </div>

          <div style={rowStyle}>
            <div><b>Email:</b> {userProfile.email}</div>
            <button onClick={() => setEditPart('email')} style={editBtnSmall}>📧 Змінити</button>
          </div>

          <div style={rowStyle}>
            <div><b>Пароль:</b> ••••••••••••</div>
            <button onClick={() => setEditPart('password')} style={editBtnSmall}>🔒 Змінити</button>
          </div>

          {/* НАЗВА КОМПАНІЇ ДЛЯ АДМІНА ТА ВОДІЯ */}
          {(isAdmin || isDriver) && (
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div><b>Компанія:</b> <span style={{ color: '#007bff', fontWeight: 'bold' }}>{companyName || "Транспортна мережа"}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛКИ */}
      {editPart && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>
              {editPart === 'name' ? 'Змінити ім\'я' : 
               editPart === 'photo' ? 'Оновити фото' : 
               editPart === 'email' ? 'Змінити Email' : 'Оновити пароль'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {editPart === 'name' && <input style={inputStyle} value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} placeholder="Нове ім'я" />}
              {editPart === 'photo' && (
                <ImageUploader 
                currentPhoto={userProfile.photoUrl} 
                onImageUpload={(base64) => setUserProfile({...userProfile, photoUrl: base64})} />
                )}
              {editPart === 'email' && <input style={inputStyle} type="email" value={userProfile.email} onChange={e => setUserProfile({...userProfile, email: e.target.value})} placeholder="Новий Email" />}
              {editPart === 'password' && (
                <>
                  <input style={inputStyle} type="password" value={userProfile.password} onChange={e => setUserProfile({...userProfile, password: e.target.value})} placeholder="Новий пароль" />
                  <input style={inputStyle} type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Підтвердіть пароль" />
                </>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => handleUpdate(editPart)} style={saveBtnFull}>Зберегти</button>
                <button onClick={() => { setEditPart(null); setPasswordConfirm(''); }} style={cancelBtnFull}>Закрити</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* КЛІЄНТ: Квитки та Історія */}
      {isClient && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px', marginTop: '30px' }}>
          <div style={cardStyle}>
            <h3 style={{marginTop: 0}}>🎟️ Мої квитки</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sortedBookings.length === 0 ? <p style={{ color: '#999' }}>Квитків не знайдено.</p> :
                sortedBookings.map((b, i) => (
                  <div key={b.bookingId || i} style={{ ...ticketCard, opacity: b.tripStatus === 'Completed' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Транспорт №{b.tripInfo?.trainName} 
                        <span style={{  fontSize: '13px', color: '#888', fontWeight: 'normal'  }}>
                          ({b.tripInfo?.trainNumber || b.tripInfo?.TrainNumber}) </span> </b>
                      <span style={statusBadge(b.tripStatus)}>{statusTranslations[b.tripStatus] || b.tripStatus}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', margin: '5px 0' }}>🗓 {b.tripInfo?.date}</div>
                    <div style={{ color: '#28a745', fontWeight: 'bold' }}>📍 Місце: {b.seatNumber}</div>
                  </div>
                ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{marginTop: 0}}>👁️ Історія переглядів</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.length === 0 ? <p style={{ color: '#999' }}>Історія порожня.</p> :
                history.map((h, i) => (
                  <div key={h.viewId || i} style={historyItem}>
                    <b> Транспорт №{h.trainInfo?.name}</b>
                    <small style={{ color: '#999' }}>{h.viewedAt}</small>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ВОДІЙ: Архів поїздок */}
      {isDriver && (
  <div style={{ marginTop: '30px' }}>
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>📜 Архів завершених рейсів</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {driverHistory.length === 0 ? (
          <p style={{ color: '#888' }}>У вас ще немає завершених рейсів.</p>
        ) : (
          driverHistory.map((trip, idx) => (
            <div key={idx} style={ticketCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b style={{ fontSize: '17px' }}>Маршрут: {trip.trainName || trip.TrainName}</b>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    🗓 {trip.date || trip.Date}
                  </div>
                  {/* ДОДАЄМО ЗАТРИМКУ ТУТ */}
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    marginTop: '5px',
                    color: (trip.delayMinutes || trip.DelayMinutes) > 0 ? '#dc3545' : '#27ae60' 
                  }}>
                    ⏱ Затримка: {trip.delayMinutes || trip.DelayMinutes || 0} хв
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ backgroundColor: '#e9ecef', padding: '5px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
                    ⌛ {trip.duration || trip.Duration}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
      
    </div>
  );
}

// СТИЛІ
const toastStyle = { position: 'fixed', top: '25px', left: '50%', transform: 'translateX(-50%)', padding: '15px 30px', color: 'white', borderRadius: '10px', zIndex: 3000, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' };
const cardStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #eee', marginBottom: '20px' };
const avatarStyle = { width: '100%', height: '100%', backgroundColor: '#007bff', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', fontWeight: 'bold', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f9f9f9' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const editBtnSmall = { padding: '6px 14px', backgroundColor: '#f0f7ff', color: '#007bff', border: '1px solid #007bff', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const saveBtnFull = { padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 2 };
const cancelBtnFull = { padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 };
const backBtnStyle = { marginBottom: '20px', padding: '8px 18px', backgroundColor: '#fff', border: '1px solid #ddd', color: '#333', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', width: '380px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' };
const pencilOverlayStyle = { position: 'absolute', bottom: '0', right: '0', backgroundColor: '#007bff', border: '2px solid #fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', color: 'white' };
const roleBadgeStyle = { backgroundColor: '#e7f1ff', color: '#007bff', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '5px', display: 'inline-block' };
const ticketCard = { padding: '15px', borderRadius: '12px', backgroundColor: '#f8f9fa', border: '1px solid #eee' };
const historyItem = { padding: '12px', borderRadius: '10px', borderLeft: '4px solid #007bff', backgroundColor: '#fdfdfd', display: 'flex', flexDirection: 'column' };
const statusBadge = (s) => ({ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', backgroundColor: s === 'Completed' ? '#e9ecef' : '#d1e7dd', color: s === 'Completed' ? '#6c757d' : '#0f5132' });

export default Profile;