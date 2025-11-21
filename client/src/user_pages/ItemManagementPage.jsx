import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { getDocs } from "firebase/firestore";
import UserNavigationBar from '../user_components/UserNavigationBar';
import UserBlankHeader from '../user_components/UserBlankHeader';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import FloatingAlert from '../components/FloatingAlert';
import { set } from 'firebase/database';
import { Spinner } from "react-bootstrap";
// import './styles/ItemManagementPage.css'; // Assuming this is kept


// 🎨 MODERN UI STYLES DEFINITION
const styles = {
    foundItemBody: {
      backgroundColor: '#f4f4f4',
      padding: '20px',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
    dropdownMenuContainer: {
        position: 'absolute',
        top: '50%',
        right: '10px',
        transform: 'translateY(-50%)',
        zIndex: 10,
    },
    dropdownToggleDiv: {
        backgroundColor: 'transparent',
        width: "25px", 
        height: "25px",
        cursor: "pointer",
        position: "absolute",
        top: 0,
        right: 0,
        zIndex: 10,
    },
    dropdownSvg: {
        position: 'absolute',
        top: 0,
        right: 0,
        cursor: 'pointer',
        zIndex: 9, // Visual element
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
    statusCell: (status) => {
        let color = '#333';
        let background = '#eee';
        const normStatus = status?.toLowerCase();
        
        if (normStatus === 'pending') { color = '#f90'; background = '#fff3e0'; }
        else if (normStatus === 'cancelled') { color = '#dc3545'; background = '#f8d7da'; }
        else if (normStatus === 'posted') { color = '#007d3bff'; background = '#a9f4ccff'; }
        // 'claimed' status falls back to default styling

        return {
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '0.85rem',
            color,
            backgroundColor: background,
        };
    },
    rateBarFull: {
        width: '100px', // Fixed width for bar container
        height: '8px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    rateBarFill: (rate) => ({
        height: '100%',
        width: `${rate}%`,
        backgroundColor: rate >= 75 ? '#28a745' : rate >= 50 ? '#ffc107' : '#dc3545',
        transition: 'width 0.3s',
    })
};


function ItemManagementPage() {
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser; 
  const location = useLocation(); // Need location for current path checks

  const [selectedYear, setSelectedYear] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
const [selectedItems, setSelectedItems] = useState([]);
const [alert, setAlert] = useState(null);
const [loading, setLoading] = useState(true);

  const itemsPerPage = 6;

useEffect(() => {
    if (!currentUser) return; 

    setLoading(true);
    
    // Only fetch items belonging to the current user
    const q = query(
      collection(db, 'itemManagement'),
      where("uid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const managementItems = snapshot.docs.map(doc => {
          const data = doc.data();
          // Normalized item data structure based on the original component's usage
          const dateSubmitted = data.dateSubmitted?.toDate ? data.dateSubmitted.toDate().toISOString() : data.dateSubmitted;
          const matchingRate = Math.round(data.highestMatchingRate || 0);

          return {
            id: data.itemId,
            itemId: data.itemId,
            itemName: data.itemName || 'Unnamed',
            images: data.images || [],
            dateSubmitted: dateSubmitted,
            type: data.type || 'Unknown',
            location: data.locationFound || data.locationLost ||'N/A',
            category: data.category || 'N/A',
            claimStatus: data.claimStatus || 'unclaimed',
            status: data.status || 'N/A',   
            highestMatchingRate: matchingRate,
            ...data
          };
        });
        setItems(managementItems);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching item management data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); 
  }, [currentUser]); 

const filteredItems = items.filter(item => {
  const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());

  const itemDate = item.dateSubmitted
    ? new Date(item.dateSubmitted)
    : item.createdAt?.toDate
    ? item.createdAt.toDate()
    : null;

  const matchesYear =
    selectedYear === "" ||
    (itemDate && itemDate.getFullYear().toString() === selectedYear);

  return matchesSearch && matchesYear;
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
  };

  const archiveItem = async (itemId) => {
  try {
    const q = query(collection(db, "itemManagement"), where("itemId", "==", itemId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref; 
      await updateDoc(docRef, { archivedStatus: true });
      console.log(`Item ${itemId} archived successfully`);
      setAlert({ type: "success", message: `Item ${itemId} archived successfully` });
    } else {
      console.error("No document found with itemId:", itemId);
    }
  } catch (error) {
    console.error("Error archiving item:", error);
  }
}

  return (
    <>
        {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

      <UserNavigationBar />
      <UserBlankHeader />
      <div style={styles.foundItemBody}>
        <div style={styles.foundItemContainer}>
          <h1 style={styles.headerH1}>Item Management</h1>

          {/* --- SEARCH, FILTER & ACTION ROW --- */}
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
                <span style={{color: '#555'}}>Submitted Year:</span>
                <DropdownButton
                  id="dropdown-academic-year"
                  title={selectedYear || "Select Year"}
                  variant="light" 
                  style={{ 
                    marginLeft: '0px', 
                    height: '40px', 
                    backgroundColor: 'transparent',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                  }} 
                  className="dropdown-toggle-no-caret" // Used to hide the caret via CSS
                >
                  <Dropdown.Item onClick={() => setSelectedYear("")}>All Years</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2025")}>2025</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2024")}>2024</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2023")}>2023</Dropdown.Item>
                  <Dropdown.Item onClick={() => setSelectedYear("2022")}>2022</Dropdown.Item>
                </DropdownButton>
            </div>
          </div>


          <div>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={{...styles.tableHeaderCell, ...styles.tableFirstCell, minWidth: '150px'}}>Item ID No.</th>
                  <th style={{minWidth: '80px', ...styles.tableHeaderCell}}>Image</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Date Submitted</th>
                  <th style={styles.tableHeaderCell}>Type</th>
                  <th style={styles.tableHeaderCell}>Location</th>
                  <th style={styles.tableHeaderCell}>Status</th>
                  <th style={styles.tableHeaderCell}>Highest Match</th>
                  <th style={{...styles.tableHeaderCell, ...styles.tableLastCell}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "40px", ...styles.tableRow }}>
                       <Spinner animation="border" style={{ width: "50px", height: "50px" }} />
                       <p style={{ marginTop: '10px' }}>Loading Your Item History...</p>
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const normalizedStatus = item.status?.toLowerCase() || "";
                    const submittedDate = item.dateSubmitted ? new Date(item.dateSubmitted).toLocaleDateString() : 'N/A';

                    return (
                      <tr
                        className="body-row"
                        key={index}
                        // Removed bulkMode logic from row click for cleaner UI
                      >
                        <td style={{...styles.tableDataCell, ...styles.tableFirstCell}}>{item.itemId}</td>
                        <td style={styles.tableDataCell}>
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt="item"
                              style={styles.profileImage}
                            />
                          ) : (
                            <div style={styles.profilePlaceholder}>No Image</div>
                          )}
                        </td>
                        <td style={styles.tableDataCell}>{item.itemName}</td>
                        <td style={styles.tableDataCell}>{submittedDate}</td>
                        <td style={styles.tableDataCell}>{item.type}</td>
                        <td style={styles.tableDataCell}>
                          {item.location && item.location.length > 25
                              ? item.location.substring(0, 25) + "..."
                              : item.location || "N/A"}
                        </td>
                        <td style={styles.tableDataCell}>
                          {/* FIX 3: Status cell now only styles posted, cancelled, pending */}
                          <span style={styles.statusCell(normalizedStatus)}>
                            {item.status}
                          </span>
                        </td>
                        <td style={styles.tableDataCell}>
                          <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                            <span>{item.highestMatchingRate}%</span>
                            <div style={styles.rateBarFull}>
                              <div
                                style={styles.rateBarFill(item.highestMatchingRate)}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{...styles.tableDataCell, ...styles.tableLastCell, position: 'relative' }}>
                          <Dropdown style={styles.dropdownMenuContainer}> 
                            <Dropdown.Toggle
                              as="div"
                              id={`dropdown-toggle-${index}`}
                              style={styles.dropdownToggleDiv} 
                            />
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() =>
                                  navigate(`/users/item-management/more-details/${item.itemId}`, {
                                    state: { item },
                                  })
                                }
                              >
                                View Item Details
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      No items found in your management history.
                    </td>
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
       {/* Global CSS for hiding the caret must be applied in your overall site stylesheet */}
       {/* If you include the original FoundItemsPage.jsx style block or have a global style: */}
       <style>
            {`
                /* Hides the default Bootstrap caret arrow from the DropdownButton (Year Selector) */
                .dropdown-toggle-no-caret::after {
                    display: none !important;
                }
            `}
        </style>
    </>
  );
}

export default ItemManagementPage;