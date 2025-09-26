import React, { useEffect, useState } from 'react';
import '../user_pages/styles/UserFoundItemDetailPage.css';
import { db, auth } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Header from '../components/Header';

function GuestReportFoundPage() {
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
        const matchResponse = await fetch("https://server.spotsync.site/api/match/found-to-lost", {
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
                  const emailResUser = await fetch("https://server.spotsync.site/api/send-email", {
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
      <Header />
      <div className='background2'/>
      <div className="user-found-procedure-body">
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
          significantly enhances the success of the matching outcome.
        </p>
        <h1>Report Found Form</h1>
        <form className="found-item-form" onSubmit={handleSubmit}>
          <label>Item Images:</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ width: '1000px', border: '2px solid #475C6F'}} required />
          <br />
          <label>Item Name:</label>
          <input type="text" value={itemName} placeholder='e.g Nike Cap' onChange={(e) => setItemName(e.target.value)} style={{ width: '1000px' }} required />
          <br />
          <label>Date Found:</label>
          <input type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} style={{ width: '200px' }} required />
          <label>Location Found:</label>
          <input type="text" value={locationFound} placeholder='e.g Building 42 - CEA Complex' onChange={(e) => setLocationFound(e.target.value)} style={{ width: '400px' }} required />
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '140px', borderRadius: '10px', backgroundColor: 'transparent', border: '2px solid #475C6F', color: '#475C6F' }} required>
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
                <span>Submitting</span>
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

export default GuestReportFoundPage;
