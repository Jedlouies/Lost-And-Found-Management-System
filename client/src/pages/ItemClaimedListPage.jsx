import React from 'react'
import './styles/ItemClaimedListPage.css'
import NavigationBar from '../components/NavigationBar'
import DashboardHeader from '../components/DashboardHeader'
import TablesHeader from '../components/TablesHeader'

function ItemClaimedListPage() {
  return (
    <>
        <NavigationBar />
        <div className='item-claimed-list-body'>
            <TablesHeader />
        </div>

    </>

  )
}

export default ItemClaimedListPage