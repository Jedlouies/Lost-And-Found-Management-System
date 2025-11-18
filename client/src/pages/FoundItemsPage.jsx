import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/FoundItemPage.css';
import TablesHeader from '../components/TablesHeader';
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
  orderBy 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import FloatingAlert from '../components/FloatingAlert';
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import Modal from 'react-bootstrap/Modal';
import BlankHeader from '../components/BlankHeader';



function FoundItemsPage() {
 const API = "http://localhost:4000";
 //const API = "https://server.spotsync.site";
 
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
  

  const dbRealtime = getDatabase();

  const [showConfirm, setShowConfirm] = useState(false);
const [selectedItemId, setSelectedItemId] = useState(null);
const [modal, setModal] = useState(false);

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
      console.log(manageData);

      
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

  if (selectedYear === "All") {
    return matchesSearch;
  }

  return matchesSearch && itemYear === selectedYear;
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
  try {
    if (!item.claimedBy || !item.claimedBy.uid) {
      setAlert({ message: "You cannot archive unclaimed items.", type: "warning" });
      return; 
    }

    const itemDocRef = doc(db, "foundItems", item.id); 
    const archiveDocRef = doc(db, "archivedFoundItems", item.id);

    await setDoc(archiveDocRef, {
      ...item,
      archivedAt: new Date(),
    });

    await deleteDoc(itemDocRef);

    setAlert({
      show: true,
      message: "Item successfully archived!",
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
  }
};
  

  return (
    <>
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
              >
                Archive
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
      <div className='found-item-body'>
        <BlankHeader />
        <div className='lost-item-container1' style={{position: 'absolute', top: '80px'}}>
        <h1 style={{marginTop: '20px', marginRight: '20px'}}>Found Items</h1>
          <div className='user-lost-header-space' style={{ position: 'relative', top: '20px', width: '100%', height: '50px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
            <div className='user-lost-searchBar2'>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input
                type="text"
                placeholder='Search'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          <div className='actions-row1' style={{width: '100%'}}>
                <button onClick={() => handleNavigate(`/admin/found-items/archive/${user?.uid}`)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-archive" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                  <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                </svg>
                  Achieve
                  </button>
                Year:
                <DropdownButton
                  id="dropdown-academic-year"
                  title={selectedYear === "All" ? "All Years" : selectedYear}
                  variant="secondary"
                  size="sm"
                  style={{ marginLeft: '10px' }}
                >
                  <Dropdown.Item onClick={() => setSelectedYear("All")}>All Years</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2022")}>2022</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2023")}>2023</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2024")}>2024</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2025")}>2025</Dropdown.Item>
                </DropdownButton>
                <button style={{backgroundColor: 'navy', color: 'white', fontWeight: 'bold'}} className={`processClaimBtn  ${location.pathname === `/admin/transactions/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/admin/transactions/${user?.uid}`)}>Process Claim</button>


            </div>

          </div>


          <div>
            <table className='lost-item-table1' style={{marginTop: '30px'}}>
              <thead>
                <tr>
                  <th style={{minWidth: '180px'}}>Item ID No.</th>
                  <th style={{minWidth: '110px'}}>Image</th>
                  <th style={{minWidth: '100px'}}>Name</th>
                  <th>Date Found</th>
                  <th>Location Found</th>
                  <th>Founder</th>
                  <th>Owner</th>
                  <th>Claim Status</th>
                  </tr>
              </thead>
              <tbody>
                {loading ? (
                  
                    <div colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                    </div>
                  
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (                    
                  <tr className='body-row' key={index}>
                      <td >{item.itemId}</td>
                      <td>
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt={item.itemName} style={{ width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover' }} />
                        ) : (
                          <div className='item-image' />
                        )}
                      </td>
                      <td>{item.itemName}</td>
                      <td>{item.dateFound}</td>
                      <td>{item.locationFound?.length > 20 
                            ? item.locationFound.slice(0, 20) + "..." 
                            : item.locationFound}
                      </td>

<td>
  <div className='founder-details'>
    {item.isGuest ? (
      // Case 1: Guest
      <div
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "40px",
          backgroundColor: "#007bff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        Guest
      </div>
    ) : item.personalInfo?.profileURL ? (
      // Case 2: Profile Image
      <>
        <img
          src={item.personalInfo.profileURL}
          alt="profile"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "40px",
            objectFit: "cover",
          }}
        />
        <div className='personal-info'>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>
            {`${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
          </p>
          <p style={{ fontStyle: 'italic', color: 'black' }}>
            {item.personalInfo?.course?.abbr || "Unknown"}
          </p>
        </div>
      </>
    ) : (
      // Case 3: Initials
      <>
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "40px",
            backgroundColor: "navy",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {`${item.personalInfo?.firstName?.[0] || ""}${
            item.personalInfo?.lastName?.[0] || ""
          }`.toUpperCase()}
        </div>
        <div className='personal-info'>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>
            {`${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
          </p>
          <p style={{ fontStyle: 'italic', color: 'black' }}>
            {item.personalInfo?.course?.abbr || "Unknown"}
          </p>
        </div>
      </>
    )}
  </div>
</td>

      <td>
        <div className='owner-details'>
          {item.claimedBy ? (
            <>
              {item.claimedBy?.isGuest ? (
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "40px",
                    backgroundColor: "#007bff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  Guest
                </div>
              ) : item.claimedBy?.profileURL ? (
                <img
                  src={item.claimedBy.profileURL}
                  alt="Owner"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "40px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "40px",
                    backgroundColor: "navy",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {`${item.claimedBy?.firstName?.[0] || ""}${
                    item.claimedBy?.lastName?.[0] || ""
                  }`.toUpperCase()}
                </div>
              )}

              {!item.claimedBy?.isGuest && (
                <div className='personal-info'>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>
                    {`${item.claimedBy?.firstName || ""} ${item.claimedBy?.lastName || ""}`.trim()}
                  </p>
                  <p style={{ fontStyle: 'italic', color: 'black' }}>
                    {item.claimedBy?.course?.abbr || "Unknown"}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className='profile'
                style={{
                  width: "50px",
                  height: "50px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" className="bi bi-person-slash" viewBox="0 0 16 16">
                  <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465m-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                </svg>
              </div>
              <div className='personal-info'>
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>Unknown</p>
              </div>
            </>
          )}
        </div>
      </td>
                  
                      <td style={{ position: 'relative' }}>
                        
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

                        <Dropdown style={{ position: 'absolute', top: 25, right: 10 }}>
                          <Dropdown.Toggle
                            as="div"
                            id={`dropdown-toggle-${index}`}
                            style={{
                              width: '25px',
                              height: '25px',
                              opacity: 0,
                              cursor: 'pointer',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              zIndex: 10,
                            }}
                          />
                          <Dropdown.Menu>
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
                              setSelectedItemId(item); // save full item object
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
                          style={{ position: 'absolute', top: 25, right: 10 }}
                        >
                          <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                        </svg>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No lost items found.</td>
                  </tr>
                )}
              </tbody>

              {/* Pagination */}
              <tfoot>
                <tr className='footer'>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '10px 0' }}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>{'<'}</button>
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
                              fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                              margin: '0 5px'
                            }}
                          >
                            {pageNum}
                          </button>
                        ))
                    }
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'>'}</button>
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
