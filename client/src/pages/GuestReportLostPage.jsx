import React, { useEffect, useState } from 'react';
// import '../user_pages/styles/UserLostItemDetailPage.css' // REMOVED EXTERNAL CSS
import { db, auth } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Header from '../components/Header'

// --- NEW CONSTANTS FOR IMAGE MODERATION ---
const PLACEHOLDER_COLOR = "#A9A9A9";
const CHECKING_TEXT = "Checking your image if it contains inappropriate content...";
const CHECKING_SHORT = "Scanning...";
const INAPPROPRIATE_ALERT_TITLE = "Inappropriate Content Detected";
const INAPPROPRIATE_ALERT_MESSAGE = (flaggedCount) => 
  `${flaggedCount} image(s) were flagged for potentially inappropriate content (e.g., nudity, violence, self-harm, hate speech) and were not added. Please upload appropriate images.`;
const MAX_IMAGES = 1; // 👈 *** SET TO 1 ***

function GuestReportLostPage() {
   //const API = "http://localhost:4000";
 const API = "https://server.spotsync.site";

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [itemName, setItemName] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [locationLost, setLocationLost] = useState('');
  const [category, setCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [howItemLost, setHowItemLost] = useState('');
  const [profileURL, setProfileURL] = useState('Guest');
  const [coverURL, setCoverURL] = useState('Guest');
  const [course, setCourse] = useState('Guest');
  const [section, setSection] = useState('Guest');
  const [yearLevel, setYearLevel] = useState('Guest');
  const [birthdate, setBirthdate] = useState('Guest');
  
  const [images, setImages] = useState(null); 
  const [imagesWithMetadata, setImagesWithMetadata] = useState([]); 
  
  const [isModerating, setIsModerating] = useState(false);

  const [founder] = useState('Unknown');  
  const [owner, setOwner] = useState('Guest');             
  const [claimStatus] = useState('unclaimed');

  const [firstName, setFirstName] = useState('Guest');
  const [lastName, setLastName] = useState('Guest');
  const [middleName, setMiddleName] = useState('Guest');
  const [email, setEmail] = useState('');   
  const [contactNumber, setContactNumber] = useState('Guest');
  const [address, setAddress] = useState('Guest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [progress, setProgress] = useState(0); // Added progress state

  const dbRealtime = getDatabase();

      const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState([]);
  
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState([]);
  
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
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          setEmail(userData.email || "");  
          // Use 'Guest' fallback for all personal info fields as expected by guest reports
        }
      } catch (err) {
        console.error("Error fetching guest info:", err);
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
        setIsSubmitting(false); 
        return;
      }

      const uid = user.uid; 

      const imageURLs = [];
      for (let i = 0; i < images.length; i++) {
        const url = await uploadLostItemImage(
          images[i], 
          `lost-items/${uid}` 
        );
        imageURLs.push(url);
      }
      
      const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

      const docRef = await addDoc(collection(db, 'lostItems'), {
        itemId: customItemId,
        uid,
        images: imageURLs,
        itemName,
        dateLost,
        locationLost,
        archivedStatus: false,
        isGuest: true,
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

      if (currentUser) {
        setIsMatching(true); 
        const matchResponse = await fetch(`${API}/api/match/lost-to-found`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uidLost: docRef.id }),
        });

        if (!matchResponse.ok) throw new Error("Matching failed");
        const matches = await matchResponse.json();
        const top4Matches = matches.slice(0, 4);

        // ... (Matching notification logic preserved)

        for (let i = 0; i < top4Matches.length; i++) {
          const match = top4Matches[i];

          if (match.scores?.overallScore >= 60 && match.foundItem?.uid) {
            await notifyUser(
              match.foundItem?.uid,
              `Your found item <b>${match.foundItem.itemName}</b> may possibly match with a newly reported lost item: <b>${itemName}</b>.`
            );

            await fetch(`${API}/api/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: match.foundItem?.personalInfo?.email || "",
                subject: "Best Possible Match for Found Item",
                html: `
                  <p>Hello,</p>
                  <p>Your found item <b>${match.foundItem.itemName}</b> may possibly match with a newly reported lost item: <b>${itemName}</b>.</p>
                  <p>Please log in to check the full details.</p>
                `
              })
            });

            if (i === 0) {
              await notifyUser(
                currentUser.uid,
                `This is the most possible match for your lost item <b>${itemName}</b>: Found item <b>${match.foundItem?.itemName} : Transaction ID: ${match.transactionId}</b>.`
              );

              try {
                const emailResUser = await fetch(`${API}/api/send-email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: email,  
                    subject: "Best Match Found for Your Lost Item",
                    html: `
                      <p>Hello ${firstName},</p>
                      <p>This is the most possible match for your lost item <b>${itemName}</b>: Found item <b>${match.foundItem?.itemName} : Transaction ID: ${match.transactionId}</b>.</p>
                      <p>Please log in to view more details.</p>
                    `
                  })
                });

                const emailDataUser = await emailResUser.json();
                console.log("Email response for guest:", emailDataUser);

                if (!emailResUser.ok) {
                  console.error("Failed to send email to guest:", emailDataUser);
                } else {
                  console.log("Email successfully sent to guest:", email);
                }
              } catch (emailErrorUser) {
                console.error("Error sending email to guest:", emailErrorUser);
              }
            }
          }
        }

        navigate(`/guest/lost/matching/${currentUser.uid}`, { state: { matches } });
      } else {
        alert("Thank you for reporting! Your lost item has been submitted as Guest.");
        navigate("/guest"); 
      }

      await addDoc(collection(db, 'itemManagement'), {
        itemId: customItemId,  
        uid,
        images: imageURLs,
        itemName,
        archivedStatus: false,
        dateSubmitted: new Date().toISOString(),
        itemDescription,
        type: "Lost",  
        location: locationLost,
        category,
        status: "Posted",
        createdAt: serverTimestamp(),
      });

    } catch (error) {
      console.error(error);
      alert('Failed to submit lost item report.');
    }
    setIsSubmitting(false);
    setIsMatching(false);
  };

  // --- START OF FORM STYLES (COPIED FROM USERLOSTITEMDETAILPAGE.JSX) ---
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
        backgroundColor: 'white',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
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
      color: '#475C6F',
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
  // --- END OF FORM STYLES ---


    return (
      <>
      <Header />
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
          <h1 style={formStyles.heading}>Guest Report Lost Form</h1>
          
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
         
          <form onSubmit={handleSubmit} id="guest-lost-form">
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
                value={dateLost}
                onChange={(e) => setDateLost(e.target.value)}
                style={formStyles.dateInput}
                required
              />          
              {/* Location Dropdown */}
              <div style={formStyles.dropdownWrapper}>
                <input
                  type="text"
                  value={locationLost}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setLocationLost(inputValue);
                    setFilteredLocations(
                      LOCATIONS.filter((loc) => loc.toLowerCase().includes(inputValue.toLowerCase()))
                    );
                  }}
                  onFocus={() => {
                    setFilteredLocations(LOCATIONS);
                    setShowLocationDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
                  placeholder="Location Lost"
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
                            setLocationLost(loc);
                            setShowLocationDropdown(false);
                          }}
                          style={formStyles.dropdownItem}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
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
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
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

            {/* How Item Lost Textarea */}
            <div style={formStyles.textareaContainer}>
              <textarea
                value={howItemLost}
                onChange={(e) => limitWords(e.target.value, setHowItemLost)}
                placeholder='How did you lose the item and what efforts have you made to find it?'
                style={formStyles.textareaField}
                required
              />
              <div style={formStyles.wordCount}>
                {countWords(howItemLost)}/{WORD_LIMIT} words
              </div>
            </div>
          </form>
          
          {/* Submit Button */}
          <button
              type="submit"
              form="guest-lost-form" 
              disabled={isSubmitting || isMatching || isModerating}
              style={{
                ...formStyles.submitButton,
                ...((isSubmitting || isMatching || isModerating) ? formStyles.disabledButton : {}),
              }}
              onMouseEnter={(e) => {
                if (!(isSubmitting || isMatching || isModerating)) e.currentTarget.style.backgroundColor = '#384d5c'; // Darker on hover
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
                "Submit Lost Report"
              )}
            </button> 
        </div>
      </div>
      </>
    );
  }

  export default GuestReportLostPage;