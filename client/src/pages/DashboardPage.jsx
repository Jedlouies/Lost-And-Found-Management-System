import React, { useEffect, useState } from 'react'
import NavigationBar from '../components/NavigationBar'
import './styles/DashboardPage.css'
import DashboardHeader from '../components/DashboardHeader'
import ClaimedLostFoundChart from '../components/ClaimedLostFoundChart'
import WeeklyUsersCard from '../components/WeeklyUsersCard'
import FeedBackChart from '../components/FeedbackChart'
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
  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) localStorage.setItem(key, value);
        });
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  loadUserData();
}, [currentUser]);


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
      <div className='banner1' style={{width: '75%'}}>
            <img src="/landing-page-img.png" alt="img" />
            <h1>Welcome to SpotSync!</h1>
            <h5>{formattedDate}</h5>
            <strong>{formattedTime}</strong>
        </div>
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

         <div className='dashboard-container' >
            <h1>Dashboard</h1>
            <div className='report-view'>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#475C6F" class="bi bi-bar-chart" viewBox="0 0 16 16" >
                <path d="M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"/>
              </svg>
              <h4>Report Overview</h4>
            </div>
         </div>
        
        <div className='graph1'>
            <ClaimedLostFoundChart />
        </div>
            
        <div className='active-users'>
            <WeeklyUsersCard />
        </div>
        
        <div className='rating'>
            <FeedBackChart />
        </div>
        
    </div>
    
    </>
  )
}

export default DashboardPage