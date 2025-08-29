import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/ItemManagementPage.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import UserNavigationBar from '../user_components/UserNavigationBar';
import UserBlankHeader from '../user_components/UserBlankHeader';
import { useAuth } from '../context/AuthContext';

function ItemManagementPage() {
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();

  const itemsPerPage = 6;

useEffect(() => {
    if (!currentUser) return; 

    
    const q = query(
      collection(db, 'itemManagement'),
      where("uid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const managementItems = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.itemId,
            itemName: data.itemName || 'Unnamed',
            images: data.images || [],
            date: data.dateSubmitted || 'N/A',
            type: data.type || 'Unknown',
            location: data.location || 'N/A',
            category: data.category || 'N/A',
            claimStatus: data.claimStatus || 'unclaimed',
            status: data.status || 'N/A',   
            highestMatchingRate: data.highestMatchingRate || 'N/A',
            ...data
          };
        });
        setItems(managementItems);
      },
      (error) => {
        console.error("Error fetching item management data:", error);
      }
    );

    return () => unsubscribe(); 
  }, [currentUser]); 

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
      <UserNavigationBar />
      <div className='manage-item-body'>
        <UserBlankHeader />
        <div className='manage-item-container'>
          <h1 style={{ fontSize: '30px', alignItems: 'center', top: '1%', fontWeight: '500' , marginLeft: '20px', color: '#475C6F'}}>
            Item Manage
          </h1>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-archive" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
              </svg>
              Achieved
            </button>
            <button>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ui-checks-grid" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                <path d="M2 10h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1m9-9h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1m0 9a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm0-10a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM2 9a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2zm7 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2zM0 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.354.854a.5.5 0 1 0-.708-.708L3 3.793l-.646-.647a.5.5 0 1 0-.708.708l1 1a.5.5 0 0 0 .708 0z"/>
              </svg>
              Bulk Select
            </button>
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
            <table className='manage-item-table'>
              <thead>
                <tr>
                  <th style={{minWidth: '180px'}}>Item ID No.</th>
                  <th style={{minWidth: '110px'}}>Image</th>
                  <th style={{minWidth: '100px'}}>Name</th>
                  <th>Date Submitted</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Highest Matching Rate</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const normalizedStatus = item.status?.toLowerCase() || '';

                    return (
                      <tr className="body-row" key={index}>
                        <td style={{ minWidth: '180px' }}>{item.id}</td>
                        <td style={{ minWidth: '110px' }}>
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt="item"
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '50px',
                              }}
                            />
                          ) : (
                            'No Image'
                          )}
                        </td>
                        <td style={{ minWidth: '100px' }}>{item.itemName}</td>
                        <td>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                        <td>{item.type}</td>
                        <td>{item.location || 'N/A'}</td>
                        <td>{item.category}</td>
                        <td>
                          <span
                            className={`status-cell ${
                              normalizedStatus === 'pending'
                                ? 'status-pending'
                                : normalizedStatus === 'cancelled'
                                ? 'status-cancelled'
                                : normalizedStatus === 'posted'
                                ? 'status-posted'
                                : normalizedStatus === 'claimed'
                                ? 'status-claimed'
                                : ''
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td style={{ position: 'relative', minWidth: '160px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginRight: '20px',
                              gap: '5px',
                            }}
                          >
                            <span>{item.highestMatchingRate}%</span>
                            <div className="highest-matching-rate-full">
                              <div
                                className="manage-highest-matching-rate"
                                style={{
                                  width: `${(item.highestMatchingRate || 0) * 1.0}px`,
                                }}
                              />
                            </div>
                          </div>

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
                              <Dropdown.Item onClick={() => console.log(`View Details of ${item.id}`)}>
                                View Details
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => console.log(`Archive ${item.id}`)}>
                                Archive
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => console.log(`Process Claim for ${item.id}`)}>
                                Process Claim
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>
                      No found items found.
                    </td>
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

export default ItemManagementPage;
