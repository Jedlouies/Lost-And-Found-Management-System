import React, { useRef, useState, useEffect } from "react"; 
import "./styles/CreateAccount.css";
import { Form, Card, Alert } from "react-bootstrap";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import createVerificationCode from "../components/createVerificationCode.jsx";
import VerificationModal from "../components/VerificationModal";
import 'bootstrap-icons/font/bootstrap-icons.css'; 

function CreateAccount() {
  const navigate = useNavigate();
  const API = "https://server.spotsync.site";

  const handleLogin = () => {
    navigate("/log-in");
  };

  const [guestLoading, setGuestLoading] = useState(false); 
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
  const [capsLock, setCapsLock] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  useEffect(() => {
    setPasswordsMatch(passwordValue === confirmPasswordValue && passwordValue !== "");
    if (passwordValue !== confirmPasswordValue && confirmPasswordValue !== "") {
       setError("Passwords do not match"); 
    } else if (error === "Passwords do not match") {
       setError(""); 
    }
  }, [passwordValue, confirmPasswordValue]);


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
            <p>This code will expire in 2 minutes.</p>
          `,
        }),
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (passwordValue !== confirmPasswordValue) {
      return setError("Passwords do not match");
    }
    if (passwordValue.length < 6) {
        return setError("Password should be at least 6 characters");
    }

    try {
      setError("");
      setLoading(true);

      const userData = {
        email: emailRef.current.value,
        password: passwordValue, 
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        contactNumber: contactNumberRef.current.value,
        studentId: studentIdRef.current.value,
      };

      const code = await createVerificationCode({ uid: userData.email, email: userData.email });
      await sendVerificationEmail(userData, code);
      setPendingUserData(userData);
      setShowVerifyModal(true);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

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
          console.log(" Account created:", userCredential.user.uid);
          navigate("/log-in");
        } catch (err) {
          console.error("Signup error:", err);
          setError(err.message);
        }
  }

  const handleCapsLockCheck = (e) => {
      const capsLockOn = typeof e.getModifierState === 'function' && e.getModifierState('CapsLock');
      setCapsLock(capsLockOn);
  };

  const handleGuest = async () => {
      try {
        setGuestLoading(true);
        await signInAnonymously(auth);
        console.log("Guest signed in:", auth.currentUser?.uid);
        setTimeout(() => {
          navigate(`/guest/email/${auth.currentUser?.uid}`);
        }, 500);
      } catch (error) {
        console.error("Guest sign-in failed:", error.message);
        setGuestLoading(false); 
      }
  };

  return (
    <>
      {showVerifyModal && (
        <VerificationModal
          show={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          user={pendingUserData} 
          sendVerificationEmail={sendVerificationEmail} 
          onVerified={finalizeSignup} 
        />
      )}

      {guestLoading && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center", zIndex: 9999,
            color: "white", fontSize: "24px",
          }}
        >
          <img src="/Spin.gif" alt="Loading..." style={{ width: "50px", height: "50px", marginBottom: "20px" }} />
          Creating Guest ID...
        </div>
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
                <div className="password-input-wrapper"> 
                  <input
                    className="create-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    ref={passwordRef} 
                    value={passwordValue} 
                    onChange={(e) => setPasswordValue(e.target.value)} 
                    required
                    onKeyUp={handleCapsLockCheck}
                    onKeyDown={handleCapsLockCheck}
                  />
                  <i
                    className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`}
                    onClick={() => setShowPassword((prev) => !prev)} 
                  ></i>
                </div>
                 {capsLock && (
                   <p style={{ color: 'yellow', marginTop: '5px', fontSize: '0.8em', textAlign:'left' }}>
                     ⚠️ CAPS LOCK IS ON
                   </p>
                 )}
              </Form.Group>

              <Form.Group id="confirm-password">
                 <div className="password-input-wrapper"> 
                    <input
                        className="create-input"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        ref={passwordConfirmRef} 
                        value={confirmPasswordValue} 
                        onChange={(e) => setConfirmPasswordValue(e.target.value)}
                        required
                        onKeyUp={handleCapsLockCheck}
                        onKeyDown={handleCapsLockCheck}
                    />
                    {passwordsMatch && (
                        <i className="bi bi-check-circle-fill password-match-icon"></i>
                    )}
                    <i
                        className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`}
                        onClick={() => setShowConfirmPassword((prev) => !prev)} // Toggle state
                    ></i>
                 </div>
              </Form.Group>

              <p className="login-link">
                Already have an account? <strong onClick={handleLogin}> Login </strong>
              </p>
              <button
                disabled={loading}
                type="submit"
                className="create-button" 
              >
                {loading ? (
                  <>
                    <img src="/Spin_black.gif" alt="Loading..." style={{ width: "20px", height: "20px" }} />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Account" 
                )}
              </button>
              <p
                className="guest-link" 
                onClick={!guestLoading ? handleGuest : undefined} 
                style={{ opacity: guestLoading ? 0.6 : 1 }} 
              >
                Continue as Guest
              </p>
            </Form>
          </Card.Body>
        </div>
      </div>

       <style>{`
          .password-input-wrapper {
            position: relative;
            display: flex; /* Aligns input and icons */
            align-items: center; /* Vertically center items */
            width: 100%; /* Take full width of the Form.Group */
          }

          .password-input-wrapper .create-input {
             /* Make input take most space, leave room for icons */
             padding-right: 60px; /* Adjust padding to prevent text overlap with icons */
             flex-grow: 1;
             width: auto; /* Override potential fixed width */
          }

          .password-toggle-icon {
            position: absolute;
            right: 10px; /* Position inside the input area, adjust as needed */
            cursor: pointer;
            color: #ccc; /* Adjust icon color */
            font-size: 1.2em; /* Adjust icon size */
            z-index: 2; /* Ensure icon is clickable */
          }

          .password-match-icon {
             position: absolute;
             right: 40px; /* Position left of the eye icon */
             color: green; /* Checkmark color */
             font-size: 1.2em;
             z-index: 2;
          }

          /* Style the main create button using a class */
          .create-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background-color: #BDDDFC;
            color: black;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            width: 100%; /* Make button full width */
            font-size: 1em;
            margin-top: 15px; /* Add some space above */
            transition: background-color 0.2s;
          }
          .create-button:disabled {
            background-color: #a8c8e8; /* Lighter color when disabled */
            cursor: not-allowed;
          }
           .create-button:hover:not(:disabled) {
            background-color: #a8c8e8; /* Slightly darker on hover */
          }

          /* Style login and guest links */
          .login-link {
            text-align: center;
            margin-top: 15px;
            font-size: 0.9em;
            color: #BDDDFC; /* Match button color scheme */
          }
           .login-link strong {
              color: #ffffff; /* White or contrasting color */
              cursor: pointer;
              text-decoration: underline;
           }

           .guest-link {
              margin-top: 20px;
              font-weight: bold;
              cursor: pointer;
              text-align: center;
              color: #ffffff;
              font-size: 0.9em;
              opacity: 0.8;
              transition: opacity 0.2s;
           }
           .guest-link:hover {
              opacity: 1;
           }

       `}</style>
       {/* --- END CSS --- */}
    </>
  );
}

export default CreateAccount;