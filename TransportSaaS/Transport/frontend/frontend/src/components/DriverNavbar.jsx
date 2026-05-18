import { Link, useNavigate, useLocation } from 'react-router-dom';

function DriverNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
    window.location.reload();
  };

  return (
    <div style={{ fontFamily: 'sans-serif', position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* ПЕРША ЛІНІЯ: Профіль та Вихід */}
      <nav style={topNavStyle}>
        <div style={logoStyle}>🚌 Панель Водія</div>
        <div style={navLinks}>
          <Link to="/profile" style={linkStyle}>Мій Профіль</Link>
          <button onClick={handleLogout} style={logoutBtn}>Вийти</button>
        </div>
      </nav>

      {/* ДРУГА ЛІНІЯ: Робочі інструменти з повзунком */}
      <div style={bottomNavStyle}>
        <div style={tabContainer}>
          <Link to="/driver/current" style={location.pathname === '/driver/current' ? activeSubLink : subLinkStyle}>
            🔘 Поточний рейс
            {location.pathname === '/driver/current' && <div style={sliderIndicator} />}
          </Link>
          
          <Link to="/driver/schedule" style={location.pathname === '/driver/schedule' ? activeSubLink : subLinkStyle}>
            📅 Мій розклад
            {location.pathname === '/driver/schedule' && <div style={sliderIndicator} />}
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- СТИЛІ ---

const topNavStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '12px 30px', 
  backgroundColor: '#1b5e20', // Темно-зелений (Emerald)
  color: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const bottomNavStyle = { 
  display: 'flex', 
  padding: '0 30px', 
  backgroundColor: '#ffffff', 
  borderBottom: '1px solid #e0e0e0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
};

const tabContainer = {
  display: 'flex',
  gap: '10px'
};

const logoStyle = { fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' };

const navLinks = { display: 'flex', gap: '20px', alignItems: 'center' };

const linkStyle = { 
  color: 'rgba(255,255,255,0.9)', 
  textDecoration: 'none', 
  fontWeight: '600', 
  fontSize: '14px',
  transition: '0.3s'
};

const logoutBtn = { 
  backgroundColor: 'rgba(255,255,255,0.1)', 
  border: '1px solid rgba(255,255,255,0.3)', 
  color: 'white', 
  padding: '5px 15px', 
  borderRadius: '6px', 
  cursor: 'pointer', 
  fontWeight: 'bold',
  fontSize: '13px',
  transition: '0.3s'
};

const subLinkStyle = { 
  color: '#666', 
  textDecoration: 'none', 
  fontSize: '14px', 
  fontWeight: '600', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px',
  padding: '15px 20px',
  position: 'relative',
  transition: '0.3s'
};

const activeSubLink = { 
  ...subLinkStyle, 
  color: '#2e7d32' // Активний зелений
};

// ПОВЗУНОК-ІНДИКАТОР (Зелений)
const sliderIndicator = {
  position: 'absolute',
  bottom: '0',
  left: '0',
  right: '0',
  height: '3px',
  backgroundColor: '#2e7d32',
  borderRadius: '10px 10px 0 0',
  animation: 'slideIn 0.3s ease-out'
};

export default DriverNavbar;