import React, { useEffect, useState } from 'react'
import NavigationBar from '../components/NavigationBar'
import DashboardHeader from '../components/DashboardHeader'
import ClaimedLostFoundChart from '../components/ClaimedLostFoundChart'
import WeeklyUsersCard from '../components/WeeklyUsersCard'
import FeedBackChart from '../components/FeedbackChart'
import AdminAddInfoPanel from '../components/AdminAddInfoPanel'
import { doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore'; 
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import QuickStatsCards from '../components/QuickStatsCards';
import BlankHeader from '../components/BlankHeader'
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from "react-bootstrap";
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import FloatingAlert from '../components/FloatingAlert';

// API for verification email/notifications (same as FoundItemsPage)
const API = "https://server.spotsync.site";


// --- Date Formatting Utility ---
const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;

    // Handle Firestore Timestamp object structure ({seconds: x, nanoseconds: y})
    if (typeof timestamp === 'object' && timestamp.seconds) {
        // Convert seconds to milliseconds
        date = new Date(timestamp.seconds * 1000);
    } 
    // Handle string date format or other Date-like objects
    else {
        date = new Date(timestamp);
    }
    
    // Fallback if parsing failed
    if (isNaN(date)) return 'N/A';

    const options = {
        year: 'numeric',
        month: 'long', // Display full month name
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        // Assuming data is stored in UTC/UTC+8 and we want to display it locally or in a specific format
    };

    return date.toLocaleString('en-US', options);
};
// -------------------------------


// Utility function derived from FoundItemsPage.jsx for notification logic
const notifyUser = async (dbRealtime, uid, message, type = "match") => {
    if (!uid) return;
    const notifRef = ref(dbRealtime, `notifications/${uid}`);
    const newNotifRef = push(notifRef);
    await set(newNotifRef, {
        message,
        timestamp: rtdbServerTimestamp(),
        type: "item",
        read: false,
    });
};

// Core verification logic abstracted from FoundItemsPage.jsx
const handleVerifyItem = async (foundDocId, itemName, dbRealtime, setAlert, setItems) => {
    try {
        const foundDocRef = doc(db, "foundItems", foundDocId);
        const foundDocSnap = await getDoc(foundDocRef);

        if (!foundDocSnap.exists()) {
            throw new Error(`No foundItems document with ID: ${foundDocId}`);
        }

        const { itemId, status, uid } = foundDocSnap.data();

        if (status === "posted") {
            setAlert({ message: "Item is already posted.", type: "warning" });
            return true; 
        }

        if (status === "cancelled") {
            setAlert({ message: "Cannot verify a cancelled item.", type: "warning" });
            return true;
        }

        if (!itemId) {
            throw new Error(`foundItems doc ${foundDocId} has no itemId field`);
        }

        await updateDoc(foundDocRef, { status: "posted" });

        const manageQuery = query(
            collection(db, "itemManagement"),
            where("itemId", "==", itemId)
        );
        const manageSnap = await getDocs(manageQuery);

        if (manageSnap.empty) {
            throw new Error(`No itemManagement document with itemId: ${itemId}`);
        }

        for (const docSnap of manageSnap.docs) {
            await updateDoc(docSnap.ref, { status: "posted" });

            const manageData = docSnap.data();
            const topMatches = manageData.topMatches || [];

            // 1. Notify potential lost item owners
            for (const match of topMatches) {
                if (match.scores?.overallScore >= 75 && match.lostItem?.uid) {
                    await notifyUser(
                        dbRealtime,
                        match.lostItem.uid,
                        `Your lost item <b>${match.lostItem.itemId}</b> - ${match.lostItem.itemName} 
                        may possibly match with a verified found item: <b>${itemName}</b>.
                        <p> With transastion Id of <b>${match.transactionId}</b>.
                        Matching rate: <b>${match.scores.overallScore}%</b> Please bring your ID and QR Code for Verification.`
                    );
                    // Email logic (simplified here, assuming API handles it)
                    await fetch(`${API}/api/send-email`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            to: match.lostItem?.personalInfo?.email,
                            subject: "Possible Lost Match ",
                            html: `... email content ...`, // Placeholder, actual content is complex
                        }),
                    });
                }
            }

            // 2. Notify the founder
            if (manageData.uid) {
                await notifyUser(
                    dbRealtime,
                    manageData.uid,
                    `Your found item <b>${itemName}</b> has been <b>verified and posted</b>. 
                    All possible owners with an 75%+ match score have been notified. 
                    Please wait for further instructions from the OSA.`,
                    "info"
                );
                // Email logic (simplified here)
                await fetch(`${API}/api/send-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: manageData.personalInfo?.email,
                        subject: "Item Verified",
                        html: `... email content ...`, // Placeholder, actual content is complex
                    }),
                });
            }
        }
        
        // Remove item from dashboard view after successful verification
        if (setItems) {
            setItems(prev => prev.filter(i => i.id !== foundDocId));
        }


        setAlert({ message: "Item Verified & Notifications Sent!", type: "success" });
        return true;

    } catch (error) {
        console.error("Error verifying item:", error);
        setAlert({ message: "Error verifying item. Check console for details.", type: "danger" });
        return false;
    }
};


function DashboardPage() {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const { currentUser } = useAuth();
  
  const [userData, setUserData] = useState(null);
  
  // NEW STATES FOR DASHBOARD VERIFICATION
  const [dbVerifyItemId, setDbVerifyItemId] = useState('');
  const [pendingItems, setPendingItems] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [alert, setAlert] = useState(null);
  
  // NEW STATES FOR DROPDOWN SEARCH
  const [showDropdown, setShowDropdown] = useState(false);
  const [allPendingItems, setAllPendingItems] = useState([]); 
  // NEW STATE: Toggle visibility of the verification search input
  const [showVerifyInput, setShowVerifyInput] = useState(false); 


  const dbRealtime = getDatabase(); // Initialize Realtime DB for notifications

  
  // --- FETCH ALL PENDING ITEMS ON LOAD (INCLUDING FOUNDER NAME) ---
  useEffect(() => {
    const fetchAllPendingItems = async () => {
        try {
            // CRITICAL FIX: Use 'in' array query for status to handle case sensitivity
            const q = query(
                collection(db, "foundItems"),
                where("status", "in", ["pending", "Pending"]) 
            );
            const querySnapshot = await getDocs(q);
            
            const itemsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const founderName = `${data.personalInfo?.firstName || ''} ${data.personalInfo?.lastName || ''}`.trim();
                return {
                    id: doc.id,
                    itemId: data.itemId,
                    itemName: data.itemName,
                    founderName: founderName || 'Unknown Founder',
                    // Include founder's profile URL for the dropdown display
                    founderProfileURL: data.personalInfo?.profileURL || null,
                };
            });
            
            setAllPendingItems(itemsData);
        } catch (error) {
            console.error("Error fetching all pending items:", error);
        }
    };
    fetchAllPendingItems();
  }, [alert]); 
  
  
  // --- ITEM SEARCH LOGIC ---
  const searchPendingItem = async (e, itemIdToUse = dbVerifyItemId) => {
    
    // Prevent default form submission only if triggered by the button click (e is defined and is an event)
    if (e && e.preventDefault) {
        e.preventDefault();
    }
    
    // Use the ID passed directly or the ID from state
    const itemIdToSearch = itemIdToUse.trim(); 

    // --- State Management Clear ---
    setVerifyError('');
    setPendingItems([]);
    setShowDropdown(false);
    
    if (!itemIdToSearch) {
        setVerifyError('Please enter an Item ID.');
        return;
    }
    
    // 1. Check if the input is one of the displayed pending items
    const selectedItem = allPendingItems.find(item => item.itemId === itemIdToSearch);
    
    if (!selectedItem) {
        setVerifyError(`No pending found item found with ID: ${itemIdToSearch}`);
        return;
    }


    setIsVerifying(true);
    try {
      // 1. Search in itemManagement using the itemId (which is the doc ID for foundItems)
      const manageQuery = query(
          collection(db, "itemManagement"),
          where("itemId", "==", itemIdToSearch),
          where("type", "==", "Found")
      );
      const manageSnap = await getDocs(manageQuery);
      
      let foundPendingItem = null;

      if (!manageSnap.empty) {
        manageSnap.forEach(docSnap => {
            const data = docSnap.data();
            // We rely on the initial fetch for status, but confirm the record exists in management
            foundPendingItem = {
                ...data,
                id: docSnap.id, 
                foundDocId: data.itemId 
            };
        });
      }
        
      if (foundPendingItem) {
          // 2. Fetch the actual found item data for the founder's details
          const foundDocRef = doc(db, "foundItems", selectedItem.id); 
          const foundDocSnap = await getDoc(foundDocRef);
          
          if (foundDocSnap.exists()) {
             const foundItemData = foundDocSnap.data();
             const founderData = foundItemData.personalInfo || {};
             
             // Final check for status integrity
             if (foundItemData.status !== 'pending' && foundItemData.status !== 'Pending') {
                 setVerifyError(`Item ${itemIdToSearch} status is ${foundItemData.status}. Only 'Pending' items can be verified here.`);
                 return;
             }
             
             // Display the item details for verification
             setPendingItems([{
                 ...foundPendingItem,
                 founderInfo: founderData,
                 createdAt: foundItemData.createdAt, // Use the correct timestamp from the actual found item doc
                 docIdToVerify: foundDocSnap.id // The correct document ID to target for verification
             }]);
          } else {
             // This should ideally not happen if manageSnap was successful and selectedItem.id is correct
             setVerifyError(`Pending item found, but original found item document missing.`);
          }
        
      } else {
        // This fails if the itemManagement record is missing or doesn't match the ItemID/type.
        setVerifyError(`No complete pending record found for ID: ${itemIdToSearch}. Management record may be missing or invalid.`);
      }

    } catch (err) {
      console.error("Dashboard Item Search Error:", err);
      setVerifyError('An unexpected error occurred during search.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // --- VERIFY ACTION HANDLER ---
  const handleDashboardVerify = async (item) => {
      setIsVerifying(true);
      const success = await handleVerifyItem(
          item.docIdToVerify, 
          item.itemName, 
          dbRealtime, 
          setAlert, 
          setPendingItems // Pass setter to update local state upon success
      );
      if (success) {
          // Clear search results after successful verification
          setPendingItems([]); 
          setDbVerifyItemId('');
          setShowVerifyInput(false); // Hide input after successful verification
      }
      setIsVerifying(false);
  };
  // --- END OF ITEM VERIFICATION LOGIC ---


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
    
    
    // Filter pending items based on search input for dropdown
    const filteredPendingItems = allPendingItems.filter(item => 
        item.itemId?.toLowerCase().includes(dbVerifyItemId.toLowerCase()) || 
        item.itemName?.toLowerCase().includes(dbVerifyItemId.toLowerCase())
    ).slice(0, 5); // Limit results to 5

    // Handler for item selection from the dropdown
    const handleItemSelect = (itemId) => {
        setDbVerifyItemId(itemId);
        setShowDropdown(false);
        // CRITICAL FIX: Pass the selected ID directly to the search function
        searchPendingItem(null, itemId); 
    };

    // Toggle button handler
    const toggleVerifyInput = () => {
        setShowVerifyInput(prev => !prev);
        setDbVerifyItemId('');
        setPendingItems([]);
        setVerifyError('');
    };



  const styles = {
    dashboardBody: {
      backgroundColor: '#f4f4f4',
      padding: '20px 0',
      minHeight: '100vh',
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
      borderRadius: '8px',
      padding: '15px',
      marginTop: '15px',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      opacity: 0,
      transform: 'translateY(20px)',
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
    },
    // NEW Verification Styles
    verifyContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px', // Reduced padding slightly
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        marginTop: '10px', 
        transition: 'height 0.3s ease, padding 0.3s ease, opacity 0.3s ease',
        // REMOVED: overflow: 'hidden', // This was the clipping culprit
    },
    verifyContainerHidden: {
        padding: '0 20px', // Collapse padding when hidden
        height: '0',
        opacity: 0,
        marginBottom: '0',
    },
    verifyContainerVisible: {
        padding: '20px',
        height: 'auto',
        opacity: 1,
        marginBottom: '20px',
    },
    verifyHeader: {
        fontSize: '1.2rem',
        color: '#475C6F',
        fontWeight: '600',
        marginBottom: '15px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
    },
    verifyForm: {
        display: 'flex',
        gap: '10px',
        alignItems: 'stretch', // Stretch items to max height
        position: 'relative', // For dropdown positioning
        marginBottom: '0', // Remove bottom margin from form itself
    },
    // Input and Dropdown Wrapper
    inputWrapper: {
        color: 'black',
        position: 'relative',
        flexGrow: 1,
        height: '45px', // Fixed height for alignment
    },
    verifyInput: {
      backgroundColor: 'white',
        padding: '10px 15px',
        border: '1px solid #ccc',
        color: 'black',
        borderRadius: '6px',
        width: '100%',
        height: '100%', // Match wrapper height
        fontSize: '1rem',
        boxSizing: 'border-box',
    },
    // Dropdown List Style
    dropdownList: {
        position: 'absolute',
        top: '100%', // Position below the input
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 100, // INCREASED Z-INDEX TO ENSURE VISIBILITY
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    dropdownItem: {
        padding: '10px 15px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        transition: 'background-color 0.2s',
        fontSize: '0.9rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    dropdownItemHover: {
        backgroundColor: '#f0f0f0',
    },
    // Buttons for action bar
    actionButton: {
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexGrow: 0,
        height: '45px', // Fixed height for alignment
    },
    verifySearchButton: {
        backgroundColor: '#475C6F',
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        height: '45px', // Fixed height
    },
    // Table Styles
    verifyTable: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 8px',
    },
    verifyTableHead: {
        backgroundColor: '#f1f1f1',
        borderRadius: '8px',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        color: '#333',
    },
    verifyTableHeaderCell: {
        padding: '10px 10px',
        textAlign: 'left',
        fontWeight: '600',
    },
    verifyTableDataCell: {
        padding: '15px 10px',
        borderTop: '1px solid #eee',
        borderBottom: '1px solid #eee',
        fontSize: '0.95rem',
        color: '#333',
        verticalAlign: 'middle',
    },
    verifyTableFirstCell: {
        borderLeft: '1px solid #eee',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
    },
    verifyTableLastCell: {
        borderRight: '1px solid #eee',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
    },
    verifyActionButton: {
        backgroundColor: 'green',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '6px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyActionButtonHover: {
        backgroundColor: '#005600',
    },
    // Founder Profile/Placeholder Styles
    profileImageSmall: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        objectFit: "cover",
        marginRight: "10px",
    },
    profilePlaceholder: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: "navy", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      fontSize: "12px",
      marginRight: "10px",
    },
    infoP: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: 'black',
        margin: 0,
        lineHeight: 1.2
    },
    infoItalicP: {
        fontStyle: 'italic',
        color: 'black',
        margin: 0,
        fontSize: '12px'
    },
  };


  return (
    <>
      <NavigationBar />
      <BlankHeader />

      {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

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
            
            {/* --- ACTION BUTTONS ROW --- */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start', // Align items to the top if the hidden div takes space
                gap: '20px',
                marginBottom: showVerifyInput ? '0px' : '20px',
            }}>
                 
                {/* 1. Process Claim Button */}
                <button 
                  style={{...styles.actionButton, backgroundColor: 'green'}} 
                  onClick={() => handleNavigate(`/admin/transactions/${currentUser?.uid}`)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-check-fill" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                      <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
                    </svg>
                    Process Claim
                </button>
                
                {/* 2. Toggle/Trigger Verify Item Button */}
                <button 
                  style={{...styles.actionButton, backgroundColor: showVerifyInput ? '#cc0000' : '#BDDDFC', color: showVerifyInput ? 'white' : '#1f2937'}} 
                  onClick={toggleVerifyInput}
                  onMouseEnter={(e) => { 
                      if (!showVerifyInput) e.currentTarget.style.backgroundColor = '#a7cce2'; 
                      else e.currentTarget.style.backgroundColor = '#990000'; 
                  }}
                  onMouseLeave={(e) => { 
                      if (!showVerifyInput) e.currentTarget.style.backgroundColor = '#BDDDFC'; 
                      else e.currentTarget.style.backgroundColor = '#cc0000'; 
                  }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-patch-check" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M10.354 6.707a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 9.293l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                        <path d="M10.273 2.651a.5.5 0 0 1 .457.135l1.529 1.529a.5.5 0 0 1 .135.457l-.372 2.115c.348.096.69.245 1.01.442l.334-.167a.5.5 0 0 1 .457.135l2.4 2.4a.5.5 0 0 1 0 .708l-2.4 2.4a.5.5 0 0 1-.457.135l-.334-.167a7.5 7.5 0 0 1-1.01.442l.372 2.115a.5.5 0 0 1-.135.457l-1.529 1.529a.5.5 0 0 1-.457.135l-2.115-.372a7.5 7.5 0 0 1-.442 1.01l.167.334a.5.5 0 0 1-.135.457l-2.4 2.4a.5.5 0 0 1-.708 0l-2.4-2.4a.5.5 0 0 1-.135-.457l.334-.167a7.5 7.5 0 0 1-1.01-.442l-.372 2.115a.5.5 0 0 1-.457.135l-1.529-1.529a.5.5 0 0 1-.135-.457l.372-2.115a7.5 7.5 0 0 1-.442-1.01l-.167-.334a.5.5 0 0 1-.457-.135l-2.4-2.4a.5.5 0 0 1 0-.708l2.4-2.4a.5.5 0 0 1 .457-.135l.334.167a7.5 7.5 0 0 1 1.01-.442l-.372-2.115a.5.5 0 0 1 .135-.457l1.529-1.529a.5.5 0 0 1 .457-.135l2.115.372a7.5 7.5 0 0 1 1.01-.442l-.167-.334a.5.5 0 0 1 .135-.457zM8 12.995a5 5 0 0 0 5-5 5 5 0 0 0-5-5 5 5 0 0 0-5 5 5 5 0 0 0 5 5"/>
                    </svg>
                    {showVerifyInput ? 'Hide Verification' : 'Verify Item'}
                </button>
            
                 {!showVerifyInput && <div style={{flexGrow: 1, maxWidth: '600px', height: '45px'}} />}

            </div>
            
            <div style={{
                ...styles.verifyContainer, 
                ...(showVerifyInput ? styles.verifyContainerVisible : styles.verifyContainerHidden)
            }}>
                {showVerifyInput && (
                    <>
                        <h5 style={styles.verifyHeader}>Verify Found Item (Pending)</h5>
                        <form onSubmit={searchPendingItem} style={styles.verifyForm}>
                            
                            <div style={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Enter or Select Pending Item ID"
                                    value={dbVerifyItemId}
                                    onChange={(e) => {
                                        setDbVerifyItemId(e.target.value);
                                        // Only show dropdown if there's input
                                        setShowDropdown(e.target.value.length > 0); 
                                        setVerifyError(''); 
                                        setPendingItems([]); 
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                    // Use onBlur to close the dropdown only after a slight delay
                                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                    style={styles.verifyInput}
                                    disabled={isVerifying}
                                />
                                {/* Dropdown List */}
                                {showDropdown && dbVerifyItemId.length > 0 && filteredPendingItems.length > 0 && (
                                    <div style={styles.dropdownList}>
                                        {filteredPendingItems.map((item) => (
                                            <div 
                                                key={item.id} 
                                                style={styles.dropdownItem}
                                                // Use onMouseDown to capture click before onBlur fires
                                                onMouseDown={() => handleItemSelect(item.itemId)}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.dropdownItemHover.backgroundColor}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                            >
                                                <strong>{item.itemId}</strong>: {item.itemName} (Founder: {item.founderName})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                style={styles.verifySearchButton}
                                disabled={isVerifying}
                                onMouseEnter={(e) => { if (!isVerifying) e.currentTarget.style.backgroundColor = '#384d5c'; }}
                                onMouseLeave={(e) => { if (!isVerifying) e.currentTarget.style.backgroundColor = '#475C6F'; }}
                            >
                                {isVerifying ? <Spinner animation="border" size="sm" /> : 
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                                    </svg>
                                }
                                Search
                            </button>
                        </form>
                        
                        {verifyError && <Alert variant="danger" style={{marginTop: '10px'}}>{verifyError}</Alert>}
                        
                        {pendingItems.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h6 style={{color: '#475C6F', marginBottom: '15px'}}>Verification Result:</h6>
                                <table style={styles.verifyTable}>
                                    <thead style={styles.verifyTableHead}>
                                        <tr>
                                            <th style={styles.verifyTableHeaderCell}>Item Name</th>
                                            <th style={styles.verifyTableHeaderCell}>Founder</th>
                                            <th style={styles.verifyTableHeaderCell}>Date Submitted</th>
                                            <th style={{...styles.verifyTableHeaderCell, textAlign: 'center'}}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingItems.map((item, index) => (
                                            <tr key={index}>
                                                <td style={styles.verifyTableDataCell}>{item.itemName}</td>
                                                <td style={styles.verifyTableDataCell}>
                                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                        {/* Display Profile URL or Fallback to Initials */}
                                                        {item.founderInfo?.profileURL ? (
                                                            <img
                                                                src={item.founderInfo.profileURL}
                                                                alt="Founder"
                                                                style={styles.profileImageSmall}
                                                            />
                                                        ) : (
                                                            <div style={styles.profilePlaceholder}>
                                                                {`${item.founderInfo?.firstName?.[0] || ""}${item.founderInfo?.lastName?.[0] || ""}`.toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p style={styles.infoP}>{`${item.founderInfo?.firstName || ""} ${item.founderInfo?.lastName || ""}`.trim()}</p>
                                                            <p style={styles.infoItalicP}>{item.founderInfo?.course?.abbr || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={styles.verifyTableDataCell}>
                                                    {formatFirestoreTimestamp(item.createdAt)}
                                                </td>
                                                <td style={{...styles.verifyTableDataCell, textAlign: 'center'}}>
                                                    <button
                                                        style={styles.verifyActionButton}
                                                        onClick={() => handleDashboardVerify(item)}
                                                        disabled={isVerifying}
                                                        onMouseEnter={(e) => { if (!isVerifying) e.currentTarget.style.backgroundColor = styles.verifyActionButtonHover.backgroundColor; }}
                                                        onMouseLeave={(e) => { if (!isVerifying) e.currentTarget.style.backgroundColor = styles.verifyActionButton.backgroundColor; }}
                                                    >
                                                        Verify
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>


            <div style={styles.reportHeader}>
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#475C6F" className="bi bi-bar-chart" viewBox="0 0 16 16">
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
                    <h4 style={{marginBottom: '15px'}}>Weekly Registered Users</h4>
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