import React, { useEffect, useState } from 'react';
import '../user_pages/styles/UserFoundItemDetailPage.css';
import { db, auth } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Header from '../components/Header';

const PLACEHOLDER_COLOR = "#A9A9A9";
const CHECKING_TEXT = "Checking your image if it contains inappropriate content...";
const CHECKING_SHORT = "Scanning...";
const INAPPROPRIATE_ALERT_TITLE = "Inappropriate Content Detected";
const INAPPROPRIATE_ALERT_MESSAGE = (flaggedCount) => 
  `${flaggedCount} image(s) were flagged for potentially inappropriate content (e.g., nudity, violence, self-harm, hate speech) and were not added. Please upload appropriate images.`;
const MAX_IMAGES = 1; // 👈 *** SET TO 1 ***

function GuestReportFoundPage() {
 const API = "https://localhost:4000"; 
 //const API = "https://server.spotsync.site";
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  co [itemName, setItemName] = useState('');
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
  
  // --- UPDATED IMAGE STATE ---
  const [images, setImages] = useState(null); // Actual files for upload
  const [imagesWithMetadata, setImagesWithMetadata] = useState([]); // For preview URLs
  
  // --- NEW MODERATION STATE ---
  const [isModerating, setIsModerating] = useState(false);

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

  const countWords = text=> {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

 useEffect(() => {
  const fetchGuestInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return; // not logged in

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


  // --- NEW MODERATION FUNCTION ---
  const checkImageModeration = async (file)  => {
      // 1. Convert File to Base64
      const fileReader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = () => reject(new Error("Failed to read file."));
      });
      fileReader.readAsDataURL(file);
      const base64Data = (await base64Promise).split(',')[1]; // Get only the base64 part
  
      try {
        const response = await fetch(`${API}/api/moderate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: `data:${file.type};base64,${base64Data}` })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Backend Moderation Error:", response.status, errorData);
          throw new Error(errorData.error || `Moderation check failed on backend (${response.status})`);
        }
  
        const data = await response.json(); // Expecting { isSafe: boolean }
        return data.isSafe;
  
      } catch (error) {
        console.error("Error calling backend for moderation:", error);
        // Fallback: If the moderation service fails, we block the image as a safety measure.
        return false; 
      }
  };


  // --- UPDATED IMAGE CHANGE HANDLER ---
  const handleImageChange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Since MAX_IMAGES is 1, we only take the first file.
      const file = files[0];

      const currentImageCount = imagesWithMetadata.length;
      if (currentImageCount >= MAX_IMAGES) {
          alert(`Only ${MAX_IMAGES} image is allowed. Please remove the existing image to add a new one.`);
          return;
      }
      
      setIsModerating(true);
      let flaggedCount = 0;
      const newImages = [];

      try {
          const isSafe = await checkImageModeration(file);
          
          if (isSafe === true) {
              newImages.push(file);
          } else {
              flaggedCount++;
          }

          if (flaggedCount > 0) {
              alert(`${INAPPROPRIATE_ALERT_TITLE}\n\n${INAPPROPRIATE_ALERT_MESSAGE(flaggedCount)}`);
          }

          // Add safe images to the state
          // Since MAX_IMAGES is 1, we replace instead of add.
          setImages(newImages);
          setImagesWithMetadata(newImages.map(file => ({ file, url: URL.createObjectURL(file) })));


      } catch (error) {
          console.error("Error during image moderation/processing:", error);
          alert('An error occurred during image processing. Please try again.');
      } finally {
          setIsModerating(false);
      }
  };

  // --- NEW FUNCTION TO REMOVE IMAGE ---
  const removeImage = (indexToRemove) => {
      // Remove from the file list (images)
      setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
      // Remove from the preview list (imagesWithMetadata)
      setImagesWithMetadata(prevMeta => prevMeta.filter((_, index) => index !== indexToRemove));
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

    // --- NEW MODERATION CHECK ---
    if (isModerating) {
        alert("Image scanning is still in progress. Please wait.");
        setIsSubmitting(false);
        return;
    }
    if (!images || images.length === 0) {
        alert(`Please upload at least one image (Max ${MAX_IMAGES} allowed).`);
        setIsSubmitting(false);
        return;
    }

    try {
      const user = auth.currentUser;

      if (!user) {
        alert("You must be signed in as a guest or user to submit.");
        setIsSubmitting(false); // Stop submission
        return;
      }

      const uid = user.uid; 
      const imageURLs = [];

      // Use the moderated 'images' state
      for (let i = 0; i < images.length; i++) {
        const url = await uploadFoundItemImage(images[i], `found-items/${uid}`);
        imageURLs.push(url);
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
        const top4Matches = matches.slice(0, 4); // Keep this, even if unused, for consistency

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
          
          {/* --- UPDATED IMAGE UPLOAD AND PREVIEW SECTION --- */}
          <div style={{ marginBottom: '20px', border: '2px solid #475C6F', padding: '10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  {imagesWithMetadata.map((img, index) => (
                      <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                          <img src={img.url} alt="Item Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                          <button 
                              type="button" 
                              onClick={() => removeImage(index)} 
                              style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                              &times;
                          </button>
                      </div>
                  ))}
                  {imagesWithMetadata.length < MAX_IMAGES && (
                      <label style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '100px', 
                          height: '100px', 
                          border: '2px dashed #475C6F', 
                          borderRadius: '4px', 
                          cursor: isModerating ? 'not-allowed' : 'pointer',
                          backgroundColor: isModerating ? '#f0f0f0' : 'white',
                          opacity: isModerating ? 0.6 : 1,
                          fontSize: '12px'
                      }}>
                          {isModerating ? (
                              <>
                                  <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                                  <span>{CHECKING_SHORT}</span>
                              </>
                          ) : (
                              <>
                                  <span>+ Add Image</span>
                              </>
                          )}
                          <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              style={{ display: 'none' }}
                              disabled={isModerating}
                              required={imagesWithMetadata.length === 0}
                          />
                      </label>
                  )}
              </div>
              <div style={{ fontSize: '12px', color: '#475C6F', textAlign: 'center' }}>
                Image content is scanned for inappropriate material.
              </div>
          </div>
          {/* --- END UPDATED IMAGE UPLOAD SECTION --- */}
          
          {/* --- FORM WITH ID --- */}
          <form className="lost-item-form" onSubmit={handleSubmit} id="guest-found-form">
            {/* <input className='file' type="file" multiple accept="image/*" onChange={handleImageChange} style={{ width: '98%', border: '2px solid #475C6F'}} required /> */}
            {/* <br /> */}
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
            <div style={{ position: 'absolute', top: '68%', marginLeft: '2%', fontSize: '12px', color: '#475C6F' }}>
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
            <div style={{ position: 'absolute', top: '96%', marginLeft: '2%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(howItemFound)}/{WORD_LIMIT} words
            </div>
            </div>
          </form>
          {/* --- SUBMIT BUTTON OUTSIDE FORM --- */}
          <button
            type="submit"
            form="guest-found-form" // 👈 *** LINKS TO FORM ID ***
            disabled={isSubmitting || isMatching || isModerating}
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
              cursor: isSubmitting || isMatching || isModerating ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "500",
              marginTop: "130px" // 👈 Added margin top for spacing
            }}
          >
            {isModerating ? (
              <>
                <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                <span>{CHECKING_SHORT}</span>
              </>
            ) : isMatching ? (
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
        </div>
      </div>
      </>
  );
}

export default GuestReportFoundPage;