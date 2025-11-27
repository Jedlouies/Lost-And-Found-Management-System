import React, { useRef, useState, useEffect } from "react"; 
import { Form, Card, Alert, Modal, Spinner, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore"; 
import createVerificationCode from "../components/createVerificationCode.jsx";
import VerificationModal from "../components/VerificationModal"; 
import 'bootstrap-icons/font/bootstrap-icons.css'; 

function SignInPage() {
  const navigate = useNavigate();
  const API = "https://server.spotsync.site";

  const { signup } = useAuth(); // Removed 'login' since we don't need it here anymore

  const handleLogin = () => { navigate("/log-in"); };

  const [guestLoading, setGuestLoading] = useState(false); 
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const studentIdRef = useRef();
  const contactNumberRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef(); 
  
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
  }, [passwordValue, confirmPasswordValue, error]);


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

  // --- FIX APPLIED HERE ---
  async function finalizeSignup() {
    try {
      // 1. Create the user account 
      // When this completes successfully, Firebase AUTOMATICALLY signs the user in.
      await signup(
        pendingUserData.email,
        pendingUserData.password,
        pendingUserData.firstName,
        pendingUserData.lastName,
        pendingUserData.contactNumber,
        pendingUserData.studentId
      );
      
      // 2. Get the current user directly from Auth
      // We use auth.currentUser because the signup process established the session.
      const user = auth.currentUser;

      if (!user) {
         // Fallback just in case something weird happened with the session
         throw new Error("Account created, but automatic sign-in failed.");
      }
      
      // 3. Set LocalStorage immediately (Optimistic)
      localStorage.setItem('role', 'user'); 
      localStorage.setItem('firstName', pendingUserData.firstName);
      localStorage.setItem('lastName', pendingUserData.lastName);
      localStorage.setItem('uid', user.uid); 
      localStorage.setItem('email', pendingUserData.email); 
      localStorage.setItem('profileURL', ''); 

      // 4. Navigate to Home
      navigate(`/home/${user.uid}`);

    } catch (err) {
      console.error("Signup error:", err);
      setError("Account created, but there was an issue loading the home page. Please log in manually.");
      navigate("/log-in");
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
        <div style={styles.guestOverlay}>
          <img src="/Spin.gif" alt="Loading..." style={styles.guestLoadingImage} />
          Creating Guest ID...
        </div>
      )}

      <div className="signin-body" style={styles.signInBody}>
        <div style={styles.formContainer}>
          {/* Card Image with Centered Logo */}
          <div style={styles.cardImage}></div>
          
          <div style={styles.accountCard}>
            <Card.Body style={styles.cardBody}>
              <h2 style={styles.heading}>Create Account</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <div style={styles.inputGroup}>
                  <input style={{...styles.inputField, flex: 1, marginRight: '10px'}} type="text" placeholder="First Name" ref={firstNameRef} required />
                  <input style={{...styles.inputField, flex: 1}} type="text" placeholder="Last Name" ref={lastNameRef} required />
                </div>
                <div style={styles.inputGroup}>
                  <input style={styles.inputField} type="text" placeholder="Student ID" ref={studentIdRef} required />
                </div>
                <div style={styles.inputGroup}>
                  <input style={styles.inputField} type="email" placeholder="Email" ref={emailRef} required />
                </div>
                <div style={styles.inputGroup}>
                  <input style={styles.inputField} type="text" placeholder="Contact Number" ref={contactNumberRef} required />
                </div>

                <div style={styles.inputGroup}>
                  <div style={styles.passwordInputWrapper}> 
                    <input
                      style={styles.inputField}
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
                      className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                      style={styles.passwordToggleIcon}
                      onClick={() => setShowPassword((prev) => !prev)} 
                    ></i>
                  </div>
                  {capsLock && (
                    <p style={styles.capsLockWarning}>
                      ⚠️ CAPS LOCK IS ON
                    </p>
                  )}
                </div>

                <div style={styles.inputGroup}>
                  <div style={styles.passwordInputWrapper}> 
                      <input
                          style={styles.inputField}
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
                          <i className="bi bi-check-circle-fill" style={styles.passwordMatchIcon}></i>
                      )}
                      <i
                          className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                          style={styles.passwordToggleIcon}
                          onClick={() => setShowConfirmPassword((prev) => !prev)} 
                      ></i>
                  </div>
                </div>

                <p style={styles.loginLink}>
                  Already have an account? <strong onClick={handleLogin} style={styles.loginLinkStrong}> Login </strong>
                </p>
                <button
                  disabled={loading}
                  type="submit"
                  style={{...styles.mainButton, ...(loading && styles.mainButtonDisabled)}} 
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = styles.mainButtonHover.backgroundColor; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = styles.mainButton.backgroundColor; }}
                >
                  {loading ? (
                    <>
                      <img src="/Spin_black.gif" alt="Loading..." style={styles.loadingIcon} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Create Account" 
                  )}
                </button>
                <button
                  style={{...styles.guestLink, opacity: guestLoading ? 0.6 : 1}}
                  onClick={!guestLoading ? handleGuest : undefined} 
                  disabled={guestLoading}
                  onMouseEnter={(e) => { if (!guestLoading) e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={(e) => { if (!guestLoading) e.currentTarget.style.opacity = 0.8; }}
                >
                  {guestLoading ? (
                    <Spinner animation="border" size="sm" style={{marginRight: '10px'}}/>
                  ) : null}
                  Continue as Guest
                </button>
              </Form>
            </Card.Body>
          </div>
        </div>
      </div>

       <style>{`
          /* Base styles for the page and layout (for non-JSX elements) */
          .signin-body {
              background: linear-gradient(135deg, #475C6F 0%, #1c2c36 100%);
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
          }
       `}</style>
    </>
  );
}

const styles = {
  signInBody: {
    background: 'linear-gradient(135deg, #475C6F 0%, #1c2c36 100%)',
    minHeight: '120vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  formContainer: {
    display: 'flex',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    maxWidth: '900px',
    width: '90%',
    minHeight: '500px',
  },

  cardImage: {
    flex: 1,
    background: 'url("/spotsync-logo.png") no-repeat center center / 80% auto #FFFFFF',
    backgroundSize: 'contain',
    display: 'block',
    minWidth: '300px',
  },

  accountCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    padding: '20px',
    minWidth: '350px',
  },

  cardBody: {
    padding: '25px',
  },

  heading: {
    color: '#BDDDFC',
    textAlign: 'center',
    marginBottom: '25px',
    fontSize: '2em',
    fontWeight: '700',
  },

  inputGroup: {
    marginBottom: '15px',
    display: 'flex',
    width: '100%',
  },

  inputField: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #475C6F',
    backgroundColor: '#374151',
    color: 'white',
    fontSize: '1em',
    boxSizing: 'border-box',
  },

  passwordInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },

  passwordToggleIcon: {
    position: 'absolute',
    right: '15px',
    cursor: 'pointer',
    color: '#BDDDFC',
    fontSize: '1.2em',
    zIndex: 2,
  },

  passwordMatchIcon: {
    position: 'absolute',
    right: '45px',
    color: 'green',
    fontSize: '1.2em',
    zIndex: 2,
  },

  capsLockWarning: {
    color: '#ffc107',
    marginTop: '5px',
    fontSize: '0.8em',
    textAlign: 'left',
    paddingLeft: '5px',
  },

  mainButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#BDDDFC',
    color: '#1f2937',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1em',
    fontWeight: '600',
    marginTop: '20px',
    transition: 'background-color 0.2s',
  },

  mainButtonHover: {
    backgroundColor: '#a8c8e8',
  },

  mainButtonDisabled: {
    backgroundColor: '#a8c8e8',
    cursor: 'not-allowed',
    opacity: 0.8,
  },

  loadingIcon: {
    width: '20px',
    height: '20px',
  },

  loginLink: {
    textAlign: 'center',
    marginTop: '15px',
    fontSize: '0.9em',
    color: '#BDDDFC',
  },

  loginLinkStrong: {
    color: 'white',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  guestLink: {
    marginTop: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
    color: 'white',
    fontSize: '0.9em',
    opacity: 0.8,
    transition: 'opacity 0.2s',
    padding: '12px 20px',
    border: '1px solid #374151',
    borderRadius: '8px',
    backgroundColor: '#475C6F',
    width: '100%',
  },

  guestOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    color: "white",
    fontSize: "1.2em",
    fontWeight: '600',
  },

  guestLoadingImage: {
    width: "50px",
    height: "50px",
    marginBottom: "20px",
    filter: 'invert(1)',
  },
};
export default SignInPage;