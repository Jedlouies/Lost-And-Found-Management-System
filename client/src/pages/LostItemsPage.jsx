import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/LostItemPage.css';
import TablesHeader from '../components/TablesHeader';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function LostItemsPage() {
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;


  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'lostItems'));
        const lostItems = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(lostItems);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      }
    };
    fetchLostItems();
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
      <div className='lost-item-body'>
        <TablesHeader />
        <div className='lost-item-container'>
          <h1>Lost Items</h1>
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
          <div className='actions-row' style={{width: '500px'}}>
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


          {/* Table */}
          <div>
            <table className='lost-item-table'>
              <thead>
                <tr>
                  <th style={{minWidth: '180px'}}>Item ID No.</th>
                  <th style={{minWidth: '110px'}}>Image</th>
                  <th style={{minWidth: '100px'}}>Name</th>
                  <th>Date Lost</th>
                  <th>Location Lost</th>
                  <th>Founder</th>
                  <th>Owner</th>
                  <th>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <tr className='body-row' key={index}>
                      <td >{item.id}</td>
                      <td>
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt={item.itemName} style={{ width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover' }} />
                        ) : (
                          <div className='item-image' />
                        )}
                      </td>
                      <td>{item.itemName}</td>
                      <td>{item.dateLost}</td>
                      <td>{item.locationLost}</td>
                      <td>
                      <div className='founder-details'>
                        <div className='profile' style={{width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center'}}> 
                          <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" class="bi bi-person-slash" viewBox="0 0 16 16">
                            <path d="M13.879 10.414a2.501 2.501 0 0 0-3.465 3.465zm.707.707-3.465 3.465a2.501 2.501 0 0 0 3.465-3.465m-4.56-1.096a3.5 3.5 0 1 1 4.949 4.95 3.5 3.5 0 0 1-4.95-4.95ZM11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m.256 7a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                          </svg>
                        </div>
                        <div className='personal-info'>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>{item.founder.name || 'Unknown'}</p>
                          <p style={{ fontStyle: 'italic', color: 'black' }}>{item.founder.course || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className='owner-details'>
                  
                          <img src={item.personalInfo?.profileURL} alt="" style={{width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover'}}/>
                        <div className='personal-info'>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>{item.personalInfo?.firstName} {item.personalInfo?.lastName}</p>
                          <p style={{ fontStyle: 'italic', color: 'black' }}>{item.personalInfo?.course || 'Unknown'} </p>
                        </div>
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

                        {/* Dropdown with 3 dots */}
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
                            <Dropdown.Item onClick={() => console.log(`View Details of ${item.id}`)}>View Details</Dropdown.Item>
                            <Dropdown.Item onClick={() => console.log(`Archive ${item.id}`)}>Archive</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>

                        {/* Visible 3-dots icon */}
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

export default LostItemsPage;
