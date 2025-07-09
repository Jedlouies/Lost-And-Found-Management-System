
import React, { useRef, useState } from 'react'
import './styles/CreateAccount.css'
import { Form, Button, Card, Alert, FormGroup, FormControl } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

function CreateAccount() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/log-in');
  };

  const firstNameRef = useRef()
  const lastNameRef = useRef()
  const studentIdRef = useRef()
  const contactNumberRef = useRef()
  const emailRef = useRef()
  const passwordRef = useRef()
  const passwordConfirmRef = useRef()
  const { signup } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match')
    }

    try {
      setError('')
      setLoading(true)
      await signup(
        emailRef.current.value, 
        passwordRef.current.value, 
        firstNameRef.current.value, 
        lastNameRef.current.value,
        contactNumberRef.current.value,
        studentIdRef.current.value
        )

      navigate("/log-in")
    } catch {
      setError('Failed to create account')
    }

    setLoading(false)
  }

  return (
    <div className='create-container'>
      <div className='card-image'></div>
      <div className='create-account-card'>
        <Card.Body className='create-body'>
          <h2>Create Account</h2>
          {error && <Alert variant='danger'>{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className='input-fullname' id='names'>
              <input className='create-input' type='text' placeholder='First Name' ref={firstNameRef} required/>
              <input className='create-input' type='text' placeholder='Last Name' ref={lastNameRef} required/>
            </Form.Group>
            <Form.Group id='studentId'>
              <input className='create-input' type='number' placeholder='Student ID' ref={studentIdRef} required />
            </Form.Group>
            <Form.Group id='email'>
              <input className='create-input' type='email' placeholder='Email' ref={emailRef} required />
            </Form.Group>
            <Form.Group id='contactNumber'>
              <input className='create-input' type='number' placeholder='Contact Number' ref={contactNumberRef} required />
            </Form.Group>
            <Form.Group id='password'>
              <input className='create-input' type='password' placeholder='Password' ref={passwordRef} required />
            </Form.Group>
            <Form.Group id='confirm-password'>
              <input className='create-input' type='password' placeholder='Confirm Password' ref={passwordConfirmRef} required />
            </Form.Group>
            <p>Already have an account?<strong onClick={handleLogin}> Login </strong></p>
            <button disabled={loading} type='submit'>Submit</button>
          </Form>
        </Card.Body>
      </div>
    </div>
  )
}

export default CreateAccount
