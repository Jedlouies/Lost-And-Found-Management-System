import React, { useRef, useState, useEffect } from "react";
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
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import { Modal, Button } from "react-bootstrap"; 
import "bootstrap/dist/css/bootstrap.min.css";   

function GuestProcessClaimPage() {
  const API = "http://localhost:4000" || "https://server.spotsync.site";

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
  const [guestEmail, setGuestEmail] = useState("");
  const [guestLastName, setGuestLastName] = useState("");
  const [guestMiddleName, setGuestMiddleName] = useState("");
  const [guestSection, setGuestSection] = useState("");
  const [guestYearLevel, setGuestYearLevel] = useState("");
  const [guestSaved, setGuestSaved] = useState(false);

  // --- Resize/compress base64 before storing in Firestore ---
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

  // --- Stop camera safely ---
  const stopCamera = async () => {
    try {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      await new Promise((res) => setTimeout(res, 200));
    } catch (err) {
      console.warn("Error stopping camera:", err);
    }
  };

  // --- Start camera with device ---
  const startCamera = async (deviceId) => {
    try {
      await stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera start error:", err);
      setAlert({ message: "Unable to start camera.", type: "error" });
    }
  };

  // --- Enumerate available cameras ---
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

  // --- Start camera when selectedDeviceId changes ---
  useEffect(() => {
    if (selectedDeviceId) startCamera(selectedDeviceId);
    return () => stopCamera();
  }, [selectedDeviceId]);

  // --- Handle camera switch ---
  const handleCameraSwitch = async (newDeviceId) => {
    await stopCamera();
    localStorage.setItem("preferredCamera", newDeviceId);
    setSelectedDeviceId(newDeviceId);
  };

  // --- Capture photo ---
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
      setShowGuestModal(true);
    }
  };

  // --- Notify user (Realtime DB) ---
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

  // (Your existing finalizeClaim logic stays the same)

  return (
    <>
      <NavigationBar />
      <div className="process-claim-page">
        <BlankHeader />
        {alert && <FloatingAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

        <h1 style={{ position: "absolute", top: "6%", left: "1%", color: "#475C6F" }}>Guest Claim</h1>

        {/* Camera Selector */}
        <div style={{ position: "absolute", top: "7%", left: "25%" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>Select Camera:</label>
          <select
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

        {/* Camera Feed */}
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline muted />
        </div>

        <button className="capture-btn" onClick={capturePhoto}>Capture Photo</button>
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
      </div>
    </>
  );
}

export default GuestProcessClaimPage;
