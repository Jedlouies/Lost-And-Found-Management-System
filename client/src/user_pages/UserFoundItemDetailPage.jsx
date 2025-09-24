import React, { useEffect, useState } from 'react';
import './styles/UserFoundItemDetailPage.css';
import UserFoundItemsPage from './UserFoundItemsPage';
import { db } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";

function UserFoundItemDetailPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
  const [isMatching, setIsMatching] = useState(false);

  const dbRealtime = getDatabase();

  const [customLocation, setCustomLocation] = useState("");
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

  const WORD_LIMIT = 150;

  const limitWords = (text, setFn) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= WORD_LIMIT) {
      setFn(text);
    } else {
      setFn(words.slice(0, WORD_LIMIT).join(" "));
    }
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };


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


  const uploadFoundItemImage = async (file, folder) => {
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

  const notifyUser = async (uid, message, type = "match") => {
  if (!uid) return;
  const notifRef = ref(dbRealtime, `notifications/${uid}`);
  const newNotifRef = push(notifRef);
  await set(newNotifRef, {
    message,
    timestamp: rtdbServerTimestamp(),
    type: "item",
    read: false,
  });
};


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!currentUser) return alert('You must be logged in to submit a report.');

  setIsSubmitting(true);
  try {
    const imageURLs = [];
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const url = await uploadFoundItemImage(images[i], `found-items/${currentUser.uid}`);
        imageURLs.push(url);
      }
    }

    const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

    const docRef = await addDoc(collection(db, 'foundItems'), {
      itemId: customItemId,
      uid: currentUser.uid,
      images: imageURLs,
      itemName,
      dateFound,
      locationFound: locationFound === "Others" ? customLocation : locationFound,
      archivedStatus: false,
      founder,
      owner,
      claimStatus,
      category,
      itemDescription,
      howItemFound,
      status: 'pending',
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

    setIsMatching(true);

    const matchResponse = await fetch("http://localhost:4000/api/match/found-to-lost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidFound: docRef.id }),
    });

    if (!matchResponse.ok) throw new Error("Matching failed");
    const matches = await matchResponse.json();

    const top4Matches = matches.slice(0, 4);

    for (let i = 0; i < top4Matches.length; i++) {
    const match = top4Matches[i];

    

        
        
          await notifyUser(
            currentUser.uid,
            `Hello <b>${firstName}</b> Your found item <b>${itemName}</b> has been submitted. 
            Please surrender it to the OSA for verification. The item is currently on a pending status  for 24 hours and Once verified, 
            the system will notify possible owners and post the item.`, 
            "info"
          );

          try {
            const emailRes = await fetch("http://localhost:4000/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: email,   
                subject: "Instructions for Found Items",
                html: `
                        <p>Hello ${firstName},</p>
                        <p>Your found item <b>${itemName}</b> has been submitted.</b>.</p>
                        <p>Please surrender it to the OSA for verification. 
                        <p>The item is currently on a pending status  for 24 hours and Once verified,</p> 
                        <p>the system will notify possible owners and post the item.</p>
                      `,
              }),
            });

            const emailData = await emailRes.json();
            console.log("📧 Email API response:", emailData);

            if (!emailRes.ok) {
              console.error(`❌ Failed to send email to ${email}:`, emailData);
            } else {
              console.log(`✅ Email successfully sent to ${email}`);
            }
          } catch (err) {
            console.error(`⚠️ Error sending email to ${email}:`, err);
          }

          

          
        
      
    }


    await addDoc(collection(db, 'itemManagement'), {
      itemId: customItemId, 
      uid: currentUser.uid,
      images: imageURLs,
      archivedStatus: false,
      itemName,
      dateSubmitted: new Date().toISOString(),
      itemDescription,
      type: "Found",  
      locationFound: locationFound === "Others" ? customLocation : locationFound,
      category,
      status: "Pending",
      expiryTime,
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

    navigate(`/users/found-items/matching/${currentUser.uid}`, { state: { matches } });

  } catch (error) {
    console.error(error);
    alert('Failed to submit found item report.');
  }
  setIsSubmitting(false);
  setIsMatching(false);
};




  
  return (
    <>
      
      <div className="user-found-procedure-body" style={{position: 'absolute', top: '5%', left: '1%'}}>
        <p style={{position: 'absolute', fontSize: '15px', left: '82%', top: '5%', width: '200px'}}>
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
        <h1>Report Found Form</h1>
        <form className="found-item-form" onSubmit={handleSubmit}>
   
          <label>Item Images:</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{width: '1000px', border: '2px solid #475C6F'}} required/>

          <br />
          <label >Item Name</label>
          <input
            type="text"
            value={itemName}
            placeholder="e.g. Nike Black Baseball Cap"
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/);
              if (words.length <= 5) {
                setItemName(e.target.value);
              } else {
                setItemName(words.slice(0, 5).join(" "));
              }
            }}
            style={{width: "1000px"}}
            required
          />
          <br />

          <label>Date Found:</label>
          <input type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} style={{width: '200px'}} required />

          <label>Location Found:</label>
          <select
            value={locationFound}
            onChange={(e) => setLocationFound(e.target.value)}
            style={{
              width: "400px",
              height: "35px",
              borderRadius: "8px",
              border: "2px solid #475C6F",
              color: "#475C6F",
              backgroundColor: "transparent",
              padding: "5px"
            }}
            required
          >
            <option value="">Select Location</option>
            <option value="Arts and Culture Building">Arts and Culture Building</option>
            <option value="Guidance and Testing Center">Guidance and Testing Center</option>
            <option value="College of Medicine">College of Medicine</option>
            <option value="Old Engineering Building">Old Engineering Building</option>
            <option value="ICT Building">ICT Building</option>
            <option value="Administration Building">Administration Building</option>
            <option value="Finance and Accounting Building / SHS Building">Finance and Accounting Building / SHS Building</option>
            <option value="Gymnasium Lobby">Gymnasium Lobby</option>
            <option value="Gymnasium">Gymnasium</option>
            <option value="Culinary Building">Culinary Building</option>
            <option value="NSTP Building">NSTP Building</option>
            <option value="Cafeteria">Cafeteria</option>
            <option value="Guardhouse">Guardhouse</option>
            <option value="LRC">LRC</option>
            <option value="Girl’s Trade Building">Girl’s Trade Building</option>
            <option value="Food Innovation Center">Food Innovation Center</option>
            <option value="University Health Center (with OSA)">University Health Center (with OSA)</option>
            <option value="Old Science Building">Old Science Building</option>
            <option value="Old Education Building">Old Education Building</option>
            <option value="Old Student Center">Old Student Center</option>
            <option value="Science Complex">Science Complex</option>
            <option value="Engineering Complex (Right Wing)">Engineering Complex (Right Wing)</option>
            <option value="Engineering Complex (Left Wing)">Engineering Complex (Left Wing)</option>
            <option value="Student Center & Education Complex">Student Center & Education Complex</option>
            <option value="Fabrication Laboratory Shop">Fabrication Laboratory Shop</option>
            <option value="Technology Building">Technology Building</option>
            <option value="Faculty Resource Center">Faculty Resource Center</option>
            <option value="Campus Residences / Dorm (new)">Campus Residences / Dorm (new)</option>
            <option value="Fab Lab Building">Fab Lab Building</option>
            <option value="Child Minding Center">Child Minding Center</option>
            <option value="BGMS">BGMS</option>
            <option value="Supply and Property Management Section">Supply and Property Management Section</option>
            <option value="Waiting Shed (Building 24)">Waiting Shed (Building 24)</option>
            <option value="Movable Classroom 1">Movable Classroom 1</option>
            <option value="Movable Classroom 2">Movable Classroom 2</option>
            <option value="Movable Classroom 3">Movable Classroom 3</option>
            <option value="Movable Classroom 4">Movable Classroom 4</option>
            <option value="Movable Classroom 5">Movable Classroom 5</option>
            <option value="Movable Classroom 6">Movable Classroom 6</option>
            <option value="Movable Classroom 7">Movable Classroom 7</option>
            <option value="Movable Classroom 8">Movable Classroom 8</option>
            <option value="Others">Others (please specify)</option>
          </select>

          {locationFound === "Others" && (
            <input
            className="custom-location-input"
              type="text"
              placeholder="Please specify location"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              style={{
                position: "absolute",
                left: "32%",
                top: "23%",
                width: "350px",
                height: "25px",
                marginTop: "8px",
                backgroundColor: "white",
                border: "none",
                padding: "5px"
              }}
              required
            />
          )}


          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{width: '140px', borderRadius: '10px', backgroundColor: 'transparent', border: '2px solid #475C6F', color: '#475C6F'}} required>
            <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Accessories">Accessories</option>
              <option value="Clothing & Apparel">Clothing & Apparel</option>
              <option value="Bags & Luggage">Bags & Luggage</option>
              <option value="Documents & IDs">Documents & IDs</option>
              <option value="Books & Stationery">Books & Stationery</option>
              <option value="Household Items">Household Items</option>
              <option value="Sports & Fitness">Sports & Fitness</option>
              <option value="Health & Personal Care">Health & Personal Care</option>
              <option value="Toys & Games">Toys & Games</option>
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Automotive Items">Automotive Items</option>
              <option value="Musical Instruments">Musical Instruments</option>
              <option value="Pet Items">Pet Items</option>
              <option value="Others">Others</option>
          </select>
          <br />
            <label>Item Description:</label>
            <textarea
              value={itemDescription}
              onChange={(e) => limitWords(e.target.value, setItemDescription)}
              style={{ color: '#475C6F' }}
              required
            />
            <div style={{ position: 'absolute', top: '50%', marginLeft: '75%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(itemDescription)}/{WORD_LIMIT} words
            </div>

            <br />

            <label>How Item Was Found:</label>
            <textarea
              value={howItemFound}
              onChange={(e) => limitWords(e.target.value, setHowItemFound)}
              style={{ color: '#475C6F' }}
              required
            />
            <div style={{ position: 'absolute', top: '78%', marginLeft: '75%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(howItemFound)}/{WORD_LIMIT} words
            </div>



          <button
            type="submit"
            disabled={isSubmitting || isMatching}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              backgroundColor: "#BDDDFC",
              color: "black",
              padding: "12px 25px",
              border: "none",
              borderRadius: "10px",
              cursor: isSubmitting || isMatching ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            {isMatching ? (
              <>
                <img src="/Spin.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                <span>AI Matching...</span>
              </>
            ) : isSubmitting ? (
              <>
                <img src="/Spin.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                <span>Matching</span>
              </>
            ) : (
              "Submit Report"
            )}
          </button>

        </form>
      </div>
    </>
  );
}

export default UserFoundItemDetailPage; 