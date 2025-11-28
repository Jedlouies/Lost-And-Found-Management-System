import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  query, 
  where,
  orderBy,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import FloatingAlert from '../components/FloatingAlert';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Modal from 'react-bootstrap/Modal';
import BlankHeader from '../components/BlankHeader';
import { Spinner } from "react-bootstrap"; 

function FoundItemsPage() {
  const API = "https://server.spotsync.site";
  
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;
  const auth = getAuth();
  const user = auth.currentUser;
  const [alert, setAlert] = useState(null);
  const [selectedYear, setSelectedYear] = useState("All");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false); 
  
  const dbRealtime = getDatabase();

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const navigate = useNavigate();
  const handleNavigate = (path) => {
    navigate(path);
  };

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const q = query(
          collection(db, "foundItems"),
          where("archivedStatus", "==", false),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const foundItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setItems(foundItems);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchLostItems();
  }, []);

  const notifyUser = async (uid, message, type = "match") => {
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

  const handleVerifyItem = async (foundDocId) => {
    try {
      setVerifying(true);
      const foundDocRef = doc(db, "foundItems", foundDocId);
      const foundDocSnap = await getDoc(foundDocRef);

      if (!foundDocSnap.exists()) {
        throw new Error(`No foundItems document with ID: ${foundDocId}`);
      }

      const { itemId, status, itemName } = foundDocSnap.data();

      if (!itemId) {
        throw new Error(`foundItems doc ${foundDocId} has no itemId field`);
      }

      if (status === "posted") {
        setAlert({ message: "Item is already posted.", type: "warning" });
        return;
      }

      if (status === "cancelled") {
        setAlert({ message: "Cannot verify a cancelled item.", type: "warning" });
        return;
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
        const manageData = docSnap.data();
        
        await updateDoc(docSnap.ref, { status: "posted" });
       
        const topMatches = manageData.topMatches || [];
      
        for (const match of topMatches) {
            if (match.scores?.overallScore >= 75 && match.lostItem?.uid) {
              await notifyUser(
                match.lostItem.uid,
                `Your lost item <b>${match.lostItem.itemId}</b> - ${match.lostItem.itemName} 
                may possibly match with a verified found item: <b>${itemName}</b>.
                <p> With transastion Id of <b>${match.transactionId}</b>.
                Matching rate: <b>${match.scores.overallScore}%</b> Please bring your ID and QR Code for Verification.`
              );
              try {
                const emailRes = await fetch(`${API}/api/send-email`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    to: match.lostItem?.personalInfo?.email,   
                    subject: "Possible Lost Match ",
                    html: `<p>Your lost item <b>${match.lostItem.itemId}</b> - ${match.lostItem.itemName} </p>
                    <p> may possibly match with a verified found item: <b>${itemName}</b>.</p>
                      <p> With transastion Id of <b>${match.transactionId}</b>.</p>
                      <p>Matching rate: <b>${match.scores.overallScore}%</b> Please bring your ID and QR Code for Verification.</p>
                    `,
                  }),
                });

                const emailData = await emailRes.json();
                console.log("Email API response:", emailData);

                if (!emailRes.ok) {
                  console.error(`Failed to send email to ${match.lostItem?.personalInfo?.email}:`, emailData);
                } else {
                  console.log(`Email successfully sent to ${match.lostItem?.personalInfo?.email}`);
                }
              } catch (err) {
                console.error(`Error sending email to ${match.lostItem?.personalInfo?.email}:`, err);
              }
            }
          }
          
          if (manageData.uid) {
            await notifyUser(
              manageData.uid,
              `Your found item <b>${itemName}</b> has been <b>verified and posted</b>. 
              All possible owners with an 75%+ match score have been notified. 
              Please wait for further instructions from the OSA.`, 
              "info"
            );

            try {
              const emailRes = await fetch(`${API}/api/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: manageData.personalInfo?.email,  
                  subject: "Item Verified",
                  html:  `<p>Your found item <b>${itemName}</b> has been <b>verified and posted</b></p>. 
              <p>All possible owners with an 75%+ match score have been notified.</p> 
              <p>Please wait for further instructions from the OSA.</p>`,
                }),
              });

              const emailData = await emailRes.json();
              console.log("Email API response:", emailData);

              if (!emailRes.ok) {
                console.error(`Failed to send email to ${manageData.personalInfo?.email}:`, emailData);
              } else {
                console.log(`Email successfully sent to ${manageData.personalInfo?.email}`);
              }
            } catch (err) {
              console.error(`Error sending email to ${manageData.personalInfo?.email}:`, err);
            }
          }
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === foundDocId ? { ...item, status: "posted" } : item
        )
      );

      setAlert({ message: "Item Verified & Notifications Sent!", type: "success" });

    } catch (error) {
      console.error("Error verifying item:", error);
      setAlert({ message: "Error verifying item. Try again.", type: "error" });
    } finally {
      setVerifying(false)
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());

    let itemYear = null;
    if (item.dateFound) {
      try {
        itemYear = new Date(item.dateFound).getFullYear().toString();
      } catch (err) {
        console.warn("Invalid date format:", item.dateFound);
      }
    }

    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;

    if (selectedYear === "All") {
      return matchesSearch && matchesCategory;
    }

    return matchesSearch && itemYear === selectedYear && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const archiveItem = async (item) => {
    if (!item.claimedBy || !item.claimedBy.uid) {
      setAlert({ message: "You cannot archive unclaimed items.", type: "warning" });
      return; 
    }
      
    setIsArchiving(true); 
    
    try {
      const itemDocRef = doc(db, "foundItems", item.id); 

      await updateDoc(itemDocRef, {
        archivedStatus: true,
        archivedAt: new Date().toISOString(),
      });

      setAlert({
        show: true,
        message: `Item ${item.itemId} successfully archived!`,
        type: "success",
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id));

    } catch (error) {
      console.error("Error archiving item:", error);
      setAlert({
        show: true,
        message: "Failed to archive item. Please try again.",
        type: "danger",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const styles = {
      foundItemBody: {
        backgroundColor: '#f4f4f4',
        padding: '20px',
        minHeight: '100vh',
      },
      foundItemContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '30px',
        maxWidth: '1200px',
        margin: '20px auto', 
      },
      headerH1: {
        fontSize: '1.8rem',
        color: '#333',
        marginBottom: '20px',
      },
      filterRow: {
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          justifyContent: 'space-between',
      },
      searchBar: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '8px 15px',
        width: '350px',
        marginRight: 'auto',
      },
      searchInput: {
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        marginLeft: '10px',
        fontSize: '1rem',
        flexGrow: 1,
        color: '#000',
      },
      actionsGroup: {
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
      },
      actionButton: {
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 15px',
          borderRadius: '6px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'background-color 0.2s',
      },
      actionButtonPrimary: {
          backgroundColor: 'navy',
          fontWeight: 'bold',
      },
      table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 8px',
      },
      tableHead: {
        backgroundColor: '#9EBAD6',
        borderRadius: '8px',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        color: '#000',
      },
      tableHeaderCell: {
        padding: '15px 10px',
        textAlign: 'left',
        fontWeight: '600',
      },
      tableRow: {
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s',
      },
      tableDataCell: {
        padding: '15px 10px',
        borderTop: '1px solid #eee',
        borderBottom: '1px solid #eee',
        fontSize: '0.95rem',
        color: '#333',
        verticalAlign: 'middle',
      },
      tableFirstCell: {
        borderLeft: '1px solid #eee',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
      },
      tableLastCell: {
        borderRight: '1px solid #eee',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
      },
      personDetails: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      },
      profileImage: {
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        objectFit: "cover",
      },
      profilePlaceholder: {
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: "#007bff", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
      },
      navyPlaceholder: {
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: "navy", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
      },
      personalInfo: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
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
      dropdownToggleWrapper: {
          backgroundColor: '#fff',
          position: 'absolute',
          top: '50%',
          right: '10px',
          transform: 'translateY(-50%)',
          zIndex: 10,
      },
      dropdownToggleDiv: {
          width: '25px',
          height: '25px',
          opacity: 0,
          cursor: 'pointer',
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 10,
      },
      dropdownSvg: {
          position: 'absolute',
          top: 0,
          right: 0,
          cursor: 'pointer',
      },
      paginationContainer: {
          textAlign: 'center',
          padding: '20px 0',
          backgroundColor: '#f9f9f9', 
          borderTop: '1px solid #ddd',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          marginTop: '10px',
      },
      paginationButton: {
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          margin: '0 5px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          color: '#333',
      },
      paginationButtonActive: {
          backgroundColor: '#007bff',
          color: 'white',
          fontWeight: 'bold',
          border: '1px solid #007bff',
      },
      globalLoadingOverlay: {
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          flexDirection: "column",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold"
      }
  };
    
  return (
    <>
        {/* GLOBAL LOADING OVERLAY */}
        {isArchiving && (
            <div style={styles.globalLoadingOverlay}>
                <Spinner animation="border" variant="light" style={{ width: "4rem", height: "4rem" }} />
                <p style={{ marginTop: "15px" }}>Archiving item, please wait...</p>
            </div>
        )}
        
        {verifying && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          flexDirection: "column",
          color: "white",
          fontSize: "20px",
          fontWeight: "bold"
        }}>
          <div className="spinner-border text-light" role="status" style={{ width: "4rem", height: "4rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: "15px" }}>Verifying item, please wait...</p>
        </div>
      )}

        <Modal
            show={showConfirm}
            onHide={() => setShowConfirm(false)}
            centered
          >
            <Modal.Header >
              <Modal.Title>Confirm Archive</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Are you sure you want to archive this item?
            </Modal.Body>
            <Modal.Footer>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowConfirm(false)}
                disabled={isArchiving} 
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={async () => {
                  if (selectedItemId) {
                    await archiveItem(selectedItemId); 
                  }
                  setShowConfirm(false);
                }}
                disabled={isArchiving}
              >
                {isArchiving ? <Spinner animation="border" size="sm" /> : "Archive"}
              </button>

            </Modal.Footer>
          </Modal>

            {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}
        

      <NavigationBar />
      <BlankHeader /> 
      
      <div style={styles.foundItemBody}>
        <div style={styles.foundItemContainer}>
          <h1 style={styles.headerH1}>Found Items</h1>
          
          <div style={styles.filterRow}>
            
            <div style={styles.searchBar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input
                type="text"
                placeholder='Search by Item Name'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          
            <div style={styles.actionsGroup}>
                
                <button 
                    onClick={() => handleNavigate(`/admin/found-items/archive/${user?.uid}`)}
                    style={{border: '1px solid #333', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '500', color: '#333', height: '40px', borderRadius: '6px', padding: '8px 15px'}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                    <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                  </svg>
                  Archive
                </button>
                
                <span style={{color: '#555'}}>Year:</span>
                <DropdownButton
                  id="dropdown-academic-year"
                  variant='light'
                  title={selectedYear === "All" ? "All Years" : selectedYear}
                  style={{ marginLeft: '0px', height: '40px', borderRadius: '6px', border: '1px solid #333' }}
                >
                  <Dropdown.Item onClick={() => setSelectedYear("All")}>All Years</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2022")}>2022</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2023")}>2023</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2024")}>2024</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2025")}>2025</Dropdown.Item>
                </DropdownButton>

                <span style={{color: '#555'}}>Category:</span>
                <DropdownButton
                    id="dropdown-category"
                    variant='light'
                    title={selectedCategory || "Select Category"}
                    style={{ marginLeft: '0px', height: '40px', borderRadius: '6px', border: '1px solid #333' }}
                >
                    <Dropdown.Item onClick={() => setSelectedCategory("")}>All Categories</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Electronics")}>Electronics</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Accessories")}>Accessories</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Clothing & Apparel")}>Clothing & Apparel</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Bags & Luggage")}>Bags & Luggage</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Documents & IDs")}>Documents & IDs</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Books & Stationery")}>Books & Stationery</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Household Items")}>Household Items</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Sports & Fitness")}>Sports & Fitness</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Health & Personal Care")}>Health & Personal Care</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Toys & Games")}>Toys & Games</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Food & Beverages")}>Food & Beverages</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Automotive")}>Automotive Items</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Musical Instruments")}>Musical Instruments</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Pet Items")}>Pet Items</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Others")}>Others</Dropdown.Item>

                </DropdownButton>
                
                <button 
                  style={{...styles.actionButton, ...styles.actionButtonPrimary, backgroundColor: 'green'}} 
                  onClick={() => handleNavigate(`/admin/transactions/${user?.uid}`)}
                >
                    Process Claim
                </button>


            </div>

          </div>


          <div>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={{...styles.tableHeaderCell, ...styles.tableFirstCell, minWidth: '150px'}}>Item ID No.</th>
                  <th style={{...styles.tableHeaderCell, minWidth: '80px'}}>Image</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Date Found</th>
                  <th style={styles.tableHeaderCell}>Location Found</th>
                  <th style={styles.tableHeaderCell}>Founder</th>
                  <th style={styles.tableHeaderCell}>Owner</th>
                  <th style={styles.tableHeaderCell}>Verified</th>
                  <th style={{...styles.tableHeaderCell, ...styles.tableLastCell}}>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "40px", ...styles.tableRow }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                      <p style={{ marginTop: '10px' }}>Loading Found Items...</p>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (                    
                  <tr style={styles.tableRow} key={index}>
                      <td style={{...styles.tableDataCell, ...styles.tableFirstCell}}>{item.itemId}</td>
                      <td style={styles.tableDataCell}>
                        <div >
                          {item.images && item.images.length > 0 ? (
                            <img 
                              src={item.images[0]} 
                              alt={item.itemName} 
                              style={styles.profileImage} 
                            />
                          ) : (
                            <div style={styles.profilePlaceholder}>No Item</div>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableDataCell}>{item.itemName}</td>
                      <td style={styles.tableDataCell}>{item.dateFound}</td>
                      <td style={styles.tableDataCell}>{item.locationFound?.length > 20 
                          ? item.locationFound.slice(0, 20) + "..." 
                          : item.locationFound}
                      </td>

                    <td style={styles.tableDataCell}>
                        <div style={styles.personDetails}>
                            {item.isGuest ? (
                            <div style={styles.profilePlaceholder}>Guest</div> 
                            ) : item.personalInfo?.profileURL ? (
                            <>
                                <img
                                src={item.personalInfo.profileURL}
                                alt="profile"
                                style={styles.profileImage}
                                />
                                <div style={styles.personalInfo}>
                                <p style={styles.infoP}>
                                    {`${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
                                </p>
                                <p style={styles.infoItalicP}>
                                    {item.personalInfo?.course?.abbr || "Unknown"}
                                </p>
                                </div>
                            </>
                            ) : (
                            <>
                                <div style={styles.navyPlaceholder}>
                                {`${item.personalInfo?.firstName?.[0] || ""}${item.personalInfo?.lastName?.[0] || ""}`.toUpperCase()}
                                </div>
                                <div style={styles.personalInfo}>
                                <p style={styles.infoP}>
                                    {`${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
                                </p>
                                <p style={styles.infoItalicP}>
                                    {item.personalInfo?.course?.abbr || "Unknown"}
                                </p>
                                </div>
                            </>
                            )}
                        </div>
                    </td>

                    <td style={styles.tableDataCell}>
                        <div style={styles.personDetails}>
                            {item.claimedBy ? (
                                <>
                                    {item.claimedBy?.isGuest ? (
                                    <div style={styles.profilePlaceholder}>Guest</div> 
                                    ) : item.claimedBy?.profileURL ? (
                                    <>
                                        <img
                                        src={item.claimedBy.profileURL}
                                        alt="Owner"
                                        style={styles.profileImage}
                                        />
                                        <div style={styles.personalInfo}>
                                        <p style={styles.infoP}>
                                            {`${item.claimedBy?.firstName || ""} ${item.claimedBy?.lastName || ""}`.trim()}
                                        </p>
                                        <p style={styles.infoItalicP}>
                                            {item.claimedBy?.course?.abbr || "Unknown"}
                                        </p>
                                        </div>
                                    </>
                                    ) : (
                                    <>
                                        <div style={styles.navyPlaceholder}>
                                        {`${item.claimedBy?.firstName?.[0] || ""}${item.claimedBy?.lastName?.[0] || ""}`.toUpperCase()}
                                        </div>
                                        <div style={styles.personalInfo}>
                                        <p style={styles.infoP}>
                                            {`${item.claimedBy?.firstName || ""} ${item.claimedBy?.lastName || ""}`.trim()}
                                        </p>
                                        <p style={styles.infoItalicP}>
                                            {item.claimedBy?.course?.abbr || "Unknown"}
                                        </p>
                                        </div>
                                    </>
                                    )}
                                </>
                            ) : (
                                <div style={styles.personDetails}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#666" className="bi bi-person-slash" viewBox="0 0 16 16">
                                        <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465m-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                                    </svg>
                                    <p style={{...styles.infoP, fontWeight: 'normal'}}>Unknown</p>
                                </div>
                            )}
                        </div>
                    </td>

                    <td style={styles.tableDataCell}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        
                        {/* POSTED = VERIFIED */}
                        {item.status === 'posted' && (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#28a745" className="bi bi-patch-check-fill" viewBox="0 0 16 16">
                              <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.896.011a2.89 2.89 0 0 0-2.924 2.924l.01.896-.636.622a2.89 2.89 0 0 0 0 4.134l.638.622-.011.896a2.89 2.89 0 0 0 2.924 2.924l.896-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.638.896-.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.896.636-.622a2.89 2.89 0 0 0 0-4.134l-.638-.622.011-.896a2.89 2.89 0 0 0-2.924-2.924l-.896.01zm.93 4.29a.5.5 0 0 0-.695-.695L6.75 8.01 5.23 6.49a.5.5 0 0 0-.706.708l1.875 1.875a.5.5 0 0 0 .707 0z"/>
                            </svg>
                            <span style={{ fontSize: '11px', color: '#28a745', fontWeight: 'bold' }}>Verified</span>
                          </>
                        )}

                        {/* PENDING = NOT VERIFIED */}
                        {item.status === 'pending' && (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#ffc107" className="bi bi-exclamation-circle-fill" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
                            </svg>
                            <span style={{ fontSize: '11px', color: '#ffc107', fontWeight: 'bold' }}>Pending</span>
                          </>
                        )}

                        {/* CANCELLED */}
                        {item.status === 'cancelled' && (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#dc3545" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
                            </svg>
                            <span style={{ fontSize: '11px', color: '#dc3545', fontWeight: 'bold' }}>Cancelled</span>
                          </>
                        )}

                      </div>
                    </td>
                  
                      <td style={{...styles.tableDataCell, ...styles.tableLastCell, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {item.claimStatus === 'claimed' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="green" className="bi bi-check-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                            </svg>
                            ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="red" className="bi bi-x-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                            )}

                            <div style={styles.dropdownToggleWrapper}>
                                <Dropdown>
                                    <Dropdown.Toggle as="div" id={`dropdown-toggle-${index}`} style={styles.dropdownToggleDiv} />
                                    <Dropdown.Menu style={{marginLeft: '20px'}}>
                                        <Dropdown.Item
                                            onClick={() =>
                                                navigate(`/admin/found-items/view-items/${item.id}`, {
                                                    state: { type: "found", item }
                                                })
                                            }
                                        >
                                            View Details
                                        </Dropdown.Item>

                                        <Dropdown.Item 
                                            onClick={() => {
                                                setSelectedItemId(item);
                                                setShowConfirm(true);
                                            }}
                                        >
                                            Archive
                                        </Dropdown.Item>

                                        <Dropdown.Item onClick={() => handleVerifyItem(item.id)}>Verify Item</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="25"
                                    height="25"
                                    fill="currentColor"
                                    className="bi bi-three-dots-vertical"
                                    viewBox="0 0 16 16"
                                    style={styles.dropdownSvg}
                                >
                                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                                </svg>
                            </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No lost items found.</td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className='footer1'>
                  <td colSpan="9" style={styles.paginationContainer}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        style={styles.paginationButton}
                      >
                        {'<'}
                      </button>
                      {
                        [...Array(totalPages)].map((_, i) => i + 1)
                          .filter(pageNum => {
                            if (totalPages <= 3) return true;
                            if (currentPage === 1) return pageNum <= 3;
                            if (currentPage === totalPages) return pageNum >= totalPages - 2;
                            return Math.abs(currentPage - pageNum) <= 1;
                          })
                          .map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              style={{
                                ...styles.paginationButton,
                                ...(currentPage === pageNum && styles.paginationButtonActive)
                              }}
                            >
                              {pageNum}
                            </button>
                          ))
                      }
                      <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        style={styles.paginationButton}
                      >
                        {'>'}
                      </button>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default FoundItemsPage;