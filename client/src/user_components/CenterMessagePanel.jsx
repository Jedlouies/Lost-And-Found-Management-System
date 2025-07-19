import React, { useState } from 'react'
import './styles/CenterMessagePanel.css'
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function CenterMessagePanel() {

  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  const handleLogout = async () => {
      try {
  
        await signOut(auth);
        
      localStorage.removeItem('address');
      localStorage.removeItem('bio');
      localStorage.removeItem('contactNumber');
      localStorage.removeItem('coverURL');
      localStorage.removeItem('designation');
      localStorage.removeItem('educationalAttainment');
      localStorage.removeItem('email');
      localStorage.removeItem('firstName');
      localStorage.removeItem('gender');
      localStorage.removeItem('lastName');
      localStorage.removeItem('middleName');
      localStorage.removeItem('profileURL');
      localStorage.removeItem('role');
      localStorage.removeItem('studentId');
      localStorage.removeItem('uid');
      localStorage.removeItem('yearsOfService');
      localStorage.removeItem('hideAddInfoPanel');


  
        navigate('/log-in');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

  const handleCancel = () => {
   setVisible(false);
   navigate(`/dashboard/${user.uid}`)
  };

  return (
    <div className={`center-message-body ${!visible ? 'hidden' : ''}`}>
        <p>Are you sure you want to log out?</p>
        <div className='action-buttons'>
            <button onClick={handleLogout}  style={{backgroundColor: '#475C6F', color: 'white'}}>Confirm</button>
            <button onClick={handleCancel}  style={{backgroundColor: 'transparent'}}>Cancel</button>
        </div>

    </div>
  )
}

export default CenterMessagePanel