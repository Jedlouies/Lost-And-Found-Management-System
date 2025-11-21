import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
// import './styles/FoundItemPage.css'; // Removed external CSS import
import BlankHeader from '../components/BlankHeader';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';

import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import TableHeader from '../components/TablesHeader';

function ItemClaimedListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("All");

  const itemsPerPage = 6;

  useEffect(() => {
    const fetchClaimedItems = async () => {
      try {
        const q = query(collection(db, "claimedItems"), orderBy("dateClaimed", "desc"));
        const querySnapshot = await getDocs(q);

        const claimed = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setItems(claimed);
      } catch (error) {
        console.error("Error fetching claimed items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimedItems();
  }, []);

  // Filter items by selectedYear
  const filteredItems = items.filter(item => {
    if (selectedYear === "All") return true;
    if (!item.dateClaimed) return false;
    const year = new Date(item.dateClaimed).getFullYear();
    return year.toString() === selectedYear;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // 🎨 INLINE STYLES DEFINITION (Adopted from UserProfilesPage)
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
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '8px 15px',
      width: '100%',
      maxWidth: '350px',
      marginBottom: '30px',
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
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 8px', // Space between rows
    },
    tableHead: {
      backgroundColor: '#9EBAD6', // Header background color
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
    profileImage: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      objectFit: "cover",
      cursor: "pointer",
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
    filterRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
      justifyContent: 'space-between',
    },
    filterLabel: {
      marginRight: '10px',
      fontWeight: 'bold',
      color: '#555',
    },
    // Styles specific to founder/owner column content
    personDetails: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    personInfo: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
    guestPlaceholder: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      backgroundColor: "#007bff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      fontSize: "12px",
    }
  };

  return (
    <>
      <NavigationBar />
              <BlankHeader />

      <div style={styles.foundItemBody}>
        <div style={styles.foundItemContainer}>
          <h1 style={styles.headerH1}>Claimed List</h1>

          <div style={styles.filterRow}>
            <div style={{...styles.searchBar, marginBottom: '0'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input style={styles.searchInput} type="text" placeholder='Search' />
            </div>
            
            <div style={{ marginLeft: '40px', display: 'flex', alignItems: 'center' }}>
                <span style={{marginRight: '10px'}}>Academic Year:</span>
                <DropdownButton
                    id="dropdown-academic-year"
                    variant='light'
                    title={selectedYear === "All" ? "All Years" : selectedYear}
                   style={{border: '1px solid #333', borderRadius: '6px'}}
                    
                >
                    <Dropdown.Item onClick={() => setSelectedYear("All")}>All</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2022")}>2022</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2023")}>2023</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2024")}>2024</Dropdown.Item>
                    <Dropdown.Item onClick={() => setSelectedYear("2025")}>2025</Dropdown.Item>
                </DropdownButton>
            </div>
          </div>

          <div>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={{...styles.tableHeaderCell, ...styles.tableFirstCell}}>Item ID No.</th>
                  <th style={styles.tableHeaderCell}>Image</th>
                  <th style={styles.tableHeaderCell}>Owner Actual Face</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Date Claimed</th>
                  <th style={styles.tableHeaderCell}>Founder</th>
                  <th style={{...styles.tableHeaderCell, ...styles.tableLastCell}}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", ...styles.tableRow }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                      <p style={{ marginTop: '10px' }}>Loading Claimed Items...</p>
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
                              onMouseEnter={() => setPreviewImage(item.images[0])}
                              onMouseLeave={() => setPreviewImage(null)}
                            />
                          ) : (
                            <div style={styles.guestPlaceholder}>No Item</div>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableDataCell}>
                        <div>
                          {item.ownerActualFace ? (
                            <img 
                              src={item.ownerActualFace} 
                              alt="Owner Face" 
                              style={{...styles.profileImage, border: "2px solid #475C6F"}} 
                              onMouseEnter={() => setPreviewImage(item.ownerActualFace)}
                              onMouseLeave={() => setPreviewImage(null)}
                            />
                          ) : (
                            <div style={styles.guestPlaceholder}>No Face</div>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableDataCell}>{item.itemName}</td>
                      <td style={styles.tableDataCell}>{new Date(item.dateClaimed).toLocaleDateString()}</td>
                      
                      {/* Founder Details Cell */}
                      <td style={styles.tableDataCell}>
                        <div style={styles.personDetails}>
                          {item.founder?.isGuest ? (
                            <div style={styles.guestPlaceholder}>Guest</div>
                          ) : item.founder?.profileURL ? (
                            <>
                              <img
                                src={item.founder.profileURL}
                                alt="Founder"
                                style={styles.profileImage}
                              />
                              <div style={styles.personInfo}>
                                <p style={{ fontWeight: "bold", color: "black", margin: 0, fontSize: "13px" }}>
                                  {`${item.founder?.firstName || ""} ${item.founder?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black", margin: 0, fontSize: "12px" }}>
                                  {item.founder?.course?.abbr || "Unknown"}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={styles.profilePlaceholder}>
                                {`${item.founder?.firstName?.[0] || ""}${item.founder?.lastName?.[0] || ""}`.toUpperCase()}
                              </div>
                              <div style={styles.personInfo}>
                                <p style={{ fontWeight: "bold", color: "black", margin: 0, fontSize: "13px" }}>
                                  {`${item.founder?.firstName || ""} ${item.founder?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black", margin: 0, fontSize: "12px" }}>
                                  {item.founder?.course?.abbr || "Unknown"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      
                      <td style={{...styles.tableDataCell, ...styles.tableLastCell}}>
                        <div style={styles.personDetails}>
                          {item.isGuest ? (
                            <div style={styles.guestPlaceholder}>Guest</div>
                          ) : item.owner?.profileURL ? (
                            <>
                              <img
                                src={item.owner.profileURL}
                                alt="Owner"
                                style={styles.profileImage}
                              />
                              <div style={styles.personInfo}>
                                <p style={{ fontWeight: "bold", color: "black", margin: 0, fontSize: "13px" }}>
                                  {`${item.owner?.firstName || ""} ${item.owner?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black", margin: 0, fontSize: "12px" }}>
                                  {item.owner?.course?.abbr || "Unknown"}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={styles.profilePlaceholder}>
                                {`${item.owner?.firstName?.[0] || ""}${item.owner?.lastName?.[0] || ""}`.toUpperCase()}
                              </div>
                              <div style={styles.personInfo}>
                                <p style={{ fontWeight: "bold", color: "black", margin: 0, fontSize: "13px" }}>
                                  {`${item.owner?.firstName || ""} ${item.owner?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black", margin: 0, fontSize: "12px" }}>
                                  {item.owner?.course?.abbr || "Unknown"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No claimed items found.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="7" style={styles.paginationContainer}>
                    <button 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                      style={styles.paginationButton}
                    >
                      {'<'}
                    </button>
                    {/* Pagination buttons logic */}
                    {[...Array(totalPages)].map((_, i) => i + 1).map((pageNum) => (
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
                    ))}
                    <button 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                      style={styles.paginationButton}
                    >
                      {'>'}
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {previewImage && (
          <div 
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              padding: "10px",
              borderRadius: "10px",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
              zIndex: 9999
            }}
          >
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ maxWidth: "400px", maxHeight: "400px", borderRadius: "8px" }} 
            />
          </div>
        )}
      </div>
    </>
  );
}

export default ItemClaimedListPage;