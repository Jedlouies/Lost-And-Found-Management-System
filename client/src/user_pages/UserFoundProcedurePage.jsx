import React, { useEffect } from 'react'
import './styles/UserFoundProcedurePage.css'
import UserLostItemsPage from './UserLostItemsPage.jsx'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth } from 'firebase/auth';

function UserFoundProcedurePage() {
  const navigate = useNavigate();
  const {currentUser} = useAuth();
  const auth = getAuth();
  const user = auth.currentUser;

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


  const handleGotIt = (path) => {
    navigate(path);
  }

  return (
    <>
      <div className='background1' style={{position: 'absolute', width: '100%', height: '120vh',  backgroundColor: '#D9D9D9'}}>
        <div className='user-found-procedure-body'>
          <h1>Item Found Procedures</h1>
          <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="orange" class="bi bi-exclamation-octagon" viewBox="0 0 16 16">
            <path d="M4.54.146A.5.5 0 0 1 4.893 0h6.214a.5.5 0 0 1 .353.146l4.394 4.394a.5.5 0 0 1 .146.353v6.214a.5.5 0 0 1-.146.353l-4.394 4.394a.5.5 0 0 1-.353.146H4.893a.5.5 0 0 1-.353-.146L.146 11.46A.5.5 0 0 1 0 11.107V4.893a.5.5 0 0 1 .146-.353zM5.1 1 1 5.1v5.8L5.1 15h5.8l4.1-4.1V5.1L10.9 1z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
          </svg>
          <div className='lost-reminders' style={{position: 'absolute', width: '90%', top: '8%', left: '8%', color: 'black'}}>
              <p><strong>Reminders:</strong> To ensure that any lost item is returned only to the rightful owner and handled with transparency and security, all items found must surrendered to Office of Student Affairs (OSA).</p>
          </div>
          <h1 style={{position: 'absolute', top: '20%', left: '3%', fontWeight: 'bold'}}>Step by Step</h1>
          <p style={{lineHeight: '35px'}}>
            1. After finding a lost item, the founder must submit an image and detailed description through the system. The submission will be marked as pending and not visible to the public. <br />
            2. The item must then be surrendered to the Office of Student Affairs (OSA) along with the completion of a Found Item Report Form. This ensures the item is securely documented and stored. <br />
            3. The system will use AI to compare the submitted item with existing lost item reports. A match rate will be shown to the founder, indicating how closely the item matches potential claims. <br />
            4. Even if a high match rate is detected, the item will remain in OSA custody and the post will stay pending. Only OSA staff can verify ownership and approve the release of the item. <br />
            5. Once the rightful owner provides valid proof and is verified by OSA, the item will be returned and the post updated as "claimed." This process ensures fairness, security, and proper item recovery. <br />     </p>
          <button className={`profile-quick-action ${location.pathname === `/users/found-items/procedure/item-details/${user?.uid}` ? 'active' : ''}`} onClick={() => handleGotIt(`/users/found-items/procedure/item-details/${user?.uid}`)}>Got it</button>
        </div>
      </div>
    </>

  )
}

export default UserFoundProcedurePage