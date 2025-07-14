import React from 'react';
import { logout } from './utils/auth';
import './LandingPage.css';

function LogoutButton() {
  return (
    <button onClick={logout} className="logout-btn">
      Logout
    </button>
  );
}

export default LogoutButton;
