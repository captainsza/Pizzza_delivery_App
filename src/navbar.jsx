import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/authContext';
import './components/styles/App.css';

function Navbar({ isMobile, navOpen, toggleNav }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      logout();
    }
  };

  if (isMobile) {
    return (
      <nav>
        <button className="nav-toggle" onClick={toggleNav}>☰</button>
        <div className={`nav-links ${navOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" onClick={toggleNav}>
            Home
          </Link>
          {user ? (
            <>
              <span className="nav-link user-info">{user.name}</span>
              <button className="nav-link" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link" onClick={toggleNav}>
                Register
              </Link>
              <Link to="/login" className="nav-link" onClick={toggleNav}>
                Login
              </Link>
            </>
          )}
          <Link to="/admin" className="nav-link" onClick={toggleNav}>
            Admin Dashboard
          </Link>
          <Link to="/orderpage" className="nav-link" onClick={toggleNav}>
            Your Orders
          </Link>
        </div>
      </nav>
    );
  } else {
    return (
      <nav>
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/about" className="nav-link">
          About
        </Link>
        <Link to="/contact" className="nav-link">
          Contact Us
        </Link>
        {user ? (
          <>
          <Link to="/orderpage" className="nav-link" onClick={toggleNav}>
            Your Orders
          </Link>
            <span className="nav-link user-info">{user.name}</span>
            <button className="nav-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="nav-link">
              Register
            </Link>
            <Link to="/login" className="nav-link">
              Login
            </Link>
          </>
        )}
      </nav>
    );
  }
}

export default Navbar;
