import React, { useState } from 'react'
import NavigationBar from '../components/NavigationBar'
import './styles/FoundItemsPage.css'
import TablesHeader from '../components/TablesHeader'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';


function FoundItemsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  

  const items = [
    {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      locationFound: 'Cafeteria',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'
    }, 
    {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      locationFound: 'Cafeteria',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'
    } 
  ];

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
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
        <TablesHeader />
        <div className='found-item-container'>
            <h1>Found Items</h1>
            <div className='searchBar'> 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" class="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input type="text" placeholder='Search'/>
            </div>
            <div className='actions-row'>
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
                <table className='found-item-table'>
                  <thead>
                    <tr>
                      <th>
                        Item ID No.
                      </th>
                      <th>
                        Image
                      </th>
                      <th>
                        Name
                      </th>
                      <th>
                        Date Found
                      </th>
                      <th>
                        Location Found
                      </th>
                      <th>
                        Founder
                      </th>
                      <th>
                        Owner
                      </th>
                      <th>
                        Claim Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((item, index) => (
                  <tr className='body-row' key={index}>
                    <td>{item.id}</td>
                    <td><div className='item-image' /></td>
                    <td>{item.name}</td>
                    <td>{item.dateLost}</td>
                    <td>{item.dateFound}</td>
                    <td>
                      <div className='founder-details'>
                        <div className='profile' />
                        <div className='personal-info'>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>{item.founder.name}</p>
                          <p style={{ fontStyle: 'italic', color: 'black' }}>{item.founder.course}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className='owner-details'>
                        <div className='profile' />
                        <div className='personal-info'>
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'black' }}>{item.owner.name}</p>
                          <p style={{ fontStyle: 'italic', color: 'black' }}>{item.owner.course}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ position: 'relative' }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25"
                        height="25"
                        fill="Green"
                        className="bi bi-check-circle"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                        <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                      </svg>

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
                        >
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => console.log(`View Details of ${item.id}`)}>View Details</Dropdown.Item>
                          <Dropdown.Item onClick={() => console.log(`Archive ${item.id}`)}>Archive</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>

                      {/* Visible Icon (clicking this triggers the transparent toggle above) */}
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
                ))}
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

  )
}

export default FoundItemsPage;