import React, { useState } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
import './styles/UserFoundItemPage.css'
import UserLostHeader from '../user_components/UserLostHeader'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';


function UserFoundItemsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
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
    }, 
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

  const handleRowDropdown = () => {
      
  }

  return (
    <>
    <UserNavigationBar />
    <div className='lost-item-body'>
        <UserLostHeader />
    </div>
    </>

  )
}

export default UserFoundItemsPage