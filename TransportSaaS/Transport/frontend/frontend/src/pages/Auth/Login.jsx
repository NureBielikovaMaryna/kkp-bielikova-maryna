import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  // Функція для показу повідомлень на сайті
  const showStatus = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Обов'язково слово async перед (e)
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('/Auth/login', { email, password });
    const user = response.data; // Витягуємо дані користувача

    // Зберігаємо все (userId, email, role, companyId) — це важливо для твоїх квитків!
    sessionStorage.setItem('user', JSON.stringify(user));
    
    showStatus('Ви успішно увійшли!', 'success');
    
    setTimeout(() => {
      
      // РОЗПОДІЛ ЗА РОЛЯМИ
    if (user.role === 'Owner') {
      navigate('/owner');
    } else if (user.role === 'Admin') {
      navigate('/admin/schedule');
    } else if (user.role === 'Driver') {
      navigate('/driver/current');
    } else {
      navigate('/'); // Для клієнтів
    }
      
      window.location.reload(); 
    }, 1500);
  } catch (err) {
    showStatus(err.response?.data?.message || 'Невірний логін або пароль');
  }
};


     

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      
      {/* ПОВІДОМЛЕННЯ (Без alert) */}
      {message.text && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: message.type === 'success' ? '#28a745' : '#dc3545',
          color: 'white', padding: '15px 30px', borderRadius: '8px', zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: 'bold'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Вхід в аккаунт</h2>
        
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
        
        <button type="submit" style={btnStyle}>Увійти</button>
        
        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Ще немає аккаунту? <Link to="/register" style={{ color: '#007bff' }}>Зареєструватися</Link>
        </p>
      </form>
    </div>
  );
}

// Стилі
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', width: '350px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: '#fff' };
const inputStyle = { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box' };
const btnStyle = { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };

export default Login;