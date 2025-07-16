import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import './styles/HeaderAccountDropdown.css';

function HeaderAccountDropdown() {
  const { currentUser } = useAuth();
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;  


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
              style={{ width: '30px', height: '30px', borderRadius: '50%' }}
            />
          ) : (
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#ccc'
              }}
            />
          )}
        </div>
        <p>{firstName} {lastName}</p>
      </div>

      <div className='line' />

      <div className={`account-dropdown-row ${location.pathname === `/dashboard/profile/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/dashboard/profile/${user?.uid}`)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
        </svg>
        <p>View Profile</p>
      </div>

      <div className='account-dropdown-row'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-view-stacked" viewBox="0 0 16 16">
          <path d="M3 0h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm0 8h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
        </svg>
        <p>Settings</p>
      </div>

      <div className='account-dropdown-row'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chat-right-quote" viewBox="0 0 16 16">
          <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" />
          <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z" />
        </svg>
        <p>User Feedback</p>
      </div>

      <div className='account-dropdown-row'>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-in-left" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z" />
          <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z" />
        </svg>
        <p>Logout</p>
      </div>
    </div>
  );
}

export default HeaderAccountDropdown;
