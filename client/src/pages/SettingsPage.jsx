import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavigationBar from '../components/NavigationBar';
import DashboardHeader from '../components/DashboardHeader';
import './styles/SettingsPage.css';

function SettingsPage() {
  const { currentUser } = useAuth();
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!currentUser || profileURL) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.profileURL) {
            setProfileURL(userData.profileURL);
            localStorage.setItem('profileURL', userData.profileURL);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile image:', err);
      }
    };

    fetchProfileImage();
  }, [currentUser, profileURL]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!image || !currentUser) return alert('Missing image or user.');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', 'profiles'); // ← Your Cloudinary preset
    formData.append('folder', `users/${currentUser.uid}`);

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dunltzf6e/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        profileURL: data.secure_url,
      });

      setProfileURL(data.secure_url);
      localStorage.setItem('profileURL', data.secure_url);

      // 👇 Notify other components (like HeaderAccountDropdown)
      window.dispatchEvent(new Event('profileImageUpdated'));

      alert('Profile image uploaded!');
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }

    setUploading(false);
  };

  return (
    <>
      <NavigationBar />
      <div className='settings-body'>
        <DashboardHeader />

        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Profile Image'}
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
    </>
  );
}

export default SettingsPage;
