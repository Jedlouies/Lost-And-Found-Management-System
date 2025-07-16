import React, { useState } from 'react'
import NavigationBar from '../components/NavigationBar'
import './styles/UserProfilesPage.css'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import BlankHeader from '../components/BlankHeader';


function UserProfilesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;


  const items = [
    {
      id: 'USR203402',
      firstName: 'Chembee',
      lastName: 'Regaton',
      studentId: '2022303336',
      course: 'BSIT',
      contactNumber: '09601165837',
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
    <div className='user-profiles-body'>
        <BlankHeader />
        <div className='user-profiles-container'>
            <h1>User Profiles</h1>
            <div className='searchBar'> 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" class="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input type="text" placeholder='Search'/>
            </div>
            <div className='actions-rows'>
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-ui-checks-grid" viewBox="0 0 16 16" style={{marginRight: '5px'}}>
                    <path d="M2 10h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1m9-9h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1m0 9a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm0-10a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM2 9a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2zm7 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2zM0 2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.354.854a.5.5 0 1 0-.708-.708L3 3.793l-.646-.647a.5.5 0 1 0-.708.708l1 1a.5.5 0 0 0 .708 0z"/>
                  </svg>
                  Bulk Select</button>
            </div>
            <div>
                <table className='user-profiles-table'>
                  <thead>
                    <tr>
                      <th>
                        User ID
                      </th>
                      <th>
                        Profile
                      </th>
                      <th>
                        First Name
                      </th>
                      <th>
                        Last Name
                      </th>
                      <th>
                        Student ID
                      </th>
                      <th>
                        Course
                      </th>
                      <th>
                        Contact Number
                      </th>
                      <th>
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItems.map((item, index) => (
                  <tr className='body-row' key={index}>
                    <td>{item.id}</td>
                    <td><div className='item-image' /></td>
                    <td>{item.firstName}</td>
                    <td>{item.lastName}</td>
                    <td>
                         {item.studentId}
                    </td>
                    <td>
                        {item.course}                   
                    </td>
                    <td>
                       {item.contactNumber}
                    </td>
                    <td style={{ position: 'relative' }}>

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

export default UserProfilesPage;