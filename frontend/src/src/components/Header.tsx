import React from 'react';
import { useAuth } from '../context/AuthContext'; 
import logo from '../assets/logo.svg';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="main-nav">
      <div className="nav-left">
        <img src={logo} alt="NazTodo Logo" className="nav-logo" />
      </div>
      
      {user && (
        <div className="user-nav-card">
          <div className="user-info-text">
            <span className="user-name">{user.username}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button className="logout-btn-small" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;