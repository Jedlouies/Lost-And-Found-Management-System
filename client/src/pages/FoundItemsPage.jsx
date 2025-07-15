import React from 'react'
import NavigationBar from '../components/NavigationBar'
import DashboardHeader from '../components/DashboardHeader'
import './styles/FoundItemsPage.css'
import TablesHeader from '../components/TablesHeader'

function FoundItemsPage() {
  return (
    <>
       <NavigationBar />
      <div className='found-item-body'>
          <TablesHeader />
      </div>
    </>

  )
}

export default FoundItemsPage