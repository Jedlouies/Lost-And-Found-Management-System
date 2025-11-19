import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { setDoc, doc, collection, getDocs, query, where } from "firebase/firestore";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext"; 
import Header from "../components/Header";
import VerificationModal from "../components/VerificationModal";
import createVerificationCode from "../components/createVerificationCode.jsx";

export default function GuestEmailRequestPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  //const API = "http://localhost:4000";
 const API = "https://server.spotsync.site";
 
 
  async function sendVerificationEmail(user, code) {
    await fetch(`${API}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: "Verify your Spotsync Email",
        html: `
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 2 minutes.</p>
        `,
      }),
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (!currentUser) {
        setError("No user session found.");
        return;
      }

      setLoading(true);

      // Prevent duplicate emails
      if (email) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          let isDuplicate = false;

          querySnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData.role !== "guest") {
              isDuplicate = true;
            }
          });

          if (isDuplicate) {
            setError("This email is already registered in the system.");
            setLoading(false);
            return;
          }
        }
      }

      const fakeUser = { email }; // guest doesn't have uid yet
      const code = await createVerificationCode(fakeUser);
      await sendVerificationEmail(fakeUser, code);

      setPendingEmail(email);
      setShowVerifyModal(true);

    } catch (err) {
      console.error("Error creating guest:", err);
      setError("Failed to save guest info.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerified() {
    // Save guest after successful verification
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        email: pendingEmail || null,
        role: "guest",
        createdAt: new Date(),
        emailVerified: true,
      },
      { merge: true }
    );

    navigate(`/guest/${currentUser.uid}`);
  }

  return (
    <>
      <Header />

      {showVerifyModal && (
        <VerificationModal
          show={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          user={{ email: pendingEmail }}
          sendVerificationEmail={sendVerificationEmail}
          onVerified={handleVerified}
        />
      )}

      <div className="background2" style={{ width: '105%' }}>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <Card style={{ width: "25rem" }}>
            <Card.Body>
              <h3 className="text-center mb-3">Email Address</h3>
              <p style={{ color: 'black' }}>
                Provide your email to receive updates about your lost item.  
                If you skip, you won’t get any notifications.
              </p>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSave}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </Form.Group>

                <div className="d-flex justify-content-center">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Save & Continue"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
}
