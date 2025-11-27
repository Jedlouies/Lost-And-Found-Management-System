import React, { useRef, useState, useEffect, useCallback } from "react";
import QrScanner from "qr-scanner";
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import FloatingAlert from "../components/FloatingAlert";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// Firebase Imports
import { db } from "../firebase";
import {
  collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc
} from "firebase/firestore";
import {
  getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp
} from "firebase/database";

// --- STYLES & THEME ---
const theme = {
  primary: '#0d6efd',
  success: '#198754',
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
    overflow: 'hidden',
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
    position: 'relative',
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
  overlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '70%',
    height: '60%',
    border: '4px dashed rgba(255, 255, 255, 0.8)',
    borderRadius: '12px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none'
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
  btnSecondary: {
    backgroundColor: 'transparent',
    color: theme.muted,
    border: `1px solid ${theme.border}`,
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '500',
    marginTop: '10px',
    cursor: 'pointer',
    width: '100%'
  }
};

// --- CUSTOM HOOK: Camera & Scanning Logic ---
const useCameraScanner = (onScanSuccess) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [streamError, setStreamError] = useState(null);

  // 1. Load Devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInput = all.filter(d => d.kind === 'videoinput');
        setDevices(videoInput);
        if (videoInput.length > 0) setActiveDeviceId(videoInput[0].deviceId);
      } catch (err) {
        setStreamError("Could not list camera devices.");
      }
    };
    getDevices();
  }, []);

  // 2. Start Stream & Scanner
  useEffect(() => {
    if (!activeDeviceId) return;

    let localScanner;
    
    const startCamera = async () => {
      if(scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: activeDeviceId }, width: 1280, height: 720 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Init QR Scanner specifically attached to this video element
          localScanner = new QrScanner(videoRef.current, (result) => {
             if(result?.data) onScanSuccess(result.data);
          }, { 
            highlightScanRegion: true, 
            highlightCodeOutline: true 
          });
          
          scannerRef.current = localScanner;
          await localScanner.start();
        }
      } catch (err) {
        console.error("Camera Start Error", err);
        setStreamError("Camera failed to start. Check permissions.");
      }
    };

    startCamera();

    return () => {
      if (localScanner) {
        localScanner.stop();
        localScanner.destroy();
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeDeviceId, onScanSuccess]);

  // 3. Helper: Capture Photo
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
    {[0, 1, 2].map(s => (
      <div key={s} style={styles.stepDot(currentStep === s, currentStep > s)}>
        {currentStep > s ? '✓' : s + 1}
      </div>
    ))}
  </div>
);

// --- MAIN COMPONENT ---
function ProcessClaimPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams();

  // Route State
  const matchData = location.state?.match || null;
  const matchDocId = matchId || matchData?.id;

  // Local State
  const [step, setStep] = useState(0); // 0: Capture, 1: Scan, 2: Finalize
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Data State
  const [claimantPhoto, setClaimantPhoto] = useState(null);
  const [scannedQRData, setScannedQRData] = useState(null);
  const [userData, setUserData] = useState(null);

  // --- Handlers ---

  // Handle QR Scan (Passed to hook)
  const handleQRDetected = useCallback(async (text) => {
    if (step !== 1) return; // Only process if in scanning step

    // Parse Data
    const tokens = text.split(/\s+/);
    const idNumber = tokens.find(t => /^\d+$/.test(t)); // Simple regex for ID
    
    if (!idNumber) {
      setAlert({ type: 'warning', message: "QR format unrecognized. Try again." });
      return;
    }

    // Fetch User
    try {
      setLoading(true);
      const q = query(collection(db, "users"), where("studentId", "==", idNumber));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const user = snap.docs[0].data();
        setUserData({ id: snap.docs[0].id, ...user });
        setScannedQRData({ raw: text, idNumber });
        setAlert({ type: 'success', message: "ID Verified Successfully!" });
        setStep(2); // Move to final step
      } else {
        setAlert({ type: 'error', message: "Student ID not found in database." });
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: "Database read error." });
    } finally {
      setLoading(false);
    }
  }, [step]);

  // Use Custom Hook
  const { videoRef, devices, activeDeviceId, setActiveDeviceId, takePhoto, streamError } = useCameraScanner(handleQRDetected);

  const handleCapture = () => {
    const photo = takePhoto();
    if (photo) {
      setClaimantPhoto(photo);
      setStep(1); // Move to Scan step
    }
  };

  const handleReset = () => {
    setStep(0);
    setClaimantPhoto(null);
    setScannedQRData(null);
    setUserData(null);
  };

  // Logic: Notifications
  const sendNotification = async (uid, msg) => {
    if (!uid) return;
    const refPath = ref(getDatabase(), `notifications/${uid}`);
    await set(push(refPath), {
      message: msg,
      timestamp: rtdbServerTimestamp(),
      type: "transaction",
      read: false,
    });
  };

  // Logic: Database Updates
  const finalizeTransaction = async () => {
    if (!matchData || !userData) return;
    setLoading(true);

    const transactionId = matchDocId || `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const sanitize = (d) => JSON.parse(JSON.stringify(d)); // Quick Deep Clean

    const finalOwnerData = sanitize({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        contactNumber: userData.contactNumber,
        address: userData.address,
        uid: userData.id,
        idNumber: scannedQRData.idNumber
    });

    try {
      const updates = [];

      // 1. Update Lost Item (if exists)
      if (matchData.lostItem?.itemId) {
        const q = query(collection(db, "lostItems"), where("itemId", "==", matchData.lostItem.itemId));
        updates.push(getDocs(q).then(snap => {
          if(!snap.empty) updateDoc(doc(db, "lostItems", snap.docs[0].id), { claimStatus: "claimed" });
        }));
      }

      // 2. Update Found Item
      if (matchData.foundItem?.itemId) {
        const q = query(collection(db, "foundItems"), where("itemId", "==", matchData.foundItem.itemId));
        updates.push(getDocs(q).then(snap => {
          if(!snap.empty) {
            updateDoc(doc(db, "foundItems", snap.docs[0].id), {
              claimStatus: "claimed",
              claimedBy: finalOwnerData,
              claimantPhoto: claimantPhoto
            });
          }
        }));
      }

      // 3. Add to History Collections
      const historyPayload = {
        itemId: matchData.foundItem.itemId,
        itemName: matchData.foundItem.itemName,
        dateClaimed: timestamp,
        owner: finalOwnerData,
        claimantPhoto: claimantPhoto,
        processedBy: currentUser?.uid
      };

      updates.push(addDoc(collection(db, "claimedItems"), historyPayload));
      updates.push(addDoc(collection(db, "claimHistory"), { ...historyPayload, status: 'completed' }));

      // 4. Update Match Doc
      if (matchDocId) {
        updates.push(setDoc(doc(db, "matches", matchDocId), { claimStatus: "claimed" }, { merge: true }));
      }

      // 5. Notifications
      updates.push(sendNotification(currentUser?.uid, `Transaction ${transactionId} Completed.`));
      updates.push(sendNotification(matchData.lostItem?.uid, `Your item ${matchData.lostItem?.itemName} has been claimed.`));

      await Promise.all(updates);

      setAlert({ type: 'success', message: "Transaction Completed!" });
      setTimeout(() => navigate(`/admin/item-claimed-list/${currentUser?.uid}`), 1500);

    } catch (e) {
      console.error(e);
      setAlert({ type: 'error', message: "Transaction failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <>
      <NavigationBar />
      <BlankHeader />
      
      <div style={styles.pageWrapper}>
        {alert && <FloatingAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        
        <div style={styles.container}>
          <div style={styles.header}>
            <h2>Claim Verification</h2>
            <p style={{color: theme.muted}}>Follow the steps to verify identity and process the item return.</p>
          </div>

          <StepWizard currentStep={step} />

          <div style={styles.card}>
            
            {/* --- STEP 0 & 1: CAMERA VIEW --- */}
            {(step === 0 || step === 1) && (
              <div style={{textAlign: 'center'}}>
                <h4 style={{marginBottom: '20px'}}>
                  {step === 0 ? "Step 1: Capture Photo" : "Step 2: Scan ID Badge"}
                </h4>
                
                {streamError ? (
                   <div className="alert alert-danger">{streamError}</div>
                ) : (
                  <div style={styles.videoWrapper}>
                    <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
                    {step === 1 && <div style={styles.overlay}><p style={{color: 'white', marginTop: '110%', textShadow: '0 2px 4px #000'}}>Align QR Code</p></div>}
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

                  {step === 0 && (
                    <button style={styles.btnPrimary} onClick={handleCapture}>
                      Capture Claimant Photo
                    </button>
                  )}
                  
                  {step === 1 && (
                    <p className="text-muted">Scanning for QR code automatically...</p>
                  )}
                </div>
              </div>
            )}

            {/* --- STEP 2: SUMMARY & SUBMIT --- */}
            {step === 2 && userData && (
              <div>
                <h4 style={{marginBottom: '25px', color: theme.success, textAlign: 'center'}}>
                   Verification Successful
                </h4>

                <div className="row">
                  <div className="col-md-4 text-center">
                    <p style={styles.label}>Captured Photo</p>
                    <img src={claimantPhoto} alt="Claimant" style={{width: '100%', borderRadius: '8px', border: '3px solid #eee'}} />
                  </div>

                  <div className="col-md-8">
                    <div style={{backgroundColor: '#f1f3f5', padding: '20px', borderRadius: '12px'}}>
                      <h5 style={{color: theme.primary, marginBottom: '15px'}}>{userData.firstName} {userData.lastName}</h5>
                      
                      <div style={styles.detailRow}>
                        <span style={styles.label}>Student ID</span>
                        <span style={styles.value}>{scannedQRData.idNumber}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.label}>Course / Section</span>
                        <span style={styles.value}>{userData.course?.abbr || userData.course} - {userData.section}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.label}>Email</span>
                        <span style={styles.value}>{userData.email}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.label}>Item Being Claimed</span>
                        <span style={styles.value}>{matchData?.foundItem?.itemName || "Unknown Item"}</span>
                      </div>
                    </div>

                    <button 
                      style={{...styles.btnPrimary, opacity: loading ? 0.7 : 1}} 
                      onClick={finalizeTransaction}
                      disabled={loading}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : "Confirm & Process Claim"}
                    </button>
                    
                    <button style={styles.btnSecondary} onClick={handleReset} disabled={loading}>
                      Cancel / Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default ProcessClaimPage;