import React, { useRef, useState } from 'react';
import { Form, Card, Alert, Modal, Spinner, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import 'bootstrap-icons/font/bootstrap-icons.css';

// Combined logic from LogIn component
function LogInPage() {
  const navigate = useNavigate();
  const handleSignIn = () => navigate('/sign-in'); 

  const studentIdRef = useRef();
  const passwordRef = useRef(); 
  const { login } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [capsLock, setCapsLock] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState(""); 

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); 
    setLoading(true);

    const studentId = studentIdRef.current.value;
    const password = passwordValue;

    if (!studentId || !password) {
        setError("Please enter both Student ID and Password.");
        setLoading(false);
        return;
    }


    try {
      const userCredential = await login(studentId, password); // Correctly uses Student ID

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            unsub(); 
            reject(new Error("Auth state confirmation timed out."));
        }, 5000); 
        const unsub = onAuthStateChanged(auth, (user) => {
          if (user && user.uid === userCredential.user.uid) {
            clearTimeout(timeout);
            unsub();
            resolve(user);
          } else if (!user && userCredential.user) {
             clearTimeout(timeout);
             unsub();
             reject(new Error("Auth state inconsistency detected after login."));
          }
        });
      });


      const user = userCredential.user; 
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        localStorage.setItem('role', userData.role || '');
        localStorage.setItem('firstName', userData.firstName || '');
        localStorage.setItem('lastName', userData.lastName || '');
        localStorage.setItem('uid', user.uid); 
        localStorage.setItem('email', userData.email || ''); 
        localStorage.setItem('profileURL', userData.profileURL || '');


        if (role === 'admin') {
          navigate(`/dashboard/${user.uid}`);
        } else if (role === 'user') { 
          navigate(`/home/${user.uid}`);
        }
         else {
             console.warn("User has unexpected role:", role);
             setError('Login successful, but role is undefined. Redirecting to default page.');
         }
      } else {
        console.error('Firestore document missing for user:', user.uid);
        setError('Login successful, but user data is missing. Please contact support.');
      }
    } catch (error) {
      console.error(' Login error:', error.code, error.message);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          setError('Incorrect Student ID or Password.');
      } else if (error.code === 'auth/too-many-requests') {
          setError('Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.');
      } else if (error.code === 'auth/network-request-failed') {
          setError('Network error. Please check your connection and try again.');
      }
       else if (error.message.includes("Auth state confirmation timed out") || error.message.includes("Auth state inconsistency")) {
           setError('Login confirmation failed. Please try again.');
       }
      else {
          setError('An unexpected error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleCapsLockCheck = (e) => {
     const capsLockOn = typeof e.getModifierState === 'function' && e.getModifierState('CapsLock');
     setCapsLock(capsLockOn);
  };

  const handlePasswordReset = async () => {
      setResetting(true);
      setResetMessage(''); 
      setError(''); 

      if (!forgotId) {
          setResetMessage('Please enter your Student ID.');
          setResetting(false);
          return;
      }

      try {
          // This logic correctly uses the studentIndex for password reset
          const studentDocRef = doc(db, 'studentIndex', forgotId.trim());
          const studentDocSnap = await getDoc(studentDocRef);

          if (!studentDocSnap.exists()) {
              setResetMessage('No account found with that Student ID.');
              setResetting(false);
              return;
          }

          const matchedEmail = studentDocSnap.data().email;
          if (!matchedEmail) {
               setResetMessage('Email address not found for this Student ID. Cannot reset password.');
               setResetting(false);
               return;
          }

          await sendPasswordResetEmail(auth, matchedEmail);
          setResetMessage(`Password reset link sent to ${matchedEmail}. Check your inbox (and spam folder).`);

      } catch (err) {
          console.error('Password reset error:', err);
          if (err.code === 'auth/invalid-email') {
              setResetMessage('The associated email address is invalid.');
          } else if (err.code === 'auth/network-request-failed') {
               setResetMessage('Network error. Please check your connection.');
          }
          else {
              setResetMessage('Failed to send reset email. Please try again later.');
          }
      } finally {
          setResetting(false);
      }
  };


  return (
    <> 
      <div className='login-body' style={styles.logInBody}>
        <div style={styles.formContainer}>
          {/* Card Image with Centered Logo */}
          <div style={styles.cardImage}></div> 
          
          <div style={styles.accountCard}>
            <Card.Body style={styles.cardBody}>
              <h2 style={styles.heading}>Log In</h2>
              {error && <Alert variant='danger'>{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <div style={styles.inputGroup}>
                  <input
                    style={styles.inputField}
                    type='text'
                    placeholder='Student ID'
                    ref={studentIdRef}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <div style={styles.passwordInputWrapper}>
                    <input
                        style={styles.inputField}
                        type={showPassword ? 'text' : 'password'} 
                        placeholder='Password'
                        ref={passwordRef} 
                        value={passwordValue} 
                        onChange={(e) => setPasswordValue(e.target.value)} 
                        onKeyUp={handleCapsLockCheck}
                        onKeyDown={handleCapsLockCheck}
                        required
                    />
                    <i
                        className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                        style={styles.passwordToggleIcon}
                        onClick={() => setShowPassword(prev => !prev)}
                    ></i>
                  </div>
                  {capsLock && (
                    <p style={styles.capsLockWarning}> 
                      ⚠️ CAPS LOCK IS ON
                    </p>
                  )}
                </div>


                <p style={styles.loginLink}> 
                  Don't have an account?
                  <strong onClick={handleSignIn} style={styles.loginLinkStrong}> Create an account</strong>
                </p>
                <p
                  style={styles.forgotPasswordLink}
                  onClick={() => {
                      setShowForgotModal(true);
                      setResetMessage(''); 
                      setError(''); 
                  }}
                >
                  Forgot Password?
                </p>

                <button
                  disabled={loading}
                  type='submit'
                  style={{...styles.mainButton, ...(loading && styles.mainButtonDisabled)}}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = styles.mainButtonHover.backgroundColor; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = styles.mainButton.backgroundColor; }}
                >
                  {loading ? (
                    <>
                      <img
                        src='/Spin_black.gif'
                        alt='Loading...'
                        style={styles.loadingIcon}
                      />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </Form>
            </Card.Body>
          </div>
        </div>

        <Modal
          show={showForgotModal}
          onHide={() => {
              setShowForgotModal(false);
              setResetMessage(''); // Clear message on close
              setForgotId(''); // Clear ID field on close
          }}
          centered
          className="custom-modal"
        >
          <Modal.Header closeButton style={styles.modalHeader}>
            <Modal.Title style={styles.modalTitle}>Reset Password</Modal.Title>
          </Modal.Header>

          <Modal.Body style={styles.modalBody}>
            {!resetMessage.includes("sent") ? (
              <>
                <p style={styles.modalText}>
                  Enter your Student ID to receive a password reset link via email.
                </p>
                <Form.Control
                  type='text'
                  placeholder='Student ID'
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  style={styles.modalInput}
                />
              </>
            ) : (
               <p style={styles.modalSentMessage}>
                 Check your email inbox (and spam folder) for the password reset link.
               </p>
            )}

            {resetMessage && (
              <p
                style={{
                  ...styles.modalStatusMessage,
                  color: resetMessage.includes('sent') ? 'green' : 'red',
                }}
              >
                {resetMessage}
              </p>
            )}
          </Modal.Body>

          <Modal.Footer style={styles.modalFooter}>
            {!resetMessage.includes("sent") ? (
              <>
                <Button variant="secondary" onClick={() => {setShowForgotModal(false); setResetMessage(''); setForgotId('');}} style={styles.modalCancelButton}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={resetting || !forgotId.trim()}
                  onClick={handlePasswordReset}
                  style={styles.modalPrimaryButton}
                >
                  {resetting ? <Spinner animation="border" size="sm" /> : 'Send Reset Link'}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setShowForgotModal(false);
                  setResetMessage('');
                  setForgotId('');
                }}
                style={styles.modalPrimaryButton}
              >
                OK
              </Button>
            )}
          </Modal.Footer>
        </Modal>

      </div>

      <style>{`
        /* Base styles for the page and layout (for non-JSX elements) */
        .login-body {
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
    // Main Layout & Card
    logInBody: {
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
        // MODIFIED: White background with centered logo, scaled to fit
        background: 'url("/spotsync-logo.png") no-repeat center center / 80% auto #FFFFFF',
        backgroundSize: 'contain',
        display: 'block',
        minWidth: '300px',
    },
    accountCard: {
        flex: 1,
        backgroundColor: '#1f2937', // Dark background for contrast
        padding: '20px',
        minWidth: '350px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    cardBody: {
        padding: '25px',
    },
    heading: {
        color: '#BDDDFC', // Light blue heading
        textAlign: 'center',
        marginBottom: '25px',
        fontSize: '2em',
        fontWeight: '700',
    },
    // Form Inputs
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
    // Password Toggle
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
    capsLockWarning: {
        color: '#ffc107',
        marginTop: '5px',
        fontSize: '0.8em',
        textAlign: 'left',
        paddingLeft: '5px',
    },
    // Links
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
    forgotPasswordLink: {
        display: 'block',
        textAlign: 'center',
        marginBottom: '20px',
        cursor: 'pointer',
        color: '#BDDDFC',
        fontSize: '0.9em',
        textDecoration: 'underline',
    },
    // Buttons
    mainButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        backgroundColor: '#BDDDFC', // Primary action color
        color: '#1f2937',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '100%',
        fontSize: '1em',
        fontWeight: '600',
        marginTop: '5px',
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
    // Modal Styles
    modalHeader: {
        borderBottom: '1px solid #ddd',
    },
    modalTitle: {
        color: '#1f2937',
        fontWeight: '700',
    },
    modalBody: {
        backgroundColor: '#f8f8f8',
    },
    modalText: {
        color: '#333',
        marginBottom: '15px',
    },
    modalInput: {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#ccc',
    },
    modalSentMessage: {
        textAlign: 'center',
        color: 'green',
        fontWeight: 'bold',
    },
    modalStatusMessage: {
        marginTop: '10px',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    modalFooter: {
        borderTop: '1px solid #ddd',
    },
    modalCancelButton: {
        backgroundColor: '#6c757d',
        borderColor: '#6c757d',
    },
    modalPrimaryButton: {
        backgroundColor: '#475C6F',
        borderColor: '#475C6F',
    }
};

export default LogInPage;