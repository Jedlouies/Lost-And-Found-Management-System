import React from "react";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header'
import { auth } from "../firebase";

export default function GuestReportPage() {
  const navigate = useNavigate();
  
  // --- Start: Helper Functions (Unchanged Functionality) ---
  const handleChoice = (type) => {

    const uid = auth.currentUser?.uid; 
    if (!uid) {
      console.error("No user is signed in");
      return;
    }
    if (type === "lost") {
      navigate(`/guest/lost/${auth.currentUser?.uid}`);
    } else if (type === "found") {
      navigate(`/guest/found/${auth.currentUser?.uid}`);
    }
  };
  // --- End: Helper Functions ---

  // --- Start: Inline Styles ---
  const styles = {
    // Main Background Container
    guestContainer: {
        width: '100%',
        minHeight: '120vh',
        background: 'linear-gradient(135deg, #475C6F 0%, #1c2c36 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px 20px',
        textAlign: 'center',
    },
    // Heading
    heading: {
        color: 'white',
        fontSize: '2.5rem',
        marginBottom: '10px',
        fontWeight: '700',
        lineHeight: 1.2,
    },
    // Subheading
    subheading: {
        color: '#E0E0E0',
        fontSize: '1.1rem',
        marginBottom: '40px',
    },
    // Button container
    buttonGroup: {
        display: 'flex',
        gap: '25px',
        flexWrap: 'wrap', // Responsive wrapping
        justifyContent: 'center',
        marginTop: '20px',
    },
    // Base button style
    baseButton: {
        padding: '15px 30px',
        fontSize: '1.1rem',
        fontWeight: '600',
        borderRadius: '10px',
        border: '3px solid',
        cursor: 'pointer',
        minWidth: '200px',
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
    },
    // Lost button style
    lostButton: {
        backgroundColor: '#BDDDFC', // Light Blue
        color: '#143447',
        borderColor: '#BDDDFC',
    },
    // Found button style
    foundButton: {
        backgroundColor: 'transparent',
        color: 'white',
        borderColor: 'white',
    },
    // Hover effects (can be applied inline or rely on external CSS if necessary)
    lostButtonHover: {
        backgroundColor: '#a7cce2',
        borderColor: '#a7cce2',
    },
    foundButtonHover: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: '#f0f0f0',
    }
  };
  // --- End: Inline Styles ---

  return (
    <>
        <Header className="header"></Header>
        <div style={styles.guestContainer}>
          
          <h1 style={styles.heading}>When losing something <br /> doesn’t mean it’s gone forever </h1>
          <p style={styles.subheading}>Please choose what you want to report:</p>

          <div style={styles.buttonGroup}>
            <button
                style={{ ...styles.baseButton, ...styles.lostButton }}
                onClick={() => handleChoice("lost")}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.lostButtonHover.backgroundColor; e.currentTarget.style.borderColor = styles.lostButtonHover.borderColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = styles.lostButton.backgroundColor; e.currentTarget.style.borderColor = styles.lostButton.borderColor; }}
            >
              I Lost an Item
            </button>
            <button
                style={{ ...styles.baseButton, ...styles.foundButton }}
                onClick={() => handleChoice("found")}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = styles.foundButtonHover.backgroundColor; e.currentTarget.style.borderColor = styles.foundButtonHover.borderColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = styles.foundButton.backgroundColor; e.currentTarget.style.borderColor = styles.foundButton.borderColor; }}
            >
              I Found an Item
            </button>
          </div>
        </div>

    </>
  );
}