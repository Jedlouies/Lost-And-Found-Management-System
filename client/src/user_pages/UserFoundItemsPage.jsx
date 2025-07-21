import React, { useState } from 'react'
import UserNavigationBar from '../user_components/UserNavigationBar'
import './styles/UserFoundItemPage.css'
import UserFoundHeader from '../user_components/UserFoundHeader'
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';


function UserFoundItemsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;

  

 

  return (
    <>
    <UserNavigationBar />
    <div className='lost-item-body'>
        <UserFoundHeader />
    </div>
    </>

  )
}

export default UserFoundItemsPage