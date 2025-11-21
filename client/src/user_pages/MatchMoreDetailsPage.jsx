import React, { useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";


// --- Styles Object for Component-Specific CSS ---
const styles = {
  // --- Global Container Styles ---
  pageBody: {
    minHeight: '100vh',
    backgroundColor: '#f4f7f9', // Soft background
    padding: '20px 0',
    fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  },

  // --- Main Reported Item Card ---
  detailHeader: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#143447',
    marginBottom: '20px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr', // Image on left, details on right
    gap: '30px',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '1px solid #ddd',
  },
  imageWrapper: {
    width: '100%',
    paddingTop: '100%', // 1:1 Aspect Ratio
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  itemImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  detailItem: {
    fontSize: '1rem',
    color: '#495057',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  detailKey: {
    fontWeight: '600',
    color: '#343a40',
    marginRight: '5px',
  },

  // --- Match Results Section ---
  matchesSection: {
    marginBottom: '30px',
  },
  matchesTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: '20px',
    borderBottom: '2px solid #000000ff',
    paddingBottom: '5px',
    display: 'inline-block',
  },
  matchesContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
    flexWrap: 'nowrap',
    overflowX: 'scroll',
    width: '100%',
    paddingBottom: '15px',
  },
  matchCard: {
    flexShrink: 0,
    width: '320px',
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '12px',
    backgroundColor: '#fdfdfd',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s',
  },
  matchCardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#143447',
    marginBottom: '10px',
  },
  matchScoreBar: (rate) => ({
    height: '10px',
    width: `${rate}%`,
    backgroundColor: rate >= 75 ? '#28a745' : rate >= 50 ? '#ffc107' : '#dc3545',
    borderRadius: '5px',
    transition: 'width 0.3s',
  }),
  matchScoreLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '5px',
  },

  // --- Status Badge Helper Styles ---
  statusBadgeBase: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    letterSpacing: "0.5px",
    marginTop: '10px',
  },
  statusColors: {
    posted: { backgroundColor: "#007bff", color: "white" }, // Blue
    pending: { backgroundColor: "#ffc107", color: "#333" }, // Yellow/Orange
    cancelled: { backgroundColor: "#dc3545", color: "white" }, // Red
    default: { backgroundColor: "#ccc", color: "#333" },
  }
};


const StatusBadge = ({ status }) => {
    const normStatus = status?.toLowerCase() || 'default';
    const style = styles.statusColors[normStatus] || styles.statusColors.default;
    
    if (normStatus === "posted") style.backgroundColor = "#4CAF50"; // Green for the original code logic
    
    return (
        <span style={{ ...styles.statusBadgeBase, ...style }}>
            {status?.toUpperCase() || 'N/A'}
        </span>
    );
};

// 2. Main Reported Item Details Component
const ItemDetailCard = ({ item }) => (
  <div style={{ paddingRight: '20px' }}>
    <div style={styles.itemGrid}>
        <div style={styles.imageWrapper}>
            <img
                src={item.images?.[0] || 'placeholder.png'}
                alt={item.itemName}
                style={styles.itemImage}
            />
        </div>
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{...styles.titleH1, marginBottom: 0 }}>{item.itemName}</h1>
                <StatusBadge status={item.status} />
            </div>
            <p style={styles.itemIdP}>Item ID: {item.itemId}</p>
            
            <p style={styles.detailItem}><span style={styles.detailKey}>Category:</span> {item.category}</p>
            <p style={styles.detailItem}><span style={styles.detailKey}>Type:</span> {item.type}</p>
            <p style={styles.detailItem}>
                <span style={styles.detailKey}>Date Reported:</span>{" "}
                {item.dateSubmitted ? new Date(item.dateSubmitted).toLocaleDateString("default", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "N/A"}
            </p>
            <p style={styles.detailItem}><span style={styles.detailKey}>Location:</span> {item.location}</p>
            <p style={styles.detailItem}>
                <span style={styles.detailKey}>Description:</span> {item.itemDescription || "No description provided"}
            </p>
        </div>
    </div>
  </div>
);

// 3. Single Match Item Card Component
const MatchItemCard = ({ match, index, itemType }) => {
    const isFoundItem = itemType?.toLowerCase() === "lost" && match.foundItem;
    const isLostItem = itemType?.toLowerCase() === "found" && match.lostItem;
    const matchItem = isFoundItem ? match.foundItem : isLostItem ? match.lostItem : null;
    const locationKey = isFoundItem ? 'locationFound' : 'locationLost';

    if (!matchItem) return null;

    return (
        <div style={styles.matchCard}>
            <h4 style={styles.matchCardTitle}>
                Top {index + 1} 
            </h4>
            
            {matchItem.images?.[0] && (
                <img
                    src={matchItem.images[0]}
                    alt={matchItem.itemName}
                    style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginBottom: "10px",
                    }}
                />
            )}

            <p style={styles.detailItem}><span style={styles.detailKey}>Transaction #:</span> {match.transactionId}</p>
            <p style={styles.detailItem}><span style={styles.detailKey}>Name:</span> {matchItem.itemName}</p>
            <p style={styles.detailItem}><span style={styles.detailKey}>Location:</span> {matchItem[locationKey]}</p>

            {match.scores && (
                <div style={{ marginTop: "15px", paddingTop: "10px", borderTop: '1px dashed #eee' }}>
                    <p style={styles.matchScoreLabel}>Overall Match: {match.scores.overallScore}%</p>
                    <div style={styles.rateBarFull}>
                        <div style={styles.matchScoreBar(match.scores.overallScore)} />
                    </div>
                    <p style={styles.matchScoreLabel}>Description Match: {match.scores.descriptionScore}%</p>
                    <div style={styles.rateBarFull}>
                        <div style={styles.matchScoreBar(match.scores.descriptionScore)} />
                    </div>
                    <p style={styles.matchScoreLabel}>Image Match: {match.scores.imageScore}%</p>
                    <div style={styles.rateBarFull}>
                        <div style={styles.matchScoreBar(match.scores.imageScore)} />
                    </div>
                    
                </div>
            )}
        </div>
    );
};


function MatchMoreDetailsPage() {
  const { uid } = useParams();
  const location = useLocation();
  const { item } = location.state || {};
  const matchesContainerRef = useRef(null);

  // --- FUNCTIONALITY: SCROLL LOGIC (UNCHANGED) ---
  useEffect(() => {
    const scrollSpeed = 3; 
    const container = matchesContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const scrollAmount = (e.deltaY !== 0 ? e.deltaY : e.deltaX) * scrollSpeed;

      if (scrollWidth > clientWidth) {
        if ((scrollAmount < 0 && scrollLeft === 0) || (scrollAmount > 0 && scrollLeft + clientWidth >= scrollWidth)) return;
        e.preventDefault();
        container.scrollLeft += scrollAmount;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  if (!item) return <p style={{textAlign: 'center', marginTop: '50px'}}>No match data provided.</p>;

  const filteredMatches = item.topMatches?.filter((match) => {
    if (item.type?.toLowerCase() === "found") {
      return match.lostItem; 
    }
    if (item.type?.toLowerCase() === "lost") {
      return match.foundItem; 
    }
    return true;
  });


  return (
    <>
      <UserNavigationBar />
      <UserBlankHeader />
      <div style={styles.pageBody}>
        <div style={styles.mainContainer}>

          <h2 style={styles.detailHeader}>Item Match Management</h2>

          {/* Reported Item Details Section */}
          <ItemDetailCard item={item} />
          
          {/* Matching Results Section */}
          <div
            className="more-matches-results"
            style={styles.matchesSection}
          >
            <h2 style={styles.matchesTitle}>
               Matching Results 
            </h2>
            <div
              ref={matchesContainerRef}
              className="matches-container"
              style={styles.matchesContainer}
            >
              <style>{`
                .matches-container::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {filteredMatches?.length > 0 ? (
                filteredMatches.map((match, index) => (
                  <MatchItemCard 
                    key={index} 
                    match={match} 
                    index={index} 
                    itemType={item.type} 
                  />
                ))
              ) : (
                <p style={{...styles.detailItem, textAlign: 'center', width: '100%'}}>
                  No high-confidence matches found for this item.
                </p>
              )}
            </div>
        </div>
        </div>
      </div>
    </>
  );
}

export default MatchMoreDetailsPage;