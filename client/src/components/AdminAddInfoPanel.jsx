import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { getAuth } from "firebase/auth";

function AdminAddInfoPanel() {
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

  // Inline Styles for Modern UI
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
      borderLeft: '5px solid #143447', // Brand accent color
      flexWrap: 'wrap',
      gap: '20px',
      marginBottom: '20px',
      width: '100%',
      boxSizing: 'border-box',
    },
    contentGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flex: '1 1 300px', // Allow grow/shrink
    },
    iconContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#e3f2fd', // Light blue bg
      color: '#143447',
      flexShrink: 0,
    },
    textContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      margin: '0 0 8px 0',
      fontSize: '1.25rem',
      fontWeight: '700',
      color: '#143447',
    },
    description: {
      margin: 0,
      fontSize: '0.95rem',
      color: '#546e7a',
      lineHeight: '1.5',
    },
    actionGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    btnLater: {
      background: 'none',
      border: 'none',
      color: '#78909c',
      fontWeight: '600',
      cursor: 'pointer',
      padding: '10px 16px',
      fontSize: '0.9rem',
      transition: 'color 0.2s',
    },
    btnContinue: {
      backgroundColor: '#143447',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '0.95rem',
      boxShadow: '0 4px 6px rgba(20, 52, 71, 0.2)',
      transition: 'transform 0.2s, background-color 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentGroup}>
        <div style={styles.iconContainer}>
            {/* Shield/Check Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
              <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            </svg>
        </div>
        <div style={styles.textContainer}>
          <h4 style={styles.title}>Secure Your Admin Profile</h4>
          <p style={styles.description}>
            Adding details helps verify your administrative identity. Update your profile picture and contact info for better visibility.
          </p>
        </div>
      </div>

      <div style={styles.actionGroup}>
        <button 
          style={styles.btnLater} 
          onClick={handleLaterClick}
          onMouseOver={(e) => e.target.style.color = '#455a64'}
          onMouseOut={(e) => e.target.style.color = '#78909c'}
        >
          Dismiss
        </button>
        <button
          style={styles.btnContinue}
          onClick={() => handleNavigate(`/admin/settings/${user?.uid}`)}
          onMouseOver={(e) => {e.target.style.backgroundColor = '#0f2636'; e.target.style.transform = 'translateY(-2px)'}}
          onMouseOut={(e) => {e.target.style.backgroundColor = '#143447'; e.target.style.transform = 'translateY(0)'}}
        >
          Complete Profile
        </button>
      </div>
    </div>
  );
}

export default AdminAddInfoPanel;