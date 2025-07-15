import React, { useState } from 'react'
import NavigationBar from '../components/NavigationBar'
import './styles/LostItemPage.css'
import TablesHeader from '../components/TablesHeader'

function LostItemsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const items = [
    {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
    {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
    {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
     {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
         {
      id: 'ITM203402',
      name: 'Iphone 15 Pro Max',
      dateLost: 'July 15, 2025',
      dateFound: 'July 23, 2025',
      founder: { name: 'Chembee Regaton', course: 'BSIT' },
      owner: { name: 'Jeany Enterina', course: 'BSCE' },
      status: 'claimed'

    },
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
    <div className='lost-item-body'>
        <TablesHeader />
        <div className='lost-item-container'>
            <h1>Lost Items</h1>
            <div className='searchBar'> 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" class="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input type="text" placeholder='Search'/>
            </div>
            <div className='actions-row'>

            </div>
            <div>
                <table className='lost-item-table'>
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
                        Date Lost
                      </th>
                      <th>
                        Location Lost
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
                    <td>
                      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="Green" className="bi bi-check-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                        <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16" style={{ position: 'absolute', left: '97%', cursor: 'pointer' }}>
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
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

export default LostItemsPage