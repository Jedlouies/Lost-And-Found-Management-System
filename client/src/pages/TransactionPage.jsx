import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import NavigationBar from "../components/NavigationBar";
// import "./styles/TransactionPage.css"; // Replaced with inline styles
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import BlankHeader from "../components/BlankHeader";
import FloatingAlert from "../components/FloatingAlert";
import { useAuth } from "../context/AuthContext";

import { Modal, Button, Form, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// 🎨 MODERN STYLES DEFINITION
const styles = {
    // --- LAYOUT CONTAINERS ---
    transactionBody: {
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        padding: '20px 0',
    },
    transactionContent: {
        maxWidth: '1200px',
        width: '95%',
        margin: '20px auto',
        display: 'grid',
        // Responsive grid: 2 columns above 992px, 1 column below
        gridTemplateColumns: window.innerWidth > 992 ? '2fr 1fr 2fr' : '1fr',
        gap: '20px',
        alignItems: 'start', // Align items to the top of the container
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },

    // --- CARD STYLES ---
    itemCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    scoreCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        padding: '25px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        // Span two columns on small screens
        gridColumn: window.innerWidth <= 992 ? '1 / -1' : 'auto', 
    },

    // --- ITEM DETAILS ---
    itemTitle: {
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#343a40',
        margin: '10px 0 5px',
    },
    itemId: {
        fontSize: '0.85rem',
        color: '#6c757d',
        marginBottom: '20px',
    },
    itemImage: {
        width: '100%',
        maxWidth: '250px',
        height: '250px',
        borderRadius: '10px',
        objectFit: 'cover',
        marginBottom: '20px',
    },
    userInfoBox: {
        width: '90%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#f1f1f1',
        padding: '12px',
        borderRadius: '10px',
        marginBottom: '20px',
    },
    detailGrid: {
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        fontSize: '0.9rem',
    },
    detailLabel: {
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: '2px',
    },
    detailText: {
        color: '#495057',
        wordWrap: 'break-word',
    },
    
    // --- SCORE SECTION ---
    scoreTitle: {
        fontSize: '1.5rem',
        color: '#007bff',
        marginBottom: '20px',
    },
    progressBarFull: {
        width: '100%',
        backgroundColor: '#e9ecef',
        borderRadius: '5px',
        height: '10px',
        marginBottom: '15px',
    },
    // Progress bar color is now determined in the loop based on the key, but default green is kept here
    progressBarPercentage: { 
        height: '100%',
        borderRadius: '5px',
        transition: 'width 0.5s ease-in-out',
    },
    scoreRow: {
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '15px',
        alignItems: 'flex-start',
    },
    scoreRate: {
        fontSize: '0.9rem',
        fontWeight: '600',
        // Default color changed to #333
        color: '#333', 
        marginBottom: '5px',
    },

    // --- ACTION BUTTONS ---
    actionButtonContainer: {
        gridColumn: '1 / -1', // Take full width below the grid
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '20px',
    },
    processButton: {
        padding: '12px 30px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        fontWeight: '600',
        fontSize: '1.1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'background-color 0.3s',
    },
    changeButton: {
        padding: '12px 30px',
        borderRadius: '8px',
        border: '1px solid #6c757d',
        backgroundColor: 'white',
        color: '#6c757d',
        fontWeight: '600',
        fontSize: '1.1rem',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    }
};


function TransactionPage() {
    const navigate = useNavigate();
    const auth = getAuth();
    const { currentUser } = useAuth();
    const user = auth.currentUser;

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [alert, setAlert] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const capitalizeFirstLetter = (str) => {
    // 1. Handle empty or non-string inputs
    if (!str || typeof str !== 'string') {
        return str;
    }
    
    // 2. Get the first character and convert it to uppercase
    const firstLetter = str.charAt(0).toUpperCase();
    
    // 3. Get the rest of the string starting from the second character
    const restOfString = str.slice(1);
    
    // 4. Combine them
    return firstLetter + restOfString;
};

    const ProfileAvatar = ({ personalInfo }) => {
        const size = 50;
        const baseStyle = {
            width: size,
            height: size,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
        };

        if (personalInfo?.firstName === "Guest" || personalInfo?.isGuest) {
            return (
                <div style={{ ...baseStyle, backgroundColor: "#6c757d", color: "white", fontSize: "12px" }}>
                    Guest
                </div>
            );
        } else if (!personalInfo?.profileURL) {
            const initials = `${personalInfo?.firstName?.[0] || ""}${
                personalInfo?.lastName?.[0] || ""
            }`.toUpperCase();

            return (
                <div style={{ ...baseStyle, backgroundColor: "#007bff", color: "white", fontSize: "19px" }}>
                    {initials || "?"}
                </div>
            );
        } else {
            return (
                <img
                    src={personalInfo.profileURL}
                    alt="profile"
                    style={{
                        width: size,
                        height: size,
                        borderRadius: "50%",
                        objectFit: "cover",
                    }}
                />
            );
        }
    };


    useEffect(() => {
        // Only show the modal if no match is selected yet
        if (!selectedMatch) {
             setIsModalOpen(true); 
        }
    }, [selectedMatch]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setAlert({
                message: "Please enter a transaction ID.",
                type: "warning",
            });
            return;
        }

        try {
            setLoading(true);
            const matchesRef = collection(db, "matches");
            const snapShot = await getDocs(matchesRef);

            const foundMatch = snapShot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .find(
                    (match) =>
                        match.transactionId?.toLowerCase() === searchQuery.toLowerCase()
                );

            if (foundMatch) {
                if (foundMatch.claimStatus === "claimed") {
                    setAlert({
                        message: "Item already claimed!",
                        type: "warning",
                    });
                    setLoading(false);
                    return;
                }
                setSelectedMatch(foundMatch);
                setIsModalOpen(false);
                setAlert(null);
            } else {
                setSelectedMatch(null);
                setAlert({
                    message: "No transaction found with that ID.",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error fetching match:", error);
            setAlert({
                message: "Error searching for transaction.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const renderItemDetails = (item, isLost) => {
        if (!item) return <p>No item details available.</p>;

        const dateLabel = isLost ? "Date Lost" : "Date Found";
        const locationLabel = isLost ? "Location Lost" : "Location Found";
        const descriptionLabel = isLost ? "Description" : "Description";
        const howLabel = isLost ? "How item lost" : "How item found";

        const primaryDate = isLost ? item.dateLost : item.dateFound;
        const primaryLocation = isLost ? item.locationLost : item.locationFound;
        const description = item.itemDescription;
        const howText = isLost ? item.howItemLost : item.howItemFound;
        
        const personalInfo = item.personalInfo;

        return (
            <>
                <div style={styles.userInfoBox}>
                    <ProfileAvatar personalInfo={personalInfo} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "15px", fontWeight: "bold" }}>
                            {personalInfo?.firstName || "Guest"}{" "}
                            {personalInfo?.lastName || ""}
                        </span>
                        <span style={{ fontSize: "15px", color: '#6c757d' }}>
                            {personalInfo?.course?.abbr || personalInfo?.designation || ""}
                        </span>
                    </div>
                </div>

                <div style={styles.detailGrid}>
                    <div style={{padding: '5px'}}>
                        <p style={styles.detailLabel}>{dateLabel}:</p>
                        <p style={styles.detailText}>{primaryDate || 'N/A'}</p>
                    </div>
                    <div style={{padding: '5px'}}>
                        <p style={styles.detailLabel}>Category:</p>
                        <p style={styles.detailText}>{item.category || 'N/A'}</p>
                    </div>
                    <div style={{padding: '5px', gridColumn: '1 / -1'}}>
                        <p style={styles.detailLabel}>{locationLabel}:</p>
                        <p style={styles.detailText}>{primaryLocation || 'N/A'}</p>
                    </div>
                    <div style={{padding: '5px'}}>
                        <p style={styles.detailLabel}>Claim Status:</p>
                        <p style={{...styles.detailText, fontWeight: 'bold', color: item.claimStatus === 'claimed' ? '#28a745' : '#dc3545'}}>
                            {item.claimStatus || 'Pending'}
                        </p>
                    </div>
                    
                    {/* Descriptions with Tooltip/Truncate logic based on old style, but simplified here */}
                    <div style={{padding: '5px'}}>
                        <p style={styles.detailLabel}>{descriptionLabel}:</p>
                        <p style={styles.detailText}>{description || 'N/A'}</p>
                    </div>
                    <div style={{padding: '5px'}}>
                        <p style={styles.detailLabel}>{howLabel}:</p>
                        <p style={styles.detailText}>{howText || 'N/A'}</p>
                    </div>

                </div>
            </>
        );
    };

    return (
        <>
            <NavigationBar />
            <BlankHeader />
            <div style={styles.transactionBody}>
                
                {alert && (
                    <FloatingAlert
                        message={alert.message}
                        type={alert.type}
                        onClose={() => setAlert(null)}
                    />
                )}

                <Modal
                    show={isModalOpen}
                    onHide={() => {
                        setIsModalOpen(false);
                        navigate(`/admin/found-items/${user?.uid}`);
                    }}
                    centered
                    backdrop="static"
                    keyboard={false}
                >
                    <Modal.Header>
                        <Modal.Title>Enter Transaction ID</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Control
                            type="text"
                            placeholder="Enter Transaction ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsModalOpen(false);
                                navigate(`/admin/found-items/${user?.uid}`);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSearch} disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : "Search"}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* --- Main Content Grid --- */}
                {selectedMatch ? (
                    <div style={styles.transactionContent}>
                        {/* 1. LOST ITEM CARD (Left) */}
                        <div style={styles.itemCard}>
                            <h2 style={{...styles.itemTitle, color: '#000000ff'}}>Lost Item</h2>
                            <img 
                                src={selectedMatch.lostItem.images} 
                                alt="Lost Item" 
                                style={styles.itemImage}
                            />
                            <h3 style={styles.itemTitle}>{selectedMatch.lostItem.itemName}</h3>
                            <span style={styles.itemId}>Item ID Number: {selectedMatch.lostItem.itemId}</span>
                            {renderItemDetails(selectedMatch.lostItem, true)}
                        </div>

                        {/* 2. MATCH SCORES CARD (Center) */}
                        <div style={styles.scoreCard}>
                            <h4 style={styles.scoreTitle}>Match Analysis</h4>
                            <div style={{width: '90%'}}>
                                
                                {Object.entries(selectedMatch.scores || {}).map(([key, value]) => {
                                    if (key === 'imageScore' || key === 'descriptionScore' || key === 'nameScore' || key === 'locationScore' || key === 'categoryScore' || key === 'overallScore') {
                                        const label = key.replace(/([A-Z])/g, ' $1').replace('Score', ' Rate').trim();
                                        const percentage = value != null ? Math.round(value) : 0;
                                        
                                        
                                        const labelColor = key === 'overallScore' ? '#007bff' : '#333';
                                        const barColor = '#28a745'; // Green for all bars
                                        
                                        return (
                                            <div key={key} style={styles.scoreRow}>
                                                <span style={{...styles.scoreRate, color: labelColor}}>
                                                    {capitalizeFirstLetter(label)}: {percentage}%
                                                </span>
                                                <div style={styles.progressBarFull}>
                                                    <div
                                                        style={{
                                                            ...styles.progressBarPercentage,
                                                            width: `${percentage}%`,
                                                            backgroundColor: barColor,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        {/* 3. FOUND ITEM CARD (Right) */}
                        <div style={styles.itemCard}>
                            <h2 style={{...styles.itemTitle, color: '#000000ff'}}>Found Item</h2>
                            <img 
                                src={selectedMatch.foundItem.images} 
                                alt="Found Item" 
                                style={styles.itemImage}
                            />
                            <h3 style={styles.itemTitle}>{selectedMatch.foundItem.itemName}</h3>
                            <span style={styles.itemId}>Item ID Number: {selectedMatch.foundItem.itemId}</span>
                            {renderItemDetails(selectedMatch.foundItem, false)}
                        </div>
                        
                        {/* 4. ACTION BUTTONS (Below the Grid) */}
                        <div style={styles.actionButtonContainer}>
                            <button
                                style={styles.changeButton}
                                onClick={() => setIsModalOpen(true)}
                            >
                                Change Transaction
                            </button>
                            <button
                                style={styles.processButton}
                                onClick={() => {
                                    const isGuestClaimant =
                                        selectedMatch?.lostItem?.personalInfo?.firstName === "Guest" ||
                                        selectedMatch?.lostItem?.personalInfo?.isGuest;

                                    if (isGuestClaimant) {
                                        navigate(`/admin/guest/process-claim/${currentUser.uid}`, {
                                            state: { match: selectedMatch, userId: currentUser.uid },
                                        });
                                    } else {
                                        navigate(`/admin/process-claim/${currentUser.uid}`, {
                                            state: { match: selectedMatch, userId: currentUser.uid },
                                        });
                                    }
                                }}
                            >
                                Process Claim
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M9.502 5.513a.144.144 0 0 0-.202.134V6.65a.5.5 0 0 1-.5.5H2.5v2.9h6.3a.5.5 0 0 1 .5.5v1.003c0 .108.11.176.202.134l3.984-2.933.042-.028a.147.147 0 0 0 0-.252l-.042-.028zM8.3 5.647a1.144 1.144 0 0 1 1.767-.96l3.994 2.94a1.147 1.147 0 0 1 0 1.946l-3.994 2.94a1.144 1.144 0 0 1-1.767-.96v-.503H2a.5.5 0 0 1-.5-.5v-3.9a.5.5 0 0 1 .5-.5h6.3z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{textAlign: 'center', margin: '50px auto', maxWidth: '400px'}}>
                         <p style={{fontSize: '1.2rem', color: '#6c757d'}}>
                            Please enter a **Transaction ID** to view match details.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

export default TransactionPage;