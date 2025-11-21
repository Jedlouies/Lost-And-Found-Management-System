import React from 'react';
// Removed: import './styles/FoundMatchResults.css'; - styles are now inline
import UserFoundItemsPage from './UserFoundItemsPage';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from "firebase/auth";
import RatingModal from "../components/RatingModal";



export default function FoundMatchResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const matches = (state?.matches || [])
    .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
    .slice(0, 4); 

  const auth = getAuth();
  const user = auth.currentUser; 

  const [selectedItem, setSelectedItem] = React.useState(null);
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  
  
  const handleNavigate = () => {
    setShowRatingModal(true)
  }

  const handleMatchAnother = (path) => {
    navigate(path)
  }
  
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Simple visual feedback for the user
      alert(`Transaction ID ${text} copied to clipboard!`); 
    });
  };

  const styles = {
    // General styles for main container and background
    mainContainer: {
      minHeight: '100vh',
      backgroundColor: '#f4f4f4', // Light gray background
      padding: '20px 0 100px 0',
      fontFamily: 'Arial, sans-serif',
    },
    resultsContainer: {
      width: '95%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
    },
    heading: {
      color: '#475C6F',
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '30px',
      borderBottom: '3px solid #BDDDFC',
      paddingBottom: '10px',
    },
    noMatchContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh", 
      width: "100%",
    },
    noMatchText: {
      color: "#475C6F",
      fontSize: "20px",
      textAlign: 'center',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    },

    // Card Styles
    matchCardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '25px',
    },
    matchingCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
      padding: '25px',
      textAlign: 'center',
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      overflow: 'hidden',
    },
    // Rank Number
    rankNumber: {
        position: 'absolute',
        top: '10px',
        right: '20px',
        fontSize: '48px',
        fontWeight: '900',
        color: '#BDDDFC', // Light primary color
        zIndex: 1,
    },
    // Item Image
    itemImage: {
        border: '3px solid #475C6F',
        width: '120px',
        height: '120px',
        objectFit: 'cover',
        borderRadius: '50%',
        marginTop: '15px',
        marginBottom: '15px',
    },
    // Item Name
    itemName: {
        color: '#475C6F',
        fontSize: '20px',
        fontWeight: '700',
        marginBottom: '20px',
    },

    // Matching Results Section
    matchingResults: {
        textAlign: 'left',
        marginBottom: '25px',
    },
    progressBarFull: {
        height: '10px',
        backgroundColor: '#e0e0e0',
        borderRadius: '5px',
        marginTop: '5px',
        overflow: 'hidden',
    },
    progressBarPercentage: (score) => ({
        height: '100%',
        backgroundColor: score >= 60 ? '#4caf50' : '#f31212ff', // Green for positive match
        width: `${score}%`, // Directly use score as percentage
        transition: 'width 0.5s ease-out',
    }),
    similarityText: {
        color: '#475C6F',
        fontSize: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
    },
    scorePercent: (score) => ({
        fontWeight: 'bold',
        color: score >= 60 ? '#4caf50' : '#f31212ff', // Highlight good scores
    }),

    // Owner/Description Section
    resultsMore: {
        textAlign: 'left',
        paddingTop: '15px',
        borderTop: '1px solid #eee',
    },
    transactionID: {
        color: '#777',
        fontSize: '12px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
    },
    copyIcon: {
        marginLeft: '5px',
        cursor: 'pointer',
        color: '#475C6F',
    },
    profileInfo: {
        backgroundColor: '#e9ecef',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
    },
    profileImage: {
        width: '45px',
        height: '45px',
        objectFit: 'cover',
        borderRadius: '50%',
        marginRight: '10px',
    },
    ownerName: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#475C6F',
        marginBottom: '0px',
    },
    ownerCourse: {
        fontSize: '12px',
        color: '#6c757d',
        fontStyle: 'italic',
    },
    descriptionQuote: {
        color: '#475C6F',
        width: '20px',
        height: '20px',
        marginBottom: '5px',
    },
    howItemDescription: {
        color: '#475C6F',
        fontSize: '13px',
        height: '60px', // Limit height for consistency
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginBottom: '20px',
        lineHeight: '1.4',
    },

    // Action Buttons
    detailsButton: {
        backgroundColor: '#475C6F',
        color: 'white',
        padding: '8px 20px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        width: '100%',
        transition: 'background-color 0.2s',
    },
    detailsButtonHover: {
        backgroundColor: '#384d5c',
    },

    // Footer Buttons
    footerContainer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'white',
        borderTop: '1px solid #ddd',
        padding: '15px 5%',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
    },
    footerButton: {
        padding: '12px 25px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '16px',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    continueButton: {
        backgroundColor: '#475C6F',
        color: 'white',
    },
    matchAnotherButton: {
        backgroundColor: '#BDDDFC',
        color: '#475C6F',
        border: '1px solid #475C6F',
    },

    // Floating Panel (Detail Modal)
    floatingPanel: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    floatingPanelContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        width: '90%',
        maxWidth: '700px',
        position: 'relative',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        display: 'flex',
        gap: '20px',
        textAlign: 'left',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#475C6F',
    },
    detailImage: {
      width: '250px',
      height: '250px',
      objectFit: 'cover',
      borderRadius: '10px',
    },
    detailText: {
        fontSize: '14px',
        color: '#475C6F',
        flexGrow: 1,
    },
    detailHeading: {
        color: '#475C6F',
        fontSize: '22px',
        marginBottom: '15px',
        borderBottom: '1px dashed #BDDDFC',
        paddingBottom: '5px',
    },
    detailItem: {
        marginBottom: '8px',
    }
  };


  return (
    <>
        {selectedItem && (
        <div style={styles.floatingPanel}>
          <div style={styles.floatingPanelContent}>
            <button style={styles.closeButton} onClick={() => setSelectedItem(null)}>
              &times;
            </button>
            
            {selectedItem.images?.[0] && (
              <img 
                src={selectedItem.images[0]} 
                alt="Lost Item" 
                style={styles.detailImage} 
              />
            )}
            <div style={styles.detailText}>
              <h2 style={styles.detailHeading}>{selectedItem.itemName}</h2>
              
              <p style={styles.detailItem}><b>Item ID:</b> {selectedItem.itemId}</p>
              <p style={styles.detailItem}><b>Category:</b> {selectedItem.category}</p>
              <p style={styles.detailItem}><b>Location Lost:</b> {selectedItem.locationLost}</p>
              <p style={styles.detailItem}>
                <b>Date Lost:</b> {selectedItem.dateLost 
                  ? new Date(selectedItem.dateLost).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) 
                  : "N/A"}
              </p>
              <p style={styles.detailItem}><b>Description:</b> {selectedItem.itemDescription || "No detailed description provided"}</p>
              <p style={styles.detailItem}><b>How Lost:</b> {selectedItem.howItemLost || "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      <div style={styles.mainContainer}>
       
    <div style={styles.resultsContainer}>
        <h1 style={styles.heading}>Matching Found Item Results</h1>

        {matches.length === 0 && (
            <div style={styles.noMatchContainer}>
                <p style={styles.noMatchText}>
                    No immediate close matches found. <br/> 
                    You can still click **Continue** to proceed or **Match Another** to submit a new report.
                </p>
            </div>
        )}

      <div style={styles.matchCardGrid}>
        {matches.map((match, index) => {
            const lostItem = match.lostItem || {};
            const posterInfo = lostItem.personalInfo || {};
            const scores = match.scores || {};
            
            // Format score values
            const formatScore = (score) => Math.round(score || 0);
            const overallScore = formatScore(scores.overallScore);
            const imageScore = formatScore(scores.imageScore);
            const nameScore = formatScore(scores.nameScore);
            const descriptionScore = formatScore(scores.descriptionScore);
            const locationScore = formatScore(scores.locationScore);


            return (
              <div key={index} style={styles.matchingCard}>
                
                <p style={styles.rankNumber}>
                  #{index + 1}
                </p>
                <h2 style={styles.itemName}>
                  {lostItem.itemName || 'Unnamed Lost Item'}
                </h2>
                {lostItem.images && lostItem.images.length > 0 && (
                  <img
                    src={lostItem.images[0]}
                    alt="Lost Item"
                    style={styles.itemImage}
                  />
                )}

                {/* Similarity Scores */}
                <div style={styles.matchingResults}>
                    <p style={styles.similarityText}>
                        <strong>Overall Match:</strong> 
                        <span style={styles.scorePercent(overallScore)}>{overallScore}%</span>
                    </p>
                    <div style={styles.progressBarFull}>
                        <div style={styles.progressBarPercentage(overallScore)}></div>
                    </div>
                    
                    <br />
                    
                    <p style={styles.similarityText}>
                        <strong>Image Similarity:</strong> 
                        <span style={styles.scorePercent(imageScore)}>{imageScore}%</span>
                    </p>
                    <div style={styles.progressBarFull}>
                        <div style={styles.progressBarPercentage(imageScore)}></div>
                    </div>
                    
                    <br />
                    
                    <p style={styles.similarityText}>
                        <strong>Name Match:</strong> 
                        <span style={styles.scorePercent(nameScore)}>{nameScore}%</span>
                    </p>
                    <div style={styles.progressBarFull}>
                        <div style={styles.progressBarPercentage(nameScore)}></div>
                    </div>
                    
                    <br />
                    
                    <p style={styles.similarityText}>
                        <strong>Description Match:</strong> 
                        <span style={styles.scorePercent(descriptionScore)}>{descriptionScore}%</span>
                    </p>
                    <div style={styles.progressBarFull}>
                        <div style={styles.progressBarPercentage(descriptionScore)}></div>
                    </div>
                    
                    <br />
                    
                    <p style={styles.similarityText}>
                        <strong>Location Match:</strong> 
                        <span style={styles.scorePercent(locationScore)}>{locationScore}%</span>
                    </p>
                    <div style={styles.progressBarFull}>
                        <div style={styles.progressBarPercentage(locationScore)}></div>
                    </div>
                </div>

                {/* Poster Info and Description */}
                <div style={styles.resultsMore}>
                    <p style={styles.transactionID}>
                      <strong>Transaction ID:</strong> {match.transactionId}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="14" 
                        height="14" 
                        fill="currentColor" 
                        className="bi bi-copy" 
                        viewBox="0 0 16 16" 
                        style={styles.copyIcon}
                        onClick={() => handleCopy(match.transactionId)}
                      >
                        <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                      </svg>
                    </p>

                    <div style={styles.profileInfo}>
                        <img src={posterInfo.profileURL} alt="Poster" style={styles.profileImage}/>
                        <div>
                            <p style={styles.ownerName}>
                              {posterInfo.firstName} {posterInfo.lastName}
                            </p>
                            <p style={styles.ownerCourse}>
                              {posterInfo.course && posterInfo.course.abbr || "N/A"}
                            </p>
                        </div>
                    </div>
                    
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-quote" viewBox="0 0 16 16" style={styles.descriptionQuote}>
                      <path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388q0-.527.062-1.054.093-.558.31-.992t.559-.683q.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 9 7.558V11a1 1 0 0 0 1 1zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612q0-.527.062-1.054.094-.558.31-.992.217-.434.559-.683.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 3 7.558V11a1 1 0 0 0 1 1z"/>
                    </svg>
                    <p style={styles.howItemDescription}>{lostItem.howItemLost}</p>
                    
                    <div style={{marginTop: '10px'}}>
                      <button 
                        onClick={() => setSelectedItem(lostItem)}
                        style={styles.detailsButton}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.detailsButtonHover.backgroundColor}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.detailsButton.backgroundColor}
                      >
                        View Details
                      </button>
                    </div>
          
                </div>
                
              </div>
            );
        })}
      </div>
      </div>
      
      {/* Footer Buttons */}
      <div style={styles.footerContainer}>
        <button 
          style={{...styles.footerButton, ...styles.continueButton}} 
          onClick={handleNavigate}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.detailsButtonHover.backgroundColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.continueButton.backgroundColor}
        >
          Continue
        </button>
        <button 
          style={{...styles.footerButton, ...styles.matchAnotherButton}} 
          onClick={() => handleMatchAnother(`/users/found-items/procedure/item-details/${user?.uid}`)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#a7cce2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.matchAnotherButton.backgroundColor}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-arrow-repeat" viewBox="0 0 16 16">
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9"/>
            <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"/>
          </svg>
          Match Another Report
        </button>
      
      </div>

      </div>
        {showRatingModal && <RatingModal onClose={() => setShowRatingModal(false)} />}
    </>
  );
}