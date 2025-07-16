import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavigationBar from '../components/NavigationBar';
import DashboardHeader from '../components/DashboardHeader';
import './styles/SettingsPage.css';

function SettingsPage() {
  const { currentUser } = useAuth();

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const [coverURL, setCoverURL] = useState(localStorage.getItem('coverURL') || '');

  useEffect(() => {
    const fetchUserImages = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

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
    if (e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleCoverChange = (e) => {
    if (e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
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
    await updateDoc(userRef, {
      [updateField]: data.secure_url,
    });

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
      const url = await uploadImage(coverImage, 'users/${currentUser.uid}', 'coverURL');
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
      <NavigationBar />
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
              <img
                src={profileURL}
                alt="Profile"
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
              />
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
              <img
                src={coverURL}
                alt="Cover"
                style={{ width: '100%', maxWidth: '500px', height: 'auto', borderRadius: '10px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SettingsPage;
