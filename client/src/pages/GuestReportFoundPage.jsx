import React, { useEffect, useState } from 'react';
import '../user_pages/styles/UserFoundItemDetailPage.css';
import { db, auth } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Header from '../components/Header';

function GuestReportFoundPage() {
 const API = "https://server.spotsync.site";
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [itemName, setItemName] = useState('');
  const [dateFound, setDateFound] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [category, setCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [howItemFound, setHowItemFound] = useState('');
  const [profileURL, setProfileURL] = useState('Guest');
  const [coverURL, setCoverURL] = useState('Guest');
  const [course, setCourse] = useState('Guest');
  const [section, setSection] = useState('Guest');
  const [yearLevel, setYearLevel] = useState('Guest');
  const [birthdate, setBirthdate] = useState('Guest');
  const [images, setImages] = useState(null);

  const [founder, setFounder] = useState('Guest');  
  const [owner] = useState('Unknown');             
  const [claimStatus] = useState('unclaimed');

  const [firstName, setFirstName] = useState('Guest');
  const [lastName, setLastName] = useState('Guest');
  const [middleName, setMiddleName] = useState('Guest');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('Guest');
  const [address, setAddress] = useState('Guest');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const dbRealtime = getDatabase();

      const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState([]);
  
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState([]);
  
    // Lists
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
  

  const WORD_LIMIT = 150;
  const expiryTime = Date.now() + 24 * 60 * 60 * 1000;


  

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
  const fetchGuestInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return; // not logged in

      // Always check Firestore "users" collection for guest records
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("Fetched guest user data:", userData);

        setEmail(userData.email || "");  // <-- fetch the guest email
        setFirstName(userData.firstName || "Guest");
        setLastName(userData.lastName || "Guest");
        setFounder(`${userData.firstName || "Guest"} ${userData.lastName || ""}`);
      } else {
        console.warn("Guest user document not found in Firestore.");
      }
    } catch (err) {
      console.error("Error fetching guest user info:", err);
    }
  };

  fetchGuestInfo();
}, []);


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
      type,
      read: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("You must be signed in as a guest or user to submit.");
        return;
      }

      const uid = user.uid; 
      const imageURLs = [];

      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const url = await uploadFoundItemImage(images[i], `found-items/${uid}`);
          imageURLs.push(url);
        }
      }

      const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

      const docRef = await addDoc(collection(db, 'foundItems'), {
        itemId: customItemId,
        uid,
        images: imageURLs,
        itemName,
        dateFound,
        locationFound,
        archivedStatus: false,
        isGuest: true,
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

      if (currentUser) {
        setIsMatching(true);
        const matchResponse = await fetch(`${API}/api/match/found-to-lost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uidFound: docRef.id }),
        });

        if (!matchResponse.ok) throw new Error("Matching failed");
        const matches = await matchResponse.json();
        const top4Matches = matches.slice(0, 4);

        await notifyUser(
          currentUser.uid,
          `Hello <b>${firstName}</b> Your found item <b>${itemName}</b> has been submitted. 
            Please surrender it to the OSA for verification. The item is currently on a pending status  for 24 hours and Once verified, 
            the system will notify possible owners and post the item.`
        );

        const recipientEmail = email;
         console.log("Current user email:", recipientEmail);

         try {
                  const emailResUser = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(recipientEmail),
                      subject: "Instructions for Found Items",
                      html: `
                        <p>Hello ${firstName},</p>
                        <p>Your found item <b>${itemName}</b> has been submitted.</b>.</p>
                        <p>Please surrender it to the OSA for verification. 
                        <p>The item is currently on a pending status  for 24 hours and Once verified,</p> 
                        <p>the system will notify possible owners and post the item.</p>
                      `
                    })
                  });

                  const emailDataUser = await emailResUser.json();
                  console.log("Email response for user:", emailDataUser);

                  if (!emailResUser.ok) {
                    console.error("Failed to send email to user:", emailDataUser);
                  } else {
                    console.log("Email successfully sent to user:", email);
                  }

                } catch (emailErrorUser) {
                  console.error("Error sending email to user:", emailErrorUser);
                }

        navigate(`/guest/found/matching/${currentUser.uid}`, { state: { matches } });
      } else {
        alert("Thank you for reporting! Your found item has been submitted as Guest.");
        navigate("/guest");
      }

      await addDoc(collection(db, 'itemManagement'), {
        itemId: customItemId, 
        uid,
        images: imageURLs,
        itemName,
        expiryTime,
        archivedStatus: false,
        dateSubmitted: new Date().toISOString(),
        itemDescription,
        type: "Found",  
        location: locationFound,
        category,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error(error);
      alert('Failed to submit found item report.');
    }
    setIsSubmitting(false);
    setIsMatching(false);
  };

  return (
      <>
      <div className='background1' style={{position: 'absolute', width: '100%', height: '120vh', backgroundColor: 'white', backgroundImage: 'url(/landing-page-img.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
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

export default GuestReportFoundPage;
