import React, { useEffect, useState } from 'react';
// Removed: import './styles/UserFoundItemDetailPage.css'; - styles are now inline
import UserFoundItemsPage from './UserFoundItemsPage';
import { db } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";

const PLACEHOLDER_COLOR = "#A9A9A9";
const CHECKING_TEXT = "Checking your image if it contains inappropriate content...";
const CHECKING_SHORT = "Scanning...";
const INAPPROPRIATE_ALERT_TITLE = "Inappropriate Content Detected";
const INAPPROPRIATE_ALERT_MESSAGE = (flaggedCount) => 
  `${flaggedCount} image(s) were flagged for potentially inappropriate content (e.g., nudity, violence, self-harm, hate speech) and were not added. Please upload appropriate images.`;
const MAX_IMAGES = 1; 


function UserFoundItemDetailPage() {
 //const API = "http://localhost:4000";
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
  const [imagesWithMetadata, setImagesWithMetadata] = useState([]); 

  const [isModerating, setIsModerating] = useState(false);

const [showLocationDropdown, setShowLocationDropdown] = useState(false);
const [filteredLocations, setFilteredLocations] = useState([]);

const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
const [filteredCategories, setFilteredCategories] = useState([]);
  const [progress, setProgress] = useState(0);


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


const checkImageModeration = async (file) => {
    const fileReader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = () => reject(new Error("Failed to read file."));
    });
    fileReader.readAsDataURL(file);
    const base64Data = (await base64Promise).split(',')[1]; 

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

      const data = await response.json(); 
      return data.isSafe;

    } catch (error) {
      console.error("Error calling backend for moderation:", error);
      return false; 
    }
  };


  const handleImageChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

        setImages(newImages);
        setImagesWithMetadata(newImages.map(file => ({ file, url: URL.createObjectURL(file) })));


    } catch (error) {
        console.error("Error during image moderation/processing:", error);
        alert('An error occurred during image processing. Please try again.');
    } finally {
        setIsModerating(false);
    }
  };

  const removeImage = (indexToRemove) => {
      setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
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
    type: "item",
    read: false,
  });
};


const handleSubmit = async (e) => {
  e.preventDefault();
  if (!currentUser) return alert('You must be logged in to submit a report.');
  
  if (isModerating) {
      alert("Image scanning is still in progress. Please wait.");
      return;
  }
  if (!images || images.length === 0) return alert(`Please upload at least one image (Max ${MAX_IMAGES} allowed).`);


  setIsSubmitting(true);
  setProgress(0);

  try {
    const imageURLs = [];
    for (let i = 0; i < images.length; i++) {
        const url = await uploadFoundItemImage(images[i], `found-items/${currentUser.uid}`);
        imageURLs.push(url);
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
    
    const interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 90) return 90;
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 90);
        });
      }, 500);
    

    const matchResponse = await fetch(`${API}/api/match/found-to-lost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uidFound: docRef.id }),
    });

    if (!matchResponse.ok) {
        // IMPROVED ERROR HANDLING: Try to get the specific error from the server
        let errorBody;
        try {
            errorBody = await matchResponse.json();
        } catch (e) {
            // Server response was not JSON
            throw new Error(`Matching failed: Server responded with status ${matchResponse.status}.`);
        }
        // Throw the server's detailed error message if available
        throw new Error(errorBody.error || "Matching failed due to a server error.");
    }
    const matches = await matchResponse.json();

      clearInterval(interval);
      setProgress(100);


    const top4Matches = matches.slice(0, 4);

for (let i = 0; i < top4Matches.length; i++) {
  const match = top4Matches[i];
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


const formStyles = {
  // Main Container
  mainContainer: {
      minHeight: '100vh',
      backgroundColor: '#f8f8f8', // Light background
      padding: '40px 0',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      justifyContent: 'center',
  },
  // Form Body Card
  formBody: {
      width: '90%',
      maxWidth: '700px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      padding: '30px',
      boxSizing: 'border-box',
  },
  // Heading
  heading: {
      color: '#475C6F',
      marginBottom: '25px',
      textAlign: 'center',
      fontSize: '28px',
      fontWeight: '700',
      borderBottom: '2px solid #BDDDFC',
      paddingBottom: '10px',
  },
  // Input Group (Image)
  imageUploadBox: {
      marginBottom: '30px',
      border: '1px solid #e0e0e0',
      padding: '20px',
      borderRadius: '10px',
      backgroundColor: '#fafafa',
  },
  // Image Upload Flex Container
  imageFlexContainer: {
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '15px', 
      marginBottom: '10px',
  },
  // Image Preview/Upload Button Style
  imagePreview: {
      position: 'relative', 
      width: '100px', 
      height: '100px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #ccc',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  // Remove Image Button
  removeImageButton: {
      position: 'absolute', 
      top: '-10px', 
      right: '-10px', 
      background: '#e74c3c', 
      color: 'white', 
      border: '3px solid white', 
      borderRadius: '50%', 
      width: '28px', 
      height: '28px', 
      cursor: 'pointer', 
      fontWeight: 'bold',
      fontSize: '18px',
      lineHeight: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
  },
  // Add Image Label/Button
  addImageLabel: {
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '100px', 
      height: '100px', 
      border: '2px dashed #475C6F', 
      borderRadius: '8px', 
      cursor: 'pointer',
      backgroundColor: 'white',
      color: '#475C6F',
      fontSize: '14px',
      transition: 'background-color 0.2s',
      textAlign: 'center',
  },
  // Image Hint Text
  imageHint: {
      fontSize: '12px', 
      color: '#777', 
      textAlign: 'center', 
      marginTop: '10px'
  },
  // Form Input Styles
  inputField: {
      width: '100%', // Full width inside parent container
      height: '45px',
      padding: '0 15px',
      margin: '10px 0',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#475C6F',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
      backgroundColor: 'white',
  },
  // Three Inputs Row Container (using Flex for alignment)
  threeInputsContainer: {
      display: 'flex', 
      gap: '10px', 
      marginBottom: '10px',
      alignItems: 'center',
  },
  // Date Input Override
  dateInput: {
    flex: '0 0 30%', // Fixed width for date input
    height: '45px',
    padding: '0 15px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#333',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    backgroundColor: 'white',
  },
  // Location/Category Wrapper for relative positioning
  dropdownWrapper: {
      position: 'relative', 
      flex: '1', // Takes up remaining space
  },
  // Location/Category Input
  dropdownInput: {
      width: '100%',
      height: '45px',
      padding: '0 15px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#475C6F',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      cursor: 'pointer',
  },
  // Dropdown Menu
  dropdownMenu: {
      position: 'absolute',
      top: '48px', // Below the input
      left: 0,
      width: '100%',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 9999,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  // Dropdown Item
  dropdownItem: {
      padding: '10px 15px',
      cursor: 'pointer',
      borderBottom: '1px solid #eee',
      transition: 'background-color 0.1s',
  },
  // Textarea Container (for word count positioning)
  textareaContainer: {
    position: 'relative',
    marginBottom: '25px', // Space between textareas
  },
  // Textarea Field
  textareaField: {
      width: '100%',
      minHeight: '120px',
      padding: '15px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '16px',
      color: '#475C6F',
      resize: 'vertical',
      boxSizing: 'border-box',
      backgroundColor: 'white',
  },
  // Word Count Display
  wordCount: {
    position: 'absolute', 
    bottom: '10px', 
    right: '15px', 
    fontSize: '12px', 
    color: '#777',
    backgroundColor: 'white',
    padding: '2px 5px',
    borderRadius: '4px',
  },
  // Submit Button
  submitButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      backgroundColor: "#475C6F", // Darker primary color
      color: "white",
      padding: "12px 30px",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "17px",
      fontWeight: "600",
      marginTop: "30px",
      width: '100%',
      transition: 'background-color 0.2s, opacity 0.2s',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  // Disabled Submit Button
  disabledButton: {
      opacity: 0.6,
      cursor: "not-allowed",
  },
  // Matching Overlay
  matchingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  // Matching Content Box
  matchingContent: {
    backgroundColor: 'white',
    padding: '30px 40px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',
  },
  // Matching Text
  matchingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#475C6F',
    marginBottom: '15px',
  },
  // Progress Container
  progressContainer: {
    width: '250px',
    height: '10px',
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    overflow: 'hidden',
    margin: '0 auto 10px auto',
  },
  // Progress Bar
  progressBar: {
    height: '100%',
    backgroundColor: '#BDDDFC',
    transition: 'width 0.5s ease-in-out',
  },
  // Progress Percentage
  progressPercentage: {
    fontSize: '14px',
    color: '#475C6F',
  }
};


  
  return (
      <>
      {isMatching && (
        <div style={formStyles.matchingOverlay}>
          <div style={formStyles.matchingContent}>
            <img src="/Spin_black.gif" alt="Scanning" style={{ width: '60px', height: '60px', marginBottom: '20px', filter: 'invert(1)' }} />
            <div style={formStyles.matchingText}>AI Matching...</div>
            <div style={formStyles.progressContainer}>
              <div style={{ ...formStyles.progressBar, width: `${progress}%` }}></div>
            </div>
            <div style={formStyles.progressPercentage}>{Math.round(progress)}%</div>
          </div>
        </div>
      )}

      <div style={formStyles.mainContainer}>
        <div style={formStyles.formBody}>
          <h1 style={formStyles.heading}>Report Found Form</h1>
          
          {/* --- Image Upload Section --- */}
          <div style={formStyles.imageUploadBox}>
              <div style={{fontWeight: '600', color: '#475C6F', marginBottom: '10px'}}>Item Photo (Max {MAX_IMAGES})</div>
              <div style={formStyles.imageFlexContainer}>
                  {imagesWithMetadata.map((img, index) => (
                      <div key={index} style={formStyles.imagePreview}>
                          <img src={img.url} alt="Item Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                              type="button" 
                              onClick={() => removeImage(index)} 
                              style={formStyles.removeImageButton}
                          >
                              &times;
                          </button>
                      </div>
                  ))}
                  {imagesWithMetadata.length < MAX_IMAGES && (
                      <label style={{ 
                          ...formStyles.addImageLabel,
                          cursor: isModerating ? 'not-allowed' : 'pointer',
                          backgroundColor: isModerating ? '#f0f0f0' : 'white',
                          opacity: isModerating ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => isModerating ? null : e.currentTarget.style.backgroundColor = '#f4f4f4'}
                      onMouseLeave={(e) => isModerating ? null : e.currentTarget.style.backgroundColor = 'white'}
                      >
                          {isModerating ? (
                              <>
                                  <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px", filter: 'invert(1)' }} />
                                  <span>{CHECKING_SHORT}</span>
                              </>
                          ) : (
                              <>
                                  <span style={{fontSize: '24px', lineHeight: '1'}}><i className="fa fa-plus"></i>+</span>
                                  <span>Add Image</span>
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
              <div style={formStyles.imageHint}>
                Image content is scanned for inappropriate material.
              </div>
          </div>
          
          {/* --- FORM WITH ID --- */}
          <form onSubmit={handleSubmit} id="user-found-form">
            <input
              type="text"
              value={itemName}
              placeholder="Item Name (Max 5 words)"
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/);
                if (words.length <= 5) {
                  setItemName(e.target.value);
                } else {
                   // Allow user to delete words, only limit adding past 5 words
                   if (e.target.value.length < itemName.length) {
                    setItemName(e.target.value);
                  } else {
                    setItemName(words.slice(0, 5).join(" "));
                  }
                }
              }}
              style={formStyles.inputField}
              required
            />       
          <div style={formStyles.threeInputsContainer}>
            <input
              type="date"
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              style={formStyles.dateInput}
              required
            />          

            {/* Location Dropdown */}
            <div style={formStyles.dropdownWrapper}>
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
                placeholder="Location Found"
                style={formStyles.dropdownInput}
                required
              />

              {showLocationDropdown && (
                <div style={formStyles.dropdownMenu}>
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                      <div
                        key={loc}
                        onClick={() => {
                          setLocationFound(loc);
                          setShowLocationDropdown(false);
                        }}
                        style={formStyles.dropdownItem}
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
                    <div style={{ padding: "8px 15px", color: "#888" }}>No match found</div>
                  )}
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div style={formStyles.dropdownWrapper}>
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
                placeholder="Category"
                style={formStyles.dropdownInput}
                required
              />

              {showCategoryDropdown && (
                <div style={formStyles.dropdownMenu}>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setShowCategoryDropdown(false);
                        }}
                        style={formStyles.dropdownItem}
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
                    <div style={{ padding: "8px 15px", color: "#888" }}>No match found</div>
                  )}
                </div>
              )}
            </div>


          </div>
              
            
            {/* Item Description Textarea */}
            <div style={formStyles.textareaContainer}>
                <textarea
                  value={itemDescription}
                  onChange={(e) => limitWords(e.target.value, setItemDescription)}
                  placeholder='Describe the item (e.g., color, size, brand, unique markings)'
                  style={formStyles.textareaField}
                  required
                />
                <div style={formStyles.wordCount}>
                  {countWords(itemDescription)}/{WORD_LIMIT} words
                </div>
            </div>

            {/* How Item Found Textarea */}
            <div style={formStyles.textareaContainer}>
              <textarea
                value={howItemFound}
                onChange={(e) => limitWords(e.target.value, setHowItemFound)}
                placeholder='How and where exactly did you find the item?'
                style={formStyles.textareaField}
                required
              />
              <div style={formStyles.wordCount}>
                {countWords(howItemFound)}/{WORD_LIMIT} words
              </div>
            </div>
          </form>

          {/* Submit Button */}
          <button
            type="submit"
            form="user-found-form" 
            disabled={isSubmitting || isMatching || isModerating}
            style={{
              ...formStyles.submitButton,
              ...((isSubmitting || isMatching || isModerating) ? formStyles.disabledButton : {}),
            }}
            onMouseEnter={(e) => {
              if (!(isSubmitting || isMatching || isModerating)) e.currentTarget.style.backgroundColor = '#384d5c';
            }}
            onMouseLeave={(e) => {
              if (!(isSubmitting || isMatching || isModerating)) e.currentTarget.style.backgroundColor = '#475C6F'; 
            }}
          >
            {isModerating ? (
              <>
                <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px", filter: 'invert(1)' }} />
                <span>{CHECKING_SHORT}</span>
              </>
            ) : isMatching ? (
              <>
                <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px", filter: 'invert(1)' }} />
                <span>AI Matching...</span>
              </>
            ) : isSubmitting ? (
              <>
                <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px", filter: 'invert(1)' }} />
                <span>Submitting...</span>
              </>
            ) : (
              "Submit Found Report"
            )}
          </button> 
        </div>
      </div>
      </>
  );
}

export default UserFoundItemDetailPage;