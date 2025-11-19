import React, { useRef, useState, useEffect } from "react";
import QrScanner from "qr-scanner";
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
import { Modal, Button, Form, Spinner } from "react-bootstrap";

function ProcessClaimPage() {
 const API = "http://localhost:4000"; 
 //const API = "https://server.spotsync.site";
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

  // Stop scanner and video safely
const stopScanner = async () => {
  try {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Wait a tiny bit to ensure the browser releases the camera
    await new Promise((res) => setTimeout(res, 200));
  } catch (err) {
    console.warn("Error stopping scanner:", err);
  }
};

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

  // Setup scanner
useEffect(() => {
  if (!videoRef.current || !selectedDeviceId) return;

  const setupScanner = async () => {
    await stopScanner();

    const scanner = new QrScanner(videoRef.current, handleScan, {
      highlightScanRegion: true,
      highlightCodeOutline: true,
    });

    scannerRef.current = scanner;

    try {
      // Some browsers need to "open" camera explicitly
      await scanner.setCamera(selectedDeviceId, { facingMode: "environment" });
      await scanner.start();
      console.log("Scanner started for device:", selectedDeviceId);
    } catch (err) {
      console.error("Scanner init error:", err);
      setAlert({ message: "Unable to start camera.", type: "error" });
    }
  };

  setupScanner();
  return () => stopScanner();
}, [selectedDeviceId]);

const handleCameraSwitch = async (newDeviceId) => {
  const allDevices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = allDevices.filter(d => d.kind === "videoinput");
  setDevices(videoDevices);

  await stopScanner();
  localStorage.setItem("preferredCamera", newDeviceId);
  setSelectedDeviceId(newDeviceId);
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
    }
  };

  // Handle QR scan
  const handleScan = async (result) => {
    if (!result?.data || qrResult) return;

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
  };

  // Notify user via Realtime DB
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

  // Finalize Claim (kept your existing logic)
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

    // --- Notifications ---
      // Notify guest not needed, but notify founder/admin
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

      try {
                  const emailResUser = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(currentUser?.email),
                      subject: "Transaction Processed",
                      html: `<b>Transaction ID: ${matchData.transactionId}</b> — The system has successfully processed a matching request for a lost item report. 
                        The results generated are: 
                        Image Match ${matchData.scores?.imageScore}%, 
                        Description Match ${matchData.scores?.descriptionScore}%, 
                        and an Overall Match Rate of ${matchData.scores?.overallScore}%. 
                        Please review the transaction details for further verification.`
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


                try {
                  const emailResUser = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(matchData.lostItem?.personalInfo?.email),
                      subject: "Transaction Processed",
                      html:` Hello <b>"${matchData.lostItem?.personalInfo?.firstName}"!</b>  Your lost item <b>"${matchData.lostItem?.itemName}"</b> has been successfully claimed.  
      Please take a moment to rate your experience and help us improve the matching process.
      `
                    })
                  });

                  const emailDataUser = await emailResUser.json();
                  console.log("Email response for user:", emailDataUser);

                  if (!emailResUser.ok) {
                    console.error("Failed to send email to user:", emailDataUser);
                  } else {
                    console.log("Email successfully sent to user:", matchData.lostItem?.personalInfo?.email);
                  }

                } catch (emailErrorUser) {
                  console.error("Error sending email to user:", emailErrorUser);
                }

                try {
                  const emailResUser = await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: String(matchData.foundItem?.personalInfo?.email),
                      subject: "Transaction Processed",
                      html:` Hello <b>"${matchData.foundItem?.personalInfo?.firstName}"!</b>  Your lost item <b>"${matchData.foundItem?.itemName}"</b> has been successfully claimed.  
      Please take a moment to rate your experience and help us improve the matching process.
      `
                    })
                  });

                  const emailDataUser = await emailResUser.json();
                  console.log("Email response for user:", emailDataUser);

                  if (!emailResUser.ok) {
                    console.error("Failed to send email to user:", emailDataUser);
                  } else {
                    console.log("Email successfully sent to user:", matchData.foundItem?.personalInfo?.email);
                  }

                } catch (emailErrorUser) {
                  console.error("Error sending email to user:", emailErrorUser);
                }
      setAlert({ message: "Claim finalized and emails sent!", type: "success" });
      navigate(`/admin/item-claimed-list/${currentUser?.uid || userData.id}`);
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
        {alert && <FloatingAlert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        <h1 style={{ position: "absolute", top: "6%", left: "1%", color: "#475C6F" }}>Process Claim</h1>

        {/* Camera Selector */}
        <div style={{ position: "absolute", top: "7%", left: "25%" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>Select Camera:</label>
          <select value={selectedDeviceId || ""} onChange={(e) => handleCameraSwitch(e.target.value)}>
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

        <button className="capture-btn" onClick={capturePhoto}>Capture Photo</button>
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {capturedImage && <div className="captured-section">
          <img src={capturedImage} alt="Captured" style={{ width: "200px", border: "2px solid #475C6F", borderRadius: "8px" }} />
        </div>}

        {qrResult && <div className="qr-result" style={{ backgroundColor: "white", width: "270px", borderRadius: "20px", padding: "10px" }}>
          <p>Scanned ID Info:</p>
          <p style={{fontWeight: 'lighter'}}><b>Fullname:</b> {qrResult.fullname}</p>
          <p style={{fontWeight: 'lighter'}}><b>ID Number:</b> {qrResult.idNumber}</p>
          <p style={{fontWeight: 'lighter'}}><b>Course:</b> {qrResult.course}</p>
        </div>}

        {userData && <div className="qr-results" style={{ marginTop: "180px", backgroundColor: "white", width: "500px", borderRadius: "20px", padding: "10px" }}>
          <p><b>Matched User Account:</b></p>
                  <div style={{display: 'flex'}}>
                    {userData.isGuest ? (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "blue",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Guest
                      </div>
                    ) : userData.profileURL ? (
                      <img
                        src={userData.profileURL}
                        alt="profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "navy",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {`${userData.firstName?.[0] || ""}${
                          userData.lastName?.[0] || ""
                        }`.toUpperCase()}
                      </div>
                    )}

                    <p style={{marginLeft: '10px'}}>
                      <strong style={{ fontSize: "14px" }}>
                        {userData.isGuest === true
                          ? userData.firstName || "Guest"
                          : `${userData.firstName || ""} ${userData.lastName || ""}`.trim()}
                      </strong>
                      <br />
                      {userData.isGuest !== true && (
                        <span>
                          {userData.personalInfo?.course?.name
                            ? `${userData.personalInfo.course.name} Student`
                            : "Unknown"}
                        </span>
                      )}
                    </p>
                  </div>
          <p style={{fontWeight: 'lighter'}}><b>Email:</b> {userData.email}</p>
          <p style={{fontWeight: 'lighter'}}><b>Course:</b> {userData.course?.abbr} | <b>Section:</b> {userData.section}</p>
          <p style={{fontWeight: 'lighter'}}><b>Year Level:</b> {userData.yearLevel}</p>
          <p style={{fontWeight: 'lighter'}}><b>Contact Number:</b> {userData.contactNumber}</p>
          <p style={{fontWeight: 'lighter'}}><b>Address:</b> {userData.address}</p>
          <p style={{fontWeight: 'lighter'}}><b>Gender:</b> {userData.gender}</p>
          <p style={{fontWeight: 'lighter'}}><b>Birthdate:</b> {userData.birthdate}</p>
        </div>}

        <button onClick={finalizeClaim} disabled={loading} style={{
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
        }}>
          {loading ? <Spinner animation="border" size="sm" /> : "Complete"}
        </button>
      </div>
    </>
  );
}

export default ProcessClaimPage;
