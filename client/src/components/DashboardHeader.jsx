import React, { useEffect, useRef, useState } from 'react'
import './styles/DashboardHeader.css'
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import HeaderAccountDropdown from './HeaderAccountDropdown.jsx';
import HeaderNotifyDropdown from './HeaderNotifyDropdown.jsx';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';


function DashboardHeader() {
  const { currentUser } = useAuth();
  const [dropDown, setDropDown] = useState(false);
  const [notifyPanel, setNotifyPanel] = useState(false);
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const dropdownRef = useRef(null);
  const notifyRef = useRef(null);
  const profileRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;  

  const toggleDropDown = () => setDropDown(prev => !prev);
  const toggleNotifyPanel = () => setNotifyPanel(prev => !prev);

useEffect(() => {
  const fetchUserDetails = async () => {
    if (!currentUser) return;

    const hasCached = localStorage.getItem('firstName') && localStorage.getItem('lastName') && localStorage.getItem('profileURL');
    if (hasCached) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFirstName(userData.firstName);
        setLastName(userData.lastName);
        setProfileURL(userData.profileURL || '');

        localStorage.setItem('firstName', userData.firstName);
        localStorage.setItem('lastName', userData.lastName);
        if (userData.profileURL) {
          localStorage.setItem('profileURL', userData.profileURL);
        }
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
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


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !profileRef.current?.contains(event.target)
      ) {
        setDropDown(false);
      }

      if (
        notifyRef.current &&
        !notifyRef.current.contains(event.target) &&
        !bellRef.current?.contains(event.target)
      ) {
        setNotifyPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <div className='header-body'>
        <button onClick={() => navigate(`/admin/lost-items/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-x" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          <p>View Lost Item</p>
        </button>
        <button onClick={() => navigate(`/admin/found-items/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-check" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          <p>View Found Item</p>
        </button>
        <button onClick={() => navigate(`/admin/item-claimed-list/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-check" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          <p>Claimed Item List</p>
        </button>
        <button onClick={() => navigate(`/admin/user-profiles/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
          </svg>
          <p>User List</p>
        </button>

        <div className='header-right'>
          <svg ref={bellRef} xmlns="http://www.w3.org/2000/svg" width="25" height="20" fill="white" class="bi bi-bell" viewBox="0 0 16 16" onClick={toggleNotifyPanel}>
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/>
          </svg>
          <div ref={profileRef} className='profile' onClick={toggleDropDown}>
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
           <p onClick={toggleDropDown}>{lastName}</p>
        </div>
    </div>
    <div  className={`account-dropdown ${dropDown ? 'dropDown' : ''}`} ref={dropdownRef}>
      <HeaderAccountDropdown />  
     </div>
    <div className={`notify-panel ${notifyPanel ? 'notifyPanel' : ''}`} ref={notifyRef}>
      <HeaderNotifyDropdown />
    </div>
    </>
  )
}

export default DashboardHeader