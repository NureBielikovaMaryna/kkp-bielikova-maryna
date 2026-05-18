import { Link, useNavigate } from 'react-router-dom';

function OwnerNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <nav style={topNavStyle}>
        <div style={logoStyle}>👑 Панель Власника</div>
        <div style={navLinks}>
          <Link to="/profile" style={linkStyle}>Мій Профіль</Link>
          <button onClick={handleLogout} style={logoutBtn}>Вийти</button>
        </div>
      </nav>
    </div>
  );
}

const topNavStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#111', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' };
const logoStyle = { fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' };
const navLinks = { display: 'flex', gap: '20px', alignItems: 'center' };
const linkStyle = { color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px' };
const logoutBtn = { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default OwnerNavbar;