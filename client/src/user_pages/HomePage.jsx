import React, { useEffect, useState } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
import './styles/HomePage.css'
import HomeHeader from '../user_components/HomeHeader'
import ClaimedLostFoundChart from '../components/ClaimedLostFoundChart'
import WeeklyUsersCard from '../components/WeeklyUsersCard'
import FeedBackChart from '../components/FeedBackChart'
import UserAddInfoPanel from '../user_components/UserAddInfoPanel'
import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';



function HomePage() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [items, setItems] = useState([]);


  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'lostItems'));
        const lostItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(lostItems);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      }
    };
    fetchLostItems();
  }, []);

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

const recentItems = [...items]
.sort((a,b) => new Date(b.dateLost) - new Date(a.dateLost))
.slice(0, 20);


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
        <h1 style={{fontSize: '30px', alignItems: 'center', top: '15%', fontWeight: '500'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-bag-x" viewBox="0 0 16 16" style={{marginRight: '10px'}}>
            <path fill-rule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          Lost Items
        </h1>
        <div className="home-lost-container">
          {recentItems.length > 0 ? (
            recentItems.map((items, index) => (
              <div className="lost-item-card" key={index}>
                <div className="lost-card-image">
                  {items.images && items.images.length > 0 ? (
                    <img src={items.images[0]} alt={items.itemName} 
                    style={{
                      width: '300px',
                      height: '200px',
                      objectFit: 'cover'
                    }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h4>{items.itemName}</h4>
                  <div className='own'>
                    <img src={items.personalInfo?.profileURL} alt="" style={{width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover'}}/>
                    <p> <strong>{items.personalInfo?.firstName} {items.personalInfo?.lastName}</strong> <br />
                      {items.personalInfo?.course} Student
                    </p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-quote" viewBox="0 0 16 16" style={{position: 'absolute', top: '75%'}}>
                      <path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388q0-.527.062-1.054.093-.558.31-.992t.559-.683q.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 9 7.558V11a1 1 0 0 0 1 1zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612q0-.527.062-1.054.094-.558.31-.992.217-.434.559-.683.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 3 7.558V11a1 1 0 0 0 1 1z"/>
                    </svg>
                    <p>
                      {items.personalInfo?.howItLost}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No recent lost items found.</p>
          )}
        </div>
        <h1 style={{fontSize: '30px', alignItems: 'center', top: '52%', fontWeight: '500'}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-bag-x" viewBox="0 0 16 16" style={{marginRight: '10px'}}>
            <path fill-rule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          Found Items
        </h1>
         <div className='home-found-container'>

        </div>
        
    </div>

    </>
  )
}

export default HomePage