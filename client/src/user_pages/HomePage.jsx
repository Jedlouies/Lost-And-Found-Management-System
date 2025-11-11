import React, { useEffect, useState, useRef } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
import './styles/HomePage.css'
import HomeHeader from '../user_components/HomeHeader'
import UserAddInfoPanel from '../user_components/UserAddInfoPanel'
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'
import MessageAdminButton from '../user_components/MessageAdminButton'
import FloatingAlert from '../components/FloatingAlert';
import { getAuth } from 'firebase/auth';


function HomePage() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const lostContainerRef = useRef(null);
  const foundContainerRef = useRef(null);
  const [alert, setAlert] = useState({ type: "", message: "", visible: false });
  const auth = getAuth();
  const user = auth.currentUser;
  const [loadingLost, setLoadingLost] = useState(true);
  const [loadingFound, setLoadingFound] = useState(true);



  const handleNavigate = (path) => {
    
    navigate(path);
    
  };

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
    const fetchItems = async () => {
      try {
        setLoadingLost(true);
        setLoadingFound(true);

        const lostSnapshot = await getDocs(collection(db, 'lostItems'));
        const lostData = lostSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLostItems(lostData);
        setLoadingLost(false);

        const foundSnapshot = await getDocs(collection(db, 'foundItems'));
        const foundData = foundSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoundItems(foundData);
        setLoadingFound(false); 

      } catch (error) {
        console.error("Error fetching items:", error);
        setLoadingLost(false);
        setLoadingFound(false);
      }
    };

    fetchItems();
  }, []);

 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  
useEffect(() => {
  const scrollSpeed = 3; 

  const addHorizontalScroll = (container) => {
    if (!container) return;

    const handleWheel = (e) => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const atStart = scrollLeft === 0;
      const atEnd = scrollLeft + clientWidth >= scrollWidth;

      const scrollAmount = (e.deltaY !== 0 ? e.deltaY : e.deltaX) * scrollSpeed; 

      if (scrollWidth > clientWidth) {
        
        if (scrollAmount < 0 && atStart) return;
        if (scrollAmount > 0 && atEnd) return;
        
        e.preventDefault(); 
        
        container.scrollLeft += scrollAmount;
      }
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


  const recentLostItems = [...lostItems]
    .filter(item => item.claimStatus !== "claimed")
    .filter(item => item.archivedStatus !== true)
    .filter(item => item.status !== "pending" && "canceled") 
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost))
    .slice(0, 20);

  const recentFoundItems = [...foundItems]
    .filter(item => item.claimStatus !== "claimed")
    .filter(item => item.status !== "pending" && "canceled")
    .filter(item => item.archivedStatus !== true) 
    .sort((a, b) => new Date(b.dateFound) - new Date(a.dateFound))
    .slice(0, 20);

  return (
    <>
    
      <MessageAdminButton setAlert={setAlert} />

      {alert.visible && (
        <FloatingAlert  
          message={alert.message}
          type={alert.type}
          visible={alert.visible}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}

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

  
        <div className='banner2'>
          <img src="/landing-page-img.png" alt="img" />
          <h1>Welcome to SpotSync!</h1>
          <h5>{formattedDate}</h5>
          <strong>{formattedTime}</strong>
        </div>

        <h1 style={{ fontSize: '30px', alignItems: 'center', top: '15%', fontWeight: '500' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-bag-x" viewBox="0 0 16 16" style={{ marginRight: '10px', color: '#475C6F' }}>
            <path fill-rule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
        Lost Items
        </h1>
        <h4 style={{ position: 'absolute', top: '15%', left: '90%', color: '#475C6F', cursor: 'pointer' }} onClick={() => handleNavigate(`/users/lost-items/${user?.uid}`)}> See More</h4>
        <div className="home-lost-container" style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', overflowX: 'auto' }} ref={lostContainerRef}>
          {loadingLost ? (
            <img src="/Spin_black.gif" alt="loading..." style={{ width: "70px", height: "70px" }} />
          ) : recentLostItems.length > 0 ? (
            recentLostItems.map((item, index) => (
              <div
                className="lost-item-card"
                key={index}
                onClick={() =>
                  navigate(`/users/lost-items/more-details/${item.id}`, {
                    state: { type: "lost", item }
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <div className="lost-card-image">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt="img"
                      style={{ width: "300px", height: "200px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h4 style={{fontSize: '15px'}}>{item.itemName}</h4>
                  <div className="own">
                    {item.isGuest ? (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "blue",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Guest
                      </div>
                    ) : item.personalInfo?.profileURL ? (
                      <img
                        src={item.personalInfo.profileURL}
                        alt="profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "navy",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {`${item.personalInfo?.firstName?.[0] || ""}${
                          item.personalInfo?.lastName?.[0] || ""
                        }`.toUpperCase()}
                      </div>
                    )}

                    <p>
                      <strong style={{ fontSize: "14px" }}>
                        {item.isGuest === true
                          ? item.personalInfo?.firstName || "Guest"
                          : `${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
                      </strong>
                      <br />
                      {item.isGuest !== true && (
                        <span>
                          {item.personalInfo?.course?.abbr
                            ? `${item.personalInfo.course.abbr} Student`
                            : "Unknown"}
                        </span>
                      )}
                    </p>
                  </div>
                  <p style={{ marginTop: "10px", fontSize: "12px", color: 'black', height: '60px', width: '250px', textAlign: 'left', marginLeft: '10px' }}>
                      {item.howItemLost && item.howItemLost.length > 120
                        ? item.howItemLost.slice(0, 120) + "..."
                        : item.howItemLost}
                    </p> 
                </div>
              </div>
            ))
            ) : (
              <p style={{color: 'black'}}>No recent found items found.</p>
            )}
        </div>
        <h1 style={{ fontSize: '30px', alignItems: 'center', top: '57%', fontWeight: '500' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-bag-check" viewBox="0 0 16 16" style={{ marginRight: '10px', color: '#475C6F' }}>
            <path fill-rule="evenodd" d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          Found Items
        </h1>
        <h4 style={{ position: 'absolute', top: '57%', left: '90%', color: '#475C6F', cursor: 'pointer' }} onClick={() => handleNavigate(`/users/found-items/${user?.uid}`)}> See More</h4>
        <div className="home-found-container" ref={foundContainerRef}>
          {loadingFound ? (
            <img src="/Spin_black.gif" alt="loading..." style={{ width: "70px", height: "70px" }} />
          ) : recentFoundItems.length > 0 ? (
            recentFoundItems.map((item, index) => (
              <div
                className="lost-item-card"
                key={index}
                onClick={() =>
                  navigate(`/users/found-items/more-details/${item.id}`, {
                    state: { type: "found", item }
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <div className="lost-card-image">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt="img"
                      style={{ width: "300px", height: "200px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h4 style={{fontSize: '15px'}}>{item.itemName}</h4>
                  <div className="own">
                    {item.isGuest ? (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "blue",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Guest
                      </div>
                    ) : item.personalInfo?.profileURL ? (
                      <img
                        src={item.personalInfo.profileURL}
                        alt="profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "navy",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {`${item.personalInfo?.firstName?.[0] || ""}${
                          item.personalInfo?.lastName?.[0] || ""
                        }`.toUpperCase()}
                      </div>
                    )}
                    <p>
                      <strong style={{ fontSize: "14px" }}>
                        {item.isGuest === true
                          ? item.personalInfo?.firstName || "Guest"
                          : `${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
                      </strong>
                      <br />
                      {item.isGuest !== true && (
                        <span>
                          {item.personalInfo?.course?.abbr
                            ? `${item.personalInfo.course.abbr} Student`
                            : "Unknown"}
                        </span>
                      )}
                    </p>
                  </div>

                  <p style={{ marginTop: "10px", fontSize: "12px", color: 'black', height: '60px', width: '250px', textAlign: 'left', marginLeft: '10px' }}>
                      {item.howItemFound && item.howItemFound.length > 120
                        ? item.howItemFound.slice(0, 120) + "..."
                        : item.howItemFound}
                    </p>
                </div>

              </div>
            ))
          ) : (
            <p style={{color: 'black'}}>No recent found items found.</p>
          )}
        </div>
      </div>
    </>
  )
}

export default HomePage;
