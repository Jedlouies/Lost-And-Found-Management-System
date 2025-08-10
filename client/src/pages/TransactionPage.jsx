import React from 'react'
import NavigationBar from '../components/NavigationBar'
import './styles/TransactionPage.css'
import { useNavigate } from 'react-router-dom'
import { getAuth } from "firebase/auth";
import BlankHeader from '../components/BlankHeader'

function TransactionPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  return (
    <>
        <NavigationBar />
        <div className='transaction-body'>
            <BlankHeader />
             <input type="text" />
        </div>
    </>
  )
}

export default TransactionPage