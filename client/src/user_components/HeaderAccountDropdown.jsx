import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './styles/HeaderAccountDropdown.css';
import CenterMessagePanel from './CenterMessagePanel.jsx';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';


function HeaderAccountDropdown() {
  const { currentUser } = useAuth();
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const [message, setMessage] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;  
    const [showModal, setShowModal] = useState(false);
  

  const toggleMessage = () => setMessage(prev => !prev);

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
  
  const handleNavigate = (path) => {
  navigate(path);
};

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;

      const hasCached =
        localStorage.getItem('firstName') &&
        localStorage.getItem('lastName') &&
        localStorage.getItem('profileURL');

      if (hasCached) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();

          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setProfileURL(userData.profileURL || '');

          localStorage.setItem('firstName', userData.firstName || '');
          localStorage.setItem('lastName', userData.lastName || '');
          if (userData.profileURL) {
            localStorage.setItem('profileURL', userData.profileURL);
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };

    fetchUserDetails();
  }, [currentUser]);


  useEffect(() => {
    const handleImageUpdate = () => {
      const newURL = localStorage.getItem('profileURL');
      if (newURL) {
        setProfileURL(newURL);
      }
    };

    window.addEventListener('profileImageUpdated', handleImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleImageUpdate);
    };
  }, []);

  return (
    <div className='account-dropdown-body'>
      <div className='profiles-body'>
        <div className='profiles-pic'>
          {profileURL ? (
          <img
            src={profileURL}
            alt='Profile'
            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover'}}
          />
        ) : (
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'navy',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {initials}
          </div>
        )}

        </div>
        <p>{firstName} {lastName}</p>
      </div>

      <div className='line' />

      <div className={`account-dropdown-row ${location.pathname === `/home/profile/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/home/profile/${user?.uid}`)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
        </svg>
        <p>View Profile</p>
      </div>

      <div className={`account-dropdown-row ${location.pathname === `/users/settings/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/users/settings/${user?.uid}`)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-view-stacked" viewBox="0 0 16 16">
          <path d="M3 0h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm0 8h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
        </svg>
        <p>Settings</p>
      </div>

        
<div className='account-dropdown-row' onClick={() => setShowModal(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-in-left" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z" />
          <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z" />
        </svg>
        <p>Logout</p>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header >
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to log out?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>  
  );
}

export default HeaderAccountDropdown;
