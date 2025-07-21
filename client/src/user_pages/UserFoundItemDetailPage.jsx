import React, { useEffect, useState } from 'react';
import './styles/UserFoundItemDetailPage.css';
import UserFoundItemsPage from './UserFoundItemsPage';
import { db } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; 

function UserFoundItemDetailPage() {
  const { currentUser } = useAuth();


  const [itemName, setItemName] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [category, setCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [howItemFound, setHowItemFound] = useState('');
  const [profileURL, setProfileURL] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [birthdate, setBirthdate] = useState('');

  const [images, setImages] = useState(null);


  const [founder, setFounder] = useState('');  
  const [owner, setOwner] = useState('Unknown');             

  const [claimStatus, setClaimStatus] = useState('unclaimed');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);


useEffect(() => {
  const fetchUserInfo = async () => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setMiddleName(userData.middleName || '');
      setEmail(userData.email || '');
      setContactNumber(userData.contactNumber || '');
      setAddress(userData.address || '');
      setProfileURL(userData.profileURL || '');
      setCoverURL(userData.coverURL || '');
      setCourse(userData.course || '');
      setSection(userData.section || '');
      setYearLevel(userData.yearLevel || '');
      setBirthdate(userData.birthdate || '');

      setFounder(`${userData.firstName || ''} ${userData.lastName || ''}`);
    }
  };
  fetchUserInfo();
}, [currentUser]);


  const handleImageChange = (e) => {
    setImages(e.target.files);
  };


  const uploadLostItemImage = async (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'found-items'); 
    formData.append('folder', folder);

    const res = await fetch(
      'https://api.cloudinary.com/v1_1/dunltzf6e/image/upload',
      { method: 'POST', body: formData }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error('Image upload failed.');
    return data.secure_url;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('You must be logged in to submit a report.');

    setIsSubmitting(true);
    try {
      const imageURLs = [];

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const url = await uploadLostItemImage(images[i], `found-items/${currentUser.uid}`);
          imageURLs.push(url);
        }
      }

    
    await addDoc(collection(db, 'foundItems'), {
      uid: currentUser.uid,
      images: imageURLs,
      itemName,
      dateFound,
      locationFound,
      founder,
      owner,
      claimStatus,
      category,
      itemDescription,
      howItemFound,
      personalInfo: {
        firstName,
        middleName,
        lastName,
        email,
        contactNumber,
        address,
        profileURL,
        coverURL,
        course,
        section,
        yearLevel,
        birthdate,
      },
      createdAt: serverTimestamp(),
    });

      alert('Found item report submitted successfully!');


      setItemName('');
      setDateFound('');
      setLocationFound('');
      setCategory('');
      setItemDescription('');
      setHowItemFound('');
      setImages(null);
    } catch (error) {
      console.error(error);
      alert('Failed to submit lost item report.');
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <UserFoundItemsPage />
      <div className="user-lost-procedure-body">
        <h1>Report Found Form</h1>
        <form className="lost-item-form" onSubmit={handleSubmit}>
   
          <label>Item Images:</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} />

          <label>Item Name:</label>
          <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} required />

          <label>Date Found:</label>
          <input type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} required />

          <label>Location Found:</label>
          <input type="text" value={locationFound} onChange={(e) => setLocationFound(e.target.value)} required />

          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Documents">Documents</option>
            <option value="Accessories">Accessories</option>
            <option value="Others">Others</option>
          </select>

          <label>Item Description:</label>
          <textarea value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required />

          <label>How Item Was Found:</label>
          <textarea value={howItemFound} onChange={(e) => setHowItemFound(e.target.value)} required />


          <label>Founder:</label>
          <input type="text" value={founder} readOnly />


          <label>Owner:</label>
          <input type="text" value={owner} readOnly />


          <label>Claim Status:</label>
          <select value={claimStatus} onChange={(e) => setClaimStatus(e.target.value)}>
            <option value="unclaimed">Unclaimed</option>
            <option value="claimed">Claimed</option>
            <option value="pending">Pending</option>
          </select>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  );
}

export default UserFoundItemDetailPage;
