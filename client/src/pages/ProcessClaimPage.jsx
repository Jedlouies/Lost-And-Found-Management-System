import React, { useRef, useState, useEffect } from "react";
import QrScanner from "qr-scanner"; // ✅ new library
import "./styles/ProcessClaimPage.css";
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

function ProcessClaimPage() {
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

  const [scanFeedback, setScanFeedback] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [alert, setAlert] = useState(null);

  const notificationsRef = collection(db, "notifications");
  const transactionId = matchDocId || `TXN-${Date.now()}`;
  const dbRealtime = getDatabase();

  // 🔹 Setup available cameras
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
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [selectedDeviceId]);

  // 🔹 Start QR Scanner whenever device changes
  useEffect(() => {
    if (!videoRef.current || !selectedDeviceId) return;

    // stop any previous scanner
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (isScanning) handleScan(result);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScanner.start().catch((err) => console.error("Scanner start error:", err));
    scannerRef.current = qrScanner;

    return () => {
      qrScanner.stop();
    };
  }, [selectedDeviceId, isScanning]);

  // 🔹 Capture a still image
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL("image/png"));

      setIsScanning(true); // enable scanning mode
    }
  };

  // 🔹 Handle QR results
  const handleScan = async (result) => {
    if (!result?.data) return;

    setAlert({ message: "QR Code Scanned!", type: "success" });
    setScanFeedback(null);

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
    setIsScanning(false);

    // 🔎 Lookup user in Firestore
    try {
      const q = query(
        collection(db, "users"),
        where("studentId", "==", idNumber)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        querySnapshot.forEach((docSnap) => {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        });
      } else {
        setUserData(null);
        setAlert({
          message: "No user found with this ID Number.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Firestore fetch error:", err);
      setAlert({ message: "Database Error Occurred.", type: "error" });
    }
  };

  // 🔹 Notify User via Realtime DB
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

  // 🔹 Finalize Claim (unchanged, trimmed for brevity)
  const finalizeClaim = async () => {
    if (!matchData || !userData || !capturedImage) {
      setAlert({
        message: "Please first capture a photo and scan ID first",
        type: "warning",
      });
      return;
    }
    // 🔹 Your finalize logic here (I kept it same as your original)
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

        <h1
          style={{
            position: "absolute",
            top: "6%",
            left: "1%",
            color: "#475C6F",
          }}
        >
          Process Claim
        </h1>

        {/* Camera Selector */}
        <div style={{ position: "absolute", top: "7%", left: "25%" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>
            Select Camera:
          </label>
          <select
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{
              marginLeft: "10px",
              padding: "5px",
              backgroundColor: "#475C6F",
              borderRadius: "5px",
            }}
          >
            {devices.map((device, idx) => (
              <option key={idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Live Video */}
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline muted />
        </div>

        <button className="capture-btn" onClick={capturePhoto}>
          Capture Photo
        </button>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Captured Image */}
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

        {/* QR Parsed Result */}
        {qrResult && (
          <div
            className="qr-result"
            style={{
              backgroundColor: "white",
              width: "270px",
              borderRadius: "20px",
              padding: "10px",
            }}
          >
            <p>Scanned ID Info:</p>
            <p style={{ fontWeight: "400" }}>Fullname: {qrResult.fullname}</p>
            <p style={{ fontWeight: "400" }}>ID Number: {qrResult.idNumber}</p>
            <p style={{ fontWeight: "400" }}>Course: {qrResult.course}</p>
          </div>
        )}

        {/* User Data */}
        {userData && (
          <div
            className="qr-results"
            style={{
              marginTop: "170px",
              backgroundColor: "white",
              width: "500px",
              borderRadius: "20px",
              padding: "10px",
            }}
          >
            <p>
              <b>Matched User Account:</b>
            </p>
            {userData.error ? (
              <p style={{ color: "red" }}>{userData.error}</p>
            ) : (
              <>
                <img
                  src={userData.profileURL}
                  alt="Profile"
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "100%",
                    objectFit: "cover",
                  }}
                />
                <p
                  style={{
                    position: "absolute",
                    top: "15%",
                    left: "15%",
                    fontSize: "20px",
                    width: "600px",
                    marginLeft: "20px",
                    fontWeight: "600",
                    color: "#475C6F",
                  }}
                >
                  {userData.firstName} {userData.middleName} {userData.lastName}
                </p>
                <p>Email: {userData.email}</p>
                <p>
                  Course: {userData.course?.abbr} | Section: {userData.section}
                </p>
                <p>Year Level: {userData.yearLevel}</p>
                <p>Contact: {userData.contactNumber}</p>
                <p>Address: {userData.address}</p>
                <p>Gender: {userData.gender}</p>
                <p>Birthdate: {userData.birthdate}</p>
              </>
            )}
          </div>
        )}

        {/* Finalize Button */}
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
