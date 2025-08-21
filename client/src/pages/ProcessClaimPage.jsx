import React, { useRef, useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import "./styles/ProcessClaimPage.css";
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";  
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"

function ProcessClaimPage() {
  const [capturedImage, setCapturedImage] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [userData, setUserData] = useState(null);

  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const { matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const matchData = location.state?.match || null;



  useEffect(() => {
    const updateDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);

       
        if (
          selectedDeviceId &&
          !videoDevices.find((d) => d.deviceId === selectedDeviceId)
        ) {
          setSelectedDeviceId(videoDevices[0]?.deviceId || null);
        }

        
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
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [selectedDeviceId]);

 
  const startCamera = async () => {
    try {
      if (!selectedDeviceId) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedDeviceId } },
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
    }
  };

  
  const handleScan = async (result, error) => {
    if (result) {
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

      
      try {
        const q = query(collection(db, "users"), where("studentId", "==", idNumber));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            setUserData({ id: doc.id, ...doc.data() });
          });
        } else {
          setUserData({ error: "No user found with this ID number." });
        }
      } catch (err) {
        console.error("Firestore fetch error:", err);
        setUserData({ error: "Database error occurred." });
      }
    }

    if (error) {
      if (
        error.name !== "NotFoundException" &&
        !error.message?.includes("No MultiFormat")
      ) {
        console.error("QR Scan Error:", error);
      }
    }
  };

const finalizeClaim = async () => {
  if (!matchData || !userData || !capturedImage) {
    alert("⚠️ Please capture a photo and scan a valid ID first.");
    return;
  }

  setLoading(true); 

  try {
    
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
          owner: matchData.lostItem.personalInfo || null,
          foundBy: matchData.foundItem?.personalInfo || null,
          claimantPhoto: capturedImage,
        });
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
          founder: matchData.foundItem.personalInfo || null,
          claimedBy: matchData.lostItem?.personalInfo || null,
          claimantPhoto: capturedImage,
        });
      }
    }

    
    navigate(`/admin/found-items/${userData.id}`);
  } catch (err) {
    console.error("Error finalizing claim:", err);
    alert("❌ Error finalizing claim.");
  } finally {
    setLoading(false); 
  }
};

  return (
    <>
      <NavigationBar />
      <div className="process-claim-page">
        <BlankHeader />
        <h1 style={{ position: "absolute", top: "6%", left: "1%", color: '#475C6F' }}>
          Process Claim
        </h1>

        
        <div style={{ position: "absolute", top: "7%", left: "25%" }}>
          <label style={{ color: "black", fontWeight: "bold", color: '#475C6F' }}>Select Camera:</label>
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
          <QrReader
            onResult={handleScan}
            constraints={{
              deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            }}
            style={{
              width: "320px",
              margin: "auto",
              border: "2px solid #475C6F",
              borderRadius: "8px",
            }}
          />
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
