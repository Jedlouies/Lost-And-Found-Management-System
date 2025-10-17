import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Header.css';

const isDesktopMode = () => {
  const userAgent = navigator.userAgent;

  const looksLikeDesktop = !/Mobi|Android|iPhone/i.test(userAgent);
  const isSmallScreen = window.screen.width < 768; // Common breakpoint for tablets

  return looksLikeDesktop && isSmallScreen;
};

function Header() {
  const navigate = useNavigate();
  const [isDesktopView, setIsDesktopView] = useState(false);

  useEffect(() => {
    const desktopModeOn = isDesktopMode();
    setIsDesktopView(desktopModeOn);
    console.log("Is 'Desktop site' toggled on?", desktopModeOn); // For testing
  }, []);

  const signInClicked = () => {
    navigate('/sign-in');
  };

  return (
    <div className='header-container'>
      <img src="/spotsync-slogan.png" alt="img" height={'50px'} />
      <button
        onClick={signInClicked}
        style={isDesktopView ? { opacity: 0, pointerEvents: 'none' } : {}}
      >
        Sign Up
      </button>
    </div>
  );
}

export default Header;