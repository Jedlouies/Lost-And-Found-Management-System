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
 const API = "http://localhost:4000";
 //const API = "https://server.spotsync.site";
 
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
const [guestSaved, setGuestSaved] = useState(false);

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


  // 🔹 Camera handling
  useEffect(() => {
    const updateDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoDevices);

        if (!selectedDeviceId && videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
          startCamera(videoDevices[0].deviceId);
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

    setShowGuestModal(true);
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
    if (!matchData || !capturedImage || !guestName || !guestContact) {
      setAlert({
        message: "Please provide guest details and capture a photo.",
        type: "warning",
      });
      return;
    }

    setLoading(true);

    try {
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
            owner: {
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
              coverURL: '',
              profileURL: '',
              section: guestSection,
              yearLevel: guestYearLevel,
              uid: "guest",
            },
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
            claimedBy: {
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
              coverURL: '',
              profileURL: '',
              section: guestSection,
              yearLevel: guestYearLevel,
              uid: "guest",
            },
            claimantPhoto: capturedImage,
          });
        }
      }

      // Update match
      if (matchDocId) {
        const matchDocRef = doc(db, "matches", matchDocId);
        await setDoc(matchDocRef, { claimStatus: "claimed" }, { merge: true });
      }

      // Save claimed item
      await addDoc(collection(db, "claimedItems"), {
        itemId: matchData.foundItem.itemId,
        images: matchData.foundItem.images,
        itemName: matchData.foundItem.itemName || "",
        dateClaimed: new Date().toISOString(),
        founder: matchData.foundItem.personalInfo || null,
        owner: {
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
          coverURL: '',
          profileURL: '',
          section: guestSection,
          yearLevel: guestYearLevel,
          uid: "guest",
        },
        ownerActualFace: capturedImage,
      });

      // Save claim history
      await addDoc(collection(db, "claimHistory"), {
        itemId: matchData.foundItem.itemId,
        itemName: matchData.foundItem.itemName || "",
        dateClaimed: new Date().toISOString(),
        founder: matchData.foundItem.personalInfo || null,
        owner: {
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
          coverURL: '',
          profileURL: '',
          section: '',
          yearLevel: guestYearLevel,
          uid: "guest",
        },
        claimantPhoto: capturedImage,
        userAccount: currentUser?.uid || "guest",
        status: "completed",
      });

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


      stopCamera();
      
      navigate(`/admin/item-claimed-list/${currentUser?.uid || "guest"}`);
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
        <h1 style={{ position: "absolute", top: "6%", left: "1%", color: "#475C6F" }}>
          Guest Claim
        </h1>

        {/* Camera selection */}
        <div style={{ position: "absolute", top: "7%", left: "25%" }}>
          <label style={{ color: "black", fontWeight: "bold" }}>Select Camera:</label>
          <select
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            style={{
              marginLeft: "10px",
              padding: "5px",
              backgroundColor: "#475C6F",
              borderRadius: "5px",
              color: "white",
            }}
          >
            {devices.map((device, idx) => (
              <option key={idx} value={device.deviceId}>
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Camera */}
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline />
        </div>

        <button className="capture-btn" onClick={capturePhoto}>
          Capture Photo
        </button>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Show captured image */}
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

        {/* ✅ Show guest info only if saved */}
    {guestSaved && (
      <div style={{ marginTop: "15px", textAlign: "left" , position: 'absolute', left: '60%', top: '30%', color: 'black', backgroundColor: 'white', padding: '10px', borderRadius: '20px', width: '400px'}}>
        <h4>Guest Details</h4>
        <p style={{color: 'black'}}><strong>Name:</strong> {guestName} {guestMiddleName} {guestLastName}</p>
        <p style={{color: 'black'}}><strong>Email:</strong> {guestEmail}</p>
        <p style={{color: 'black'}}><strong>Contact:</strong> {guestContact}</p>
        <p style={{color: 'black'}}><strong>Address:</strong> {guestAddress}</p>
        <p style={{color: 'black'}}><strong>Birthdate:</strong> {guestBirthdate}</p>
        <p style={{color: 'black'}}><strong>Course:</strong> {guestCourseAbbr} - {guestCourseName}</p>
        <p style={{color: 'black'}}><strong>Year Level:</strong> {guestYearLevel}</p>
      </div>
    )}

        {/* Guest Details */}
        <Modal show={showGuestModal} onHide={() => setShowGuestModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Guest Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input
              type="text"
              placeholder="First Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={guestLastName}
              onChange={(e) => setGuestLastName(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Middle Name"
              value={guestMiddleName}
              onChange={(e) => setGuestMiddleName(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={guestContact}
              onChange={(e) => setGuestContact(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Address"
              value={guestAddress}
              onChange={(e) => setGuestAddress(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="date"
              placeholder="Birthdate"
              value={guestBirthdate}
              onChange={(e) => setGuestBirthdate(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Course Abbreviation (e.g. BSCE)"
              value={guestCourseAbbr}
              onChange={(e) => setGuestCourseAbbr(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Course Name"
              value={guestCourseName}
              onChange={(e) => setGuestCourseName(e.target.value)}
              className="form-control mb-3"
            />
            <input
              type="text"
              placeholder="Year Level"
              value={guestYearLevel}
              onChange={(e) => setGuestYearLevel(e.target.value)}
              className="form-control mb-3"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGuestModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={() => {
              setShowGuestModal(false);
               setGuestSaved(true);

            }}>
              Save Info
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Finalize button */}
        <button
          onClick={finalizeClaim}
          disabled={loading}
          style={{
            marginTop: "41%",
            height: "50px",
            width: "250px",
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
            marginLeft: '600px'
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
            "Complete Claim"
          )}
        </button>
      </div>
    </>
  );
}

export default GuestProcessClaimPage;
