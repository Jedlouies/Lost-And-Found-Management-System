import React, { useState, useEffect } from 'react';
import UserNavigationBar from '../user_components/UserNavigationBar';
import UserBlankHeader from '../user_components/UserBlankHeader';
import './styles/ItemManagementPage.css';
import Dropdown from 'react-bootstrap/Dropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";

function ArchivedItemManagementPage() {
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [selectedYear, setSelectedYear] = useState("");

  const itemsPerPage = 6;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'itemManagement'),
      where("uid", "==", currentUser.uid),
      where("archivedStatus", "==", true) // 👈 only archived items
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const archivedItems = snapshot.docs.map(doc => {
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
      setItems(archivedItems);
    });

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

  return (
    <>
      <UserNavigationBar />
      <div className='manage-item-body'>
        <UserBlankHeader />
        <div className='manage-item-container'>
          <h1 style={{ fontSize: '30px', fontWeight: '500', marginLeft: '20px', color: '#475C6F'}}>
            Archived Item Management
          </h1>
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
                      <tr key={index}>
                        <td>{item.id}</td>
                        <td>
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
                        <td>{item.itemName}</td>
                        <td>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                        <td>{item.type}</td>
                        <td>{item.location || 'N/A'}</td>
                        <td>{item.category}</td>
                        <td>{item.status}</td>
                        <td>{item.highestMatchingRate}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>
                      No archived items found.
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

export default ArchivedItemManagementPage;
