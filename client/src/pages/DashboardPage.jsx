import React, { useEffect, useState } from 'react'
import NavigationBar from '../components/NavigationBar'
// import './styles/DashboardPage.css' // Removed external CSS import
import DashboardHeader from '../components/DashboardHeader'
import ClaimedLostFoundChart from '../components/ClaimedLostFoundChart'
import WeeklyUsersCard from '../components/WeeklyUsersCard'
import FeedBackChart from '../components/FeedbackChart'
import AdminAddInfoPanel from '../components/AdminAddInfoPanel'
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import QuickStatsCards from '../components/QuickStatsCards';
import BlankHeader from '../components/BlankHeader'
import { useNavigate } from 'react-router-dom';



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

    const navigate = useNavigate();
    const handleNavigate = (path) => {
      navigate(path);
    };



  const styles = {
    dashboardBody: {
      backgroundColor: '#f4f4f4',
      minHeight: '100vh',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    mainContentArea: {
      maxWidth: '1200px',
      width: '95%',
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: '30px',
      marginTop: '30px',
      '@media (min-width: 768px)': {
        gridTemplateColumns: '1fr 300px', // Header, Panel
      },
    },
    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: '20px',
      width: '100%',
      marginTop: '20px', 
      '@media (min-width: 992px)': {
        gridTemplateColumns: '2fr 1fr', // Main chart column (left) and side cards (right)
      }
    },
    headerSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
    },
    banner: {
      backgroundColor: '#f9f9ff',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      position: 'relative',
      overflow: 'hidden',
    },
    bannerH1: {
      fontSize: '2rem',
      color: '#333',
      marginBottom: '5px',
    },
    bannerH5: {
      fontSize: '1rem',
      color: '#555',
      margin: '0',
    },
    bannerTime: {
      fontSize: '1.2rem',
      color: '#007bff',
      fontWeight: 'bold',
      marginTop: '5px',
    },
    bannerImg: {
      position: 'absolute',
      right: '0px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '100%',
      opacity: 0.3,
      '@media (max-width: 500px)': {
        width: '100px',
      }
    },
    panelContainer: {
        width: '100%',
    },
    addInfoPanel: {
      backgroundColor: '#fff3cd', 
      border: '1px solid #ffecb5',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '15px',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      opacity: 0,
      transform: 'translateY(20px)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    addInfoPanelShow: {
        opacity: 1,
        transform: 'translateY(0)',
    },
    // Styles for the Report Header
    reportHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '15px 0',
      borderBottom: '2px solid #eee',
      marginBottom: '15px',
    },
    reportHeaderH4: {
      margin: 0,
      fontSize: '1.2rem',
      color: '#475C6F',
      fontWeight: '600',
    },
    // Card Styles
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      height: 'fit-content',
    },
    quickStatsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px',
    },
    mainChartWrapper: {
        gridColumn: 'span 1', 
        '@media (min-width: 992px)': {
            gridColumn: 'span 2',
        }
    },
    sideChartsWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
    }
  };


  return (
    <>
      <NavigationBar />
        <BlankHeader />

    <div style={styles.dashboardBody}>
      
      <div style={styles.mainContentArea}>
        
        <div style={styles.headerSection}>
            <div style={styles.banner}>
                <h1 style={styles.bannerH1}>Welcome to SpotSync, Admin!</h1>
                <h5 style={styles.bannerH5}>{formattedDate}</h5>
                <strong style={styles.bannerTime}>{formattedTime}</strong>
                <img src="/landing-page-img.png" alt="spot-sync-logo" style={styles.bannerImg} />
            </div>
           
            
            <div style={styles.panelContainer}>
                <div style={{ padding: '0', margin: '0' }}>
                </div>
            
                {hasEmptyFields && (
                    <div 
                        style={{...styles.addInfoPanel, ...(isPanelVisible ? styles.addInfoPanelShow : {})}}
                    >
                        <AdminAddInfoPanel />
                    </div>
                )}
            </div>
        </div>
          
      </div>
      

      <div style={styles.mainContentArea}>
        
        <div style={{ gridColumn: '1 / -1' }}>
         <button 
                  style={{...styles.actionButton, ...styles.actionButtonPrimary, backgroundColor: 'green', height: '40px', width: '100%', marginTop: '10px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '16px'}} 
                  onClick={() => handleNavigate(`/admin/transactions/${currentUser?.uid}`)}
                >
                    Process Claim
                </button>
            <div style={styles.reportHeader}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#475C6F" className="bi bi-bar-chart" viewBox="0 0 16 16" >
                    <path d="M4 11H2v3h2zm5-4H7v7h2zm5-5v12h-2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H-4a1 1 0 0 1-1-1z"/>
                </svg>
                <h4 style={styles.reportHeaderH4}>Quick Stats</h4>
            </div>
            <div style={styles.quickStatsGrid}>
                <QuickStatsCards />
            </div>
        </div>


        <div style={styles.dashboardGrid}>
            
            <div style={{...styles.card, padding: '30px', minHeight: '400px', gridColumn: 'span 2', '@media (min-width: 992px)': {gridColumn: 'span 1'}}}>
                <h4 style={{marginBottom: '15px'}}>Item Monthly Status Overview</h4>
                <div style={{height: '350px'}}>
                    <ClaimedLostFoundChart />
                </div>
            </div>
            
            <div style={styles.sideChartsWrapper}>
                
                <div style={{...styles.card, height: '400px'}}>
                    <h4 style={{marginBottom: '15px'}}>Active Weekly Users</h4>
                    <WeeklyUsersCard />
                </div>
                
                <div style={{...styles.card, flex: 1}}>
                    <h4 style={{marginBottom: '15px'}}>User Feedback Distribution</h4>
                    <FeedBackChart />
                </div>
            </div>
        </div>
      </div>
      
    </div>
    
    </>
  )
}

export default DashboardPage