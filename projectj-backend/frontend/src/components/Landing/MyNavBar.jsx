import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import './Landing.css';

const MyNavBar = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <img src={logo} alt="HireSense Logo" className="logo-img" />
          <span className="logo-text">HireSense</span>
        </Link>
        <nav className="navbar-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
        </nav>
        <div className="navbar-actions">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log In</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default MyNavBar;
