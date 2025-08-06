import React, { useEffect, useState } from 'react'
import NavigationBar from '../components/NavigationBar'
import './styles/DashboardPage.css'
import DashboardHeader from '../components/DashboardHeader'
import ClaimedLostFoundChart from '../components/ClaimedLostFoundChart'
import WeeklyUsersCard from '../components/WeeklyUsersCard'
import FeedBackChart from '../components/FeedBackChart'
import AdminAddInfoPanel from '../components/AdminAddInfoPanel'
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';



function DashboardPage() {
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
      <NavigationBar />
    <div className='dashboard-body'>
       <div className='nav'>
        <DashboardHeader />
       </div>
       <div className='add-info'>
            {hasEmptyFields && (
      <div className={`add-info-panel ${isPanelVisible ? 'show' : ''}`}>
        <AdminAddInfoPanel />
      </div>
    )}

      </div>

        <div className='dashboard-container'>
            <h1>Dashboard</h1>
            <div className='report-view'>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#475C6F" class="bi bi-bar-chart" viewBox="0 0 16 16" style={{ marginTop: '80px' }}>
                <path d="M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/>
              </svg>
              <h4>Report Overview</h4>
            </div>
        </div>
        <div className='banner1'>
            <img src="/landing-page-img.png" alt="img" />
            <h1>Welcome to SpotSync!</h1>
            <h5>{formattedDate}</h5>
            <strong>{formattedTime}</strong>
        </div>
        <div className='graph1'>
            <ClaimedLostFoundChart />
        </div>
            <div className='total-active-users'>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16" style={{ marginTop: '83px' }}>
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
              <h4>Total Active Users</h4>
            </div>
        <div className='active-users'>
            <WeeklyUsersCard />
        </div>
        <div className='user-feedback'>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16" style={{ marginTop: '82px' }}>
                <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
              </svg>
              <h4>User Feedback</h4>
        </div>
        <div className='rating'>
            <FeedBackChart />
        </div>
        
    </div>

    </>
  )
}

export default DashboardPage