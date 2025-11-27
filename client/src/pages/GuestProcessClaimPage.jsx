import React, { useRef, useState, useEffect, useCallback } from "react";
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import FloatingAlert from "../components/FloatingAlert";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Form, Spinner, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// Firebase Imports
import { db } from "../firebase";
import {
  collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc
} from "firebase/firestore";
import {
  getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp
} from "firebase/database";

// --- THEME & STYLES ---
const theme = {
  primary: '#0d6efd',
  success: '#198754',
  warning: '#ffc107',
  text: '#212529',
  muted: '#6c757d',
  bg: '#f8f9fa',
  white: '#ffffff',
  border: '#dee2e6'
};

const styles = {
  pageWrapper: {
    backgroundColor: theme.bg,
    minHeight: '100vh',
    paddingBottom: '40px'
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 20px',
  },
  header: {
    padding: '30px 0',
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.white,
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: '30px',
    transition: 'all 0.3s ease'
  },
  stepperBox: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
    gap: '15px'
  },
  stepDot: (active, completed) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    backgroundColor: completed ? theme.success : active ? theme.primary : '#e9ecef',
    color: completed || active ? theme.white : theme.muted,
    border: active ? `3px solid ${theme.primary}40` : 'none',
    transition: 'all 0.3s ease'
  }),
  videoWrapper: {
    width: '100%',
    maxWidth: '600px',
    aspectRatio: '4/3',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    margin: '0 auto 20px auto',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${theme.border}`
  },
  label: { fontWeight: '600', color: theme.muted, fontSize: '0.9rem' },
  value: { fontWeight: '500', color: theme.text },
  btnPrimary: {
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    width: '100%',
    cursor: 'pointer',
    marginTop: '20px'
  },
};

// --- CUSTOM HOOK: Camera Logic (Simplified for Guests) ---
const useCamera = () => {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devs => {
        const videoDevs = devs.filter(d => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0) setActiveDeviceId(videoDevs[0].deviceId);
      })
      .catch(() => setStreamError("Camera permission denied or no device found."));
  }, []);

  useEffect(() => {
    if (!activeDeviceId || !videoRef.current) return;
    
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: activeDeviceId }, width: 1280, height: 720 }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        setStreamError("Could not access camera.");
      }
    };
    startStream();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeDeviceId]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  return { videoRef, devices, activeDeviceId, setActiveDeviceId, takePhoto, streamError };
};

// --- SUB-COMPONENT: Step Indicator ---
const StepWizard = ({ currentStep }) => (
  <div style={styles.stepperBox}>
    {['Photo', 'Details', 'Confirm'].map((label, idx) => (
      <div key={idx} style={styles.stepDot(currentStep === idx, currentStep > idx)}>
        {currentStep > idx ? '✓' : idx + 1}
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT ---
function GuestProcessClaimPage() {
  const API = "https://server.spotsync.site";
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams();

  // Route Data
  const matchData = location.state?.match || null;
  const matchDocId = matchId || matchData?.id;

  // Local State
  const [step, setStep] = useState(0); // 0: Capture, 1: Details, 2: Finalize
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Data State
  const [claimantPhoto, setClaimantPhoto] = useState(null);
  const [guestData, setGuestData] = useState({
    firstName: "", lastName: "", middleName: "",
    email: "", contactNumber: "", address: "",
    birthdate: "", course: "", yearLevel: ""
  });

  const { videoRef, devices, activeDeviceId, setActiveDeviceId, takePhoto, streamError } = useCamera();

  // --- Handlers ---

  const handleCapture = () => {
    const photo = takePhoto();
    if (photo) {
      setClaimantPhoto(photo);
      setStep(1); // Move to Details
      setShowModal(true); // Auto-open modal
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGuestData(prev => ({ ...prev, [name]: value }));
  };

  const saveGuestDetails = () => {
    if (!guestData.firstName || !guestData.contactNumber) {
      setAlert({ type: 'warning', message: 'Name and Contact Number are required.' });
      return;
    }
    setShowModal(false);
    setStep(2); // Move to Finalize
  };

  const handleReset = () => {
    setStep(0);
    setClaimantPhoto(null);
    setGuestData({
        firstName: "", lastName: "", middleName: "",
        email: "", contactNumber: "", address: "",
        birthdate: "", course: "", yearLevel: ""
    });
  };

  // --- LOGIC: Database & Email ---
  
  const sendEmail = async (to, subject, html) => {
    if(!to) return;
    try {
        await fetch(`${API}/api/send-email`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: String(to), subject, html })
        });
    } catch (e) { console.error("Email failed", e); }
  };

  const sendNotification = async (uid, msg) => {
    if (!uid) return;
    await set(push(ref(getDatabase(), `notifications/${uid}`)), {
      message: msg, timestamp: rtdbServerTimestamp(), type: "transaction", read: false
    });
  };

  const finalizeClaim = async () => {
    if (!matchData || !claimantPhoto) return;
    setLoading(true);

    const transactionId = matchDocId || `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const finalGuestData = {
        ...guestData,
        uid: "guest",
        idNumber: "N/A (Guest)",
        isGuest: true
    };

    const cleanData = (obj) => JSON.parse(JSON.stringify(obj)); // Remove undefined

    try {
      const updates = [];
      const historyPayload = {
        itemId: matchData.foundItem.itemId,
        itemName: matchData.foundItem.itemName || "",
        dateClaimed: timestamp,
        owner: cleanData(finalGuestData),
        ownerActualFace: claimantPhoto,
        founder: matchData.foundItem.personalInfo || null,
        processedBy: currentUser?.uid || "system"
      };

      // 1. Update Found Item
      if (matchData.foundItem?.itemId) {
        const q = query(collection(db, "foundItems"), where("itemId", "==", matchData.foundItem.itemId));
        updates.push(getDocs(q).then(snap => {
            if(!snap.empty) {
                updateDoc(doc(db, "foundItems", snap.docs[0].id), {
                    claimStatus: "claimed",
                    claimedBy: cleanData(finalGuestData),
                    claimantPhoto: claimantPhoto
                });
            }
        }));
      }

      // 2. Update Lost Item
      if (matchData.lostItem?.itemId) {
        const q = query(collection(db, "lostItems"), where("itemId", "==", matchData.lostItem.itemId));
        updates.push(getDocs(q).then(snap => {
            if(!snap.empty) updateDoc(doc(db, "lostItems", snap.docs[0].id), { 
                claimStatus: "claimed", owner: cleanData(finalGuestData) 
            });
        }));
      }

      // 3. History & Match Records
      updates.push(addDoc(collection(db, "claimedItems"), historyPayload));
      updates.push(addDoc(collection(db, "claimHistory"), { ...historyPayload, status: "completed" }));
      
      if (matchDocId) {
        updates.push(setDoc(doc(db, "matches", matchDocId), { claimStatus: "claimed" }, { merge: true }));
      }

      // 4. Notifications
      updates.push(sendNotification(currentUser?.uid, `Guest Claim: Transaction ${transactionId} Processed.`));
      updates.push(sendNotification(matchData.lostItem?.uid, `Your lost item ${matchData.lostItem?.itemName} has been claimed.`));
      updates.push(sendNotification(matchData.foundItem?.uid, `Found item ${matchData.foundItem?.itemName} has been successfully returned.`));

      // 5. Emails (Fire and forget, but included in promise for structure)
      updates.push(sendEmail(currentUser?.email, "Claim Processed", `Guest claim processed for item: ${matchData.foundItem?.itemName}`));
      updates.push(sendEmail(matchData.lostItem?.personalInfo?.email, "Item Claimed", `Your item was claimed by guest: ${guestData.firstName} ${guestData.lastName}`));

      await Promise.all(updates);

      setAlert({ type: 'success', message: "Guest Claim Finalized Successfully!" });
      setTimeout(() => navigate(`/admin/item-claimed-list/${currentUser?.uid}`), 1500);

    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: "System Error. Could not finalize claim." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavigationBar />
      <BlankHeader />
      
      <div style={styles.pageWrapper}>
        {alert && <FloatingAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        
        <div style={styles.container}>
          <div style={styles.header}>
            <h2>Guest Claim Verification</h2>
            <p style={{color: theme.muted}}>Manual entry for claimants without a Registered Student ID.</p>
          </div>

          <StepWizard currentStep={step} />

          <div style={styles.card}>
            
            {/* --- STEP 0: CAMERA --- */}
            {step === 0 && (
              <div style={{textAlign: 'center'}}>
                <h4 style={{marginBottom: '20px'}}>Step 1: Capture Guest Photo</h4>
                
                {streamError ? <div className="alert alert-danger">{streamError}</div> : (
                  <div style={styles.videoWrapper}>
                    <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                  </div>
                )}

                <div style={{maxWidth: '300px', margin: '0 auto'}}>
                  <select 
                    className="form-select mb-3" 
                    onChange={(e) => setActiveDeviceId(e.target.value)} 
                    value={activeDeviceId || ''}
                  >
                    {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
                  </select>

                  <button style={styles.btnPrimary} onClick={handleCapture}>Capture Photo</button>
                </div>
              </div>
            )}

            {/* --- STEP 1 & 2: PREVIEW & ACTIONS --- */}
            {(step === 1 || step === 2) && (
               <div className="row">
                  <div className="col-md-5 text-center mb-4">
                     <h5 style={{color: theme.muted}}>Photo Preview</h5>
                     <img src={claimantPhoto} alt="Guest" style={{width: '100%', borderRadius: '12px', border: `3px solid ${theme.border}`}} />
                     <button className="btn btn-outline-secondary w-100 mt-3" onClick={handleReset}>Reset / Retake</button>
                  </div>

                  <div className="col-md-7">
                     {step === 1 && (
                        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%'}}>
                             <h4>Step 2: Enter Details</h4>
                             <p className="text-muted">Photo captured. Please input the guest's identification details.</p>
                             <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>Open Details Form</button>
                        </div>
                     )}

                     {step === 2 && (
                        <div style={{backgroundColor: '#f1f3f5', padding: '20px', borderRadius: '12px'}}>
                            <h4 style={{color: theme.success, marginBottom: '20px'}}>Step 3: Confirm & Finalize</h4>
                            <div style={styles.detailRow}><span style={styles.label}>Name</span><span style={styles.value}>{guestData.firstName} {guestData.lastName}</span></div>
                            <div style={styles.detailRow}><span style={styles.label}>Contact</span><span style={styles.value}>{guestData.contactNumber}</span></div>
                            <div style={styles.detailRow}><span style={styles.label}>Email</span><span style={styles.value}>{guestData.email || "N/A"}</span></div>
                            <div style={styles.detailRow}><span style={styles.label}>Address</span><span style={styles.value}>{guestData.address || "N/A"}</span></div>
                            <div style={styles.detailRow}><span style={styles.label}>Item</span><span style={styles.value}>{matchData?.foundItem?.itemName || "Unknown"}</span></div>

                            <button style={styles.btnPrimary} onClick={finalizeClaim} disabled={loading}>
                                {loading ? <Spinner size="sm" animation="border"/> : "Complete Transaction"}
                            </button>
                            <button className="btn btn-sm btn-link mt-2" onClick={() => setShowModal(true)}>Edit Details</button>
                        </div>
                     )}
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* --- DATA ENTRY MODAL --- */}
      <Modal show={showModal} onHide={() => { if(step === 1) handleReset(); else setShowModal(false); }} centered backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Guest Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <Form>
             <Row className="mb-3">
                <Col md={4}><Form.Control name="firstName" placeholder="First Name *" value={guestData.firstName} onChange={handleInputChange} /></Col>
                <Col md={4}><Form.Control name="middleName" placeholder="Middle Name" value={guestData.middleName} onChange={handleInputChange} /></Col>
                <Col md={4}><Form.Control name="lastName" placeholder="Last Name" value={guestData.lastName} onChange={handleInputChange} /></Col>
             </Row>
             <Row className="mb-3">
                <Col md={6}><Form.Control name="contactNumber" placeholder="Contact Number *" value={guestData.contactNumber} onChange={handleInputChange} /></Col>
                <Col md={6}><Form.Control name="email" type="email" placeholder="Email Address" value={guestData.email} onChange={handleInputChange} /></Col>
             </Row>
             <Form.Control className="mb-3" name="address" placeholder="Home Address" value={guestData.address} onChange={handleInputChange} />
             <Row className="mb-3">
                 <Col md={6}><Form.Control name="course" placeholder="Course/Designation" value={guestData.course} onChange={handleInputChange} /></Col>
                 <Col md={6}><Form.Control name="yearLevel" placeholder="Year Level/Position" value={guestData.yearLevel} onChange={handleInputChange} /></Col>
             </Row>
           </Form>
        </Modal.Body>
        <Modal.Footer>
            {step === 1 && <Button variant="secondary" onClick={handleReset}>Cancel</Button>}
            {step === 2 && <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>}
            <Button variant="primary" onClick={saveGuestDetails} disabled={!guestData.firstName || !guestData.contactNumber}>
                Save & Continue
            </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default GuestProcessClaimPage;