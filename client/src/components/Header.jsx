import React from 'react'
import { useNavigate } from 'react-router-dom'
import './styles/Header.css'

function Header() {
  const navigate = useNavigate();

  const signInClicked = () => {
    navigate('/sign-in');
  };

  return (
    <div className='header-container'>
        <img src="/spotsync-slogan.png" alt="img" height={'50px'}/>
        <button onClick={signInClicked}>Sign Up</button>
    </div>
  )
}

export default Header