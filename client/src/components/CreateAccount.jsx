import React, { useRef, useState } from "react";
import "./styles/CreateAccount.css";
import { Form, Card, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import createVerificationCode from "../components/createVerificationCode.jsx";
import VerificationModal from "../components/VerificationModal";

function CreateAccount() {
  const navigate = useNavigate();

  const API = "http://localhost:4000" || "https://server.spotsync.site";

  const handleLogin = () => {
    navigate("/log-in");
  };

  const handleGuest = async () => {
    try {
      await signInAnonymously(auth);
      console.log("Guest signed in:", auth.currentUser?.uid);
      navigate(`/guest/email/${auth.currentUser?.uid}`);
    } catch (error) {
      console.error("Guest sign-in failed:", error.message);
    }
  };

  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const studentIdRef = useRef();
  const contactNumberRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);

  async function sendVerificationEmail(userData, code) {
    await fetch(`${API}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userData.email,
        subject: "Verify your Spotsync Account",
        html: `
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px;">${code}</h1>
          <p>This code will expire shortly.</p>
        `,
      }),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match");
    }

    try {
      setError("");
      setLoading(true);

      // Collect user data but DO NOT create the account yet
      const userData = {
        email: emailRef.current.value,
        password: passwordRef.current.value,
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        contactNumber: contactNumberRef.current.value,
        studentId: studentIdRef.current.value,
      };

      // Generate and store verification code
      const code = await createVerificationCode({ uid: userData.email, email: userData.email });

      // Send email
      await sendVerificationEmail(userData, code);

      // Save form data for later signup
      setPendingUserData(userData);

      // Show modal
      setShowVerifyModal(true);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  // Function called AFTER verification succeeds
  async function finalizeSignup() {
    try {
      const userCredential = await signup(
        pendingUserData.email,
        pendingUserData.password,
        pendingUserData.firstName,
        pendingUserData.lastName,
        pendingUserData.contactNumber,
        pendingUserData.studentId
      );
      console.log("✅ Account created:", userCredential.user.uid);
      navigate("/log-in");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    }
  }

  return (
    <>
      {showVerifyModal && (
        <VerificationModal
          show={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          user={pendingUserData}
          sendVerificationEmail={sendVerificationEmail}
          onVerified={finalizeSignup} // call signup only after code is valid
        />
      )}

      <div className="create-container">
        <div className="card-image"></div>
        <div className="create-account-card">
          <Card.Body className="create-body">
            <h2>Create Account</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="input-fullname" id="names">
                <input className="create-input" type="text" placeholder="First Name" ref={firstNameRef} required />
                <input className="create-input" type="text" placeholder="Last Name" ref={lastNameRef} required />
              </Form.Group>
              <Form.Group id="studentId">
                <input className="create-input" type="text" placeholder="Student ID" ref={studentIdRef} required />
              </Form.Group>
              <Form.Group id="email">
                <input className="create-input" type="email" placeholder="Email" ref={emailRef} required />
              </Form.Group>
              <Form.Group id="contactNumber">
                <input className="create-input" type="text" placeholder="Contact Number" ref={contactNumberRef} required />
              </Form.Group>
              <Form.Group id="password">
                <input className="create-input" type="password" placeholder="Password" ref={passwordRef} required />
              </Form.Group>
              <Form.Group id="confirm-password">
                <input className="create-input" type="password" placeholder="Confirm Password" ref={passwordConfirmRef} required />
              </Form.Group>
              <p>
                Already have an account?<strong onClick={handleLogin}> Login </strong>
              </p>
              <button
                disabled={loading}
                type="submit"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  backgroundColor: "#BDDDFC",
                  color: "black",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create"
                )}
              </button>
              <p
                className="guest"
                style={{ marginTop: "20px", fontWeight: "bold", cursor: "pointer", textAlign: "center" }}
                onClick={handleGuest}
              >
                Continue as Guest
              </p>
            </Form>
          </Card.Body>
        </div>
      </div>
    </>
  );
}

export default CreateAccount;
