import React, { useRef, useState, useEffect } from 'react'
import './styles/ViewProfilePage.css'
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import NavigationBar from '../components/NavigationBar.jsx'
import BlankHeader from '../components/BlankHeader.jsx'
import { useNavigate, useParams } from 'react-router-dom';
import UserNavigationBar from '../user_components/UserNavigationBar.jsx';
import TableHeader from '../components/TablesHeader.jsx';

function ViewProfilePage() {
  const { uid } = useParams();  
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!uid) return;

      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUserDetails();
  }, [uid]);

  if (!userData) return <p>Loading profile...</p>;

  const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();

  return (
    <>
      <NavigationBar />
      <div className='profile-body'>
        <TableHeader />
        <div className='profile-container'>
          <img src={userData.coverURL || ''} alt="cover" />
          <div ref={profileRef} className='profile-picture'>
            {userData.profileURL ? (
              <img
                src={userData.profileURL}
                alt='Profile'
                style={{ width: '200px', height: '200px', borderRadius: '50%', border: '7px solid gray'}}
              />
            ) : (
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  backgroundColor: 'navy',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '80px',
                }}
              >
                {initials}
              </div>
            )}
          </div>
          <div className='container-details'>
            <h1>{userData.firstName} {userData.lastName}</h1>
            <h4 style={{fontStyle: 'italic', fontWeight: '100'}}>
              {userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : ""}
            </h4>
          </div>
        </div>
        <div className='all-profile-details'>
          <div className='profile-other-details'>
          <p><strong>Firstname: </strong>{userData.firstName}</p>
          <p><strong>Lastname: </strong>{userData.lastName}</p>
          <p><strong>Gender: </strong>{userData.gender}</p>
          <p><strong>Email: </strong>{userData.email}</p>
          <p><strong>Contact Number: </strong>{userData.contactNumber}</p>
          <p><strong>Address: </strong>{userData.address}</p>
        </div>

        <div className='profile-other-details2'>
          <p><strong>Course:</strong> {userData.course?.abbr} - {userData.course?.name}</p>
          <p><strong>Section:</strong> {userData.section}</p>
          <p><strong>Bio: </strong> {userData.bio}</p>
        </div>

        </div>
      </div>
    </>
  )
}

export default ViewProfilePage;
