import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/LostItemPage.css';
import TablesHeader from '../components/TablesHeader';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function ArchivedLostItemsPage() {
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;
  const navigate = useNavigate();

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
      <div className='lost-item-body'>
        <TablesHeader />
        <div className='lost-item-container'>
          <h1>Archived Lost Items</h1>

          <div className='searchBar2'>
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
            <table className='lost-item-table'>
              <thead>
                <tr>
                  <th>Item ID No.</th>
                  <th>Image</th>
                  <th>Name</th>
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
                      <td>{item.itemId}</td>
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
                      <td>{item.foundBy?.firstName || "Unknown"} {item.foundBy?.lastName || ""}</td>
                      <td>{item.personalInfo?.firstName || "Unknown"} {item.personalInfo?.lastName || ""}</td>
                      <td>{item.claimStatus}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center' }}>No archived items found.</td>
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

export default ArchivedLostItemsPage;
