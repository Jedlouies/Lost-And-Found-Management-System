import React, { useRef, useState, useEffect } from "react";
// Removed: import "./styles/ProcessClaimPage.css"; // Removing external CSS
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  setDoc,
} from "firebase/firestore";
import FloatingAlert from "../components/FloatingAlert";
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Form, Spinner } from "react-bootstrap"; 
import "bootstrap/dist/css/bootstrap.min.css";   
import QrScanner from "qr-scanner"; // Needed for camera control reuse

// 🎨 MODERN STYLES DEFINITION (COPIED FROM ProcessClaimPage.jsx)
const styles = {
    // --- LAYOUT CONTAINERS ---
    processClaimBody: {
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        padding: '20px 0',
    },
    mainContainer: {
        maxWidth: '1200px',
        width: '95%',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    title: {
        fontSize: '2rem',
        color: '#343a40',
        marginBottom: '20px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
    },
    contentGrid: {
        display: 'grid',
        // Force 1.5fr (controls) and 2fr (results) column layout
        gridTemplateColumns: window.innerWidth > 992 ? '1.5fr 2fr' : '1fr', 
        gap: '40px',
        alignItems: 'start',
        minHeight: '60vh', 
    },
    
    // --- STEP INDICATOR STYLES ---
    stepContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '10px 0',
        width: '100%',
    },
    stepItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        flex: 1,
    },
    stepCircle: (isActive, isComplete) => ({
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: isComplete ? '#28a745' : isActive ? '#007bff' : '#ccc',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        zIndex: 10,
        boxShadow: isActive ? '0 0 10px rgba(0, 123, 255, 0.5)' : 'none',
        transition: 'all 0.3s',
    }),
    stepLabel: (isActive, isComplete) => ({
        marginTop: '8px',
        fontSize: '0.9rem',
        fontWeight: isActive || isComplete ? '600' : '400',
        color: isActive ? '#007bff' : isComplete ? '#28a745' : '#6c757d',
        textAlign: 'center',
    }),
    stepLine: (isComplete) => ({
        position: 'absolute',
        top: '20px',
        height: '2px',
        backgroundColor: isComplete ? '#6eb47eff' : '#ccc',
        right: '210px',
        zIndex: 5,
    }),

    // --- CAPTURE CARD ---
    scanCard: {
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        alignItems: 'center',
        height: '100%', 
    },
    cameraContainer: { 
        width: '100%',
        aspectRatio: '4/3', 
        borderRadius: '8px',
        overflow: 'hidden',
        border: '3px solid #007bff',
        marginBottom: '10px',
        flexGrow: 1,
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    cameraControls: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '10px',
    },
    captureButton: {
        padding: '12px 20px',
        backgroundColor: '#007bff', // Primary Blue
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    
    capturedImage: {
        width: '100%',
        maxWidth: '250px', 
        height: 'auto',
        objectFit: 'contain', 
        border: '3px solid #475C6F',
        borderRadius: '8px',
        margin: '10px 0',
    },
    
    // --- DATA & ACTION CARD ---
    dataCard: {
        padding: '25px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
    },
    userHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee',
    },
    avatar: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        objectFit: 'cover',
        backgroundColor: '#6c757d', // Gray for Guest Avatar
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    detailGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px 30px',
    },
    detailItem: {
        fontSize: '0.95rem',
        color: '#555',
    },
    detailKey: {
        fontWeight: 'bold',
        color: '#343a40',
        marginRight: '5px',
    },
    completeButton: {
        padding: '15px 30px',
        backgroundColor: '#28a745', // Green for Final Claim
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: 'pointer',
        marginTop: '20px',
        transition: 'background-color 0.3s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

// --- GUEST PROFILE AVATAR HELPER ---
const GuestProfileAvatar = ({ isSaved }) => {
    const baseStyle = styles.avatar;
    return (
        <div style={baseStyle}>
            {isSaved ? 'GUEST' : '...'}
        </div>
    );
};

// --- STEP INDICATOR COMPONENT ---
const StepIndicator = ({ isCaptureStep, isConfirmStep }) => {
    
    const isStep1Complete = !isCaptureStep;
    
    const steps = [
        { id: 1, label: 'Capture Photo', active: isCaptureStep, complete: isStep1Complete },
        { id: 2, label: 'Enter Details', active: !isCaptureStep && !isConfirmStep, complete: isStep1Complete && !isConfirmStep },
        { id: 3, label: 'Confirm & Finalize', active: isConfirmStep, complete: isConfirmStep },
    ];

    return (
        <div style={styles.stepContainer}>
            {steps.map((step, index) => (
                <div key={step.id} style={{...styles.stepItem, position: 'relative'}}>
                    {/* Line connecting previous step */}
                    {index > 0 && (
                        <div style={{
                            ...styles.stepLine(steps[index - 1].complete), 
                            width: 'calc(100% - 40px)', 
                            left: '0%',
                            transform: `translateX(-50%)`, 
                        }} />
                    )}

                    <div style={styles.stepCircle(step.active, step.complete)}>
                        {step.complete ? '✓' : step.id}
                    </div>
                    <span style={styles.stepLabel(step.active, step.complete)}>
                        {step.label}
                    </span>
                </div>
            ))}
        </div>
    );
};
// ------------------------------------


function GuestProcessClaimPage() {
 //const API = "http://localhost:4000";
 const API = "https://server.spotsync.site";
 
  const [capturedImage, setCapturedImage] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [guestAddress, setGuestAddress] = useState("");
  const { currentUser } = useAuth();

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const matchData = location.state?.match || null;
  const matchDocId = matchId || matchData?.id;

  const [alert, setAlert] = useState(null);

  const dbRealtime = getDatabase();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestBirthdate, setGuestBirthdate] = useState("");
const [guestCourseAbbr, setGuestCourseAbbr] = useState("");
const [guestCourseName, setGuestCourseName] = useState("");
const [guestCoverURL, setGuestCoverURL] = useState("");
const [guestEmail, setGuestEmail] = useState("");
const [guestLastName, setGuestLastName] = useState("");
const [guestMiddleName, setGuestMiddleName] = useState("");
const [guestProfileURL, setGuestProfileURL] = useState("");
const [guestSection, setGuestSection] = useState("");
const [guestYearLevel, setGuestYearLevel] = useState("");
const [guestSaved, setGuestSaved] = useState(false); // Tracks if guest details were entered/saved

const resizeBase64Img = (base64, maxWidth = 400, maxHeight = 400, quality = 0.7) => {
  return new Promise((resolve) => {
    let img = new Image();
    img.src = base64;
    img.onload = () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality)); // JPEG is smaller than PNG
    };
  });
};


  // 🔹 Camera handling (Simplified useEffect logic to manage stream state)
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  const startCamera = async (deviceId = selectedDeviceId) => {
    if (!deviceId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setAlert({ message: "Unable to start camera. Please check permissions.", type: "error" });
    }
  };

  useEffect(() => {
    const updateDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);

        if (!selectedDeviceId && videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Device enumeration error:", err);
      }
    };

    updateDevices();
    navigator.mediaDevices.ondevicechange = updateDevices;

    return () => {
      stopCamera();
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [selectedDeviceId]); 

  useEffect(() => {
    const isActiveStep = !capturedImage || (capturedImage && !guestSaved);
    if (isActiveStep) {
        startCamera();
    } else {
        stopCamera();
    }
  }, [selectedDeviceId, capturedImage, guestSaved]);


  // 🔹 Capture photo
const capturePhoto = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (video && canvas) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawImage = canvas.toDataURL("image/png");

    // 🔹 Compress before saving
    const compressedImage = await resizeBase64Img(rawImage);
    setCapturedImage(compressedImage);

    stopCamera(); // Stop camera after capture
    setShowGuestModal(true); // Open details modal
  }
};

  // 🔹 Notify user (Realtime DB)
  const notifyUser = async (uid, message) => {
    if (!uid) return;
    const notifRef = ref(dbRealtime, `notifications/${uid}`);
    const newNotifRef = push(notifRef);
    await set(newNotifRef, {
      message,
      timestamp: rtdbServerTimestamp(),
      type: "transaction",
      read: false,
    });
  };

  // 🔹 Finalize claim
  const finalizeClaim = async () => {
    if (!matchData || !capturedImage || !guestSaved) {
      setAlert({
        message: "Please enter guest details and capture a photo first.",
        type: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const guestOwnerData = {
          firstName: guestName,
          lastName: guestLastName,
          middleName: guestMiddleName,
          email: guestEmail,
          contactNumber: guestContact,
          address: guestAddress,
          birthdate: guestBirthdate,
          course: {
            abbr: guestCourseAbbr,
            name: guestCourseName,
          },
          coverURL: guestCoverURL,
          profileURL: guestProfileURL,
          section: guestSection,
          yearLevel: guestYearLevel,
          uid: "guest",
      };
      
      // Sanitize undefined/null values before Firestore write
      const sanitizeData = (obj) =>
        Object.fromEntries(
          Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
        );

      // Update lost item
      if (matchData.lostItem?.itemId) {
        const lostQuery = query(
          collection(db, "lostItems"),
          where("itemId", "==", matchData.lostItem.itemId)
        );
        const lostSnap = await getDocs(lostQuery);

        if (!lostSnap.empty) {
          const lostDocId = lostSnap.docs[0].id;
          await updateDoc(doc(db, "lostItems", lostDocId), {
            claimStatus: "claimed",
            owner: sanitizeData(guestOwnerData),
            claimantPhoto: capturedImage,
          });
        }
      }

      // Update found item
      if (matchData.foundItem?.itemId) {
        const foundQuery = query(
          collection(db, "foundItems"),
          where("itemId", "==", matchData.foundItem.itemId)
        );
        const foundSnap = await getDocs(foundQuery);

        if (!foundSnap.empty) {
          const foundDocId = foundSnap.docs[0].id;
          await updateDoc(doc(db, "foundItems", foundDocId), {
            claimStatus: "claimed",
            claimedBy: sanitizeData(guestOwnerData),
            claimantPhoto: capturedImage,
          });
        }
      }

      // Update match
      if (matchDocId) {
        const matchDocRef = doc(db, "matches", matchDocId);
        await setDoc(matchDocRef, { claimStatus: "claimed" }, { merge: true });
      }

      // Save to claimedItems
      await addDoc(collection(db, "claimedItems"), {
        itemId: matchData.foundItem.itemId,
        images: matchData.foundItem.images,
        itemName: matchData.foundItem.itemName || "",
        dateClaimed: new Date().toISOString(),
        founder: matchData.foundItem.personalInfo || null,
        owner: sanitizeData(guestOwnerData),
        ownerActualFace: capturedImage,
      });

      // Save claim history
      await addDoc(collection(db, "claimHistory"), {
        itemId: matchData.foundItem.itemId,
        itemName: matchData.foundItem.itemName || "",
        dateClaimed: new Date().toISOString(),
        founder: matchData.foundItem.personalInfo || null,
        owner: sanitizeData(guestOwnerData),
        claimantPhoto: capturedImage,
        userAccount: currentUser?.uid || "system",
        status: "completed",
      });

      // --- Notifications and Emails (Logic Preserved) ---
      await notifyUser(currentUser?.uid, `<b>Transaction ID: ${matchData.transactionId}</b> — Claim processed.`);
      await notifyUser(matchData.lostItem?.uid, ` Hello <b>"${matchData.lostItem?.personalInfo?.firstName}"!</b>  Your lost item <b>"${matchData.lostItem?.itemName}"</b> has been successfully claimed.`);
      await notifyUser(matchData.foundItem?.uid, `Thank you <b>"${matchData.foundItem?.personalInfo?.firstName}"!</b>  The item you reported found <b>"${matchData.foundItem?.itemName}"</b> has been successfully claimed.`);
      
      // (Email sending logic kept intact)
      // Email logic starts here 
      try {
          const emailResUser = await fetch(`${API}/api/send-email`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to: String(currentUser?.email), subject: "Claim Processed", html: `<b>Transaction ID: ${matchData.transactionId}</b> — Claim processed by admin.` })
          });
          if (!emailResUser.ok) { console.error("Failed to send email to user:", await emailResUser.json()); }
      } catch (emailErrorUser) { console.error("Error sending email to user:", emailErrorUser); }

      // Email to Lost Item Reporter (Owner)
      try {
          const emailResLost = await fetch(`${API}/api/send-email`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to: String(matchData.lostItem?.personalInfo?.email), subject: "Item Claimed", html: `Your lost item "${matchData.lostItem?.itemName}" has been claimed.` })
          });
          if (!emailResLost.ok) { console.error("Failed to send email to lost owner:", await emailResLost.json()); }
      } catch (emailErrorLost) { console.error("Error sending email to lost owner:", emailErrorLost); }

      // Email to Found Item Reporter (Founder)
      try {
          const emailResFound = await fetch(`${API}/api/send-email`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ to: String(matchData.foundItem?.personalInfo?.email), subject: "Item Claimed", html: `The item you reported found, "${matchData.foundItem?.itemName}", has been claimed.` })
          });
          if (!emailResFound.ok) { console.error("Failed to send email to found reporter:", await emailResFound.json()); }
      } catch (emailErrorFound) { console.error("Error sending email to found reporter:", emailErrorFound); }

      
      navigate(`/admin/item-claimed-list/${currentUser?.uid || "guest"}`);
      // window.location.reload(); // Removed reload as it might cause state loss/flicker
    } catch (err) {
      console.error("Error finalizing claim:", err);
      setAlert({ message: "Error finalizing claim.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopCamera();
    setCapturedImage(null);
    setGuestSaved(false);
    // Reset all guest state fields to ensure clean data input
    setGuestName("");
    setGuestLastName("");
    setGuestMiddleName("");
    setGuestContact("");
    setGuestAddress("");
    setGuestBirthdate("");
    setGuestCourseAbbr("");
    setGuestCourseName("");
    setGuestYearLevel("");
    setSelectedDeviceId(devices[0]?.deviceId || null);
  };
  
  const handleSaveGuestInfo = () => {
    if (!guestName || !guestContact) {
      setAlert({ message: "First Name and Contact are required.", type: "warning" });
      return;
    }
    setShowGuestModal(false);
    setGuestSaved(true);
  };


// --- CALCULATE CURRENT VIEW STATE ---
const isCaptureStep = !capturedImage; // Step 1: Capture photo (Active if no photo yet)
const isDetailsStep = !!capturedImage && !guestSaved; // Step 2: Enter Details (Active if photo exists but no details saved)
const isConfirmStep = !!capturedImage && !!guestSaved; // Step 3: Confirm

  return (
    <>
      <NavigationBar />
      <BlankHeader />
      
      <div style={styles.processClaimBody}>
        {alert && <FloatingAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        
        <div style={styles.mainContainer}>
          <h1 style={styles.title}>Guest Claim Verification</h1>

            {/* STEP INDICATOR (Visible always) */}
            <StepIndicator isCaptureStep={isCaptureStep} isConfirmStep={isConfirmStep} />
          
          <div style={styles.contentGrid}>

                {/* --- LEFT COLUMN: CAMERA/DETAILS --- */}
                <div style={styles.scanCard}>
                    
                    {/* --- STEP 1: CAPTURE PHOTO --- */}
                    {isCaptureStep && (
                        <>
                            <h3>Step 1: Capture Claimant Photo</h3>

                            <div style={styles.cameraContainer}>
                                <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                            </div>
                            
                            <button style={styles.captureButton} onClick={capturePhoto}>
                                Capture Photo
                            </button>
                            
                            <div style={styles.cameraControls}>
                                <label style={{ color: "#343a40", fontWeight: "600", fontSize: '0.9rem' }}>Select Camera:</label>
                                <select 
                                    style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                                    value={selectedDeviceId || ""} 
                                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                                >
                                    {devices.map((device, idx) => (
                                        <option key={idx} value={device.deviceId}>
                                            {device.label || `Camera ${idx + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <canvas ref={canvasRef} style={{ display: "none" }} />
                            <p style={{color: '#6c757d', fontSize: '0.9rem'}}>Take a clear photo of the claimant's face.</p>
                        </>
                    )}
                    
                    {/* --- STEPS 2 & 3: CAPTURED PREVIEW --- */}
                    {capturedImage && !isCaptureStep && (
                        <>
                            <h3 style={{color: isConfirmStep ? '#28a745' : '#007bff'}}>Photo Preview</h3>
                            <img src={capturedImage} alt="Captured" style={styles.capturedImage} />
                            <p style={{color: '#6c757d', fontSize: '0.9rem', textAlign: 'center'}}>
                                {isDetailsStep ? "Click below to input guest details." : "Ready for Finalization."}
                            </p>
                            <button 
                                onClick={handleReset} 
                                style={{
                                    padding: '8px 15px', 
                                    backgroundColor: 'transparent', 
                                    color: '#dc3545', 
                                    border: '1px solid #dc3545', 
                                    borderRadius: '6px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Reset All Steps
                            </button>
                        </>
                    )}
                </div>


                {/* --- RIGHT COLUMN: DATA & ACTION --- */}
                <div style={styles.dataCard}>
                    
                    {/* Initial State / Step 1 & 2 Prompt */}
                    {isCaptureStep || isDetailsStep ? (
                        <>
                            <h3>{isCaptureStep ? "Claimant Information Needed" : "Step 2: Enter Guest Details"}</h3>
                            <p style={{ color: '#007bff', fontWeight: 'bold' }}>
                                This step records the claimant's identity, as they do not have a registered Student ID.
                            </p>
                            
                            {/* Manual Input Button (Triggering Modal) */}
                            {capturedImage && !guestSaved && (
                                <button 
                                    onClick={() => setShowGuestModal(true)} 
                                    style={styles.completeButton}
                                >
                                    Input Guest Details
                                </button>
                            )}
                            
                            {!capturedImage && <p style={{color: '#dc3545', fontWeight: '500'}}>Please complete Step 1 (Capture Photo) first.</p>}

                            {guestSaved && (
                                <p style={{color: '#28a745', fontWeight: '500'}}>Details saved. Proceed to Step 3.</p>
                            )}
                        </>
                    ) : (
                        // --- STEP 3: CONFIRMATION & FINALIZE ---
                        <>
                            <h3>Step 3: Finalize Claim</h3>

                            <div style={styles.userHeader}>
                                <GuestProfileAvatar isSaved={true} />
                                <div style={{lineHeight: '1.2'}}>
                                    <p style={{ margin: 0, fontWeight: 'bold', color: '#143447' }}>
                                        {guestName} {guestLastName}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                                        {guestCourseAbbr || guestYearLevel || 'Guest'}
                                    </p>
                                </div>
                            </div>
                            
                            <div style={styles.detailGrid}>
                                <p style={styles.detailItem}><span style={styles.detailKey}>Email:</span> {guestEmail || 'N/A'}</p>
                                <p style={styles.detailItem}><span style={styles.detailKey}>Contact:</span> {guestContact || 'N/A'}</p>
                                <p style={styles.detailItem}><span style={styles.detailKey}>Address:</span> {guestAddress || 'N/A'}</p>
                                <p style={styles.detailItem}><span style={styles.detailKey}>Birthdate:</span> {guestBirthdate || 'N/A'}</p>
                                <p style={styles.detailItem}><span style={styles.detailKey}>Course:</span> {guestCourseAbbr || 'N/A'}</p>
                                <p style={styles.detailItem}><span style={styles.detailKey}>Year Level:</span> {guestYearLevel || 'N/A'}</p>
                                
                                <p style={{fontSize: '0.9rem', gridColumn: '1 / -1', marginTop: '15px', color: '#555'}}>
                                    **Transaction ID:** <strong style={{color: '#343a40'}}>{matchData?.transactionId || "N/A"}</strong>
                                </p>
                            </div>
                            
                            {/* Finalize Button */}
                            <button 
                                onClick={finalizeClaim} 
                                disabled={loading} 
                                style={{...styles.completeButton, backgroundColor: loading ? '#6c757d' : styles.completeButton.backgroundColor }}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : "Complete & Finalize Claim"}
                            </button>
                            <button 
                                onClick={() => setShowGuestModal(true)} 
                                style={{
                                    padding: '8px 15px', 
                                    backgroundColor: '#ffc107', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '6px',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    width: '100%',
                                    marginTop: '10px'
                                }}
                            >
                                Edit Guest Details
                            </button>
                        </>
                    )}
                </div>

          </div>
        </div>
      </div>
      
      {/* Guest Details Modal (Manual Input) */}
      <Modal show={showGuestModal} onHide={() => setShowGuestModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Guest Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
                <Form.Control type="text" placeholder="First Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="mb-3" />
                <Form.Control type="text" placeholder="Last Name" value={guestLastName} onChange={(e) => setGuestLastName(e.target.value)} className="mb-3" />
                <Form.Control type="text" placeholder="Middle Name (Optional)" value={guestMiddleName} onChange={(e) => setGuestMiddleName(e.target.value)} className="mb-3" />
                <Form.Control type="email" placeholder="Email (Optional)" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="mb-3" />
                <Form.Control type="text" placeholder="Contact Number" value={guestContact} onChange={(e) => setGuestContact(e.target.value)} className="mb-3" />
                <Form.Control type="text" placeholder="Address (Optional)" value={guestAddress} onChange={(e) => setGuestAddress(e.target.value)} className="mb-3" />
                <Form.Control type="date" placeholder="Birthdate (Optional)" value={guestBirthdate} onChange={(e) => setGuestBirthdate(e.target.value)} className="mb-3" />
                <Form.Control type="text" placeholder="Course Abbreviation (e.g. BSCE, Optional)" value={guestCourseAbbr} onChange={(e) => setGuestCourseAbbr(e.target.value)} className="mb-3" />
                <Form.Control type="text" placeholder="Year Level (Optional)" value={guestYearLevel} onChange={(e) => setGuestYearLevel(e.target.value)} className="mb-3" />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGuestModal(false)}>
              Cancel
            </Button>
            <Button 
                variant="success" 
                onClick={handleSaveGuestInfo}
                disabled={!guestName || !guestContact}
            >
              Save Info
            </Button>
          </Modal.Footer>
        </Modal>
    </>
  );
}

export default GuestProcessClaimPage;