import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (data) setUser(JSON.parse(data));
  }, []);

  const companyName = user?.companyName || user?.CompanyName || "Транспортна Система";

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const navItems = [
    { path: '/admin/schedule', label: '📅 Розклад' },
    { path: '/admin/fleet', label: '🚌 Автобуси' },
    { path: '/admin/staff', label: '👥 Персонал' },
    { path: '/admin/stats', label: '📊 Статистика' },
  ];

  return (
    <header style={headerWrapper}>
      {/* ПЕРША ЛІНІЯ: СИСТЕМНА */}
      <div style={topBar}>
        <div style={panelTitle}>⚙️ Адмін панель</div>
        
        <div style={topContent}>
          <Link to="/profile" style={profileLink}>Мій профіль</Link>
          <button onClick={handleLogout} style={logoutBtn}>Вийти</button>
        </div>
      </div>

      {/* ДРУГА ЛІНІЯ: РОБОЧА */}
      <div style={navCard}>
        <div style={companyTitle}>{companyName}</div>

        <nav style={linksGroup}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={isActive ? activeLinkStyle : linkStyle}>
                {item.label}
                {isActive && <div style={sliderIndicator} />}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

// --- СТИЛІ ---

const headerWrapper = { 
  width: '100%', 
  position: 'sticky', 
  top: 0, 
  zIndex: 1000, 
  fontFamily: 'sans-serif',
  backgroundColor: '#f8f9fa' 
};

const topBar = { 
  backgroundColor: '#1a237e', // Глибокий синій
  padding: '8px 40px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  color: 'white'
};

const panelTitle = { fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', opacity: 0.9 };

const topContent = { display: 'flex', alignItems: 'center', gap: '20px' };

const profileLink = { 
  color: 'white', 
  textDecoration: 'none', 
  fontSize: '13px', 
  fontWeight: '600',
  opacity: 0.9,
  transition: '0.3s'
};

const logoutBtn = { 
  backgroundColor: 'rgba(255,255,255,0.1)', 
  border: '1px solid rgba(255,255,255,0.3)', 
  color: 'white', 
  padding: '4px 12px', 
  borderRadius: '5px', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  fontSize: '12px' 
};

const navCard = {
  padding: '10px 40px',
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #e0e0e0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
};

const companyTitle = { 
  fontSize: '19px', 
  fontWeight: '800', 
  color: '#262424',
  borderLeft: '4px solid #1a237e',
  paddingLeft: '15px'
};

const linksGroup = { display: 'flex', gap: '5px' };

const linkStyle = {
  textDecoration: 'none',
  color: '#555',
  padding: '12px 18px',
  fontSize: '14px',
  fontWeight: '600',
  position: 'relative',
  transition: '0.3s'
};

const activeLinkStyle = { ...linkStyle, color: '#1a237e' };

const sliderIndicator = {
  position: 'absolute',
  bottom: '0',
  left: '15px',
  right: '15px',
  height: '3px',
  backgroundColor: '#1a237e',
  borderRadius: '10px 10px 0 0'
};

export default AdminNavbar;