import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showStatus = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. ПЕРЕВІРКА: чи є такий Email в системі (запрошений водій/адмін)
      try {
        const checkRes = await api.post('/Auth/check-email', { Email: email });
        
        // Якщо повернувся 200 OK, значить юзер є, але НЕ активований
        const userRole = checkRes.data.role;
        showStatus(`Вас уже додано до системи як ${userRole}! Активуємо ваш профіль...`, 'success');

        // 2. АКТИВАЦІЯ: автоматично викликаємо активацію для водія/адміна
        await api.post('/Auth/activate', { 
          Email: email, 
          Name: name, 
          Password: password 
        });

        showStatus('Акаунт успішно активовано! Переходимо до входу...', 'success');
        setTimeout(() => navigate('/login'), 2500);
        return; // Виходимо, щоб не пішла звичайна реєстрація клієнта

      } catch (err) {
        // Якщо 404 — користувача немає, йдемо до стандартної реєстрації клієнта
        if (err.response?.status === 404) {
          await api.post('/Auth/register-client', { name, email, password });
          showStatus('Реєстрація успішна! Ласкаво просимо.', 'success');
          setTimeout(() => navigate('/login'), 2000);
        } 
        // Якщо 400 — користувач уже активований
        else if (err.response?.status === 400) {
          showStatus('Цей Email вже активований. Будь ласка, просто увійдіть.', 'error');
        } 
        else {
          showStatus(err.response?.data?.message || 'Помилка сервера');
        }
      }
    } catch (err) {
      showStatus('Не вдалося завершити реєстрацію.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      
      {message.text && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 'bold', textAlign: 'center'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Реєстрація</h2>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginBottom: '20px' }}>
          Для клієнтів, водіїв та адміністраторів
        </p>
        
        <input 
          type="text" placeholder="Ваше Ім'я" required 
          value={name} onChange={e => setName(e.target.value)}
          style={inputStyle} 
        />
        <input 
          type="email" placeholder="Email" required 
          value={email} onChange={e => setEmail(e.target.value)}
          style={inputStyle} 
        />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Пароль" required 
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingRight: '40px' }} 
          />
          <span 
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '10px', cursor: 'pointer', fontSize: '18px' }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>
        
        <button type="submit" style={btnStyle} disabled={loading}>
          {loading ? 'Обробка...' : 'Створити аккаунт'}
        </button>
        
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Вже є аккаунт? <Link to="/login" style={{ color: '#007bff' }}>Увійти</Link>
        </p>
      </form>
    </div>
  );
}

const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', width: '350px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: '#fff' };
const inputStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' };
const btnStyle = { padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };

export default Register;