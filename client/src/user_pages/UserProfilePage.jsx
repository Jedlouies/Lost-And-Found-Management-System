import React, { useRef, useState, useEffect, use } from 'react'
import './styles/UserProfilePage.css'
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth } from 'firebase/auth';
import NavigationBar from '../components/NavigationBar.jsx'
import BlankHeader from '../components/BlankHeader.jsx'
import UserBlankHeader from '../user_components/UserBlankHeader.jsx'
import { useNavigate } from 'react-router-dom';
import UserNavigationBar from '../user_components/UserNavigationBar.jsx';

function UserProfilePage() {
  const {currentUser} = useAuth();
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const [coverURL, setCoverURL] = useState(localStorage.getItem('coverURL') || '');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [middleName, setMiddleName] = useState(localStorage.getItem('middleName') || '');
  const [gender, setGender] = useState(localStorage.getItem('gender') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [contactNumber, setContactNumber] = useState(localStorage.getItem('contactNumber') || '');
  const [address, setAddress] = useState(localStorage.getItem('address') || '');
  const [designation, setDesignation] = useState(localStorage.getItem('designation') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [studentId, setStudentId] = useState(localStorage.getItem('studentId') || '');
  const [uid, setUid] = useState(localStorage.getItem('uid') || '');
  const [bio, setBio] = useState(localStorage.getItem('bio') || '');
  const [educationalAttainment, setEducationalAttainment] = useState(localStorage.getItem('educationalAttainment') || '');
  const [yearsOfService, setYearsOfService] = useState(localStorage.getItem('yearsOfService') || '');
  const [yearLevel, setYearLevel] = useState(localStorage.getItem('yearLevel') || '');
  const [course, setCourse] = useState(localStorage.getItem('course') || '');
  const [section, setSection] = useState(localStorage.getItem('section') || '')
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;
  
      const hasCached = localStorage.getItem('firstName') && localStorage.getItem('lastName') && localStorage.getItem('profileURL')
      && localStorage.getItem('designation') && localStorage.getItem('coverURL') && localStorage.getItem('bio') && localStorage.getItem('role') && 
      localStorage.getItem('middleName') && localStorage.getItem('gender') && localStorage.getItem('email') && localStorage.getItem('contactNumber')
      && localStorage.getItem('address') && localStorage.getItem('studentId') && localStorage.getItem('educationalAttainment') && localStorage.getItem('yearsOfService')
      && localStorage.getItem('section') && localStorage.getItem('course') && localStorage.getItem('yearLevel');
      if (hasCached) return;
  
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setRole(userData.role || '');
          setDesignation(userData.designation || '');
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setMiddleName(userData.middleName || '');
          setGender(userData.gender || '');
          setEmail(userData.email || '');
          setContactNumber(userData.contactNumber || '');
          setAddress(userData.address || '');
          setStudentId(userData.studentId || '');
          setUid(userData.uid || '');
          setBio(userData.bio || '');
          setEducationalAttainment(userData.educationalAttainment || '');
          setYearsOfService(userData.yearsOfService || '');
          setCoverURL(userData.coverURL || '');
          setProfileURL(userData.profileURL || '');
          setCourse(userData.course);
          setYearLevel(userData.yearLevel);
          setSection(userData.section);
          
          localStorage.setItem('role', userData.role || '');
          localStorage.setItem('designation', userData.designation || '');
          localStorage.setItem('firstName', userData.firstName || '');
          localStorage.setItem('lastName', userData.lastName || '');
          localStorage.setItem('middleName', userData.middleName || '');
          localStorage.setItem('gender', userData.gender || '');
          localStorage.setItem('email', userData.email || '');
          localStorage.setItem('contactNumber', userData.contactNumber || '');
          localStorage.setItem('address', userData.address || '');
          localStorage.setItem('studentId', userData.studentId || '');
          localStorage.setItem('uid', userData.uid || '');
          localStorage.setItem('bio', userData.bio || '');
          localStorage.setItem('educationalAttainment', userData.educationalAttainment || '');
          localStorage.setItem('yearsOfService', userData.yearsOfService || '');
          localStorage.setItem('yearLevel', userData.yearLevel || '');
          localStorage.setItem('course', userData.course || '');
          localStorage.setItem('section', userData.section || '');
          localStorage.setItem('coverURL', userData.coverURL || '');
          localStorage.setItem('profileURL', userData.profileURL || '');
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

  const handleEdit = (path) => {
    navigate(path)
  };

  return (
    <>
    <UserNavigationBar />
    <div className='profile-body' style={{height: '120vh'}}>
      <UserBlankHeader />
      <div className='profile-container'>
        <img src={coverURL} alt="" />
          <div ref={profileRef} className='profile-picture'>
          {profileURL ? (
          <img
            src={profileURL}
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
            
            <h1>{firstName} {lastName}</h1>
            <h4 style={{marginLeft: '60px'}}>{designation}</h4>
            
          </div>
          <div className={`profile-quick-action ${location.pathname === `/users/settings/${user?.uid}` ? 'active' : ''}`} onClick={() => handleEdit(`/users/settings/${user?.uid}`)}>
              <button>Change Password</button>
              <button>Edit Profile</button>
          </div>

          </div>
          <div className='all-profile-details' style={{marginTop: '50px'}}>
            <div className='profile-other-details' style={{marginTop: '50px'}}>
                <p><strong>Firstname: </strong>{firstName}</p>
                <p><strong>Lastname: </strong>{lastName}</p>
                <p><strong>Gender: </strong>{gender}</p>
                <p><strong>Email: </strong>{email}</p>
                <p><strong>Contact Number: </strong>{contactNumber}</p>
                <p><strong>Address: </strong>{address}</p>
              
                </div>
              <div className='profile-other-details2'  style={{marginTop: '50px'}}>
                <p>
                  <strong>Course:</strong>{" "}
                  {course?.abbr && course?.name
                    ? `${course.abbr} – ${course.name}`
                    : course || "N/A"}
                </p>
                <p><strong>Section:</strong> {section}</p>
                <p><strong>Bio: </strong> {bio}</p>

              </div>
          </div>
              
        </div>
    </>
  )
}

export default UserProfilePage