import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import BlankHeader from '../components/BlankHeader';
import './styles/UserProfilesPage.css';
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

    if (selectedYear === "All") return matchesSearch;

    const year = user.createdAt?.getFullYear();
    return matchesSearch && year === Number(selectedYear);
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

  return (
    <>
      <NavigationBar />
      <div className='found-item-body'>
        <BlankHeader />
        <div className='found-item-container'>
          <h1>User Profiles</h1>

          <div className='searchBar'>
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


          <div>
            <table className='user-profiles-table' style={{ marginTop: '-10px' }}>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Profile</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Contact Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                 
                    <div colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                    </div>
                  
                ) : displayedUsers.length > 0 ? (
                  displayedUsers.map((user, index) => (
                    <tr className='body-row' key={index}>
                      <td>{user.studentId}</td>
                      <td>
                        {user.profileURL ? (
                          <img
                            src={user.profileURL}
                            alt={`${user.firstName}`}
                            style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                            onMouseEnter={() => setPreviewImage(user.profileURL)}
                            onMouseLeave={() => setPreviewImage(null)}
                          />
                        ) : (
                          <div
                                style={{
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
                                }}
                              >
                                {`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()}
                              </div>
                        )}
                      </td>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.course?.abbr || "N/A"}</td>
                      <td>{user.contactNumber || "N/A"}</td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle
                            as="div"
                            style={{ cursor: "pointer" }}
                            className="custom-dropdown-toggle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                              <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                            </svg>
                          </Dropdown.Toggle>

                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => navigate(`/admin/view-profile/${user.id}`)}>
                              View Profile
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No users found.</td>
                  </tr>
                )}

              </tbody>

              <tfoot>
                <tr className='footer'>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '10px 0', minWidth: '200px' }}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>{'<'}</button>
                    
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

                      for (let i = startPage; i <= endPage; i++) {
                        pageNumbers.push(i);
                      }

                      return pageNumbers.map((pageNum) => (
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
                      ));
                    })()}
                    
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>{'>'}</button>
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
