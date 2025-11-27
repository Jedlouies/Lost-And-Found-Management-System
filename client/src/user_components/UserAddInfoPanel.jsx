import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { getAuth } from "firebase/auth";

function UserAddInfoPanel() {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
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

  // Inline Styles
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      borderRadius: '16px', // Slightly softer corners for users
      padding: '24px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', // Softer shadow
      flexWrap: 'wrap',
      gap: '20px',
      marginBottom: '20px',
      border: '1px solid #f0f0f0',
      width: '100%',
      boxSizing: 'border-box',
      background: 'linear-gradient(to right, #ffffff, #f9fdff)',
    },
    contentGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flex: '1 1 300px',
    },
    iconContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      borderRadius: '20px',
      backgroundColor: '#e0f7fa', // Teal accent
      color: '#006064',
      flexShrink: 0,
    },
    textContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      margin: '0 0 6px 0',
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#263238',
    },
    description: {
      margin: 0,
      fontSize: '0.9rem',
      color: '#607d8b',
      lineHeight: '1.5',
    },
    actionGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    btnLater: {
      background: 'transparent',
      border: '2px solid transparent',
      color: '#90a4ae',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '10px 16px',
      borderRadius: '8px',
      transition: 'all 0.2s',
    },
    btnContinue: {
      backgroundColor: '#007bff', // Friendly blue
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 28px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '0.95rem',
      boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentGroup}>
        <div style={styles.iconContainer}>
            {/* User Avatar Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
              <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
            </svg>
        </div>
        <div style={styles.textContainer}>
          <h4 style={styles.title}>Finish Setting Up Your Profile</h4>
          <p style={styles.description}>
            Personalize your experience! Add a profile picture and updated contact info to help others recognize you easily.
          </p>
        </div>
      </div>

      <div style={styles.actionGroup}>
        <button 
          style={styles.btnLater} 
          onClick={handleLaterClick}
          onMouseOver={(e) => {e.target.style.color = '#546e7a'; e.target.style.backgroundColor = '#f5f5f5'}}
          onMouseOut={(e) => {e.target.style.color = '#90a4ae'; e.target.style.backgroundColor = 'transparent'}}
        >
          Maybe Later
        </button>
        <button
          style={styles.btnContinue}
          onClick={() => handleNavigate(`/users/settings/${user?.uid}`)}
          onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 15px rgba(0, 123, 255, 0.4)'}}
          onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)'}}
        >
          Update Profile
        </button>
      </div>
    </div>
  );
}

export default UserAddInfoPanel;