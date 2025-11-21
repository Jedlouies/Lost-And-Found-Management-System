import React, { useState, useRef, useEffect } from 'react';
import UserNavigationBar from '../user_components/UserNavigationBar';
import UserLostHeader from '../user_components/UserLostHeader';
import 'bootstrap/dist/css/bootstrap.min.css';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from 'react-bootstrap'; 
import BlankHeader from '../components/BlankHeader';
import UserBlankHeader from '../user_components/UserBlankHeader';

// 🎨 MODERN UI STYLES DEFINITION (COPIED FROM FoundItemsPage.jsx)
const styles = {
    pageBody: {
        backgroundColor: '#f4f7f9',
        minHeight: '100vh',
        padding: '20px 0',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    pageContainer: {
        maxWidth: '1200px',
        width: '95%',
        margin: '20px auto',
        padding: '20px 0',
    },
    // --- Header & Controls ---
    controlPanel: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '30px',
        padding: '0 10px',
    },
    titleSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    mainTitle: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#143447',
        marginBottom: '10px',
    },
    searchFilterWrapper: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginTop: '10px',
        flexWrap: 'wrap',
    },
    searchInput: {
        padding: '8px 15px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        width: '300px',
        minWidth: '200px',
        backgroundColor: 'white',
        color: '#000',
    },
    selectCategory: {
        padding: '8px 15px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        backgroundColor: 'white',
        color: '#475C6F',
        width: '200px',
        cursor: 'pointer',
    },
    // --- Saved Items Icon ---
    savedIconWrapper: {
        position: 'relative',
        cursor: 'pointer',
        padding: '5px',
        marginTop: '5px',
        transition: 'color 0.2s',
    },
    savedBadge: {
        position: 'absolute',
        top: '-5px',
        right: '0px',
        background: 'red',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold',
        lineHeight: 1,
    },
    // --- Item Grid ---
    itemGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px',
        padding: '10px',
    },
    // --- Item Card ---
    itemCard: {
        width: '300px', // Fixed size for uniformity
        height: '350px', 
        minWidth: '300px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '150px',
        objectFit: 'cover',
        backgroundColor: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6c757d',
    },
    cardDetails: {
        padding: '15px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    cardItemName: {
        fontSize: '1.2rem',
        fontWeight: '600',
        color: '#333',
        marginBottom: '5px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    cardDescription: {
        fontSize: '0.85rem',
        color: '#6c757d',
        height: '40px',
        overflow: 'hidden',
        lineHeight: '1.4',
        marginBottom: '10px',
    },
    // --- User Info (Reporter) ---
    reporterWrapper: { 
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderTop: '1px solid #eee',
        paddingTop: '10px',
        marginTop: 'auto',
    },
    avatar: { 
        width: '40px',
        height: '40px',
        borderRadius: '50%', 
        objectFit: 'cover',
        backgroundColor: 'navy',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        flexShrink: 0, 
    },
    avatarImage: { 
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    avatarGuest: {
        backgroundColor: '#6c757d',
        fontSize: '10px',
    },
    infoText: { 
        fontSize: '0.8rem',
        lineHeight: '1.3',
        flexGrow: 1,
        minWidth: 0, 
    },
    infoName: {
        fontWeight: '600',
        color: '#143447',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    // --- Modal Styles ---
    modalCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        width: '450px',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    },
    modalItemWrapper: {
        border: '1px solid #ddd',
        padding: '12px',
        marginBottom: '10px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.2s',
    },
    modalItemContent: {
        display: 'flex',
        gap: '15px',
        flex: 1,
        cursor: 'pointer',
    },
    modalImage: {
        width: '50px',
        height: '50px',
        borderRadius: '5px',
        objectFit: 'cover',
    },
    modalRemoveBtn: {
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
    },
    modalCloseBtn: {
        marginTop: "20px",
        background: "#143447",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "10px 12px",
        cursor: "pointer",
        width: "100%",
    },
    postButton: (disabled) => ({
        backgroundColor: disabled ? "#ccc" : "#143447", // Red for Lost, gray if disabled
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "8px",
        border: "none",
        padding: "8px 15px",
        color: "white",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        transition: "background-color 0.2s",
    }),
    actionRow: { // NEW style for the single horizontal row
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px',
        width: '100%',
        paddingBottom: '10px',
    },
    searchFilterWrapper: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    actionGroupRight: { // NEW style for grouping Post button and Saved icon
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
};

const ItemCard = ({ item, navigate, toggleSave, isSaved }) => {
    // NOTE: For Lost Items, the 'personalInfo' field holds the owner/reporter.
    const person = item.personalInfo;
    const initials = `${person?.firstName?.[0] || ''}${person?.lastName?.[0] || ''}`.toUpperCase();
    const description = item.howItemLost; // Use howItemLost for Lost Items
    
    const renderAvatar = () => {
        const baseAvatarStyle = {
            ...styles.avatar,
            flexShrink: 0,
            width: '40px',
            height: '40px',
        };

        if (item.isGuest) {
            return <div style={{ ...baseAvatarStyle, ...styles.avatarGuest }}>Guest</div>;
        }
        if (person?.profileURL) {
            return <img src={person.profileURL} alt="profile" style={styles.avatarImage} />;
        }
        return <div style={baseAvatarStyle}>{initials}</div>;
    };
    
    return (
        <div style={styles.itemCard}>
            <div
                onClick={() =>
                    navigate(`/users/lost-items/more-details/${item.id}`, { // Navigate to lost item details
                        state: { type: "lost", item },
                    })
                }
            >
                <div style={styles.cardImage}>
                    {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.itemName} style={styles.cardImage} />
                    ) : (
                        <div style={styles.cardImage}>No Image</div>
                    )}
                </div>
                
                <div style={styles.cardDetails}>
                    <h4 style={styles.cardItemName}>{item.itemName}</h4>
                    <p style={styles.cardDescription}>
                        {description && description.length > 100 ? description.slice(0, 100) + "..." : description || "No description provided."}
                    </p>
                    
                    <div style={styles.reporterWrapper}>
                        {renderAvatar()}
                        <div style={styles.infoText}>
                            <strong style={styles.infoName}>
                                {item.isGuest ? 'Guest Reporter' : `${person?.firstName || 'Unknown'} ${person?.lastName || ''}`.trim()}
                            </strong>
                            <br />
                            {/* Display course abbreviation from personalInfo for Lost Item Reporter */}
                            <span style={{color: '#143447'}}>{person?.course?.abbr}</span> 
                        </div>
                    </div>
                </div>
            </div>

            <div
                onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(item);
                }}
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    cursor: "pointer",
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: '50%',
                    padding: '5px',
                }}
            >
                {isSaved ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#ffc107" className="bi bi-star-fill" viewBox="0 0 16 16">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#6c757d" className="bi bi-star" viewBox="0 0 16 16">
                        <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
                    </svg>
                )}
            </div>
        </div>
    );
};


function UserLostItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const lostContainerRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingLost, setLoadingLost] = useState(true);
  
  
  

  const navigate = useNavigate();

  // --- BEGIN: MOVED AUTH/PROFILE COMPLETENESS LOGIC ---
  const requiredFields = ["firstName", "lastName", "email", "contactNumber", "address", "course", "gender", "section"];
  const hasEmptyFields = userData
    ? requiredFields.some((field) => {
        const value = userData[field];
        // Check if value is undefined, null, or whitespace/empty string
        return value === undefined || value === null || (typeof value === 'string' && value.trim() === "");
      })
    : true; // Default to true if userData is null (i.e., still loading)

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
  // --- END: MOVED AUTH/PROFILE COMPLETENESS LOGIC ---

  // FIX: Use onSnapshot for real-time updates of lost items
  useEffect(() => {
    setLoadingLost(true);

    const unsubscribe = onSnapshot(
      collection(db, 'lostItems'),
      (snapshot) => {
        const lostData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLostItems(lostData);
        setLoadingLost(false);
      },
      (error) => {
        console.error("Error fetching lost items:", error);
        setLoadingLost(false);
      }
    );

    return () => unsubscribe();
  }, []);


    useEffect(() => {
      if (!currentUser) return;

      const fetchSaved = async () => {
        try {
          const snapshot = await getDocs(collection(db, "users", currentUser.uid, "savedItems"));
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setSavedItems(items);
        } catch (error) {
          console.error("Error fetching saved items:", error);
        }
      };

      fetchSaved();
    }, [currentUser]);

    const toggleSave = async (item) => {
      if (!currentUser) {
        alert("Please login to save items");
        return;
      }

      const ref = doc(db, "users", currentUser.uid, "savedItems", item.id);

      if (savedItems.some((saved) => saved.id === item.id)) {
        await deleteDoc(ref);
        setSavedItems((prev) => prev.filter((saved) => saved.id !== item.id));
      } else {
        await setDoc(ref, item);
        setSavedItems((prev) => [...prev, item]);
      }
    };

  const filteredLostItems = [...lostItems]
    .filter(item => item.claimStatus !== "claimed")
    .filter(item => item.status === "posted")
    .filter(item => item.archivedStatus !== true)
    .filter(item => {
      const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost));

  return (
    <>
      {/* --- SAVED ITEMS MODAL (Remains identical) --- */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)} 
        >
          <div
            style={styles.modalCard}
            onClick={(e) => e.stopPropagation()} 
          >
            <h3 style={{ marginBottom: "20px", color: "#143447", fontWeight: '600' }}>Saved Items</h3>
            
            {savedItems.length > 0 ? (
              savedItems.map((item) => (
                <div
                  key={item.id}
                  style={styles.modalItemWrapper}
                >
                  <div
                    style={styles.modalItemContent}
                    onClick={() =>
                      navigate(`/users/lost-items/more-details/${item.id}`, {
                        state: { type: "lost", item },
                      })
                    }
                  >
                    {item.images?.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt="saved"
                        style={styles.modalImage}
                      />
                    ) : (
                      <div style={{ ...styles.modalImage, background: "#eee" }} />
                    )}
                    <div>
                      <strong style={{ color: "#143447" }}>
                        {item.personalInfo?.firstName}'s {item.itemName}
                      </strong>
                      <p style={{ fontSize: "12px", margin: 0, color: "#6c757d" }}>
                        {item.personalInfo?.course?.abbr} Student
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleSave(item);
                    }}
                    style={styles.modalRemoveBtn}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p style={{ color: "#6c757d" }}>No saved items yet.</p>
            )}

            <button
              onClick={() => setShowModal(false)}
              style={styles.modalCloseBtn}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <UserNavigationBar />
       <UserBlankHeader />

      <div style={styles.pageBody}>
        
        <div style={styles.pageContainer}>

          <h1 style={styles.mainTitle}>Lost Items</h1>
          
          <div style={styles.controlPanel}>
            
            {/* Single Row Container */}
            <div style={styles.actionRow}>
                
                {/* 1. Search and Category (Left Group) */}
                <div style={styles.searchFilterWrapper}>
                    <input
                      type="text"
                      placeholder="Search items by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchInput}
                    />
                    <select
                      name="category"
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={styles.selectCategory}
                    >
                        <option value="">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Clothing & Apparel">Clothing & Apparel</option>
                        <option value="Bags & Luggage">Bags & Luggage</option>
                        <option value="Documents & IDs">Documents & IDs</option>
                        <option value="Books & Stationery">Books & Stationery</option>
                        <option value="Household Items">Household Items</option>
                        <option value="Sports & Fitness">Sports & Fitness</option>
                        <option value="Health & Personal Care">Health & Personal Care</option>
                        <option value="Toys & Games">Toys & Games</option>
                        <option value="Food & Beverages">Food & Beverages</option>
                        <option value="Automotive">Automotive Items</option>
                        <option value="Musical Instruments">Musical Instruments</option>
                        <option value="Pet Items">Pet Items</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                {/* 2. Post Button and Saved Icon (Right Group) */}
                <div style={styles.actionGroupRight}>
                    
                    <button
                        onClick={() => {
                            if (!hasEmptyFields) {
                                navigate(`/users/lost-items/procedure/${currentUser?.uid}`);
                            }
                        }}
                        disabled={hasEmptyFields}
                        style={styles.postButton(hasEmptyFields)} 
                        title={hasEmptyFields ? "Complete profile to post" : "Post a Lost Item"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
                        Post
                    </button>

                    <div style={styles.savedIconWrapper} onClick={() => setShowModal(true)}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            fill="#143447"
                            className="bi bi-bookmark"
                            viewBox="0 0 16 16"
                        >
                            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                        </svg>
                        {savedItems.length > 0 && (
                            <span style={styles.savedBadge}>
                                {savedItems.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>
          </div>


          {loadingLost ? (
            <div 
              style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                marginTop: "100px" 
              }}
            >
              <Spinner animation="border" style={{ width: "60px", height: "60px" }} />
            </div>
          ) : (
            <div style={styles.itemGrid} ref={lostContainerRef}>
              {filteredLostItems.length > 0 ? (
                filteredLostItems.map((item) => {
                  const isSaved = savedItems.some((saved) => saved.id === item.id);
                  return (
                    <ItemCard item={item} navigate={navigate} toggleSave={toggleSave} isSaved={isSaved} key={item.id} />
                  );
                })
              ) : (
                <p style={{ color: "#6c757d", gridColumn: '1 / -1', textAlign: 'center' }}>No lost items matched your criteria.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default UserLostItemsPage;