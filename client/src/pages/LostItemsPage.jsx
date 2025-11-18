import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/LostItemPage.css';
import TablesHeader  from '../components/TablesHeader';
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
import { getAuth } from 'firebase/auth';
import { Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import FloatingAlert from '../components/FloatingAlert';
import UserBlankHeader from '../user_components/UserBlankHeader'
import BlankHeader from '../components/BlankHeader';

function LostItemsPage() {
  const location = useLocation();
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [selectedYear, setSelectedYear] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
   const [alert, setAlert] = useState(null);
   const [loading, setLoading] = useState(true);




  useEffect(() => {
    const fetchLostItems = async () => {
        try {
          const q = query(
            collection(db, "lostItems"),
            where("archivedStatus", "==", false),
            orderBy("createdAt", "desc")
          );
    
          const querySnapshot = await getDocs(q);
          const lostItems = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
    
          setItems(lostItems);
        } catch (error) {
          console.error("Error fetching lost items:", error);
        }  finally {
      setLoading(false); // stop loading
        }
      };
    
      fetchLostItems();
    },[])


const filteredItems = [...items]
  
  .filter(item => item.archivedStatus !== true)
  .filter(item => {
    const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;

    let itemYear = "";  
    if (item.dateLost) {
      if (typeof item.dateLost === "string") {
        itemYear = new Date(item.dateLost).getFullYear().toString();
      } else if (item.dateLost.toDate) {
        itemYear = item.dateLost.toDate().getFullYear().toString();
      }
    }

    const matchesYear = selectedYear === '' || itemYear === selectedYear;

    return matchesSearch && matchesCategory && matchesYear;
  })
  .sort((a, b) => {
    const dateA = a.dateLost?.toDate ? a.dateLost.toDate() : new Date(a.dateLost);
    const dateB = b.dateLost?.toDate ? b.dateLost.toDate() : new Date(b.dateLost);
    return dateB - dateA;
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

  const handleNavigate = (path) => {
    navigate(path);
  }

const archiveItem = async (item) => {
  try {
    if (item.claimStatus !== "claimed") {
      setAlert({
        message: "You cannot archive unclaimed items.",
        type: "warning",
      });
      return;
    }

    const q = query(collection(db, "lostItems"), where("itemId", "==", item.itemId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref; 
      await updateDoc(docRef, { archivedStatus: true });
      console.log(`Item ${item.itemId} archived successfully`);

      setAlert({
        message: `Item ${item.itemId} archived successfully.`,
        type: "success",
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } else {
      setAlert({
        message: `No document found with itemId: ${item.itemId}`,
        type: "warning",
      });
      console.error("No document found with itemId:", item.itemId);
    }
  } catch (error) {
    setAlert({
      message: "Error archiving item. Please try again.",
      type: "danger",
    });
    console.error("Error archiving item:", error);
  }
};

  return (
    <>
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
                className="btn btn-danger" 
                onClick={async () => {
                  if (selectedItemId) {
                    await archiveItem(selectedItemId); // passing full object now
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
      <div className='lost-item-body'>
        <BlankHeader />
        <div className='lost-item-container1'>
                                <h1>Lost Items</h1>
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
                <button onClick={() => handleNavigate(`/admin/lost-items/archive/${user?.uid}`)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-archive" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                  <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                </svg>
                  Achieved
                  </button>
                Academic Year:
                <DropdownButton
                    id="dropdown-academic-year"
                    title={selectedYear || "Select Year"}
                    variant="secondary"
                    size="sm"
                    style={{ marginLeft: '10px' }}
                  >
                    <Dropdown.Item onClick={() => setSelectedYear("")}>
                      All Years
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2022")}>
                      2022
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2023")}>
                      2023
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2024")}>
                      2024
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2025")}>
                      2025
                    </Dropdown.Item>
                  </DropdownButton>


            </div>

          </div>


          <div>
            <table className='lost-item-table1' style={{ marginTop: '20px' }}>
              <thead>
                <tr>
                  <th >Item ID No.</th>
                  <th>Image</th>
                  <th >Name</th>
                  <th>Date Lost</th>
                  <th>Location Lost</th>
                  <th>Founder</th>
                  <th>Owner</th>
                  <th>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
              
                  <div colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                    <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px",  }} />
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
                      <td>{item.dateLost}</td>
                      <td>{item.locationLost?.length > 20 
                          ? item.locationLost.slice(0, 20) + "..." 
                          : item.locationLost}
                    </td>

                    <td>
                      <div className='founder-details'>
                        {item.foundBy ? (
                          <>
                            {item.foundBy?.isGuest ? (
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
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                Guest
                              </div>
                            ) : item.foundBy?.profileURL ? (
                              // Case 2: Profile Image
                              <img
                                src={item.foundBy.profileURL}
                                alt="Founder"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "40px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              // Case 3: Initials Fallback
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
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                              >
                                {`${item.foundBy?.firstName?.[0] || ""}${
                                  item.foundBy?.lastName?.[0] || ""
                                }`.toUpperCase()}
                              </div>
                            )}

                            {/* Personal Info */}
                            <div className='personal-info'>
                              <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>
                                {`${item.foundBy?.firstName || ""} ${item.foundBy?.lastName || ""}`
                                  .trim()
                                  .slice(0, 15)}
                                {`${item.foundBy?.firstName || ""} ${item.foundBy?.lastName || ""}`.trim().length > 15 ? "..." : ""}
                              </p>
                              <p style={{ fontStyle: 'italic', color: 'black' }}>
                                {item.foundBy?.course?.abbr?.length > 10
                                  ? item.foundBy.course.abbr.slice(0, 10) + "..."
                                  : (item.foundBy?.course?.abbr || "Unknown")}
                              </p>
                            </div>
                          </>
                        ) : (
                          // Case 4: No foundBy at all
                          <>
                            <div
                              className='profile'
                              style={{
                                width: '50px',
                                height: '50px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                display: 'flex',
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
                        <td>
                          <div className='owner-details'>
                            {item.isGuest ? (
                              // Guest Display
                              <div
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "40px",
                                  backgroundColor: "#007bff", // Bootstrap Blue
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                Guest
                              </div>
                            ) : item.personalInfo?.profileURL ? (
                              // Profile Image
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
                            ) : (
                              // Initials Fallback
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
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                }}
                              >
                                {`${item.personalInfo?.firstName?.[0] || ""}${
                                  item.personalInfo?.lastName?.[0] || ""
                                }`.toUpperCase()}
                              </div>
                            )}

                            {/* Personal Info */}
                            {!item.isGuest && (
                              <div className='personal-info'>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>
                                  {`${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`
                                    .trim()
                                    .slice(0, 15)}
                                  {`${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim().length > 15 ? "..." : ""}
                                </p>
                                <p style={{ fontStyle: 'italic', color: 'black' }}>
                                  {item.personalInfo?.course?.abbr?.length > 10
                                    ? item.personalInfo.course.abbr.slice(0, 10) + "..."
                                    : (item.personalInfo?.course?.abbr || "Unknown")}
                                </p>
                              </div>
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
                                navigate(`/admin/lost-items/view-items/${item.id}`, {
                                  state: { type: "lost", item }
                                })
                              }
                            >
                              View Details
                            </Dropdown.Item>
                            <Dropdown.Item 
                              onClick={() => {
                                setSelectedItemId(item); // store full object
                                setShowConfirm(true);
                              }}
                            >
                              Archive
                            </Dropdown.Item>

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

export default LostItemsPage;
