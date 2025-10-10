import React, { useEffect, useState } from 'react';
import './styles/UserFoundItemDetailPage.css';
import UserFoundItemsPage from './UserFoundItemsPage';
import { db } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";

function UserFoundItemDetailPage() {
 const API = "https://server.spotsync.site";

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

  // Dropdown control states
const [showLocationDropdown, setShowLocationDropdown] = useState(false);
const [filteredLocations, setFilteredLocations] = useState([]);

// For Category input dropdown
const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
const [filteredCategories, setFilteredCategories] = useState([]);

const CATEGORIES = [
  "Electronics",
  "Accessories",
  "Clothing & Apparel",
  "Bags & Luggage",
  "Documents & IDs",
  "Books & Stationery",
  "Household Items",
  "Sports & Fitness",
  "Health & Personal Care",
  "Toys & Games",
  "Food & Beverages",
  "Automotive Items",
  "Musical Instruments",
  "Pet Items",
  "Others",
];




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

  const LOCATIONS = [
  "Arts and Culture Building",
  "Guidance and Testing Center",
  "College of Medicine",
  "Old Engineering Building",
  "ICT Building",
  "Administration Building",
  "Finance and Accounting Building / SHS Building",
  "Gymnasium Lobby",
  "Gymnasium",
  "Culinary Building",
  "NSTP Building",
  "Cafeteria",
  "Guardhouse",
  "LRC",
  "Girl’s Trade Building",
  "Food Innovation Center",
  "University Health Center (with OSA)",
  "Old Science Building",
  "Old Education Building",
  "Old Student Center",
  "Science Complex",
  "Engineering Complex (Right Wing)",
  "Engineering Complex (Left Wing)",
  "Student Center & Education Complex",
  "Fabrication Laboratory Shop",
  "Technology Building",
  "Faculty Resource Center",
  "Campus Residences / Dorm (new)",
  "Fab Lab Building",
  "Child Minding Center",
  "BGMS",
  "Supply and Property Management Section",
  "Waiting Shed (Building 24)",
  "Movable Classroom 1",
  "Movable Classroom 2",
  "Movable Classroom 3",
  "Movable Classroom 4",
  "Movable Classroom 5",
  "Movable Classroom 6",
  "Movable Classroom 7",
  "Movable Classroom 8",
  "Others",
];


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
      remindersSent: [],
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

    const matchResponse = await fetch(`${API}/api/match/found-to-lost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidFound: docRef.id }),
    });

    if (!matchResponse.ok) throw new Error("Matching failed");
    const matches = await matchResponse.json();

    const top4Matches = matches.slice(0, 4);

// Loop is only for matches (if needed later)
for (let i = 0; i < top4Matches.length; i++) {
  const match = top4Matches[i];
  // (maybe process matches here if needed)
}

await notifyUser(
  currentUser.uid,
  `Hello <b>${firstName}</b> Your found item <b>${itemName}</b> has been submitted. 
  Please surrender it to the OSA for verification. The item is currently on a pending status for 24 hours and once verified, 
  the system will notify possible owners and post the item.`,
  "info"
);

try {
  const emailRes = await fetch(`${API}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      subject: "Instructions for Found Items",
      html: `
        <p>Hello ${firstName},</p>
        <p>Your found item <b>${itemName}</b> has been submitted.</p>
        <p>Please surrender it to the OSA for verification.</p>
        <p>The item is currently on pending status for 24 hours and once verified, 
        the system will notify possible owners and post the item.</p>
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
      <div className='background1' style={{position: 'absolute', width: '100%', height: '120vh', backgroundColor: '#D9D9D9'}}>
        <div className="user-found-procedure-body" >
          <h1>Report Found Form</h1>
          <form className="lost-item-form" onSubmit={handleSubmit}>
            <input className='file' type="file" multiple accept="image/*" onChange={handleImageChange} style={{ width: '98%', border: '2px solid #475C6F'}} required />
            <br />
          <input
            type="text"
            value={itemName}
            placeholder="Item Name"
            onChange={(e) => {
              const words = e.target.value.trim().split(/\s+/);
              if (words.length <= 5) {
                setItemName(e.target.value);
              } else {
                setItemName(words.slice(0, 5).join(" "));
              }
            }}
            style={{width: "98%"}}
            required
          />       
          <div className='three-inputs' style={{width: '100%', height: '35px'}}>
            <input
              type="date"
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              style={{
                width: '30%',
                color: '#475C6F',
                WebkitAppearance: 'none',
                marginRight: '10px'
                , height: '35px'
              }}
              required
            />          

<div style={{ position: "relative", marginRight: '40px'}}>
  <input
    type="text"
    value={locationFound}
    onChange={(e) => {
      const inputValue = e.target.value;
      setLocationFound(inputValue);
      setFilteredLocations(
        LOCATIONS.filter((loc) =>
          loc.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    }}
    onFocus={() => {
      setFilteredLocations(LOCATIONS);
      setShowLocationDropdown(true);
    }}
    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
    placeholder="Type or select location"
    style={{
      width: "100%",
      height: "35px",
      borderRadius: "8px",
      border: "2px solid #475C6F",
      color: "#475C6F",
      backgroundColor: "white",
      padding: "5px",
    }}
    required
  />

  {showLocationDropdown && (
    <div
      style={{
        position: "absolute",
        top: "38px",
        left: 0,
        width: "100%",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxHeight: "150px",
        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      {filteredLocations.length > 0 ? (
        filteredLocations.map((loc) => (
          <div
            key={loc}
            onClick={() => {
              setLocationFound(loc);
              setShowLocationDropdown(false);
            }}
            style={{
              padding: "8px",
              cursor: "pointer",
              borderBottom: "1px solid #eee",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "white")
            }
          >
            {loc}
          </div>
        ))
      ) : (
        <div style={{ padding: "8px", color: "#888" }}>No match found</div>
      )}
    </div>
  )}
</div>

{/* CATEGORY INPUT WITH TYPE + DROPDOWN */}
<div style={{ position: "relative", width: "26%", marginRight: "10px" }}>
  <input
    type="text"
    value={category}
    onChange={(e) => {
      const inputValue = e.target.value;
      setCategory(inputValue);
      setFilteredCategories(
        CATEGORIES.filter((cat) =>
          cat.toLowerCase().includes(inputValue.toLowerCase())
        )
      );
    }}
    onFocus={() => {
      setFilteredCategories(CATEGORIES);
      setShowCategoryDropdown(true);
    }}
    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
    placeholder="Type or select category"
    style={{
      width: "100%",
      height: "35px",
      borderRadius: "8px",
      border: "2px solid #475C6F",
      color: "#475C6F",
      backgroundColor: "white",
      padding: "5px",
    }}
    required
  />

  {showCategoryDropdown && (
    <div
      style={{
        position: "absolute",
        top: "38px",
        left: 0,
        width: "100%",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxHeight: "150px",
        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      {filteredCategories.length > 0 ? (
        filteredCategories.map((cat) => (
          <div
            key={cat}
            onClick={() => {
              setCategory(cat);
              setShowCategoryDropdown(false);
            }}
            style={{
              padding: "8px",
              cursor: "pointer",
              borderBottom: "1px solid #eee",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "white")
            }
          >
            {cat}
          </div>
        ))
      ) : (
        <div style={{ padding: "8px", color: "#888" }}>No match found</div>
      )}
    </div>
  )}
</div>


          </div>
              
            <br />
            <div className='describe'>
                <textarea
              value={itemDescription}
              onChange={(e) => limitWords(e.target.value, setItemDescription)}
              placeholder='Describe the item'
              style={{ color: '#475C6F', width: '98%', marginBottom: '30px'}}
              required
            />
            <div style={{ position: 'absolute', top: '50%', marginLeft: '2%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(itemDescription)}/{WORD_LIMIT} words
            </div>

            <br />

            <textarea
              value={howItemFound}
              onChange={(e) => limitWords(e.target.value, setHowItemFound)}
              placeholder='How item found?'
              style={{ color: '#475C6F', width: '98%', }}
              required
            />
            <div style={{ position: 'absolute', top: '79%', marginLeft: '2%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(howItemFound)}/{WORD_LIMIT} words
            </div>
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
                <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                <span>AI Matching...</span>
              </>
            ) : isSubmitting ? (
              <>
                <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                <span>Matching</span>
              </>
            ) : (
              "Submit Report"
            )}
          </button> 
          </form>
        </div>
      </div>
      </>
  );
}

export default UserFoundItemDetailPage; 