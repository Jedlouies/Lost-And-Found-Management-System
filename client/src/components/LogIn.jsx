import React, { useRef, useState } from 'react'
import './styles/LogIn.css'
import { Form, Button, Card, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.jsx'

function LogIn() {
  const navigate = useNavigate()
  const handleSignIn = () => navigate('/sign-in')

  const studentIdRef = useRef()
  const passwordRef = useRef()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)

      const userCredential = await login(
        studentIdRef.current.value,
        passwordRef.current.value
      )

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
      setError('Invalid Credentials')
    }
    setLoading(false)
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
              <input className='create-input' type='integer' placeholder='Student ID' ref={studentIdRef} required />
            </Form.Group>
            <Form.Group id='password'>
              <input className='create-input' type='password' placeholder='Password' ref={passwordRef} required />
            </Form.Group>
            <p>Don't have an account?<strong onClick={handleSignIn}> Create an account</strong></p>
            <button disabled={loading} type='submit'>{loading ? 'Submitting...' : 'Submit'}</button>
          </Form>
        </Card.Body>
      </div>
    </div>
  )
}

export default LogIn
