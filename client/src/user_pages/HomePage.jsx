import React, { useEffect, useState } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
import './styles/HomePage.css'
import HomeHeader from '../user_components/HomeHeader'
import ClaimedLostFoundChart from '../components/ClaimedLostFoundChart'
import WeeklyUsersCard from '../components/WeeklyUsersCard'
import FeedBackChart from '../components/FeedBackChart'
import UserAddInfoPanel from '../user_components/UserAddInfoPanel'
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';



function HomePage() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };

    fetchData();
  }, [currentUser]);

    const formattedDate = currentDateTime.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

   const hasEmptyFields = userData
    ? Object.values(userData).some((value) => value === "")
    : false;

  
    useEffect(() => {
  if (hasEmptyFields) {

    const timeout = setTimeout(() => {
      setIsPanelVisible(true);
    }, 100);
    return () => clearTimeout(timeout);
  } else {
    setIsPanelVisible(false);
  }
}, [hasEmptyFields]);


  return (
    <>
      <UserNavigationBar />
    <div className='home-body'>
       <div className='nav'>
        <HomeHeader />
       </div>
       <div className='add-info'>
            {hasEmptyFields && (
      <div className={`add-info-panel ${isPanelVisible ? 'show' : ''}`}>
        <UserAddInfoPanel />
      </div>
    )}

      </div>

        <div className='home-container'>
            <h1>Home</h1>   
        </div>
        <div className='banner'>
            <img src="/landing-page-img.png" alt="img" />
            <h1>Welcome to SpotSync!</h1>
            <h5>{formattedDate}</h5>
            <strong>{formattedTime}</strong>
        </div>
           
        
    </div>

    </>
  )
}

export default HomePage