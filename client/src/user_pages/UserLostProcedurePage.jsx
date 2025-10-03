import React, { useEffect } from 'react'
import './styles/UserFoundProcedurePage.css'
import UserLostItemsPage from './UserLostItemsPage'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth } from 'firebase/auth';

function UserLostProcedurePage() {
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
    <div className='background1' style={{position: 'absolute', width: '100%', height: '120vh', backgroundColor: '#D9D9D9'}}>
      <div className='user-found-procedure-body'>
       <h1>Item Lost Procedures</h1>
      <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" fill="orange" class="bi bi-exclamation-octagon" viewBox="0 0 16 16">
        <path d="M4.54.146A.5.5 0 0 1 4.893 0h6.214a.5.5 0 0 1 .353.146l4.394 4.394a.5.5 0 0 1 .146.353v6.214a.5.5 0 0 1-.146.353l-4.394 4.394a.5.5 0 0 1-.353.146H4.893a.5.5 0 0 1-.353-.146L.146 11.46A.5.5 0 0 1 0 11.107V4.893a.5.5 0 0 1 .146-.353zM5.1 1 1 5.1v5.8L5.1 15h5.8l4.1-4.1V5.1L10.9 1z"/>
        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
      </svg>
      <div className='lost-reminders' style={{position: 'absolute', width: '90%', top: '8%', left: '8%', color: 'black'}}>
          <p><strong>Reminders:</strong> To ensure that any lost item is returned only to the rightful owner and handled with transparency and security, all items found must surrendered to Office of Student Affairs (OSA).</p>
      </div>
      <h1 style={{position: 'absolute', top: '20%', left: '3%', fontWeight: 'bold'}}>Step by Step</h1>
      <p style={{lineHeight: '35px'}}>
        1. When the owner sees their lost item listed in the system, they must proceed to fill out the Lost Item Claim Form. <br />
        
        2. The form requires a detailed description of the item, the estimated date and location it was lost, and any unique identifiers.<br />
        3. After submitting the form, the system will display a match percentage based on how closely the provided details align with the found item.<br />
        4. The owner must then go to the Office of Student Affairs (OSA) for the second phase of verification.<br />
        5. During the visit to OSA, the owner must present valid identification, proof of ownership, and the AI match result shown by the system.<br />
        6. If the OSA verifies the claim and approves it, the item will be released to the rightful owner and the system will mark the item as "Claimed."<br />
      </p>
      <button className={`profile-quick-action ${location.pathname === `/users/lost-items/procedure/item-details/${user?.uid}` ? 'active' : ''}`} onClick={() => handleGotIt(`/users/lost-items/procedure/item-details/${user?.uid}`)}>Got it</button>
    </div>

    </div>
    </>

  )
}

export default UserLostProcedurePage