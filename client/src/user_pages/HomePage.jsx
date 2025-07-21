import React, { useEffect, useState, useRef } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
import './styles/HomePage.css'
import HomeHeader from '../user_components/HomeHeader'
import UserAddInfoPanel from '../user_components/UserAddInfoPanel'
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const lostContainerRef = useRef(null);
  const foundContainerRef = useRef(null);

  // Fetch Lost and Found Items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Fetch Lost Items
        const lostSnapshot = await getDocs(collection(db, 'lostItems'));
        const lostData = lostSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLostItems(lostData);

        // Fetch Found Items
        const foundSnapshot = await getDocs(collection(db, 'foundItems'));
        const foundData = foundSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoundItems(foundData);

      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  // Live Date & Time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add horizontal scroll on wheel
  useEffect(() => {
    const addHorizontalScroll = (container) => {
      if (!container) return;
      const handleWheel = (e) => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      };
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    };

    const lostCleanup = addHorizontalScroll(lostContainerRef.current);
    const foundCleanup = addHorizontalScroll(foundContainerRef.current);

    return () => {
      if (lostCleanup) lostCleanup();
      if (foundCleanup) foundCleanup();
    };
  }, []);

  // Fetch current user data
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

  // Date & Time Formatting
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

  // Check if user data has empty fields
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

  // Sort Lost and Found Items
  const recentLostItems = [...lostItems]
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost))
    .slice(0, 20);

  const recentFoundItems = [...foundItems]
    .sort((a, b) => new Date(b.dateFound) - new Date(a.dateFound))
    .slice(0, 20);

  return (
    <>
      <UserNavigationBar />
      <div className='home-body'>
        <div className='nav'>
          <HomeHeader />
        </div>

        {/* Add Info Panel */}
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

        {/* Banner */}
        <div className='banner'>
          <img src="/landing-page-img.png" alt="img" />
          <h1>Welcome to SpotSync!</h1>
          <h5>{formattedDate}</h5>
          <strong>{formattedTime}</strong>
        </div>

        <h1 style={{ fontSize: '30px', alignItems: 'center', top: '15%', fontWeight: '500' }}>
          Lost Items
        </h1>
        <h4 style={{ position: 'absolute', top: '15%', left: '90%', color: '#475C6F', cursor: 'pointer' }}>More</h4>
        <div className="home-lost-container" ref={lostContainerRef}>
          {recentLostItems.length > 0 ? (
            recentLostItems.map((item, index) => (
              <div className="lost-item-card" key={index}>
                <div className="lost-card-image">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt='img'
                      style={{ width: '300px', height: '200px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h4>{item.itemName}</h4>
                  <div className='own'>
                    <img
                      src={item.personalInfo?.profileURL}
                      alt=""
                      style={{ width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover' }}
                    />
                    <p>
                      <strong>{item.personalInfo?.firstName} {item.personalInfo?.lastName}</strong><br />
                      {item.personalInfo?.course} Student
                    </p>
                    <div className='card-more-details'>
                      <p style={{ position: 'absolute', top: '100%', marginLeft: '50px', width: '200px', fontSize: '12px' }}>
                        {item.howItemLost && item.howItemLost.length > 120
                          ? item.howItemLost.slice(0, 120) + "..."
                          : item.howItemLost}
                      </p>
                      <p className='more-details-button' style={{ fontStyle: 'normal', fontWeight: 'bold', position: 'absolute', top: '200%', marginLeft: '170px', fontSize: '12px', cursor: 'pointer', width: '200px' }}>
                        More Details
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16" style={{ marginLeft: '10px' }}>
                          <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                        </svg>

                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No recent lost items found.</p>
          )}
        </div>
        <h1 style={{ fontSize: '30px', alignItems: 'center', top: '57%', fontWeight: '500' }}>
          Found Items
        </h1>
        <h4 style={{ position: 'absolute', top: '57%', left: '90%', color: '#475C6F', cursor: 'pointer' }}>More</h4>
        <div className="home-found-container" ref={foundContainerRef}>
          {recentFoundItems.length > 0 ? (
            recentFoundItems.map((item, index) => (
              <div className="lost-item-card" key={index}>
                <div className="lost-card-image">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt='img'
                      style={{ width: '300px', height: '200px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h4>{item.itemName}</h4>
                  <div className='own'>
                    <img
                      src={item.personalInfo?.profileURL}
                      alt=""
                      style={{ width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover' }}
                    />
                    <p>
                      <strong>{item.personalInfo?.firstName} {item.personalInfo?.lastName}</strong><br />
                      {item.personalInfo?.course} Student
                    </p>
                    <div className='card-more-details'>
                      <p style={{ position: 'absolute', top: '100%', marginLeft: '50px', width: '200px', fontSize: '12px' }}>
                        {item.howItemFound && item.howItemFound.length > 120
                          ? item.howItemFound.slice(0, 120) + "..."
                          : item.howItemFound || "No description provided"}
                      </p>
                      <p className='more-details-button' style={{ fontStyle: 'normal', fontWeight: 'bold', position: 'absolute', top: '200%', marginLeft: '170px', fontSize: '12px', cursor: 'pointer', width: '200px', justifyContent: 'center' }}>
                        More Details
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16" style={{ marginLeft: '10px' }}>
                          <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                        </svg>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No recent found items found.</p>
          )}
        </div>
      </div>
    </>
  )
}

export default HomePage;
