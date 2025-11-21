import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth } from 'firebase/auth';
// Removed unused imports: import './styles/UserFoundProcedurePage.css', import UserLostItemsPage from './UserLostItemsPage'

// --- Style Definitions (Internal CSS) ---
const PRIMARY_COLOR = '#143447'; // Deep Navy Blue (Headers)
const ACCENT_COLOR_LOST = '#143447'; // Red (Warning/Lost)
const LIGHT_BG = '#f8f9fa'; // Page Background

const styles = {
    pageBody: {
        minHeight: '100vh',
        backgroundColor: LIGHT_BG,
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    procedureCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        maxWidth: '850px',
        width: '100%',
        padding: '40px',
    },
    headerArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '30px',
        borderBottom: `2px solid ${ACCENT_COLOR_LOST}`,
        paddingBottom: '15px',
    },
    mainTitle: {
        fontSize: '2rem',
        color: PRIMARY_COLOR,
        fontWeight: '700',
        margin: 0,
    },
    icon: {
        width: '45px',
        height: '45px',
        fill: ACCENT_COLOR_LOST, 
        flexShrink: 0,
    },
    reminderBox: {
        backgroundColor: '#f8d7da', // Light red/pink background
        color: '#721c24', // Dark red text
        border: `1px solid #f5c6cb`,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '30px',
        fontSize: '0.95rem',
    },
    stepTitle: {
        fontSize: '1.6rem',
        fontWeight: '600',
        color: PRIMARY_COLOR,
        marginBottom: '20px',
        marginTop: '30px',
    },
    stepList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    stepItem: {
        marginBottom: '15px',
        padding: '18px 20px',
        backgroundColor: LIGHT_BG,
        borderRadius: '8px',
        lineHeight: '1.6',
        fontSize: '1rem',
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-start',
        borderLeft: `5px solid ${ACCENT_COLOR_LOST}`,
    },
    stepNumber: {
        fontWeight: 'bold',
        fontSize: '1.2rem',
        color: PRIMARY_COLOR,
        flexShrink: 0,
        marginTop: '2px',
    },
    gotItButton: {
        display: 'block',
        width: '100%',
        padding: '15px 0',
        marginTop: '40px',
        backgroundColor: ACCENT_COLOR_LOST,
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1.2rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'background-color 0.3s, transform 0.2s',
        boxShadow: '0 4px 10px rgba(220, 53, 69, 0.3)',
    },
    gotItButtonHover: {
        backgroundColor: '#071f2dff',
        transform: 'translateY(-2px)',
    },
    // Style for the active button state (required by the original code's logic)
    activeButton: {
        boxShadow: '0 0 0 3px rgba(220, 53, 69, 0.5)',
        border: '1px solid #fff',
    }
};

function UserLostProcedurePage() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const {currentUser} = useAuth();
  const auth = getAuth();
  const user = auth.currentUser;

  // --- FUNCTIONALITY PRESERVED ---
  // Note: setFirstName, setLastName, and setProfileURL must be available 
  // from a useAuth or similar context hook for this logic to fully work.
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;
  
      const hasCached = localStorage.getItem('firstName') && localStorage.getItem('lastName') && localStorage.getItem('profileURL');
      if (hasCached) return;
 
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
 
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Assuming setter functions are defined outside this component or context handles them
          // setFirstName(userData.firstName);
          // setLastName(userData.lastName);
          // setProfileURL(userData.profileURL || '');
 
          localStorage.setItem('firstName', userData.firstName);
          localStorage.setItem('lastName', userData.lastName);
          if (userData.profileURL) {
            localStorage.setItem('profileURL', userData.profileURL);
          }
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
 
    fetchUserDetails();
  }, [currentUser]);


  const handleGotIt = (path) => {
    navigate(path);
  }

  const steps = [
    "When the owner sees their lost item listed in the system, they must proceed to fill out the Lost Item Claim Form.",
    "The form requires a detailed description of the item, the estimated date and location it was lost, and any unique identifiers.",
    "After submitting the form, the system will display a match percentage based on how closely the provided details align with the found item.",
    "The owner must then go to the Office of Student Affairs (OSA) for the second phase of verification.",
    "During the visit to OSA, the owner must present valid identification, proof of ownership, and the AI match result shown by the system.",
    "If the OSA verifies the claim and approves it, the item will be released to the rightful owner and the system will mark the item as \"Claimed.\"",
  ];

  const buttonPath = `/users/lost-items/procedure/item-details/${user?.uid}`;
  const isButtonActive = location.pathname === buttonPath;

  return (
    // Replaced original background div with style={styles.pageBody}
    <div style={styles.pageBody}>
      <div style={styles.procedureCard}>
        <div style={styles.headerArea}>
          {/* Modernized Icon (Circle with Exclamation is often used for warnings/important steps) */}
          <svg xmlns="http://www.w3.org/2000/svg" style={styles.icon} viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
          </svg>
          <h1 style={styles.mainTitle}>Item Lost Procedure</h1>
        </div>

        <div style={styles.reminderBox}>
            <p style={{color: 'black'}}><strong>Reminders:</strong> To ensure that your lost item is returned only to the rightful owner and handled with transparency and security, all claims must be verified by the Office of Student Affairs (OSA)**.</p>
        </div>
        
        <h2 style={styles.stepTitle}>Step-by-Step Claim Process:</h2>
        
        <ol style={styles.stepList}>
          {steps.map((step, index) => (
            <li key={index} style={styles.stepItem}>
              <span style={styles.stepNumber}>{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <button 
          style={{
            ...styles.gotItButton, 
            ...(isButtonActive ? styles.activeButton : {}),
          }}
          onClick={() => handleGotIt(buttonPath)}
          onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.gotItButtonHover)}
          onMouseOut={(e) => Object.assign(e.currentTarget.style, styles.gotItButton)}
        >
          Got it, Proceed to Report
        </button>
      </div>
    </div>
  );
}

export default UserLostProcedurePage;