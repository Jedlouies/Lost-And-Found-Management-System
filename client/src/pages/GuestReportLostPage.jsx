import React, { useEffect, useState } from 'react';
import '../user_pages/styles/UserLostItemDetailPage.css'
import { db, auth } from '../firebase'; 
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Header from '../components/Header'

function GuestReportLostPage() {
    const API = "http://localhost:4000" || "https://server.spotsync.site";


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

  const [founder] = useState('Unknown');  
  const [owner, setOwner] = useState('Guest');             
  const [claimStatus] = useState('unclaimed');

  const [firstName, setFirstName] = useState('Guest');
  const [lastName, setLastName] = useState('Guest');
  const [middleName, setMiddleName] = useState('Guest');
  const [email, setEmail] = useState('');   // 👈 guest email fetched from Firestore
  const [contactNumber, setContactNumber] = useState('Guest');
  const [address, setAddress] = useState('Guest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const dbRealtime = getDatabase();
    
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

  // ✅ Fetch guest data (including email) from Firestore
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          setFirstName(userData.firstName || "Guest");
          setLastName(userData.lastName || "Guest");
          setMiddleName(userData.middleName || "");
          setEmail(userData.email || "");  // 👈 this ensures we have guest email
          setContactNumber(userData.contactNumber || "Guest");
          setAddress(userData.address || "Guest");
          setProfileURL(userData.profileURL || "Guest");
          setCoverURL(userData.coverURL || "Guest");
          setCourse(userData.course || "Guest");
          setSection(userData.section || "Guest");
          setYearLevel(userData.yearLevel || "Guest");
          setBirthdate(userData.birthdate || "Guest");
          setOwner(`${userData.firstName || "Guest"} ${userData.lastName || ""}`);
        } else {
          console.warn("Guest Firestore document not found.");
        }
      } catch (err) {
        console.error("Error fetching guest info:", err);
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

      // Upload images
      const imageURLs = [];
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const url = await uploadLostItemImage(
            images[i], 
            `lost-items/${uid}` 
          );
          imageURLs.push(url);
        }
      }

      // Generate itemId
      const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

      // Save lost item to Firestore
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

      // ✅ Matching process
      if (currentUser) {
        const matchResponse = await fetch(`${API}/api/match/lost-to-found`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uidLost: docRef.id }),
        });

        if (!matchResponse.ok) throw new Error("Matching failed");
        const matches = await matchResponse.json();
        const top4Matches = matches.slice(0, 4);

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

    return (
      <>
      <div className='background1' style={{position: 'absolute', width: '100%', height: '120vh', backgroundColor: 'white', backgroundImage: 'url(/landing-page-img.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="user-found-procedure-body" >
          <h1>Guest Report Lost Form</h1>
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
              value={dateLost}
              onChange={(e) => setDateLost(e.target.value)}
              style={{
                width: '30%',
                color: '#475C6F',
                WebkitAppearance: 'none',
                marginRight: '10px'
                , height: '35px'
              }}
              required
            />          
          <select
            value={locationLost}
            onChange={(e) => setLocationLost(e.target.value)}
            style={{
              width: "40%",
              height: "35px",
              borderRadius: "8px",
              border: "2px solid #475C6F",
              color: "#475C6F",
              backgroundColor: "transparent",
              padding: "5px",

              marginRight: '10px',
              marginBottom: '10px'
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

          {locationLost === "Others" && (
            <input
            className="custom-location-input"
              type="text"
              placeholder="Please specify location"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              style={{
                position: "absolute",
                left: "32%",
                top: "20%",
                width: "350px",
                height: "25px",
                marginTop: "8px",
                backgroundColor: "white",
                border: "none",
                padding: "5px",
                marginLeft: '10px',
                marginRight: '10px'
                
              }}
              required
            />
          )}

            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '26%', height: '35px', borderRadius: '10px', backgroundColor: 'transparent', border: '2px solid #475C6F', color: '#475C6F', marginRight: '10px' }} required>
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
              value={howItemLost}
              onChange={(e) => limitWords(e.target.value, setHowItemLost)}
              placeholder='How item lost?'
              style={{ color: '#475C6F', width: '98%', }}
              required
            />
            <div style={{ position: 'absolute', top: '79%', marginLeft: '2%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(howItemLost)}/{WORD_LIMIT} words
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

  export default GuestReportLostPage;