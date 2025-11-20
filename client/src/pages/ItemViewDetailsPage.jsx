import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import UserNavigationBar from "../user_components/UserNavigationBar"; // Assuming this should be NavigationBar if used in Admin view
import UserBlankHeader from "../user_components/UserBlankHeader"
// import '../user_pages/styles/ItemMoreDetailsPage.css'; // Replaced with inline styles
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import { useAuth } from "../context/AuthContext"; // Import useAuth to determine user role/context

// Define modern, responsive styles
const styles = {
    // --- MAIN LAYOUT ---
    itemBody: {
        backgroundColor: '#f8f9fa', // Light background
        minHeight: '100vh',
        padding: '20px',
    },
    itemContainer: {
        maxWidth: '1000px',
        width: '100%',
        margin: '30px auto',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        padding: '30px',
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 768 ? '1.5fr 2fr' : '1fr', // Split layout on larger screens
        gap: '40px',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },

    // --- LEFT COLUMN: IMAGE ---
    imageSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        order: window.innerWidth > 768 ? 1 : 2, // Details first on mobile, image first on desktop
    },
    itemImageWrapper: {
        width: '100%',
        paddingTop: '100%', // Creates a square aspect ratio container
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    itemImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    
    // --- RIGHT COLUMN: DETAILS ---
    detailsSection: {
        order: window.innerWidth > 768 ? 2 : 1,
    },
    titleH1: {
        fontSize: '2rem',
        color: '#343a40',
        marginBottom: '5px',
    },
    itemIdP: {
        fontSize: '1rem',
        color: '#6c757d',
        fontWeight: '500',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
        marginBottom: '20px',
    },
    detailH3: {
        fontSize: '1.2rem',
        color: '#333',
        marginTop: '15px',
        marginBottom: '5px',
        borderLeft: '4px solid #333',
        paddingLeft: '10px',
        fontWeight: '600',
    },
    detailP: {
        fontSize: '1rem',
        color: '#495057',
        margin: '0 0 10px 14px',
    },

    // --- USER BLOCKS (Owner/Founder) ---
    userBlockH3: {
        fontSize: '1.2rem',
        color: '#343a40',
        marginTop: '25px',
        marginBottom: '10px',
        borderBottom: '2px solid #eee',
        paddingBottom: '5px',
    },
    userInfoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px',
    },
    userNameInfo: {
        margin: 0,
        fontSize: '1rem',
        color: '#343a40',
    },
    claimButton: {
        backgroundColor: '#28a745', // Green for Claim action
        color: 'white',
        padding: '12px 25px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '30px',
        transition: 'background-color 0.3s',
        alignSelf: 'flex-start',
    },
    guestUserIcon: { // Style for the 'Guest' placeholder icon
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: '#6c757d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
    },
    defaultUserIcon: { // Style for the Initials placeholder icon
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
    }
};

function ItemViewDetailsPage() {
    const { uid } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser; 
    const { role } = useAuth(); // Determine if user is Admin/Staff or Student

    const { item: stateItem, type: stateType } = location.state || {};
    const [item, setItem] = useState(stateItem || null);
    const [type, setType] = useState(stateType || null);
    const [loading, setLoading] = useState(!stateItem);

    const renderUser = (userData, isGuest = false) => {
        if (isGuest) {
            return <div style={styles.guestUserIcon}>Guest</div>;
        } else if (userData?.profileURL) {
            return (
                <img
                    src={userData.profileURL}
                    alt="profile"
                    style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                    }}
                />
            );
        } else {
            const initials = `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`.toUpperCase();
            return <div style={styles.defaultUserIcon}>{initials}</div>;
        }
    };


    useEffect(() => {
        const fetchItem = async () => {
            if (item) return;

            try {
                let docRef = doc(db, "lostItems", uid);
                let docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setItem(docSnap.data());
                    setType("lost");
                } else {
                    docRef = doc(db, "foundItems", uid);
                    docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setItem(docSnap.data());
                        setType("found");
                    }
                }
            } catch (error) {
                console.error("Error fetching item:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [uid, item]);

    if (loading) return <p style={{textAlign: 'center', marginTop: '50px'}}>Loading item details...</p>;
    if (!item) return <p style={{textAlign: 'center', marginTop: '50px'}}>No item data found.</p>;

    
    const handleClaim = () => {
        if (type === "lost") {
            navigate(`/users/found-items/procedure/${user?.uid}`);
        } else if (type === "found") {
            navigate(`/users/lost-items/procedure/${user?.uid}`);
        }
    };
    
 


    const ItemImagePath = item.images?.length > 0 ? item.images[0] : 'placeholder_image_url.png'; // Use a default placeholder if needed

    const showClaimButton = item.status === 'posted' && item.claimStatus !== 'claimed' && user;

    const ownerInfo = type === "lost" ? item.personalInfo : item.claimedBy;
    const founderInfo = type === "lost" ? item.foundBy : item.personalInfo;


    return (
        <>
            <NavigationBar />
            <BlankHeader />
            <div style={styles.itemBody}>
                
                <div style={styles.itemContainer}>

                    <div style={styles.imageSection}>
                        <div style={styles.itemImageWrapper}>
                            <img
                                src={ItemImagePath}
                                alt={item.itemName}
                                style={styles.itemImage}
                            />
                        </div>

                        {showClaimButton && (
                            <button 
                                onClick={handleClaim}
                                style={styles.claimButton}
                            >
                                {type === "lost" ? "Report Item Found" : "Report Item Lost"}
                            </button>
                        )}
                    </div>
                    
                    <div style={styles.detailsSection}>
                        <h1 style={styles.titleH1}>{item.itemName}</h1>
                        <p style={styles.itemIdP}>Item ID No. {item.itemId}</p>

                        <h3 style={styles.detailH3}>{type === "lost" ? "How It Was Lost" : "How It Was Found"}</h3>
                        <p style={styles.detailP}>
                            {type === "lost" 
                                ? item.howItemLost || "No description provided" 
                                : item.howItemFound || "No description provided"}
                        </p>
                        
                        <h3 style={styles.detailH3}>Date:</h3>
                        <p style={styles.detailP}>
                            {type === "lost" 
                                ? item.dateLost ? new Date(item.dateLost).toLocaleDateString() : "N/A"
                                : item.dateFound ? new Date(item.dateFound).toLocaleDateString() : "N/A"}
                        </p>

                        <h3 style={styles.detailH3}>Location:</h3>
                        <p style={styles.detailP}>
                            {type === "lost" ? item.locationLost : item.locationFound}
                        </p>
                        
                        <h3 style={styles.detailH3}>Category:</h3>
                        <p style={styles.detailP}>{item.category}</p>


                        <h3 style={styles.userBlockH3}>
                            {type === "lost" ? "Reported Owner" : "Claimed By "}
                        </h3>
                        <div style={styles.userInfoRow}>
                            {renderUser(ownerInfo, type === "lost" ? item.isGuest : item.claimedBy?.isGuest)}
                            <p style={styles.userNameInfo}>
                                {`${ownerInfo?.firstName || 'Unknown'} ${ownerInfo?.lastName || ''}`.trim()}{" "}
                                – {ownerInfo?.course?.abbr || ownerInfo?.designation || 'N/A'}
                            </p>
                        </div>

                        <h3 style={styles.userBlockH3}>
                            {type === "lost" ? "Reported Founder" : "Reported Founder "}
                        </h3>
                        <div style={styles.userInfoRow}>
                            {renderUser(founderInfo, type === "lost" ? item.foundBy?.isGuest : item.isGuest)}
                            <p style={styles.userNameInfo}>
                                {`${founderInfo?.firstName || 'Unknown'} ${founderInfo?.lastName || ''}`.trim()}{" "}
                                – {founderInfo?.course?.abbr || founderInfo?.designation || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ItemViewDetailsPage;