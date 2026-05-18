import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Компоненти навігації
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import OwnerNavbar from './components/OwnerNavbar';
import DriverNavbar from './components/DriverNavbar'; // Створимо нижче

// Публічні сторінки
import CompaniesList from './pages/Public/CompaniesList';
import CompanySchedule from './pages/Public/CompanySchedule';
import SeatSelection from './pages/Public/SeatSelection';

// Авторизація
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Auth/Profile';
import Activate from './pages/Auth/Activate'; // Нова сторінка

// Панель Власника (Тебе)
import OwnerDashboard from './pages/Owner/OwnerDashboard';

// Адмінка
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminFleet from './pages/Admin/AdminFleet';
import AdminStaff from './pages/Admin/AdminStaff';
import AdminFullSchedule from './pages/Admin/AdminFullSchedule';

// Сторінки Водія
import DriverSchedule from './pages/Driver/DriverSchedule';
import DriverCurrentTrip from './pages/Driver/DriverCurrentTrip';
import DriverHistory from './pages/Driver/DriverHistory';

import LiveTracking from './pages/Public/LiveTracking';

function App() {

  const user = JSON.parse(sessionStorage.getItem('user'));
  
  // Для зручності можна окремо витягнути роль
  const userRole = user?.role || user?.Role;

  return (
    <BrowserRouter>
      {/* Головний навбар сам вирішить, коли зникнути */}
      <Navbar /> 
      
      

      <Routes>
        {/* Публічні та гостьові */}
        <Route path="/" element={<CompaniesList />} />
        <Route path="/schedule/:companyId" element={<CompanySchedule />} />
        <Route path="/booking/:tripInstanceId" element={<SeatSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />

        <Route path="/live" element={<LiveTracking />} />
        

        {/* Роль: Власник (Owner) */}
        <Route path="/owner" element={<OwnerDashboard />} />

        {/* Роль: Адмін */}
        <Route path="/admin/stats" element={<AdminDashboard />} />
        <Route path="/admin/fleet" element={<AdminFleet />} />
        <Route path="/admin/staff" element={<AdminStaff />} />
        <Route path="/admin/schedule" element={<AdminFullSchedule />} />

        {/* Роль: Водій */}
        <Route path="/driver/current" element={<DriverCurrentTrip />} />
        <Route path="/driver/schedule" element={<DriverSchedule />} />
        <Route path="/driver/history" element={<DriverHistory />} />

        {/* Роль: Клієнт */}
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;