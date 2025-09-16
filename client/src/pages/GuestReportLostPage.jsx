  import React, { useEffect, useState } from 'react';
  import '../user_pages/styles/UserLostItemDetailPage.css'
import { db, auth } from '../firebase'; 
  import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
  import { useAuth } from '../context/AuthContext'; 
  import { useNavigate } from 'react-router-dom';
  import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp} from "firebase/database";
  import Header from '../components/Header'

  function GuestReportLostPage() {
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
    const [email, setEmail] = useState('');
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


    

    useEffect(() => {
      const fetchUserInfo = async () => {
        const user = auth.currentUser;
      

        if (!currentUser) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          setFirstName(userData.firstName || "Guest");
          setLastName(userData.lastName || "Guest");
          setMiddleName(userData.middleName || "");
          setEmail(userData.email || ""); // 👈 this pulls the guest’s email
          setContactNumber(userData.contactNumber || "Guest");
          setAddress(userData.address || "Guest");
          setProfileURL(userData.profileURL || "Guest");
          setCoverURL(userData.coverURL || "Guest");
          setCourse(userData.course || "Guest");
          setSection(userData.section || "Guest");
          setYearLevel(userData.yearLevel || "Guest");
          setBirthdate(userData.birthdate || "Guest");
          setOwner(`${userData.firstName || "Guest"} ${userData.lastName || ""}`);
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

    const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

    const docRef = await addDoc(collection(db, 'lostItems'), {
      itemId: customItemId,
      uid,
      images: imageURLs,
      itemName,
      dateLost,
      locationLost,
      archivedStatus: 'false',
      isGuest: !currentUser,
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
      const matchResponse = await fetch("http://localhost:4000/api/match/lost-to-found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uidLost: docRef.id }),
      });

      if (!matchResponse.ok) throw new Error("Matching failed");
      const matches = await matchResponse.json();

      const top4Matches = matches.slice(0, 4);

      for (let i = 0; i < top4Matches.length; i++) {
        const match = top4Matches[i];

        console.log("Found Email:", match.foundItem?.personalInfo?.email)

        if (match.scores?.overallScore >= 40 && match.foundItem?.uid) {
          
          await notifyUser(
            match.foundItem?.uid,
            `Your found item <b>${match.foundItem.itemName}</b> may possibly match with a newly reported lost item: <b>${itemName}</b>.`
          );

          await fetch("http://localhost:4000/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: match.foundItem?.personalInfo?.email, 
              subject: "Possible Lost & Found Match",
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
              `This is the most possible match for your lost item <b>${itemName}</b>: Found item <b>${match.foundItem?.itemName}</b>.`
            );
              try {
                  const emailResUser = await fetch("http://localhost:4000/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: email, 
                      subject: "Best Match Found for Your Lost Item",
                      html: `
                        <p>Hello ${firstName},</p>
                        <p>This is the most possible match for your lost item <b>${itemName}</b>: Found item <b>${match.foundItem?.itemName}</b>.</p>
                        <p>Please log in to view more details.</p>
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
        <Header />
        <div className='background2'/>
        
        <div className="user-lost-procedure-body2">
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
            <input
              type="date"
              value={dateLost}
              onChange={(e) => setDateLost(e.target.value)}
              style={{
                width: '200px',
                color: '#475C6F',
                WebkitAppearance: 'none'
              }}
              required
            />          
            <label>Location Lost:</label>
            <input type="text" value={locationLost} placeholder='e.g Building 42 - CEA Complex' onChange={(e) => setLocationLost(e.target.value)} style={{ width: '400px' }} required />
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
            <div style={{ position: 'absolute', top: '48%', marginLeft: '75%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(itemDescription)}/{WORD_LIMIT} words
            </div>

            <br />

            <label>How Item Was Lost:</label>
            <textarea
              value={howItemLost}
              onChange={(e) => limitWords(e.target.value, setHowItemLost)}
              style={{ color: '#475C6F' }}
              required
            />
            <div style={{ position: 'absolute', top: '76%', marginLeft: '75%', fontSize: '12px', color: '#475C6F' }}>
              {countWords(howItemLost)}/{WORD_LIMIT} words
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
                <span>Matching Items</span>
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

  export default GuestReportLostPage;