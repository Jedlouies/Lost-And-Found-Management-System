import React, { useEffect, useRef, useState } from 'react';
import './styles/LogIn.css'; 
import { Form, Button, Card, Alert, Modal, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import 'bootstrap-icons/font/bootstrap-icons.css';

function LogIn() {
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
      const userCredential = await login(studentId, password); 

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
      <div className='create-container'>
        <div className='card-image'></div>
        <div className='create-account-card'>
          <Card.Body className='create-body'>
            <h2>Log In</h2>
            {error && <Alert variant='danger'>{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group id='studentId'>
                <input
                  className='create-input'
                  type='text'
                  placeholder='Student ID'
                  ref={studentIdRef}
                  required
                />
              </Form.Group>

              <Form.Group id='password'>
                 <div className="password-input-wrapper">
                    <input
                        className='create-input'
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
                        className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`}
                        onClick={() => setShowPassword(prev => !prev)}
                    ></i>
                 </div>
                {capsLock && (
                  <p style={{ color: 'yellow', marginTop: '5px', fontSize: '0.8em', textAlign: 'left' }}> 
                    ⚠️ CAPS LOCK IS ON
                  </p>
                )}
              </Form.Group>


              <p className="login-link"> 
                Don't have an account?
                <strong onClick={handleSignIn}> Create an account</strong>
              </p>
              <p
                className="forgot-password-link"
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
                className="create-button" 
              >
                {loading ? (
                  <>
                    <img
                      src='/Spin_black.gif'
                      alt='Loading...'
                      style={{ width: '20px', height: '20px' }}
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

        <Modal
          show={showForgotModal}
          onHide={() => {
              setShowForgotModal(false);
              setResetMessage(''); // Clear message on close
              setForgotId(''); // Clear ID field on close
          }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Reset Password</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {/* Show input only if email hasn't been sent */}
            {!resetMessage.includes("sent") ? (
              <>
                <p style={{ color: 'black' }}>
                  Enter your Student ID to receive a password reset link via email.
                </p>
                <Form.Control
                  type='text'
                  placeholder='Student ID'
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)} // No need to trim here, trim in handler
                  className="mb-3" // Add margin bottom
                />
              </>
            ) : (
                // Message shown after email is sent
               <p style={{ textAlign: 'center', color: 'black' }}>
                 Check your email inbox (and spam folder) for the password reset link.
               </p>
            )}

            {/* Display status/error messages */}
            {resetMessage && (
              <p
                style={{
                  color: resetMessage.includes('sent') ? 'green' : 'red',
                  marginTop: '10px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                {resetMessage}
              </p>
            )}
          </Modal.Body>

          <Modal.Footer>
            {/* Show different buttons based on whether email was sent */}
            {!resetMessage.includes("sent") ? (
              <>
                <Button variant="secondary" onClick={() => {setShowForgotModal(false); setResetMessage(''); setForgotId('');}}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={resetting || !forgotId.trim()} // Disable if resetting or input is empty/whitespace
                  onClick={handlePasswordReset}
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
              >
                OK
              </Button>
            )}
          </Modal.Footer>
        </Modal>

      </div>

      <style>{`
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .password-input-wrapper .create-input {
          padding-right: 40px; /* Make space for the icon */
          flex-grow: 1; /* Allow input to fill space */
          width: auto; /* Override specific width if needed */
        }

        .password-toggle-icon {
          position: absolute;
          right: 10px; /* Adjust position */
          cursor: pointer;
          color: #ccc; /* Icon color */
          font-size: 1.2em; /* Icon size */
          z-index: 2;
        }

        /* Add styles for links if not in LogIn.css */
        .login-link, .forgot-password-link {
            text-align: center;
            margin-top: 10px;
            font-size: 0.9em;
            color: #BDDDFC; /* Or your preferred link color */
        }
        .login-link strong, .forgot-password-link {
            color: #ffffff; /* Or a contrasting color */
            cursor: pointer;
            text-decoration: underline;
        }
        .forgot-password-link {
             display: block; /* Make it take its own line */
             margin-bottom: 15px; /* Add space below */
             color: #a0c6ffff !important; /* Specific color if needed */
        }

        /* Style the login button */
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
            width: 100%;
            font-size: 1em;
            margin-top: 5px; /* Reduced space above */
            transition: background-color 0.2s;
         }
         .create-button:disabled {
            background-color: #a8c8e8;
            cursor: not-allowed;
         }
          .create-button:hover:not(:disabled) {
            background-color: #a8c8e8;
         }

      `}</style>
    </>
  );
}

export default LogIn;