import React, { useRef, useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import "./styles/ProcessClaimPage.css";
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";  
import { collection, query, where, getDocs, doc, updateDoc, addDoc, setDoc } from "firebase/firestore";
import FloatingAlert from "../components/FloatingAlert";
import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database";
import { useAuth } from "../context/AuthContext"; 


function ProcessClaimPage() {
  const [capturedImage, setCapturedImage] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [userData, setUserData] = useState(null);
  const {currentUser} = useAuth();

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

  const [scanFeedback, setScanFeedback] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [alert, setAlert] = useState(null);

  const notificationsRef = collection(db, "notifications");
  const transactionId = matchDocId || `TXN-${Date.now()}`;

  const dbRealtime = getDatabase();






  useEffect(() => {
const updateDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);

     
      if (!selectedDeviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
        startCamera(videoDevices[0].deviceId); 
      } else if (selectedDeviceId) {
        
        const valid = videoDevices.find((d) => d.deviceId === selectedDeviceId);
        if (!valid && videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
          startCamera(videoDevices[0].deviceId);
        }
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
 
const startCamera = async (deviceId = selectedDeviceId) => {
  try {
    if (!deviceId) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  } catch (err) {
    console.error("Camera access error:", err);
  }
};
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [selectedDeviceId]);

 
  const capturePhoto = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  if (video && canvas) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/png"));

    
    setIsScanning(true);
    setShowScanner(true);
  }
};

  
const handleScan = async (result, error) => {
  if (!isScanning) return; 

  if (result) {
    
    setAlert({ message: "QR Code Scanned!", type: "success" });
    setScanFeedback(null);
    const text = result?.text || "";
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
    setShowScanner(false);

    try {
      const q = query(collection(db, "users"), where("studentId", "==", idNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          setUserData({ id: doc.id, ...doc.data() });
        });
      } else {
        setUserData(null);
        setAlert({ message: "No user found with this ID Number.", type: "error" });
      }
    } catch (err) {
      console.error("Firestore fetch error:", err);
      setAlert({ message: "Database Error Occured.", type: "error" });
    }
  }

  if (error && isScanning) { 
    if (
      error.name !== "NotFoundException" &&
      !error.message?.includes("No MultiFormat")
    ) {
      console.error("QR Scan Error:", error);

      if (error.message?.includes("Not Found")) {
        setScanFeedback("❌ No QR code in view");
      } else if (error.message?.includes("blur")) {
        setScanFeedback("⚠️ Too blurry — hold steady");
      } else if (error.message?.includes("close")) {
        setScanFeedback("⚠️ Too close — move back");
      } else {
        setScanFeedback("⚠️ No QR code detected");
      }
    }
  }
};

const notifyUser = async (uid, message) => {
  if (!uid) return;
  const notifRef = ref(dbRealtime, `notifications/${uid}`);
  const newNotifRef = push(notifRef);
  await set(newNotifRef, {
    message,
    timestamp: serverTimestamp(),
    type: "transaction",
    read: false,
  });
};

const finalizeClaim = async () => {
  if (!matchData || !userData || !capturedImage) {
    setAlert({ message: "Please first capture a photo and scan ID first", type: "warning" });
    
    return;
  }

  if (userData?.error || !userData?.id) {
    setAlert({ message: "Cannot complete: No valid user account found for this ID.", type: "warning" });
    return;
  }

  setLoading(true);

  try {
    let itemId = null;
    let itemName = "";
    let founder = null;
    let owner = null;


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
      owner: {
        ...matchData.lostItem.personalInfo,
        uid: matchData.lostItem?.uid || null,  
      },
      foundBy: {
        ...matchData.foundItem?.personalInfo,
        uid: matchData.foundItem?.uid || null, 
      },
      claimantPhoto: capturedImage,
    });

    itemId = matchData.lostItem.itemId;
    itemName = matchData.lostItem.itemName || "";
    owner = matchData.lostItem.personalInfo || null;
    founder = matchData.foundItem?.personalInfo || null;
  }
}

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
      founder: {
        ...matchData.foundItem.personalInfo,
        uid: matchData.foundItem.personalInfo?.uid || null,  
      },
      claimedBy: {
        ...matchData.lostItem?.personalInfo,
        uid: matchData.lostItem?.uid || null, 
      },
      claimantPhoto: capturedImage,
    });

    itemId = matchData.foundItem.itemId;
    itemName = matchData.foundItem.itemName || "";
    founder = matchData.foundItem.personalInfo || null;
    owner = matchData.lostItem?.personalInfo || null;
  }
}


    if (matchDocId) {
        const matchDocRef = doc(db, "matches", matchDocId);
        await setDoc(matchDocRef, { claimStatus: "claimed" }, { merge: true });
      } else {
        console.warn("⚠️ No matchId provided, skipping matches update");
      }

   
    await addDoc(collection(db, "claimedItems"), {
      itemId: matchData.foundItem.itemId,
      images: matchData.foundItem.images,
      itemName: matchData.foundItem.itemName || "",
      dateClaimed: new Date().toISOString(),
      founder: matchData.foundItem.personalInfo || null,
      owner: matchData.lostItem?.personalInfo || null,
      ownerActualFace: capturedImage,
    });

    
    await addDoc(collection(db, "claimHistory"), {
      itemId: matchData.foundItem.itemId,
      itemName: matchData.foundItem.itemName || "",
      dateClaimed: new Date().toISOString(),
      founder: matchData.foundItem.personalInfo || null,
      owner: matchData.lostItem?.personalInfo || null,
      claimantPhoto: capturedImage,
      userAccount: currentUser.uid || null,
      status: "completed"
    });

    await notifyUser(currentUser?.uid, `<b>Transaction ID: ${matchData.transactionId}</b> — The system has successfully processed a matching request for a lost item report. 
      The results generated are: 
      Image Match ${matchData.scores?.imageScore}%, 
      Description Match ${matchData.scores?.descriptionScore}%, 
      and an Overall Match Rate of ${matchData.scores?.overallScore}%. 
      Please review the transaction details for further verification.`);
    await notifyUser(matchData.lostItem?.uid, ` Hello <b>"${matchData.lostItem?.personalInfo?.firstName}"!</b>  Your lost item <b>"${matchData.lostItem?.itemName}"</b> has been successfully claimed.  
      Please take a moment to rate your experience and help us improve the matching process.
      `);
    await notifyUser(matchData.foundItem?.uid, `Thank you <b>"${matchData.foundItem?.personalInfo?.firstName}"!</b>  The item you reported found <b>"${matchData.foundItem?.itemName}"</b> 
      has been successfully claimed by its rightful owner.  
We appreciate your honesty and contribution. Kindly rate your experience with the process.
`);

    setShowScanner(false);  
    setIsScanning(false);
    stopCamera();
    navigate(`/admin/item-claimed-list/${currentUser.uid}`);
    window.location.reload();
  } catch (err) {
    console.error("Error finalizing claim:", err);
    setAlert({ message: "Error finalizing claim.", type: "error" });
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <NavigationBar />
      <div className="process-claim-page">
        <BlankHeader />
        {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}
        <h1 style={{ position: "absolute", top: "6%", left: "1%", color: '#475C6F' }}>
          Process Claim
        </h1>

        
        <div style={{ position: "absolute", top: "7%", left: "25%" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>Select Camera:</label>
          <select
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px", backgroundColor: '#475C6F', borderRadius: '5px'}}
          >
            {devices.map((device, idx) => (
              <option key={idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

       
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline />
        </div>

        <button className="capture-btn" onClick={capturePhoto}>
          Capture Photo
        </button>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        
        {capturedImage && (
          <div className="captured-section">
            <img
              src={capturedImage}
              alt="Captured"
              style={{
                width: "200px",
                border: "2px solid #475C6F",
                borderRadius: "8px",
              }}
            />
          </div>
        )}


        <div className="qr-scanner-container" style={{ position: "absolute" }}>
          
          {capturedImage && scanFeedback && (
            <div style={{
              position: "relative",
              top: "-250px",
              left: "200%",
              transform: "translateX(-50%)",
              backgroundColor: "#000000cc",
              color: "white",
              padding: "8px 15px",
              borderRadius: "8px",
              zIndex: 1000,
              fontWeight: "500",
              fontSize: "14px",
            }}>
              {scanFeedback}
            </div>
          )}

          
          {isScanning && (
            <>
              <QrReader
                onResult={handleScan}
                constraints={{
                  deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                }}
                style={{
                  width: "320px",
                  margin: "auto",
                  borderRadius: "8px",
                }}
              />

              {/* Overlay */}
              <div
                style={{
                  position: "absolute",
                  top: -150,
                  left: 300,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none", // so clicks pass through
                }}
              >
                <div
                  style={{
                    width: "200px",
                    height: "200px",
                    position: "relative",
                    backgroundColor: "transparent",
                  }}
                >
                  {/* 4 corner guides */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "40px",
                    height: "40px",
                    borderTop: "4px solid #00FF00",
                    borderLeft: "4px solid #00FF00",
                  }}></div>

                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "40px",
                    height: "40px",
                    borderTop: "4px solid #00FF00",
                    borderRight: "4px solid #00FF00",
                  }}></div>

                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "40px",
                    height: "40px",
                    borderBottom: "4px solid #00FF00",
                    borderLeft: "4px solid #00FF00",
                  }}></div>

                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "40px",
                    height: "40px",
                    borderBottom: "4px solid #00FF00",
                    borderRight: "4px solid #00FF00",
                  }}></div>
                </div>
              </div>
            </>
          )}
        </div>

     
        {qrResult && (
          <div className="qr-result">
            <p>Scanned ID Info:</p>
            <p style={{ fontWeight: "400" }}>Fullname: {qrResult.fullname}</p>
            <p style={{ fontWeight: "400" }}>ID Number: {qrResult.idNumber}</p>
            <p style={{ fontWeight: "400" }}>Course: {qrResult.course}</p>
          </div>
        )}

    
        {userData && (
          <div className="qr-results" style={{ marginTop: "160px" }}>
            <p><b>Matched User Account:</b></p>
            {userData.error ? (
              <p style={{ color: "red" }}>{userData.error}</p>
            ) : (
              <>
                <img 
                  src={userData.profileURL} 
                  alt="Profile" 
                  style={{ width: "60px", height: "60px", borderRadius: "100%", objectFit: "cover" }}
                />
                <p style={{position: "absolute", top: "15%", left: "25%", fontSize: "20px", width: "600px"}}>
                  {userData.firstName} {userData.middleName} {userData.lastName}
                </p>
                <p style={{ fontWeight: "400" }}>Email: {userData.email}</p>
                <p style={{ fontWeight: "400" }}>Course: {userData.course} | Section: {userData.section}</p>
                <p style={{ fontWeight: "400" }}>Year Level: {userData.yearLevel}</p>
                <p style={{ fontWeight: "400" }}>Contact: {userData.contactNumber}</p>
                <p style={{ fontWeight: "400" }}>Address: {userData.address}</p>
                <p style={{ fontWeight: "400" }}>Gender: {userData.gender}</p>
                <p style={{ fontWeight: "400" }}>Birthdate: {userData.birthdate}</p>
              </>
            )}
          </div>
        )}
          <button
            onClick={finalizeClaim}
            disabled={loading}
            style={{
              position: "absolute",
              bottom: "5%",
              height: "50px",
              width: "250px",
              top: "76%",
              left: "40%",
              padding: "12px 25px",
              fontSize: "18px",
              backgroundColor: "#475C6F",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px", 
            }}
          >
            {loading ? (
              <>
                <img
                  src="/Spin.gif"
                  alt="Loading..."
                  style={{ width: "25px", height: "25px" }}
                />
                <span>Storing data...</span>
              </>
            ) : (
              "Complete"
            )}
          </button>

      </div>
    </>
  );
}

export default ProcessClaimPage;
