import React from 'react'
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './styles/CenterMessagePanel.css';

function CenterMessagePanel({ visible, onCancel }) {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  if (!visible) return null; 

  const handleLogout = async () => {
    try {
      await signOut(auth);

     
      [
        'address','bio','contactNumber','coverURL','designation',
        'educationalAttainment','email','firstName','gender','lastName',
        'middleName','profileURL','role','studentId','uid','yearsOfService',
        'hideAddInfoPanel'
      ].forEach(key => localStorage.removeItem(key));

      navigate('/log-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel();
    navigate(`/dashboard/${user.uid}`);
  };

  return (
    <div className="overlay">
      <div className="center-message-body">
        <p>Are you sure you want to log out?</p>
        <div className='action-buttons'>
          <button onClick={handleLogout} style={{ backgroundColor: '#475C6F', color: 'white' }}>
            Confirm
          </button>
          <button onClick={handleCancel} style={{ backgroundColor: 'transparent' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default CenterMessagePanel;
