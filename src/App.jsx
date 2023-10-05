import React, {lazy, useState, useEffect, useCallback } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import Register from './auth/register';
import Login from './auth/login';
import Home from './pages/homeuser';
import AdminDashboard from './pages/admin-dashboard'; 
import UserDashboard from './UserDashboard';
import Navbar from './navbar';
import { AuthProvider } from './auth/authContext';
import Checkout from './pages/chackout';
import './components/styles/App.css';
import AddressForm from './AddressForm';
import OrderPage from './pages/orders';
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  
  const toggleNav = () => {
    setNavOpen(!navOpen);
  };

  return (
    <Router>
      <AuthProvider>
        <div className={`app-container ${navOpen ? 'nav-open' : ''}`}>
          <Navbar 
            isMobile={isMobile} 
            navOpen={navOpen} 
            toggleNav={toggleNav} 
          />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/address" element={<AddressForm />} />
            <Route path="/orderpage" element={<OrderPage />} />
            <Route path='/success' element={<PaymentSuccess />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;