import React, { useEffect, useState } from 'react';
import './styles/UserLostItemDetailPage.css';
import UserLostItemsPage from './UserLostItemsPage';
import { db } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

function UserLostItemDetailPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [itemName, setItemName] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [category, setCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [howItemLost, setHowItemLost] = useState('');
  const [profileURL, setProfileURL] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [images, setImages] = useState(null);

  const [founder] = useState('Unknown');  
  const [owner, setOwner] = useState('');             
  const [claimStatus] = useState('unclaimed');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

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
        setOwner(`${userData.firstName || ''} ${userData.lastName || ''}`);
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
    formData.append('upload_preset', 'lost-items'); 
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
        const url = await uploadLostItemImage(images[i], `lost-items/${currentUser.uid}`);
        imageURLs.push(url);
      }
    }

    // ✅ Generate custom itemId
    const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

    const docRef = await addDoc(collection(db, 'lostItems'), {
      itemId: customItemId,
      uid: currentUser.uid,
      images: imageURLs,
      itemName,
      dateLost,
      locationLost,
      founder,
      owner,
      claimStatus,
      category,
      itemDescription,
      howItemLost,
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

    const matchResponse = await fetch("http://localhost:4000/api/match/lost-to-found", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidLost: docRef.id }),
    });

    if (!matchResponse.ok) throw new Error("Matching failed");
    const matches = await matchResponse.json();

    const top4Matches = matches.slice(0, 4);

    await addDoc(collection(db, 'itemManagement'), {
      itemId: customItemId,  // ✅ use same ID
      uid: currentUser.uid,
      images: imageURLs,
      itemName,
      dateSubmitted: new Date().toISOString(),
      type: "Lost",  
      location: locationLost,
      category,
      status: "Posted",
      highestMatchingRate: top4Matches?.[0]?.scores?.overallScore ?? 0,
      topMatches: top4Matches,
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

    navigate(`/users/lost-items/matching/${currentUser.uid}`, { state: { matches } });

  } catch (error) {
    console.error(error);
    alert('Failed to submit lost item report.');
  }
  setIsSubmitting(false);
  setIsMatching(false);
};

  return (
    <>
      <UserLostItemsPage />
      <div className='background'/>
      <div className="user-lost-procedure-body">
        <p style={{ position: 'absolute', fontSize: '15px', left: '82%', top: '5%', width: '200px' }}>
          <strong>NOTE: </strong>
          To achieve a more successful matching process, 
          it is essential to provide accurate and complete 
          data. Precise information minimizes errors and 
          ensures that the system can generate the most 
          relevant and reliable results. 
          Incomplete or incorrect details can lead to 
          mismatches, reducing the overall effectiveness 
          of the process. Therefore, supplying exact data 
          and information significantly enhances the 
          accuracy and success of the matching outcome.
        </p>
        <h1>Report Lost Form</h1>
        <form className="lost-item-form" onSubmit={handleSubmit}>
          <label>Item Images:</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ width: '1000px', border: '2px solid #475C6F'}} required />
          <br />
          <label>Item Name:</label>
          <input type="text" value={itemName} placeholder='e.g Nike Cap' onChange={(e) => setItemName(e.target.value)} style={{ width: '1000px' }} required />
          <br />
          <label>Date Lost:</label>
          <input type="date" value={dateLost} onChange={(e) => setDateLost(e.target.value)} style={{ width: '200px' }} required />
          <label>Location Lost:</label>
          <input type="text" value={locationLost} placeholder='e.g Building 42 - CEA Complex' onChange={(e) => setLocationLost(e.target.value)} style={{ width: '400px' }} required />
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '140px', borderRadius: '10px', backgroundColor: 'transparent', border: '2px solid #475C6F', color: '#475C6F' }} required>
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Documents">Documents</option>
            <option value="Accessories">Accessories</option>
            <option value="Others">Others</option>
          </select>
          <br />
          <label>Item Description:</label>
          <textarea value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} style={{ color: '#475C6F' }} required />
          <br />
          <label>How Item Was Lost:</label>
          <textarea value={howItemLost} onChange={(e) => setHowItemLost(e.target.value)} style={{ color: '#475C6F' }} required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Matching Lost Items...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  );
}

export default UserLostItemDetailPage;