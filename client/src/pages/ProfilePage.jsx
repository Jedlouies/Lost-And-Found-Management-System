import React, { useRef, useState, useEffect, use } from 'react'
import './styles/ProfilePage.css'
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth } from 'firebase/auth';
import NavigationBar from '../components/NavigationBar.jsx'
import BlankHeader from '../components/BlankHeader.jsx'

function ProfilePage() {
  const {currentUser} = useAuth();
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [coverURL, setCoverURL] = useState(localStorage.getItem('coverURL') || '')
  const [designation, setDesignation] = useState(localStorage.getItem('designation') || '');
  const profileRef = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;
  
      const hasCached = localStorage.getItem('firstName') && localStorage.getItem('lastName') && localStorage.getItem('profileURL')
      && localStorage.getItem('designation') && localStorage.getItem('coverURL');
      if (hasCached) return;
  
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setDesignation(userData.designation);
          setFirstName(userData.firstName);
          setLastName(userData.lastName);
          setProfileURL(userData.profileURL || '');
          setCoverURL(userData.coverURL || '')
          
          localStorage.setItem('designation', userData.designation)
          localStorage.setItem('firstName', userData.firstName);
          localStorage.setItem('lastName', userData.lastName);
          localStorage.setItem('coverURL', userData.coverURL)
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

  return (
    <>
    <NavigationBar />
    <div className='profile-body'>
      <BlankHeader />
      <div className='profile-container'>
        <img src={coverURL} alt="img" />
          <div ref={profileRef} className='profile-picture'>
              {profileURL ? (
            <img
              src={profileURL}
              alt='Profile'
              style={{ width: '200px', height: '200px', borderRadius: '50%', border: '5px solid #475C6F' }}
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                backgroundColor: '#ccc'
              }}
            />
          )}
          </div>
          <div className='container-details'>
            
            <h1>{firstName} {lastName}</h1>
            <h2>{designation}</h2>
          </div>

      </div>
    </div>
    </>
  )
}

export default ProfilePage