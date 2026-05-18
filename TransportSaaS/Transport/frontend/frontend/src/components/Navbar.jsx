import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Дістаємо юзера з sessionStorage (як ми домовилися для тестів)
  const user = JSON.parse(sessionStorage.getItem('user'));
  const userRole = user?.role || user?.Role;
  const path = location.pathname;

  // ХОВАТИСЯ, якщо ми в спец-зонах (Адмін, Власник, Водій мають свої навбари)
  if (path.startsWith('/admin') || path.startsWith('/owner') || path.startsWith('/driver')) {
    return null;
  }

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
    window.location.reload();
  };

  return (
    <nav style={navStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <Link to="/" style={logoStyle}>🚌 TransportSaaS</Link>
        
        {/* Загальнодоступне посилання на головну/розклад */}
        <Link to="/" style={path === '/' ? activeLinkStyle : linkStyle}>Головна</Link>
      </div>

      <div style={linksStyle}>
        {!user ? (
          <>
            <Link to="/login" style={linkStyle}>Увійти</Link>
            <Link to="/register" style={regBtnStyle}>Реєстрація</Link>
          </>
        ) : (
          <>
            {/* СПЕЦ-ПОСИЛАННЯ ДЛЯ КЛІЄНТА */}
            {userRole === 'Client' && (
              <Link to="/live" style={path === '/live' ? activeLiveLinkStyle : liveLinkStyle}>
                🛰️ Live-трекінг
              </Link>
            )}

            {/* Швидкі переходи для інших ролей, якщо вони на публічній сторінці */}
            {userRole === 'Owner' && <Link to="/owner" style={linkStyle}>Панель Власника</Link>}
            {userRole === 'Admin' && <Link to="/admin/schedule" style={linkStyle}>Панель Адміна</Link>}
            {userRole === 'Driver' && <Link to="/driver/current" style={linkStyle}>Рейс (Водій)</Link>}

            <Link to="/profile" style={path === '/profile' ? activeLinkStyle : linkStyle}>
              Мій Профіль
            </Link>

            <button onClick={handleLogout} style={logoutBtn}>Вийти</button>
          </>
        )}
      </div>
    </nav>
  );
}

// --- СТИЛІ ---
const navStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '12px 50px', 
  backgroundColor: '#fff', 
  borderBottom: '1px solid #eee',
  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  position: 'sticky',
  top: 0,
  zIndex: 1000
};

const logoStyle = { fontSize: '20px', fontWeight: '800', color: '#007bff', textDecoration: 'none', letterSpacing: '-0.5px' };
const linksStyle = { display: 'flex', alignItems: 'center', gap: '25px' };

const linkStyle = { 
  textDecoration: 'none', 
  color: '#555', 
  fontWeight: '600', 
  fontSize: '14px',
  transition: '0.2s'
};

const activeLinkStyle = { ...linkStyle, color: '#007bff' };

// Стиль для Live-трекінгу (робимо його помітним)
const liveLinkStyle = { 
  ...linkStyle, 
  color: '#ff4757', // Червоний акцент
  backgroundColor: '#fff0f0', 
  padding: '6px 12px', 
  borderRadius: '8px' 
};

const activeLiveLinkStyle = { 
  ...liveLinkStyle, 
  backgroundColor: '#ff4757', 
  color: '#fff' 
};

const regBtnStyle = { 
  textDecoration: 'none',
  backgroundColor: '#007bff', 
  color: 'white', 
  padding: '8px 18px', 
  borderRadius: '8px', 
  fontWeight: 'bold',
  fontSize: '14px'
};

const logoutBtn = { 
  border: '1px solid #eee', 
  backgroundColor: '#f8f9fa', 
  color: '#dc3545', 
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer', 
  fontWeight: 'bold',
  fontSize: '13px'
};

export default Navbar;