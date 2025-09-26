import React from 'react'
import './styles/SignInPage.css'
import CreateAccount from '../components/CreateAccount'


function SignInPage() {
  return (
    <>
        <div className='signin-body'>
          <CreateAccount />
        </div>   
    </>
  )
}

export default SignInPage