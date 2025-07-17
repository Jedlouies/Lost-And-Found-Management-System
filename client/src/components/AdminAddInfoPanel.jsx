import React, { useState, useEffect } from 'react';
import './styles/AdminAddInfoPanel.css';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";

function AdminAddInfoPanel() {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const dismissed = localStorage.getItem('hideAddInfoPanel');
    if (dismissed === 'true') {
      setVisible(false);
    }
  }, []);

  const handleLaterClick = () => {
    localStorage.setItem('hideAddInfoPanel', 'true');
    setVisible(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (!visible) return null;

  return (
    <div className='admin-add-info-body'>
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="green" className="bi bi-person-check" viewBox="0 0 16 16">
        <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m1.679-4.493-1.335 2.226a.75.75 0 0 1-1.174.144l-.774-.773a.5.5 0 0 1 .708-.708l.547.548 1.17-1.951a.5.5 0 1 1 .858.514M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
        <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
      </svg>
      
      <p>
        <h6><strong>Complete your Profile</strong></h6>
        Personalizing your account with a profile picture, cover photo, and additional details can make your experience more engaging. Feel free to update them now or later.
      </p>

      <div className='add-actions'>
        <button className='later' onClick={handleLaterClick}>I'll do it later</button>
        <button
          className={`continue ${location.pathname === `/admin/settings/${user?.uid}` ? 'active' : ''}`}
          onClick={() => handleNavigate(`/admin/settings/${user?.uid}`)}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default AdminAddInfoPanel;
