import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';

function Activate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1 - перевірка Email, 2 - встановлення пароля
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [activationData, setActivationData] = useState({
    email: '',
    name: '',
    password: ''
  });

  const showMessage = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Крок 1: Перевірка, чи є такий Email в базі
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!activationData.email) return;
    setLoading(true);

    try {
      // Відправляємо на C# бекенд PascalCase
      await api.post('/Auth/check-email', { Email: activationData.email });
      showMessage("Емейл знайдено. Будь ласка, встановіть пароль.");
      setStep(2); // Переходимо до наступного кроку
    } catch (err) {
      const msg = err.response?.data?.message || "Емейл не знайдено серед запрошених водіїв або адмінів.";
      showMessage(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Крок 2: Фінальна активація (Ім'я + Пароль)
  const handleFinalActivate = async (e) => {
    e.preventDefault();
    if (!activationData.name || !activationData.password) return;
    setLoading(true);

    const payload = {
      Email: activationData.email,
      Name: activationData.name,
      Password: activationData.password
    };

    try {
      // Активуємо акаунт на бекенді
      await api.post('/Auth/activate', payload);
      showMessage("Акаунт успішно активовано! Тепер ви можете увійти.");
      setTimeout(() => navigate('/login'), 2000); // Редирект на логін
    } catch (err) {
      showMessage("Помилка активації. Спробуйте пізніше.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#dc3545' : '#198754' }}>
          {toast.text}
        </div>
      )}

      <div style={formCard}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={logoStyle}>🚌 TransportSaaS</div>
          <h2 style={{ margin: '10px 0', color: '#111' }}>Активація акаунту</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Ця сторінка для запрошених адмінів та водіїв</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleCheckEmail} style={formStyle}>
            <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '15px' }}>
              Введіть ваш Email, який ви надали адміністратору.
            </p>
            <input 
              type="email" 
              placeholder="Введіть ваш Email" 
              style={inputStyle} 
              value={activationData.email} 
              onChange={e => setActivationData({...activationData, email: e.target.value})} 
              required 
            />
            <button type="submit" style={activeBtn} disabled={loading}>
              {loading ? "Перевірка..." : "Продовжити"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleFinalActivate} style={formStyle}>
            <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginBottom: '15px' }}>
              Гаразд, емейл знайдено. <br /> Тепер підтвердіть ім'я та придумайте пароль.
            </p>
            <input 
              type="text" 
              placeholder="Ваше повне ім'я" 
              style={inputStyle} 
              value={activationData.name} 
              onChange={e => setActivationData({...activationData, name: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Придумайте пароль" 
              style={inputStyle} 
              value={activationData.password} 
              onChange={e => setActivationData({...activationData, password: e.target.value})} 
              required 
            />
            <button type="submit" style={activeBtn} disabled={loading}>
              {loading ? "Активація..." : "Активувати акаунт"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- СТИЛІ ---
const toastStyle = { position: 'fixed', top: '25px', right: '25px', padding: '15px 30px', color: 'white', borderRadius: '10px', zIndex: 3000, fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' };
const formCard = { backgroundColor: '#fff', padding: '40px', borderRadius: '15px', boxShadow: '0 5px 25px rgba(0,0,0,0.05)', width: '380px', border: '1px solid #eee' };
const logoStyle = { fontSize: '24px', fontWeight: 'bold', color: '#007bff' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%' };
const activeBtn = { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', transition: '0.2s', width: '100%' };

export default Activate;