import React, { useEffect, useRef, useState } from 'react'
import './styles/BlankHeader.css'
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import HeaderAccountDropdown from './HeaderAccountDropdown.jsx';
import HeaderNotifyDropdown from './HeaderNotifyDropdown.jsx';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';


function BlankHeader() {
  const { currentUser } = useAuth();
  const [dropDown, setDropDown] = useState(false);
  const [notifyPanel, setNotifyPanel] = useState(false);
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '')
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


        <div className='header-right-tables'>
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
    <div className={`account-dropdown ${dropDown ? 'dropDown' : ''}`} ref={dropdownRef}>
      <HeaderAccountDropdown />  
     </div>
    <div className={`notify-panels ${notifyPanel ? 'notifyPanel' : ''}`} ref={notifyRef}>
      <HeaderNotifyDropdown />
    </div>
    </> 
  )
}

export default BlankHeader