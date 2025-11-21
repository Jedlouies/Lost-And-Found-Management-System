import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
// import './styles/LostItemPage.css'; // REMOVED external CSS import
import TablesHeader from '../components/TablesHeader';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import BlankHeader from '../components/BlankHeader'; // Import BlankHeader for spacing

function ArchivedLostItemsPage() {
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;
  const navigate = useNavigate();

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
        justifyContent: 'flex-start', // Adjusted for only search bar
        gap: '20px',
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '8px 15px',
      width: '350px',
      // Removed marginRight: 'auto' to keep search bar left-aligned if no other filters
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
  
  const PersonDetailsRenderer = ({ userData, isGuest = false }) => {
    if (!userData) {
      return (
          <div style={styles.personDetails}>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#666" className="bi bi-person-slash" viewBox="0 0 16 16">
                  <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465m-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
              </svg>
              <p style={{...styles.infoP, fontWeight: 'normal'}}>Unknown</p>
          </div>
      );
    }
    
    if (isGuest || userData.isGuest) {
      return <div style={styles.profilePlaceholder}>Guest</div>;
    } 

    const initials = `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`.toUpperCase();

    return (
        <div style={styles.personDetails}>
            {userData.profileURL ? (
                <img src={userData.profileURL} alt="profile" style={styles.profileImage} />
            ) : (
                <div style={styles.navyPlaceholder}>{initials}</div>
            )}
            <div style={styles.personalInfo}>
                <p style={styles.infoP}>
                    {`${userData.firstName || ""} ${userData.lastName || ""}`.trim()}
                </p>
                <p style={styles.infoItalicP}>
                    {userData.course?.abbr || userData.designation || "N/A"}
                </p>
            </div>
        </div>
    );
  };


  useEffect(() => {
    const fetchArchivedItems = async () => {
      try {
        const q = query(collection(db, 'lostItems'), where("archivedStatus", "==", true));
        const querySnapshot = await getDocs(q);
        const archivedItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(archivedItems);
      } catch (error) {
        console.error("Error fetching archived items:", error);
      }
    };
    fetchArchivedItems();
  }, []);

  const filteredItems = items.filter(item =>
    item.itemName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <>
      <NavigationBar />
      <BlankHeader />
      <div style={styles.foundItemBody}>
        <div style={styles.foundItemContainer}>
          <h1 style={styles.headerH1}>Archived Lost Items</h1>

          {/* Filter Row (Only Search Bar) */}
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
          </div>

          <div>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={{...styles.tableHeaderCell, ...styles.tableFirstCell}}>Item ID No.</th>
                  <th style={styles.tableHeaderCell}>Image</th>
                  <th style={styles.tableHeaderCell}>Name</th>
                  <th style={styles.tableHeaderCell}>Date Lost</th>
                  <th style={styles.tableHeaderCell}>Location Lost</th>
                  <th style={styles.tableHeaderCell}>Founder</th>
                  <th style={styles.tableHeaderCell}>Owner (Reporter)</th>
                  <th style={{...styles.tableHeaderCell, ...styles.tableLastCell}}>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <tr style={styles.tableRow} key={index}>
                      <td style={{...styles.tableDataCell, ...styles.tableFirstCell}}>{item.itemId}</td>
                      <td style={styles.tableDataCell}>
                        {item.images && item.images.length > 0 ? (
                          <img 
                            src={item.images[0]} 
                            alt={item.itemName} 
                            style={styles.profileImage} 
                          />
                        ) : (
                          <div style={styles.profilePlaceholder}>No Item</div>
                        )}
                      </td>
                      <td style={styles.tableDataCell}>{item.itemName}</td>
                      <td style={styles.tableDataCell}>{item.dateLost}</td>
                      <td style={styles.tableDataCell}>
                        {item.locationLost?.length > 20 
                          ? item.locationLost.slice(0, 20) + "..." 
                          : item.locationLost}
                      </td>

                      <td style={styles.tableDataCell}>
                        <PersonDetailsRenderer 
                            userData={item.foundBy} 
                            isGuest={item.foundBy?.isGuest}
                        />
                      </td>

                      <td style={styles.tableDataCell}>
                        <PersonDetailsRenderer 
                            userData={item.personalInfo} 
                            isGuest={item.isGuest}
                        />
                      </td>

                      <td style={{...styles.tableDataCell, ...styles.tableLastCell}}>
                        {item.claimStatus || 'unclaimed'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No archived lost items found.</td>
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

export default ArchivedLostItemsPage;