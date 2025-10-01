import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/FoundItemPage.css';
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

  return (
    <>
      <NavigationBar />
      <div className='found-item-body'>
        <BlankHeader />
        <div className='found-item-container' style={{ position: 'absolute', top: '80px' }}>
          <h1>Claimed List</h1>

          <div className='searchBar'>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
            <input type="text" placeholder='Search' />
          </div>

          <div className='actions-row1' style={{ width: '500px', marginTop: '-15px', marginLeft: '40px' }}>
            Academic Year:
            <DropdownButton
              id="dropdown-academic-year"
              title={selectedYear === "All" ? "All Years" : selectedYear}
              variant="secondary"
              size="sm"
              style={{ marginLeft: '10px' }}
            >
              <Dropdown.Item onClick={() => setSelectedYear("All")}>All</Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedYear("2022")}>2022</Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedYear("2023")}>2023</Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedYear("2024")}>2024</Dropdown.Item>
              <Dropdown.Item onClick={() => setSelectedYear("2025")}>2025</Dropdown.Item>
            </DropdownButton>
          </div>

          <div>
            <table className='found-item-table1' style={{marginTop: '20px'}}>
              <thead>
                <tr>
                  <th>Item ID No.</th>
                  <th>Image</th>
                  <th>Owner Actual Face</th>
                  <th>Name</th>
                  <th>Date Claimed</th>
                  <th>Founder</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  
                    <div colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                    </div>
                  
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <tr className='body-row' key={index}>
                      <td>{item.itemId}</td>
                      <td>
                        <div >
                          {item.images && item.images.length > 0 ? (
                            <img 
                              src={item.images[0]} 
                              alt={item.itemName} 
                              style={{ width: "50px", height: "50px", borderRadius: "100%", objectFit: "cover", cursor: "pointer" }} 
                              onMouseEnter={() => setPreviewImage(item.images[0])}
                              onMouseLeave={() => setPreviewImage(null)}
                            />
                          ) : (
                            <div className="no-image">No Item</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {item.ownerActualFace ? (
                            <img 
                              src={item.ownerActualFace} 
                              alt="Owner Face" 
                              style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #475C6F", cursor: "pointer" }} 
                              onMouseEnter={() => setPreviewImage(item.ownerActualFace)}
                              onMouseLeave={() => setPreviewImage(null)}
                            />
                          ) : (
                            <div className="no-image">No Face</div>
                          )}
                        </div>
                      </td>
                      <td>{item.itemName}</td>
                      <td>{new Date(item.dateClaimed).toLocaleDateString()}</td>
                      <td>
                        <div className='founder-details' >
                          {item.founder?.isGuest ? (
                            // Case 1: Guest
                            <div
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                backgroundColor: "#007bff",
                                display: "flex",
                                alignItems: "left",
                                justifyContent: "left",
                                color: "white",
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            >
                              Guest
                            </div>
                          ) : item.founder?.profileURL ? (
                            // Case 2: Profile Image
                            <>
                              <img
                                src={item.founder.profileURL}
                                alt="Founder"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  justifyContent: 'left',
                                  alignItems: 'left',
                                }}
                              />
                              <div className='personal-info'>
                                <p style={{ fontWeight: "bold", color: "black" }}>
                                  {`${item.founder?.firstName || ""} ${item.founder?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black" }}>
                                  {item.founder?.course?.abbr || "Unknown"}
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
                                {`${item.founder?.firstName?.[0] || ""}${item.founder?.lastName?.[0] || ""}`.toUpperCase()}
                              </div>
                              <div className='personal-info'>
                                <p style={{ fontWeight: "bold", color: "black" }}>
                                  {`${item.founder?.firstName || ""} ${item.founder?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black" }}>
                                  {item.founder?.course?.abbr || "Unknown"}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className='owner-details'>
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
                          ) : item.owner?.profileURL ? (
                            // Case 2: Profile Image
                            <>
                              <img
                                src={item.owner.profileURL}
                                alt="Owner"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "40px",
                                  objectFit: "cover",
                                }}
                              />
                              <div className='personal-info'>
                                <p style={{ fontSize: "13px", fontWeight: "bold", color: "black" }}>
                                  {`${item.owner?.firstName || ""} ${item.owner?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black" }}>
                                  {item.owner?.course?.abbr || "Unknown"}
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
                                {`${item.owner?.firstName?.[0] || ""}${item.owner?.lastName?.[0] || ""}`.toUpperCase()}
                              </div>
                              <div className='personal-info'>
                                <p style={{ fontSize: "13px", fontWeight: "bold", color: "black" }}>
                                  {`${item.owner?.firstName || ""} ${item.owner?.lastName || ""}`.trim()}
                                </p>
                                <p style={{ fontStyle: "italic", color: "black" }}>
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
                    <td colSpan="7" style={{ textAlign: 'center' }}>No claimed items found.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className='footer'>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '10px 0' }}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>{'<'}</button>
                    {[...Array(totalPages)].map((_, i) => i + 1).map((pageNum) => (
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
                    ))}
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

export default ItemClaimedListPage;
