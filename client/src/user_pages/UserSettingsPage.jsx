import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavigationBar from '../components/NavigationBar';
import DashboardHeader from '../components/DashboardHeader';
import './styles/UserSettingsPage.css';
import UserNavigationBar from '../user_components/UserNavigationBar';

function UserSettingsPage() {
  const { currentUser } = useAuth();

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const [coverURL, setCoverURL] = useState(localStorage.getItem('coverURL') || '');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [contactNumber, setContactNumber] = useState(localStorage.getItem('contactNumber') || '');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [bio, setBio] = useState('');
  const [designation, setDesignation] = useState('1');
  const [gender, setGender] = useState('');
  const [yearsOfService, setYearsOfService] = useState('1');
  const [educationalAttainment, setEducationalAttainment] = useState('1');
  const [address, setAddress] = useState('');

  const updateUserInfo = async (uid, updatedData) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updatedData);
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  const handleUpdate = () => {
    const updatedData = {
      firstName,
      lastName,
      bio,
      middleName,
      email,
      contactNumber,
      coverURL,
      profileURL,
      designation,
      educationalAttainment,
      gender,
      yearsOfService,
      address,
      course,
      section,
      yearLevel,
      birthdate,
    };

    updateUserInfo(currentUser.uid, updatedData);
  };

  useEffect(() => {
    const fetchUserImages = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setMiddleName(userData.middleName || '');
          setEmail(userData.email || '');
          setContactNumber(userData.contactNumber || '');
          setBio(userData.bio || '');
          setDesignation(userData.designation || '');
          setGender(userData.gender || '');
          setYearsOfService(userData.yearsOfService || '');
          setEducationalAttainment(userData.educationalAttainment || '');
          setAddress(userData.address);
          setCourse(userData.course || '');
          setSection(userData.section || '');
          setYearLevel(userData.yearLevel || '');
          setBirthdate(userData.birthdate || '');

          localStorage.setItem('course', userData.course || '');
          localStorage.setItem('section', userData.section || '');
          localStorage.setItem('yearLevel', userData.yearLevel || '');
          localStorage.setItem('birthdate', userData.birthdate || '');
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
          if (userData.profileURL) {
            setProfileURL(userData.profileURL);
            localStorage.setItem('profileURL', userData.profileURL);
          }

          if (userData.coverURL) {
            setCoverURL(userData.coverURL);
            localStorage.setItem('coverURL', userData.coverURL);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user images:', err);
      }
    };

    fetchUserImages();
  }, [currentUser]);

  const handleProfileChange = (e) => {
    if (e.target.files[0]) setProfileImage(e.target.files[0]);
  };

  const handleCoverChange = (e) => {
    if (e.target.files[0]) setCoverImage(e.target.files[0]);
  };

  const uploadImage = async (file, folder, updateField) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'profiles');
    formData.append('folder', folder);

    const res = await fetch('https://api.cloudinary.com/v1_1/dunltzf6e/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed.');

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { [updateField]: data.secure_url });

    localStorage.setItem(updateField, data.secure_url);
    window.dispatchEvent(new Event('profileImageUpdated'));

    return data.secure_url;
  };

  const handleProfileUpload = async () => {
    if (!profileImage || !currentUser) return alert('Missing profile image or user.');
    setUploadingProfile(true);
    try {
      const url = await uploadImage(profileImage, `users/${currentUser.uid}`, 'profileURL');
      setProfileURL(url);
      alert('Profile image uploaded!');
    } catch (err) {
      console.error(err);
      alert('Profile upload failed.');
    }
    setUploadingProfile(false);
  };

  const handleCoverUpload = async () => {
    if (!coverImage || !currentUser) return alert('Missing cover image or user.');
    setUploadingCover(true);
    try {
      const url = await uploadImage(coverImage, `users/${currentUser.uid}`, 'coverURL');
      setCoverURL(url);
      alert('Cover image uploaded!');
    } catch (err) {
      console.error(err);
      alert('Cover upload failed.');
    }
    setUploadingCover(false);
  };

  return (
    <>
      <UserNavigationBar />
      <div className='settings-body'>
        <DashboardHeader />

        <div className='upload-section1'>
          <h3>Upload Profile Image</h3>
          <input type="file" accept="image/*" onChange={handleProfileChange} />
          <button onClick={handleProfileUpload} disabled={uploadingProfile}>
            {uploadingProfile ? 'Uploading...' : 'Upload Profile Image'}
          </button>
          {profileURL && (
            <div>
              <p>Current Profile Image:</p>
              <img src={profileURL} alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div className='upload-section2'>
          <h3>Upload Cover Image</h3>
          <input type="file" accept="image/*" onChange={handleCoverChange} />
          <button onClick={handleCoverUpload} disabled={uploadingCover}>
            {uploadingCover ? 'Uploading...' : 'Upload Cover Image'}
          </button>
          {coverURL && (
            <div>
              <p>Current Cover Image:</p>
              <img src={coverURL} alt="Cover" style={{ width: '100%', maxWidth: '500px', height: 'auto', borderRadius: '10px', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div className='user-info-form'>
          <h3>Edit Profile Information</h3>
          <input placeholder='First Name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder='Middle Name' value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          <input placeholder='Last Name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder='Contact Number' value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          <input placeholder='Gender' value={gender} onChange={(e) => setGender(e.target.value)} />
          <textarea placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} />
          <input placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />
          <input placeholder='Course' value={course} onChange={(e) => setCourse(e.target.value)} />
          <input placeholder='Section' value={section} onChange={(e) => setSection(e.target.value)} />
          <input placeholder='Year Level' value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} />
          <label>Birthdate:</label>
          <input type='date' value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />


          <button onClick={handleUpdate}>Save Changes</button>
        </div>
      </div>
    </>
  );
}

export default UserSettingsPage;