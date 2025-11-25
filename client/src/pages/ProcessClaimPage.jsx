import React, { useRef, useState, useEffect } from "react";
import QrScanner from "qr-scanner";
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
import {
  getDatabase,
  ref,
  push,
  set,
  serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css"; 

// 🎨 MODERN STYLES DEFINITION (Adjusted for camera container fill)
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
    
    // --- STEP INDICATOR STYLES (Kept from previous) ---
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
        backgroundColor: isComplete ? '#28a745' : '#ccc',
        zIndex: 5,
    }),

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
        width: '40%',
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
        backgroundColor: '#28a745', 
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    
    // FIX: Captured Image Preview Style
    capturedImage: {
        width: '100%',
        maxWidth: '250px', // Adjusted size for better visibility
        height: 'auto',
        objectFit: 'contain', 
        border: '3px solid #475C6F',
        borderRadius: '8px',
        margin: '10px 0',
    },
    qrResultBox: {
        width: '100%',
        padding: '15px',
        backgroundColor: '#e6f7ff',
        borderRadius: '10px',
        border: '1px solid #b3e0ff',
    },
    resultText: {
        margin: '5px 0',
        fontSize: '0.9rem',
        color: '#333',
    },
    resultLabel: {
        fontWeight: 'bold',
        color: '#007bff',
    },

    // --- RIGHT COLUMN: USER DATA & ACTION (Step 3) ---
    dataCard: {
        padding: '25px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%', // Fill the grid cell
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
        backgroundColor: '#007bff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
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
        backgroundColor: '#007bff', // Blue for final action
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

// --- Profile Avatar Helper ---
const ProfileAvatar = ({ userData }) => {
    const size = 60;
    const baseStyle = {
        ...styles.avatar,
        width: size,
        height: size,
        borderRadius: '50%',
    };

    if (userData?.isGuest) {
        return <div style={{...baseStyle, backgroundColor: '#6c757d', fontSize: '12px'}}>Guest</div>;
    } else if (userData?.profileURL) {
        return <img src={userData.profileURL} alt="profile" style={{...baseStyle, objectFit: 'cover'}} />;
    } else {
        const initials = `${userData?.firstName?.[0] || ""}${userData?.lastName?.[0] || ""}`.toUpperCase();
        return <div style={baseStyle}>{initials}</div>;
    }
};

function ProcessClaimPage() {
 //const API = "http://localhost:4000"; 
 const API = "https://server.spotsync.site";
  const [capturedImage, setCapturedImage] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [userData, setUserData] = useState(null);
  const { currentUser } = useAuth();

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const matchData = location.state?.match || null;
  const matchDocId = matchId || matchData?.id;

  const [alert, setAlert] = useState(null);

  const notificationsRef = collection(db, "notifications");
  const transactionId = matchDocId || `TXN-${Date.now()}`;
  const dbRealtime = getDatabase();

  const sanitizeData = (obj) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
    );

// --- 1. ROBUST STOP FUNCTION ---
  const stopScanner = async () => {
    try {
      // Kill the QR Scanner instance first
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      // Kill the Video Stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop()); // Stop hardware light
        videoRef.current.srcObject = null;       // Unlink stream
      }
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    }
  };

  // --- 2. CAMERA SETUP LOGIC ---
  useEffect(() => {
    const isCapturePhotoActive = !capturedImage;
    const isScanIDActive = !!capturedImage && !qrResult;

    // Do nothing if we don't have a ref or a selected device
    if (!videoRef.current || !selectedDeviceId) return;

    // If we are in confirmation (Step 3), shut everything down
    if (!isCapturePhotoActive && !isScanIDActive) {
      stopScanner();
      return;
    }

    const startCamera = async (enableScanning) => {
      // 1. Clean up any existing streams forcefully
      await stopScanner();

      try {
        // 2. Strict Constraints: Force the specific ID
        const constraints = {
          video: {
            deviceId: { exact: selectedDeviceId } // 'exact' is crucial
          }
        };

        // 3. Get the stream manually
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // 4. Attach to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure it plays only when ready
          await videoRef.current.play();
        }

        // 5. Initialize QR Scanner only if needed (Step 2)
        if (enableScanning) {
          // Pass the ALREADY PLAYING video element to QrScanner
          const scanner = new QrScanner(videoRef.current, handleScan, {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          });
          scannerRef.current = scanner;
          await scanner.start();
        } else {
          scannerRef.current = null;
        }

      } catch (err) {
        console.error("Camera error:", err);
        setAlert({ message: "Failed to start selected camera.", type: "error" });
      }
    };

    // Trigger the logic based on the active step
    if (isCapturePhotoActive) {
      startCamera(false); // Step 1: Just video
    } else if (isScanIDActive) {
      startCamera(true);  // Step 2: Video + Scan
    }

    return () => {
      stopScanner();
    };
  }, [selectedDeviceId, capturedImage, qrResult]); 
  // ^ The effect re-runs whenever selectedDeviceId changes
  // Resize/compress base64 image
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

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
    });
  };

  // Enumerate available cameras
  useEffect(() => {
    const updateDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);

        const saved = localStorage.getItem("preferredCamera");
        if (saved && videoDevices.find((d) => d.deviceId === saved)) {
          setSelectedDeviceId(saved);
        } else if (!selectedDeviceId && videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Device enumeration error:", err);
      }
    };

    updateDevices();
    navigator.mediaDevices.ondevicechange = updateDevices;
    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [selectedDeviceId]);

  // Setup scanner or camera stream
// --- 2. CAMERA SETUP LOGIC (Keep this one) ---
  useEffect(() => {
    const isCapturePhotoActive = !capturedImage;
    const isScanIDActive = !!capturedImage && !qrResult;

    // Do nothing if we don't have a ref or a selected device
    if (!videoRef.current || !selectedDeviceId) return;

    // If we are in confirmation (Step 3), shut everything down
    if (!isCapturePhotoActive && !isScanIDActive) {
      stopScanner();
      return;
    }

    const startCamera = async (enableScanning) => {
      // 1. Clean up any existing streams forcefully
      await stopScanner();

      try {
        // 2. Strict Constraints: Force the specific ID
        const constraints = {
          video: {
            deviceId: { exact: selectedDeviceId }, // This forces the switch
            facingMode: 'environment' // Optional preference
          }
        };

        // 3. Get the stream manually
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // 4. Attach to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure it plays only when ready
          await videoRef.current.play();
        }

        // 5. Initialize QR Scanner only if needed (Step 2)
        if (enableScanning) {
          // Pass the ALREADY PLAYING video element to QrScanner
          const scanner = new QrScanner(videoRef.current, handleScan, {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          });
          scannerRef.current = scanner;
          await scanner.start();
        } else {
          scannerRef.current = null;
        }

      } catch (err) {
        console.error("Camera error:", err);
        setAlert({ message: "Failed to start selected camera.", type: "error" });
      }
    };

    // Trigger the logic based on the active step
    if (isCapturePhotoActive) {
      startCamera(false); // Step 1: Just video
    } else if (isScanIDActive) {
      startCamera(true);  // Step 2: Video + Scan
    }

    return () => {
      // Cleanup when unmounting or when dependencies change (switching cameras)
      stopScanner();
    };
  }, [selectedDeviceId, capturedImage, qrResult]);

const handleCameraSwitch = (newDeviceId) => {
  // Just update state; the useEffect will handle the stop/start logic
  setSelectedDeviceId(newDeviceId);
  localStorage.setItem("preferredCamera", newDeviceId);
};

  // Capture still image
  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawImage = canvas.toDataURL("image/png");
      const compressedImage = await resizeBase64Img(rawImage);
      setCapturedImage(compressedImage);
        
        // Auto advance to next step (Step 2: Scan ID)
        stopScanner();
    }
  };

  // Handle QR scan
  const handleScan = async (result) => {
    if (!result?.data || qrResult) return;

    // Stop scanner after successful scan
    await stopScanner();

    setAlert({ message: "QR Code Scanned!", type: "success" });

    const text = result.data;
    const tokens = text.split(/\s+/);

    let fullnameParts = [];
    let idNumber = "";
    let courseParts = [];
    let phase = "name";

    for (let token of tokens) {
      if (/^\d+$/.test(token)) {
        idNumber = token;
        phase = "course";
      } else {
        if (phase === "name") fullnameParts.push(token);
        else if (phase === "course") courseParts.push(token);
      }
    }

    const parsedResult = {
      fullname: fullnameParts.join(" "),
      idNumber,
      course: courseParts.join(" "),
    };

    setQrResult(parsedResult);

    // Lookup user in Firestore
    try {
      const q = query(collection(db, "users"), where("studentId", "==", idNumber));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach((docSnap) => {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        });
      } else {
        setUserData(null);
        setAlert({ message: "No user found with this ID Number.", type: "error" });
      }
    } catch (err) {
      console.error("Firestore fetch error:", err);
      setAlert({ message: "Database Error Occurred.", type: "error" });
    }
    
    // Auto advance to next step (Step 3: Confirm) is handled by state change (setUserData)
  };

  // Notify user via Realtime DB (kept existing logic)
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

  // Finalize Claim (kept existing logic)
  const finalizeClaim = async () => {
    if (!matchData || !userData || !capturedImage) {
      setAlert({ message: "Please capture a photo and scan a valid ID first.", type: "warning" });
      return;
    }

    setLoading(true);
    try {
    // --- Update lost item ---
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
          foundBy: matchData.foundItem.personalInfo || null,
        });
      }
    }

    // --- Update found item ---
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
          claimedBy: sanitizeData({
            firstName: userData.firstName,
            lastName: userData.lastName,
            middleName: userData.middleName || "",
            email: userData.email,
            contactNumber: userData.contactNumber,
            address: userData.address,
            birthdate: userData.birthdate,
            course: userData.course,
            section: userData.section,
            yearLevel: userData.yearLevel,
            profileURL: userData.profileURL,
            uid: userData.id,
          }),
          claimantPhoto: capturedImage,
        });
      }
    }

    // --- Update match record ---
    if (matchDocId) {
      const matchDocRef = doc(db, "matches", matchDocId);
      await setDoc(matchDocRef, { claimStatus: "claimed" }, { merge: true });
    }

    // --- Save to claimedItems ---
    await addDoc(collection(db, "claimedItems"), {
      itemId: matchData.foundItem.itemId,
      images: matchData.foundItem.images,
      itemName: matchData.foundItem.itemName || "",
      dateClaimed: new Date().toISOString(),
      founder: matchData.foundItem.personalInfo || null,
      owner: sanitizeData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName || "",
        email: userData.email,
        contactNumber: userData.contactNumber,
        address: userData.address,
        birthdate: userData.birthdate,
        course: userData.course,
        section: userData.section,
        yearLevel: userData.yearLevel,
        profileURL: userData.profileURL,
        uid: userData.id,
      }),
      ownerActualFace: capturedImage,
    });

    // --- Save to claimHistory ---
    await addDoc(collection(db, "claimHistory"), {
      itemId: matchData.foundItem.itemId,
      itemName: matchData.foundItem.itemName || "",
      dateClaimed: new Date().toISOString(),
      founder: matchData.foundItem.personalInfo || null,
      owner: sanitizeData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName || "",
        email: userData.email,
        contactNumber: userData.contactNumber,
        address: userData.address,
        birthdate: userData.birthdate,
        course: userData.course,
        section: userData.section,
        yearLevel: userData.yearLevel,
        profileURL: userData.profileURL,
        uid: userData.id,
      }),
      claimantPhoto: capturedImage,
      userAccount: currentUser?.uid || "system",
      status: "completed",
    });

    // --- Notifications and Emails ---
      
    await notifyUser(currentUser?.uid, `<b>Transaction ID: ${matchData.transactionId}</b> — Claim processed.`);
    await notifyUser(matchData.lostItem?.uid, ` Hello <b>"${matchData.lostItem?.personalInfo?.firstName}"!</b>  Your lost item <b>"${matchData.lostItem?.itemName}"</b> has been successfully claimed.`);
    await notifyUser(matchData.foundItem?.uid, `Thank you <b>"${matchData.foundItem?.personalInfo?.firstName}"!</b>  The item you reported found <b>"${matchData.foundItem?.itemName}"</b> has been successfully claimed.`);

      
      // Email logic starts here 
      try {
                  const emailResUser = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(currentUser?.email),
                      subject: "Claim Processed",
                      html: `<b>Transaction ID: ${matchData.transactionId}</b> — Claim processed by admin.`
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

                // Email to Lost Item Reporter (Owner)
                try {
                  const emailResLost = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(matchData.lostItem?.personalInfo?.email),
                      subject: "Item Claimed",
                      html: `Your lost item "${matchData.lostItem?.itemName}" has been claimed.`
                    })
                  });
                  const emailDataLost = await emailResLost.json();
                  console.log("Email response for lost item owner:", emailDataLost);
                  if (!emailResLost.ok) {
                    console.error("Failed to send email to lost owner:", emailDataLost);
                  } else {
                    console.log("Email successfully sent to lost owner:", matchData.lostItem?.personalInfo?.email);
                  }
                } catch (emailErrorLost) {
                  console.error("Error sending email to lost owner:", emailErrorLost);
                }

                // Email to Found Item Reporter (Founder)
                try {
                  const emailResFound = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(matchData.foundItem?.personalInfo?.email),
                      subject: "Item Claimed",
                      html: `The item you reported found, "${matchData.foundItem?.itemName}", has been claimed.`
                    })
                  });
                  const emailDataFound = await emailResFound.json();
                  console.log("Email response for found item reporter:", emailDataFound);
                  if (!emailResFound.ok) {
                    console.error("Failed to send email to found reporter:", emailDataFound);
                  } else {
                    console.log("Email successfully sent to found reporter:", matchData.foundItem?.personalInfo?.email);
                  }
                } catch (emailErrorFound) {
                  console.error("Error sending email to found reporter:", emailErrorFound);
                }

      setAlert({ message: "Claim finalized and notifications sent!", type: "success" });
      navigate(`/admin/item-claimed-list/${currentUser?.uid || userData.id}`);
    } catch (err) {
      console.error("Error finalizing claim:", err);
      setAlert({ message: "Error finalizing claim.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

const handleReset = async () => {
    await stopScanner();
    setCapturedImage(null);
    setQrResult(null);
    setUserData(null);
    // The useEffect will automatically restart the camera stream for Step 1.
};

// --- CALCULATE CURRENT VIEW STATE ---
const isCaptureStep = !capturedImage; // Step 1: Capture photo (Active if no photo yet)
const isScanStep = !!capturedImage && !qrResult; // Step 2: Scan ID (Active if photo exists but no QR result)
const isConfirmStep = !!capturedImage && !!qrResult && !!userData; // Step 3: Confirm

// --- STEP INDICATOR COMPONENT ---
const StepIndicator = ({ isCaptureStep, isScanStep, isConfirmStep }) => {
    
    // Logic for completion:
    const isStep1Complete = !isCaptureStep;
    const isStep2Complete = !isScanStep && isStep1Complete;
    
    const steps = [
        { id: 1, label: 'Capture Photo', active: isCaptureStep, complete: isStep1Complete },
        { id: 2, label: 'Scan ID', active: isScanStep, complete: isStep2Complete },
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
                            left: '-50%', 
                            right: 'auto',
                            transform: 'translateX(20px)', // Center line between steps
                            width: '100%'
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


  return (
    <>
      <NavigationBar />
      <BlankHeader />
      
      <div style={styles.processClaimBody}>
        {alert && <FloatingAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        
        <div style={styles.mainContainer}>
          <h1 style={styles.title}>Claim Verification</h1>

            {/* STEP INDICATOR (Visible always) */}
            <StepIndicator isCaptureStep={isCaptureStep} isScanStep={isScanStep} isConfirmStep={isConfirmStep} />
          
          <div style={styles.contentGrid}>

                {isCaptureStep && (
                    <div style={{...styles.scanCard, gridColumn: '1 / -1'}}>
                        <h3>Step 1: Capture Claimant Photo </h3>

                        <div style={styles.cameraContainer}>
                            <video ref={videoRef}  autoPlay playsInline muted style={styles.video} />
                        </div>
                        
                        <button style={styles.captureButton} onClick={capturePhoto}>
                            Capture Photo
                        </button>
                                                <div style={styles.cameraControls}>
                            <label style={{ color: "#343a40", fontWeight: "600", fontSize: '0.9rem' }}>Select Camera:</label>
                            <select 
                                style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                                value={selectedDeviceId || ""} 
                                onChange={(e) => handleCameraSwitch(e.target.value)}
                            >
                                {devices.map((device, idx) => (
                                    <option key={idx} value={device.deviceId}>
                                        {device.label || `Camera ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p style={{color: '#6c757d', fontSize: '0.9rem'}}>Take a clear photo of the claimant's face for record purposes.</p>
                        
                        {capturedImage && (
                            <div style={{textAlign: 'center'}}>
                                <p style={{fontWeight: '600', color: '#333'}}>Captured Face Preview</p>
                                <img src={capturedImage} alt="Captured" style={styles.capturedImage} />
                            </div>
                        )}
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
                            Reset
                        </button>
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                    </div>
                )}


                {isScanStep && (
                    <div style={{...styles.scanCard, gridColumn: '1 / -1'}}>
                        <h3>Step 2: Scan Claimant ID (QR) </h3>
                        
                        <div style={styles.cameraContainer}>
                            <video ref={videoRef}   autoPlay playsInline muted style={styles.video} />
                        </div>

                        <div style={styles.cameraControls}>
                            <label style={{ color: "#343a40", fontWeight: "600", fontSize: '0.9rem' }}>Select Camera:</label>
                            <select 
                                style={{padding: '8px', borderRadius: '6px', border: '1px solid #ccc'}}
                                value={selectedDeviceId || ""} 
                                onChange={(e) => handleCameraSwitch(e.target.value)}
                            >
                                {devices.map((device, idx) => (
                                    <option key={idx} value={device.deviceId}>
                                        {device.label || `Camera ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p style={{color: '#6c757d', fontSize: '0.9rem'}}>Hold the claimant's QR ID steady in front of the camera.</p>
                        
                        {qrResult && (
                            <div style={styles.qrResultBox}>
                                <p style={styles.resultText}><span style={styles.resultLabel}>Status:</span> ID Scanned! Proceeding to Step 3...</p>
                            </div>
                        )}
                        
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
                    </div>
                )}


                {isConfirmStep && (
                    <>
                        {/* Display Scanned/Captured info (Left Column) */}
                        <div style={styles.scanCard}>
                            <h3 style={{color: '#28a745'}}>Verification Details</h3>
                            
                            <p style={{fontWeight: '600', color: '#333'}}>Claimant Photo Preview</p>
                            {capturedImage && (
                                <img src={capturedImage} alt="Captured" style={styles.capturedImage} />
                            )}
                            
                            {qrResult && (
                                <div style={styles.qrResultBox}>
                                    <p style={styles.resultText}><span style={styles.resultLabel}>Fullname:</span> {qrResult.fullname}</p>
                                    <p style={styles.resultText}><span style={styles.detailKey}>ID Number:</span> {qrResult.idNumber}</p>
                                    <p style={styles.resultText}><span style={styles.detailKey}>Course:</span> {qrResult.course}</p>
                                </div>
                            )}
                        </div>

                        {/* Matched User Data and Finalize (Right Column) */}
                        <div style={styles.dataCard}>
                            <h3>Step 3: Finalize Claim</h3>

                            {userData ? (
                                <>
                                    {/* User Header */}
                                    <div style={styles.userHeader}>
                                        <ProfileAvatar userData={userData} />
                                        <div style={{lineHeight: '1.2'}}>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff' }}>
                                                {userData.firstName} {userData.lastName}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                                                {userData.course?.abbr || userData.designation || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Matched Data Details */}
                                    <div style={styles.detailGrid}>
                                        <p style={styles.detailItem}><span style={styles.detailKey}>ID Number:</span> {qrResult?.idNumber || 'N/A'}</p>
                                        <p style={styles.detailItem}><span style={styles.detailKey}>Year Level:</span> {userData.yearLevel || 'N/A'}</p>
                                        <p style={styles.detailItem}><span style={styles.detailKey}>Section:</span> {userData.section || 'N/A'}</p>
                                        <p style={styles.detailItem}><span style={styles.detailKey}>Contact:</span> {userData.contactNumber || 'N/A'}</p>
                                        <p style={styles.detailItem}><span style={styles.detailKey}>Gender:</span> {userData.gender || 'N/A'}</p>
                                        <p style={styles.detailItem}><span style={styles.detailKey}>Birthdate:</span> {userData.birthdate || 'N/A'}</p>
                                        <p style={{...styles.detailItem, gridColumn: '1 / -1'}}><span style={styles.detailKey}>Address:</span> {userData.address || 'N/A'}</p>
                                        <p style={{...styles.detailItem, gridColumn: '1 / -1'}}><span style={styles.detailKey}>Email:</span> {userData.email || 'N/A'}</p>
                                    </div>
                                    
                                    {/* Transaction ID Display */}
                                    <p style={{fontSize: '0.9rem', marginTop: '15px', color: '#555'}}>
                                        **Transaction ID:** <strong style={{color: '#343a40'}}>{transactionId}</strong>
                                    </p>


                                    {/* Finalize Button */}
                                    <button 
                                        onClick={finalizeClaim} 
                                        disabled={loading || !qrResult || !capturedImage || !userData} 
                                        style={styles.completeButton}
                                    >
                                        {loading ? <Spinner animation="border" size="sm" /> : "Complete & Finalize Claim"}
                                    </button>
                                    <button 
                                        onClick={handleReset} 
                                        style={{
                                            padding: '8px 15px', 
                                            backgroundColor: 'transparent', 
                                            color: '#dc3545', 
                                            border: '1px solid #dc3545', 
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            width: '100%',
                                            marginTop: '10px'
                                        }}
                                    >
                                        Go Back/Reset
                                    </button>
                                </>
                            ) : (
                                <p style={{color: '#dc3545', fontWeight: '500'}}>Scan the claimant's QR ID and capture their photo to view details and finalize the claim.</p>
                            )}
                        </div>
                    </>
                )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProcessClaimPage;