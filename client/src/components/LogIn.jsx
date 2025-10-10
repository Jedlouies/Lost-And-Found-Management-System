import React, { useEffect, useRef, useState } from 'react'
import './styles/LogIn.css'
import { Form, Button, Card, Alert, Modal, Spinner } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase.jsx'
import { doc, getDoc } from 'firebase/firestore'
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth"

function LogIn() {
  const navigate = useNavigate()
  const handleSignIn = () => navigate('/sign-in')

  const studentIdRef = useRef()
  const passwordRef = useRef()
  const { login } = useAuth()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotId, setForgotId] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [capsLock, setCapsLock] = useState(false) // CAPS LOCK indicator

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)

      const userCredential = await login(
        studentIdRef.current.value,
        passwordRef.current.value
      )

      await new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsub()
            resolve(user)
          }
        })
      })

      const user = userCredential.user
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        const role = userData.role

        if (role === 'admin') {
          navigate(`/dashboard/${user.uid}`)
        } else {
          navigate(`/home/${user.uid}`)
        }
      } else {
        setError('User data not found.')
      }
    } catch (error) {
      console.error('🔥 Login error:', error.code || error.message)
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with that Student ID.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Detect CAPS LOCK key while typing
  const handleCapsLockCheck = (e) => {
    setCapsLock(e.getModifierState && e.getModifierState('CapsLock'))
  }

  return (
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
              <input
                className='create-input'
                type='password'
                placeholder='Password'
                ref={passwordRef}
                onKeyUp={handleCapsLockCheck}
                onKeyDown={handleCapsLockCheck}
                required
              />
              {capsLock && (
                <p style={{ color: '#ffffffff', marginTop: '5px' }}>
                  ⚠️ CAPS LOCK
                </p>
              )}
            </Form.Group>

            <p>
              Don't have an account?
              <strong onClick={handleSignIn}> Create an account</strong>
            </p>
            <p
              style={{
                cursor: 'pointer',
                color: '#a0c6ffff',
                marginBottom: '10px'
              }}
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </p>

            <button
              disabled={loading}
              type='submit'
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                backgroundColor: '#BDDDFC',
                color: 'black',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
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
        onHide={() => setShowForgotModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {!resetMessage.includes("sent") ? (
            <>
              <p style={{ color: 'black' }}>
                Enter your Student ID to receive a password reset link.
              </p>
              <Form.Control
                type='text'
                placeholder='Student ID'
                value={forgotId}
                onChange={(e) => setForgotId(e.target.value.trim())}
              />
            </>
          ) : (
            <p style={{ textAlign: 'center', color: 'black' }}>
              Check your email and follow the link to reset your password.
              <br />
              After you’ve changed it, come back here to log in again.
            </p>
          )}

          {resetMessage && (
            <p
              style={{
                color: resetMessage.includes('sent') ? 'green' : 'red',
                marginTop: '10px',
              }}
            >
              {resetMessage}
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          {!resetMessage.includes("sent") ? (
            <>
              <Button variant="secondary" onClick={() => setShowForgotModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                disabled={resetting || !forgotId}
                onClick={async () => {
                  setResetting(true)
                  setResetMessage('')
                  try {
                    const studentDocRef = doc(db, 'studentIndex', forgotId)
                    const studentDocSnap = await getDoc(studentDocRef)
                    if (!studentDocSnap.exists()) {
                      setResetMessage('No account found with that Student ID.')
                      setResetting(false)
                      return
                    }
                    const matchedEmail = studentDocSnap.data().email
                    await sendPasswordResetEmail(auth, matchedEmail)
                    setResetMessage(`Password reset link sent to ${matchedEmail}`)
                  } catch (err) {
                    console.error('Password reset error:', err)
                    if (err.code === 'permission-denied') {
                      setResetMessage('Permission denied. Please allow read access to studentIndex.')
                    } else {
                      setResetMessage('Failed to send reset email. Please try again.')
                    }
                  }
                  setResetting(false)
                }}
              >
                {resetting ? <Spinner animation="border" size="sm" /> : 'Send Reset Link'}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                setShowForgotModal(false)
                setResetMessage('')
                setForgotId('')
              }}
            >
              Back to Login
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default LogIn
