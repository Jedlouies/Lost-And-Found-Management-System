import React, { useState } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/FoundItemPage.css'; // ✅ reuse the same design
import BlankHeader from '../components/BlankHeader';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';

function ItemClaimedListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const items = [
    {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateClaimed: 'July 15, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT', profileURL: '' },
      owner: { name: 'Jeany Enterina', course: 'BSCE', profileURL: '' },
      status: 'claimed'
    }
  ];

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const displayedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <NavigationBar />
      <div className='found-item-body'>
        <BlankHeader />
        <div className='found-item-container' style={{ position: 'absolute', top: '80px' }}>
          <h1>Item Claimed List</h1>
          <div className='searchBar'>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
            <input type="text" placeholder='Search' />
          </div>

          {/* Actions */}
          <div className='actions-row' style={{ width: '500px', marginTop: '10px' }}>
            <button>Archive</button>
            <button>Bulk Select</button>
            Academic Year:
            <DropdownButton
              id="dropdown-academic-year"
              title="Select Year"
              variant="secondary"
              size="sm"
              style={{ marginLeft: '10px' }}
            >
              <Dropdown.Item>2022–2023</Dropdown.Item>
              <Dropdown.Item>2023–2024</Dropdown.Item>
              <Dropdown.Item>2024–2025</Dropdown.Item>
              <Dropdown.Item>2025–2026</Dropdown.Item>
            </DropdownButton>
          </div>

          {/* Table */}
          <div>
            <table className='found-item-table' style={{ marginTop: '30px' }}>
              <thead>
                <tr>
                  <th>Item ID No.</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Date Claimed</th>
                  <th>Founder</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <tr className='body-row' key={index}>
                      <td>{item.id}</td>
                      <td><div className='item-image' /></td>
                      <td>{item.name}</td>
                      <td>{item.dateClaimed}</td>
                      <td>
                        <div className='founder-details'>
                          <div className='profile' />
                          <div className='personal-info'>
                            <p style={{ fontWeight: 'bold' }}>{item.founder.name}</p>
                            <p style={{ fontStyle: 'italic' }}>{item.founder.course}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className='owner-details'>
                          <div className='profile' />
                          <div className='personal-info'>
                            <p style={{ fontWeight: 'bold' }}>{item.owner.name}</p>
                            <p style={{ fontStyle: 'italic' }}>{item.owner.course}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {item.status === 'claimed' ? (
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
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No claimed items found.</td>
                  </tr>
                )}
              </tbody>

              {/* Pagination */}
              <tfoot>
                <tr className='footer'>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '10px 0' }}>
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
      </div>
    </>
  );
}

export default ItemClaimedListPage;
