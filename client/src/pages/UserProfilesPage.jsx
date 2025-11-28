import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import BlankHeader from '../components/BlankHeader';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import TableHeader from '../components/TablesHeader';

function UserProfilesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("All"); 

  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), orderBy("firstName", "asc"));
        const querySnapshot = await getDocs(q);

        const userList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
          }
        });

        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

 
  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.firstName} ${user.lastName} ${user.studentId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const yearMatches = selectedYear === "All" || (user.createdAt?.getFullYear() === Number(selectedYear));

    const roleMatches = user.role === 'user';

    return matchesSearch && yearMatches && roleMatches;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
    
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
        tableRowHover: {
          
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
        dropdownToggle: {
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '4px',
            transition: 'background-color 0.2s',
            
        }
    };



  return (
    <>
      <NavigationBar />
        <BlankHeader />

      <div style={styles.foundItemBody}>
        <div style={styles.foundItemContainer}>
          <h1 style={styles.headerH1}>User Profiles </h1>

          <div style={styles.searchBar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
            <input
              type="text"
              placeholder='Search by Name or ID'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>


          <div>
            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={{...styles.tableHeaderCell, ...styles.tableFirstCell}}>Student ID</th>
                  <th style={styles.tableHeaderCell}>Profile</th>
                  <th style={styles.tableHeaderCell}>First Name</th>
                  <th style={styles.tableHeaderCell}>Last Name</th>
                  <th style={styles.tableHeaderCell}>Email</th>
                  <th style={styles.tableHeaderCell}>Course</th>
                  <th style={styles.tableHeaderCell}>Contact Number</th>
                  <th style={{...styles.tableHeaderCell, ...styles.tableLastCell}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "40px", ...styles.tableRow}}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                      <p style={{ marginTop: '10px' }}>Loading Users...</p>
                    </td>
                  </tr>
                ) : displayedUsers.length > 0 ? (
                  displayedUsers.map((user, index) => {
                    return (
                    <tr key={index} style={styles.tableRow}>
                      <td style={{...styles.tableDataCell, ...styles.tableFirstCell}}>{user.studentId || "N/A"}</td>
                      <td style={styles.tableDataCell}>
                        {user.profileURL ? (
                          <img
                            src={user.profileURL}
                            alt={`${user.firstName}`}
                            style={styles.profileImage}
                            onMouseEnter={() => setPreviewImage(user.profileURL)}
                            onMouseLeave={() => setPreviewImage(null)}
                          />
                        ) : (
                          <div style={styles.profilePlaceholder}>
                                {`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td style={styles.tableDataCell}>{user.firstName}</td>
                      <td style={styles.tableDataCell}>{user.lastName}</td>
                      <td style={styles.tableDataCell}>{user.email || "N/A"}</td>
                      <td style={styles.tableDataCell}>{user.course?.abbr || "N/A"}</td>
                      <td style={styles.tableDataCell}>{user.contactNumber || "N/A"}</td>
                      <td style={{...styles.tableDataCell, ...styles.tableLastCell}}>
                        <Dropdown>
                          <Dropdown.Toggle
                            as="div"
                            style={styles.dropdownToggle}
                            className="custom-dropdown-toggle"
                          >
                            
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => navigate(`/admin/view-profile/${user.id}`)}>
                              View Profile
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '20px', ...styles.tableRow}}>No users match your search criteria.</td>
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
                    
                    {(() => {
                      const pageNumbers = [];
                      const maxButtonsToShow = 3;

                      let startPage;
                      let endPage;

                      if (totalPages <= maxButtonsToShow) {
                        startPage = 1;
                        endPage = totalPages;
                      } else if (currentPage <= 2) {
                        startPage = 1;
                        endPage = maxButtonsToShow;
                      } else if (currentPage >= totalPages - 1) {
                        startPage = totalPages - maxButtonsToShow + 1;
                        endPage = totalPages;
                      } else {
                        startPage = currentPage - 1;
                        endPage = currentPage + 1;
                      }

                      return pageNumbers.map((pageNum) => (
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
                      ));
                    })()}
                    
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

export default UserProfilesPage;