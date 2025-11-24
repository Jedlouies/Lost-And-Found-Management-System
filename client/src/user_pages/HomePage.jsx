import React, { useEffect, useState, useRef } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
// import './styles/HomePage.css' // Using inline styles
import HomeHeader from '../user_components/HomeHeader'
import UserAddInfoPanel from '../user_components/UserAddInfoPanel'
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'
import MessageAdminButton from '../user_components/MessageAdminButton'
import FloatingAlert from '../components/FloatingAlert';
import { getAuth } from 'firebase/auth';
import { Spinner } from 'react-bootstrap'; // FIX: ADD SPINNER IMPORT
import BlankHeader from '../components/BlankHeader';
import UserBlankHeader from '../user_components/UserBlankHeader';

const styles = {
    // --- LAYOUT ---
    homeBody: {
        backgroundColor: '#f4f7f9', 
        minHeight: '100vh',
        padding: '20px 0',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    pageContainer: {
        maxWidth: '1200px',
        width: '95%',
        margin: '0 auto',
        padding: '20px 0',
    },
    
    banner: {
        backgroundColor: '#ffffff', 
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '30px',
    },
    bannerTitle: {
        fontSize: '2rem',
        color: '#143447',
        fontWeight: '600',
        zIndex: 10,
    },
    bannerTime: {
        fontSize: '1rem',
        color: '#0650a0ff',
        fontWeight: 'bold',
        marginTop: '5px',
        zIndex: 10,
    },
    bannerDate: {
        fontSize: '0.9rem',
        color: '#000000ff',
        margin: '0',
        zIndex: 10,
    },
    bannerImage: {
        position: 'absolute',
        right: '0px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.4,
        width: '100%',
        height: 'auto',
    },

    infoPanelWrapper: {
        marginBottom: '20px',
    },
    
    itemSectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        padding: '0 10px',
    },
    itemTitle: {
        fontSize: '1.5rem',
        color: '#143447',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    seeMoreLink: {
        fontSize: '1rem',
        color: '#007bff',
        fontWeight: '500',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    carouselWrapper: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        overflowX: 'scroll', 
        paddingBottom: '20px', 
        gap: '20px',
        scrollbarWidth: 'thin', 
        scrollbarColor: '#007bff #ccc',
        
    },
    
    itemCard: {
        width: '300px', 
        minWidth: '300px',
        flex: '0 0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        height: '350px', 
        display: 'flex',
        flexDirection: 'column',
    },
    itemCardHover: {
        transform: 'translateY(-3px)',
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
    },
    cardImage: {
        width: '100%',
        height: '150px', 
        objectFit: 'cover',
        backgroundColor: '#e0e0e0',
    },
    cardDetails: {
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        height: '200px', 
    },
    cardItemName: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#333',
        marginBottom: '5px', 
        height: '20px', 
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    ownerInfoWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderTop: '1px solid #eee',
        paddingTop: '10px',
        marginTop: 'auto',
    },
    avatarDefault: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#007bff", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
    },
    avatarGuest: {
        backgroundColor: '#6c757d',
        fontSize: '10px',
    },
    avatarImage: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        objectFit: "cover",
    },
    ownerText: {
        fontSize: '0.85rem',
        lineHeight: '1.3',
    },
    ownerName: {
        fontWeight: '600',
        color: '#143447',
    },
    descriptionText: {
        marginTop: "5px", 
        fontSize: "0.85rem", 
        color: '#6c757d', 
        height: '40px', 
        lineHeight: '1.2',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    actionWrapper: { 
        display: 'flex',
        gap: '20px',
        marginBottom: '30px',
        padding: '0 10px',
        justifyContent: 'flex-start',
    },
    actionButton: (isLost) => ({ 
        padding: '15px 30px',
        backgroundColor: isLost ? '#dc3545' : '#28a745', 
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '600',
        fontSize: '1.1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        transition: 'background-color 0.2s',
        minWidth: '250px',
        justifyContent: 'center',
    }),
    actionButtonHover: (isLost) => ({
        backgroundColor: isLost ? '#c82333' : '#218838',
    }),
};

const ItemCard = ({ item, type, navigate, user }) => {
    const isLost = type === "lost";
    const person = item.personalInfo;

    const initials = `${person?.firstName?.[0] || ''}${person?.lastName?.[0] || ''}`.toUpperCase();

    const renderAvatar = () => {
        if (item.isGuest) {
            return <div style={{ ...styles.avatarDefault, ...styles.avatarGuest }}>Guest</div>;
        }
        if (person?.profileURL) {
            return <img src={person.profileURL} alt="profile" style={styles.avatarImage} />;
        }
        return <div style={styles.avatarDefault}>{initials}</div>;
    };

    return (
        <div
            style={styles.itemCard}
            onClick={() =>
                navigate(`/users/${type}-items/more-details/${item.id}`, {
                    state: { type: type, item }
                })
            }
        >
            <div style={styles.cardImage}>
                {item.images && item.images.length > 0 ? (
                    <img
                        src={item.images[0]}
                        alt={item.itemName}
                        style={styles.cardImage}
                    />
                ) : (
                    <div style={{ ...styles.cardImage, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>No Image</div>
                )}
            </div>
            <div style={styles.cardDetails}>
                <h4 style={styles.cardItemName}>{item.itemName}</h4>
                <p style={styles.descriptionText}>
                    {isLost 
                        ? (item.howItemLost && item.howItemLost.length > 100 ? item.howItemLost.slice(0, 100) + "..." : item.howItemLost) || "No description provided."
                        : (item.howItemFound && item.howItemFound.length > 100 ? item.howItemFound.slice(0, 100) + "..." : item.howItemFound) || "No description provided."
                    }
                </p>
                <div style={styles.ownerInfoWrapper}>
                    {renderAvatar()}
                    <div style={styles.ownerText}>
                        <strong style={styles.ownerName}>
                            {item.isGuest ? 'Guest Reporter' : `${person?.firstName || 'Unknown'} ${person?.lastName || ''}`.trim()}
                        </strong>
                        <br />
                        <span style={{color: '#000000ff'}}>
                             {item.personalInfo?.course?.abbr}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};


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
    .filter(item => item.status !== "pending" && item.status !== "canceled") 
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost))
    .slice(0, 20);

  const recentFoundItems = [...foundItems]
    .filter(item => item.claimStatus !== "claimed")
    .filter(item => item.status === "posted" && item.status !== "canceled")
    .filter(item => item.archivedStatus !== true) 
    .sort((a, b) => new Date(b.dateFound) - new Date(a.dateFound))
    .slice(0, 20);


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
      <UserBlankHeader />
      
      <div style={styles.homeBody}>
        <div style={styles.pageContainer}>

            <div style={styles.infoPanelWrapper}>
                {hasEmptyFields && (
                    <div className={`add-info-panel ${isPanelVisible ? 'show' : ''}`}>
                      <UserAddInfoPanel />
                    </div>
                )}
            </div>

            <div style={styles.banner}>
                <h1 style={styles.bannerTitle}>Welcome, {userData?.firstName || 'User'}!</h1>
                <p style={styles.bannerDate}>{formattedDate}</p>
                <strong style={styles.bannerTime}>{formattedTime}</strong>
                <img src="/landing-page-img.png" alt="SpotSync Banner" style={styles.bannerImage} />
            </div>

            <div style={styles.actionWrapper}>
                
                <button 
                    style={styles.actionButton(true)} 
                    onClick={() => handleNavigate(`/users/lost-items/${user?.uid}`)}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.actionButtonHover(true).backgroundColor}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.actionButton(true).backgroundColor}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-bag-x" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
                        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                    </svg>
                    Report Lost Item
                </button>
                
                <button 
                    style={styles.actionButton(false)}
                    onClick={() => handleNavigate(`/users/found-items/${user?.uid}`)}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.actionButtonHover(false).backgroundColor}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.actionButton(false).backgroundColor}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-bag-check" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                        <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                    </svg>
                    Report Found Item
                </button>
            </div>


            <div style={{marginBottom: '40px'}}>

                <div style={styles.itemSectionHeader}>
                    <h2 style={styles.itemTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-bag-x" viewBox="0 0 16 16" style={{ color: '#dc3545' }}>
                            <path fillRule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
                            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                        </svg>
                        Recent Lost Items
                    </h2>
                    <a onClick={() => handleNavigate(`/users/lost-items/${user?.uid}`)} style={styles.seeMoreLink}>
                        See All
                    </a>
                </div>
                
                <div style={styles.carouselWrapper} ref={lostContainerRef}>
                    {loadingLost ? (
                        <Spinner animation="border" style={{margin: '20px'}} />
                    ) : recentLostItems.length > 0 ? (
                        recentLostItems.map((item) => (
                            <ItemCard item={item} type="lost" navigate={navigate} user={user} key={item.id} />
                        ))
                    ) : (
                        <p style={{ color: '#6c757d', padding: '10px 0' }}>No recent lost items have been reported.</p>
                    )}
                </div>
            </div>

            <div style={{marginBottom: '40px'}}>
                <div style={styles.itemSectionHeader}>
                    <h2 style={styles.itemTitle}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-bag-check" viewBox="0 0 16 16" style={{ color: '#28a745' }}>
                            <path fillRule="evenodd" d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
                        </svg>
                        Recent Found Items
                    </h2>
                    <a onClick={() => handleNavigate(`/users/found-items/${user?.uid}`)} style={styles.seeMoreLink}>
                        See All
                    </a>
                </div>

                <div style={styles.carouselWrapper} ref={foundContainerRef}>
                    {loadingFound ? (
                        <Spinner animation="border" style={{margin: '20px'}} />
                    ) : recentFoundItems.length > 0 ? (
                        recentFoundItems.map((item) => (
                            <ItemCard item={item} type="found" navigate={navigate} user={user} key={item.id} />
                        ))
                    ) : (
                        <p style={{ color: '#6c757d', padding: '10px 0' }}>No recent found items have been posted.</p>
                    )}
                </div>
            </div>

        </div>
        
      </div>
    </>
  );
}

export default HomePage;