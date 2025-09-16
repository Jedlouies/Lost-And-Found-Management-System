import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';   // ✅ Add this
import NavigationBar from '../components/NavigationBar';
import './styles/UserProfilesPage.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import BlankHeader from '../components/BlankHeader';

import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

function UserProfilesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const itemsPerPage = 6;
  const navigate = useNavigate();

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("firstName", "asc"));
      const querySnapshot = await getDocs(q);

      const userList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user => user.role !== "admin");

      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  fetchUsers();
}, []);

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.studentId}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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
                    <div className='actions-row' style={{width: '500px', marginTop: '10px'}}>
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-archive" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                  <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                </svg>
                  Achieved
                  </button>
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-ui-checks-grid" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                    <path d="M2 10h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1m9-9h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1m0 9a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm0-10a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM2 9a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2zm7 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2zM0 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.354.854a.5.5 0 1 0-.708-.708L3 3.793l-.646-.647a.5.5 0 1 0-.708.708l1 1a.5.5 0 0 0 .708 0z"/>
                  </svg>
                  Bulk Select</button>
                Academic Year:
                <DropdownButton
                  id="dropdown-academic-year"
                  title="Select Year"
                  variant="secondary"
                  size="sm"
                  style={{ marginLeft: '10px' }}
                >
                  <Dropdown.Item onClick={() => console.log("2022–2023")}>2022–2023</Dropdown.Item>
                  <Dropdown.Item onClick={() => console.log("2023–2024")}>2023–2024</Dropdown.Item>
                  <Dropdown.Item onClick={() => console.log("2024–2025")}>2024–2025</Dropdown.Item>
                  <Dropdown.Item onClick={() => console.log("2025–2026")}>2025–2026</Dropdown.Item>
                </DropdownButton>

            </div>

          <div>
            <table className='user-profiles-table' style={{ marginTop: '30px' }}>
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
                {displayedUsers.length > 0 ? (
                  displayedUsers.map((user, index) => (
                    <tr className='body-row' key={index}>
                      <td>{user.studentId}</td>
                      <td>
                        <div className='item-image'>
                          {user.profileURL ? (
                            <img
                              src={user.profileURL}
                              alt={`${user.firstName}`}
                              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                              onMouseEnter={() => setPreviewImage(user.profileURL)}
                              onMouseLeave={() => setPreviewImage(null)}
                            />
                          ) : (
                            <div className="no-image">No Profile</div>
                          )}
                        </div>
                      </td>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.course?.abbr || "N/A"}</td>
                      <td>{user.contactNumber || "N/A"}</td>
                      <td>
                        {/* ✅ Individual Dropdown per user */}
                        <Dropdown>
                          <Dropdown.Toggle
                            as="div"
                            style={{ cursor: "pointer" }}
                            className="custom-dropdown-toggle"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="25"
                              height="25"
                              fill="currentColor"
                              className="bi bi-three-dots-vertical"
                              viewBox="0 0 16 16"
                            >
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

              {/* Pagination */}
              <tfoot>
                <tr className='footer'>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '10px 0' }}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>{'<'}</button>
                    {
                      [...Array(totalPages)].map((_, i) => i + 1).map((pageNum) => (
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

        {/* Image Preview Modal */}
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
