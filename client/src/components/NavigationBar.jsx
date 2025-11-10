import React, { useState, useEffect } from "react";
import "./styles/NavigationBar.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import CenterMessagePanel from "./CenterMessagePanel";
import { getDatabase, ref, onValue } from "firebase/database";
import { useNotification } from "../context/NotificationContext";

function NavigationBar() {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);  // ✅ add this
  const { clearNotifications } = useNotification();   // ✅ only pull clearNotifications

  

  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const toggleMessage = () => setMessage((prev) => !prev);
  const toggleSidebar = () => setExpanded((prev) => !prev);

  const handleNavigate = (path) => {
    
    navigate(path);
    setExpanded((prev) => !prev);
  };

useEffect(() => {
    // Safer check for user UID
    if (!user?.uid) {
      setUnreadCount(0); // Reset count if no user
      return; // Exit if no user UID
    }

    const db = getDatabase();
    // Path specific to the current admin's notifications
    const notificationsRef = ref(db, `notifications/${user.uid}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      let count = 0; // Initialize count for this snapshot update
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const notificationData = child.val();
          // ✅ FILTER ADDED: Count only if it's unread AND NOT a 'user-message' type
          if (notificationData &&
              notificationData.read === false &&
              notificationData.type !== 'user-message') { // <--- Add this condition
            count++;
          }
        });
      }
      setUnreadCount(count); // Update state with the filtered count
    }, (error) => {
        console.error("Error fetching notification count:", error);
        setUnreadCount(0); // Reset count on error
    });

    // Cleanup listener on unmount or when user ID changes
    return () => unsubscribe();
  }, [user?.uid]);
  return (
    <>

    <div className={`nav-body ${expanded ? 'expanded' : ''}`}>
      <img src="/spotsync-logo-navy.png" alt="img" />
      {expanded && <img className='slogan' src='/spotsync-slogan-navy.png' alt='img'/>}
      <div className='line' />
      <div className={`nav-buttons ${location.pathname === `/dashboard/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/dashboard/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-border-all" viewBox="0 0 16 16">
            <path d="M0 0h16v16H0zm1 1v6.5h6.5V1zm7.5 0v6.5H15V1zM15 8.5H8.5V15H15zM7.5 15V8.5H1V15z"/>
          </svg>
          {expanded && <span>Dashboard</span>}
      </div>
      <div className={`nav-buttons  ${location.pathname === `/admin/lost-items/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/admin/lost-items/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-x" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M6.146 8.146a.5.5 0 0 1 .708 0L8 9.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 10l1.147 1.146a.5.5 0 0 1-.708.708L8 10.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 10 6.146 8.854a.5.5 0 0 1 0-.708"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          {expanded && <span>Lost Items</span>}
      </div>
      <div className={`nav-buttons  ${location.pathname === `/admin/found-items/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/admin/found-items/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bag-check" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10.854 8.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L7.5 10.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
          {expanded && <span>Found Items</span>}
      </div>
      <div className={`nav-buttons  ${location.pathname === `/admin/item-claimed-list/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/admin/item-claimed-list/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-people" viewBox="0 0 16 16">
            <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
          </svg>
          {expanded && <span>Item Claimed List</span>}
      </div>
      <div className={`nav-buttons  ${location.pathname === `/admin/user-profiles/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/admin/user-profiles/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
          </svg>
          {expanded && <span>User Profiles</span>}
      </div>
      <div
        className={`nav-buttons  ${
          location.pathname === `/admin/notifications/${user?.uid}`
            ? "active"
            : ""
        }`}
        onClick={() => 
          {
          handleNavigate(`/admin/notifications/${user?.uid}`);
         clearNotifications();
        }}
        
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-bell"
          viewBox="0 0 16 16"
        >
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6" />
        </svg>
             {unreadCount > 0 && (
      <span className={`notif-badge ${expanded ? "expanded" : "collapsed"}`}>
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    )}

        

        {expanded && <span>Notification</span>}
      </div>
      <div className={`nav-buttons ${location.pathname === `/admin/settings/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/admin/settings/${user?.uid}`)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
            </svg>
            {expanded && <span>Settings</span>}
      </div>
      <div className='nav-buttons' style={{opacity: '60%'}} onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-question-square" viewBox="0 0 16 16">
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
            </svg>
            {expanded && <span>Help</span>}
      </div>
      <div className={`logout-message ${message ? 'message' : ''}`}>
          <CenterMessagePanel />
      </div>
    </div>

    </>
  )
}

export default NavigationBar