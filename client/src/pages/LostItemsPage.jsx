import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
// import './styles/LostItemPage.css'; // Removed external CSS import
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
      setLoading(false); 
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


// 🎨 INLINE STYLES DEFINITION (Adopted from FoundItemsPage)
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
        // Ensuring text wrap works well
        maxWidth: 'calc(100% - 60px)', 
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
};
  
  // Helper to determine who is the founder/owner for rendering logic
  const getPersonDetails = (person, isGuest) => {
    const initials = `${person?.firstName?.[0] || ""}${person?.lastName?.[0] || ""}`.toUpperCase();
    const fullName = `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
    const courseAbbr = person?.course?.abbr || "Unknown";
    
    if (!person) {
        return (
            <div style={styles.personDetails}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#666" className="bi bi-person-slash" viewBox="0 0 16 16">
                    <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465m-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                </svg>
                <p style={{...styles.infoP, fontWeight: 'normal'}}>Unknown</p>
            </div>
        );
    }

    if (isGuest) {
        return <div style={styles.profilePlaceholder}>Guest</div>;
    }

    const imageElement = person.profileURL ? (
        <img src={person.profileURL} alt={fullName} style={styles.profileImage} />
    ) : (
        <div style={styles.navyPlaceholder}>{initials}</div>
    );

    return (
        <div style={styles.personDetails}>
            {imageElement}
            <div style={styles.personalInfo}>
                <p style={styles.infoP}>{fullName.length > 15 ? fullName.slice(0, 15) + "..." : fullName}</p>
                <p style={styles.infoItalicP}>{courseAbbr.length > 10 ? courseAbbr.slice(0, 10) + "..." : courseAbbr}</p>
            </div>
        </div>
    );
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
      <BlankHeader />
      
      <div style={styles.foundItemBody}>
        <div style={styles.foundItemContainer}>
          <h1 style={styles.headerH1}>Lost Items</h1>
          
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
                    onClick={() => handleNavigate(`/admin/lost-items/archive/${user?.uid}`)}
                    style={styles.actionButton}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                    <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                  </svg>
                  Archive
                </button>
                
                <span style={{color: '#555'}}>Year:</span>
                <DropdownButton
                  id="dropdown-academic-year"
                  title={selectedYear || "Select Year"}
                  style={{ marginLeft: '0px', height: '40px',  }}
                >
                  <Dropdown.Item onClick={() => setSelectedYear("")}>All Years</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2022")}>2022</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2023")}>2023</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2024")}>2024</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2025")}>2025</Dropdown.Item>
                </DropdownButton>
                
                <span style={{color: '#555'}}>Category:</span>
                <DropdownButton
                    id="dropdown-category"
                    title={selectedCategory || "Select Category"}
                    style={{ marginLeft: '0px', height: '40px' }}
                >
                    <Dropdown.Item onClick={() => setSelectedCategory("")}>All Categories</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Gadgets")}>Gadgets</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("IDs")}>IDs</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Accessories")}>Accessories</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedCategory("Other")}>Other</Dropdown.Item>
                </DropdownButton>

            </div>

          </div>


          <div>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={{...styles.tableHeaderCell, ...styles.tableFirstCell, minWidth: '150px'}}>Item ID No.</th>
                  <th style={{...styles.tableHeaderCell, minWidth: '80px'}}>Image</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Date Lost</th>
                  <th style={styles.tableHeaderCell}>Location Lost</th>
                  <th style={styles.tableHeaderCell}>Owner</th>
                  <th style={styles.tableHeaderCell}>Founder</th>
                  <th style={{...styles.tableHeaderCell, ...styles.tableLastCell}}>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", ...styles.tableRow }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                      <p style={{ marginTop: '10px' }}>Loading Lost Items...</p>
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
                      <td style={styles.tableDataCell}>{item.dateLost}</td>
                      <td style={styles.tableDataCell}>{item.locationLost?.length > 20 
                          ? item.locationLost.slice(0, 20) + "..." 
                          : item.locationLost}
                      </td>

                      <td style={styles.tableDataCell}>
                          {getPersonDetails(item.personalInfo, item.isGuest)}
                      </td>

                      <td style={styles.tableDataCell}>
                          {getPersonDetails(item.foundBy, item.foundBy?.isGuest)}
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
                                                navigate(`/admin/lost-items/view-items/${item.id}`, {
                                                    state: { type: "lost", item }
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
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No lost items found.</td>
                  </tr>
                )}
              </tbody>
              
              <tfoot>
                <tr className='footer1'>
                  <td colSpan="8" style={styles.paginationContainer}>
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

export default LostItemsPage;