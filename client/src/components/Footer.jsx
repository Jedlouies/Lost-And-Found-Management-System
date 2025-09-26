import React from 'react'
import './styles/Footer.css'

function Footer() {
  return (
    <>
        <div className='footer-body'>
            <img src="/USTP-Logo.png" alt="img" />
            <h3>University of Science and Technology of Southern Philippines</h3>
            <h4 style={{top: '319%', fontWeight: 'bold'}}>College of Information Technology and Communication</h4>
            <h4 style={{top: '322%'}}>Department of Information Technology</h4>
            <h4 style={{top: '325%'}}>Bachelor of Science in Information Technology</h4>
            <h4 style={{top: '328%', fontStyle: 'italic'}}>USTP-CDO Campus</h4>
        </div>
    </>
  )
}

export default Footer