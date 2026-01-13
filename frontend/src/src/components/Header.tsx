import React from 'react';
import { useAuth } from '../context/AuthContext'; 
import logo from '../assets/logo.svg';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header>
      <img src={logo} alt="NazTodo Logo" className="header-logo" />

      {user && (
        <div className="header-user">
          <div className="header-user-text">
            <span className="header-user-text-name">{user.username}</span>
            <span className="header-user-text-email">{user.email}</span>
          </div>
          <button className="header-user-button" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;