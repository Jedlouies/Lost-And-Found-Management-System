import React, { useEffect, useRef, useState } from 'react'
import './styles/HomeHeader.css'
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import HeaderAccountDropdown from './HeaderAccountDropdown.jsx';
import HeaderNotifyDropdown from './HeaderNotifyDropdown.jsx';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useNotification } from "../context/NotificationContext";
import { signOut } from "firebase/auth";
import './styles/HeaderAccountDropdown.css';
import CenterMessagePanel from './CenterMessagePanel.jsx';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
    import "./styles/HeaderNotifyDropdown.css";
    import { getDatabase, ref, onValue, remove } from "firebase/database";
    import FloatingAlert from "../components/FloatingAlert";



function UserLostHeader() {
  const { currentUser } = useAuth();
  const [dropDown, setDropDown] = useState(false);
  const [notifyPanel, setNotifyPanel] = useState(false);
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  const dropdownRef = useRef(null);
  const notifyRef = useRef(null);
  const profileRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser; 
  const { unreadCount, clearNotifications } = useNotification();

  const toggleDropDown = () => setDropDown(prev => !prev);
  const toggleNotifyPanel = () => setNotifyPanel(prev => !prev);

  const requiredFields = [
  "firstName",
  "lastName",
  "email",
  "contactNumber",
  "address",
  "course",
  "gender",
  "section"
];

const [userData, setUserData] = useState(null);

useEffect(() => {
  const fetchUserDetails = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData(data);

        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setProfileURL(data.profileURL || "");

        localStorage.setItem("firstName", data.firstName || "");
        localStorage.setItem("lastName", data.lastName || "");
        if (data.profileURL) {
          localStorage.setItem("profileURL", data.profileURL);
        }
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  fetchUserDetails();
}, [currentUser]);

useEffect(() => {
    const handleImageUpdate = () => {
      const newURL = localStorage.getItem('profileURL');
      if (newURL) {
        setProfileURL(newURL);
      }
    };

    window.addEventListener('profileImageUpdated', handleImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleImageUpdate);
    };
  }, []);

const hasEmptyFields = userData
  ? requiredFields.some((field) => {
      const value = userData[field];
      return value === undefined || value === null || String(value).trim() === "";
    })
  : true;




  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !profileRef.current?.contains(event.target)
      ) {
        setDropDown(false);
      }

      if (
        notifyRef.current &&
        !notifyRef.current.contains(event.target) &&
        !bellRef.current?.contains(event.target)
      ) {
        setNotifyPanel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
    const [message, setMessage] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
  
    const toggleMessage = () => setMessage(prev => !prev);
  
    const handleLogout = async () => {
          try {
            await signOut(auth);
      
           
            [
              'address','bio','contactNumber','coverURL','designation',
              'educationalAttainment','email','firstName','gender','lastName',
              'middleName','profileURL','role','studentId','uid','yearsOfService',
              'hideAddInfoPanel'
            ].forEach(key => localStorage.removeItem(key));
      
            navigate('/log-in');
          } catch (error) {
            console.error('Logout failed:', error);
          }
        };
    
    const handleNavigate = (path) => {
    navigate(path);
  };
  
    useEffect(() => {
      const fetchUserDetails = async () => {
        if (!currentUser) return;
  
        const hasCached =
          localStorage.getItem('firstName') &&
          localStorage.getItem('lastName') &&
          localStorage.getItem('profileURL');
  
        if (hasCached) return;
  
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
  
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
  
            setFirstName(userData.firstName || '');
            setLastName(userData.lastName || '');
            setProfileURL(userData.profileURL || '');
  
            localStorage.setItem('firstName', userData.firstName || '');
            localStorage.setItem('lastName', userData.lastName || '');
            if (userData.profileURL) {
              localStorage.setItem('profileURL', userData.profileURL);
            }
          }
        } catch (err) {
          console.error('Error fetching user info:', err);
        }
      };
  
      fetchUserDetails();
    }, [currentUser]);
  
  
    useEffect(() => {
      const handleImageUpdate = () => {
        const newURL = localStorage.getItem('profileURL');
        if (newURL) {
          setProfileURL(newURL);
        }
      };
  
      window.addEventListener('profileImageUpdated', handleImageUpdate);
      return () => {
        window.removeEventListener('profileImageUpdated', handleImageUpdate);
      };
    }, []);

    
      const typeConfig = {
      transaction: {
        title: "Transaction Processed",
        icon: "bi-cash-stack",
        color: "green",
      },
      system: {
        title: "System Update",
        icon: "bi-gear-fill",
        color: "#007bff",
      },
      reminder: {
        title: "Reminder",
        icon: "bi-bell-fill",
        color: "orange",
      },
      item: {
        title: "Item Update",
        icon: "bi-info-circle",
        color: "#062949ff",
      },
    };
    
    
      const [groupedNotifications, setGroupedNotifications] = useState({});
      const [alert, setAlert] = useState(null);
      const [userId, setUserId] = useState(null);
    
    
      useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        setUserId(user.uid);
    
        const db = getDatabase();
        const notificationsRef = ref(db, `notifications/${user.uid}`);
    
        const unsubscribe = onValue(notificationsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const parsed = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
    
            parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
            const limited = parsed.slice(0, 10);
    
            const grouped = groupByDate(limited);
            setGroupedNotifications(grouped);
          } else {
            setGroupedNotifications({});
          }
        });
    
        return () => unsubscribe();
      }, []);
    
      const groupByDate = (notifications) => {
        const groups = { Today: [], Yesterday: [], "Last Week": [], "Last Month": [] };
    
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
    
        notifications.forEach((n) => {
          const ts = n.timestamp ? new Date(n.timestamp) : new Date();
          if (ts >= today) groups.Today.push(n);
          else if (ts >= yesterday) groups.Yesterday.push(n);
          else if (ts >= oneWeekAgo) groups["Last Week"].push(n);
          else if (ts >= oneMonthAgo) groups["Last Month"].push(n);
        });
    
        return groups;
      };
    
      const handleDelete = (notifId) => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
    
        const db = getDatabase();
        const notifRef = ref(db, `notifications/${user.uid}/${notifId}`);
        remove(notifRef)
          .then(() => {
            setAlert({ message: "Notification Deleted", type: "success" });
          })
          .catch((err) => console.error("Error deleting notification:", err));
      };
    

    
  

  return (
    <>
<div className='dropdown-containers' style={{ position: 'relative', left: '-10%', zIndex: 1000 }}>
  {/* Account dropdown */}
  {dropDown && (
    <div 
      className="account-dropdown-menu" 
      ref={dropdownRef} 
      style={{
        position: 'absolute',
        right: '0',
        top: '40px',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
      }}
    >
      <div className='account-dropdown-body'>
      <div className='profiles-body' style={{top: '0', paddingBottom: '10px', borderBottom: '1px solid #ddd'}}>
        <div className='profiles-pic'>
          {profileURL ? (
          <img
            src={profileURL}
            alt='Profile'
            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover'}}
          />
        ) : (
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'navy',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {initials}
          </div>
        )}

        </div>
        <p>{firstName} {lastName}</p>
      </div>

      <div className='line' />

      <div className={`account-dropdown-row ${location.pathname === `/home/profile/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/home/profile/${user?.uid}`)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
        </svg>
        <p>View Profile</p>
      </div>

      <div className={`account-dropdown-row ${location.pathname === `/users/settings/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/users/settings/${user?.uid}`)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-view-stacked" viewBox="0 0 16 16">
          <path d="M3 0h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm0 8h10a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2m0 1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
        </svg>
        <p>Settings</p>
      </div>


<div className='account-dropdown-row' onClick={() => setShowModal(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-in-left" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0z" />
          <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708z" />
        </svg>
        <p>Logout</p>
      </div>

    </div>  

    </div>
  )}

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header >
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to log out?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>


  {/* Notification dropdown */}
  {notifyPanel && (
    <div 
      className="notify-dropdown-menu" 
      ref={notifyRef} 
      style={{
        position: 'absolute',
        right: '50px',
        top: '40px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
        padding: '10px',
        minWidth: '320px',
        minHeight: '300px',
        overflowY: 'auto'
      }}
    >
          <>
      {alert && (
        <FloatingAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="notify-body" style={{ maxWidth: '300px', maxHeight: '280px' }}>
        <h4 className="notify-title" style={{ marginTop: "-5px" }}>
          Notifications
        </h4>

        <div className="notify-list">
          {Object.keys(groupedNotifications).every(
            (key) => groupedNotifications[key].length === 0
          ) ? (
            <p className="notify-empty">No recent notifications</p>
          ) : (
            Object.entries(groupedNotifications).map(
              ([section, items]) =>
                items.length > 0 && (
                  <div key={section}>
                    <h5 className="notify-section">{section}</h5>
                    {items.map((n) => {
                      const config =
                        typeConfig[n.type] || {
                          title: "Notification",
                          icon: "bi-info-circle",
                          color: "#062949ff",
                        };

                      return (
                        <div key={n.id} className="notify-item">
                          <div className="notify-text">
                            <p
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <i
                                className={`bi ${config.icon}`}
                                style={{ color: config.color, fontSize: "18px" }}
                              ></i>
                              <span style={{ display: "flex", flexDirection: "column" }}>
                                <strong style={{ color: config.color, fontSize: '15px', marginBottom: '5px' }}>
                                  {config.title}
                                </strong>
                                <span
                                  dangerouslySetInnerHTML={{ __html: n.message }}
                                  style={{ marginLeft: "2px", color: "black" }}
                                />
                              </span>
                            </p>
                            <small>
                              {n.timestamp
                                ? new Date(n.timestamp).toLocaleString()
                                : "Just now"}
                            </small>
                          </div>

                          <button
                            onClick={() => handleDelete(n.id)}
                            className="notify-delete"
                            title="Delete notification"
                          >
                            🗑
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
            )
          )}
        </div>

        <div className="notify-footer">
          <button
            onClick={handleNavigate}
            style={{
              backgroundColor: "#475C6F",
              border: "none",
      
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: "5px",
              color: "white",
              position: 'relative'
            }}
          >
            View all
          </button>
        </div>
      </div>
    </>

    </div>
  )}
</div>
    <div className='home-header-body'>
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <button
    onClick={() => {
      if (!hasEmptyFields) {
        navigate(`/users/lost-items/procedure/${user?.uid}`);
      }
    }}
    disabled={hasEmptyFields}
    style={{
      backgroundColor: hasEmptyFields ? "#ccc" : "#475C6F",
      cursor: hasEmptyFields ? "not-allowed" : "pointer",
      borderRadius: "5px",
      border: "solid 2px white",
      padding: "6px 12px",
      display: "flex",
      alignItems: "center",
      gap: "5px"
    }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
      className="bi bi-plus" viewBox="0 0 16 16">
      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
    </svg>
    <p style={{ margin: 0 }}>Post</p>
  </button>

  {hasEmptyFields && (
    <span style={{ color: "white", fontSize: "14px" }}>
      ⚠ Please complete your personal information before posting.
    </span>
  )}
</div>

        <div className='home-header-right'>

          <div ref={profileRef} className='profile' onClick={toggleDropDown}>
            {profileURL ? (
            <img
              src={profileURL}
              alt='Profile'
              style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover'}}
            />
          ) : (
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'navy',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              {initials}
            </div>
          )}

          </div>
           <p onClick={toggleDropDown}>{lastName}</p>
        </div>
    </div>
    

    </>
  )
}

export default UserLostHeader