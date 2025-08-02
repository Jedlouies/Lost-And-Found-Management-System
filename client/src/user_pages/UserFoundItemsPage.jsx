import React, { useState, useRef, useEffect } from 'react';
import UserNavigationBar from '../user_components/UserNavigationBar';
import './styles/UserLostItemPage.css'; // You can reuse the same styles
import UserFoundHeader from '../user_components/UserFoundHeader';
import 'bootstrap/dist/css/bootstrap.min.css';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

function UserFoundItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [foundItems, setFoundItems] = useState([]);
  const foundContainerRef = useRef(null);

  // Fetch Found Items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const foundSnapshot = await getDocs(collection(db, 'foundItems'));
        const foundData = foundSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoundItems(foundData);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    fetchItems();
  }, []);

  // Fetch current user data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };
    fetchData();
  }, [currentUser]);

  // Sort Found Items
  const recentFoundItems = [...foundItems]
    .sort((a, b) => new Date(b.dateFound) - new Date(a.dateFound))
    .slice(0, 20);

  return (
    <>
      <UserNavigationBar />
      <div className='found-item-body'>
        <UserFoundHeader /> 
        <h1 style={{ fontSize: '30px', alignItems: 'center', top: '9%', fontWeight: '500', marginLeft: '20px', color: '#475C6F' }}>
          Found Items
        </h1>
        <div className="page-lost-container" ref={foundContainerRef}>
          {recentFoundItems.length > 0 ? (
            recentFoundItems.map((item, index) => (
              <div className="found-item-card" key={index}>
                <div className="lost-card-image">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt='img'
                      style={{ width: '300px', height: '200px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="card-details">
                  <h4>{item.itemName}</h4>
                  <div className='own'>
                    <img
                      src={item.personalInfo?.profileURL}
                      alt=""
                      style={{ width: '50px', height: '50px', borderRadius: '40px', objectFit: 'cover' }}
                    />
                    <p>
                      <strong>{item.personalInfo?.firstName} {item.personalInfo?.lastName}</strong><br />
                      {item.personalInfo?.course} Student
                    </p>
                    <div className='card-more-details'>
                      <p style={{ position: 'absolute', top: '100%', marginLeft: '50px', width: '200px', fontSize: '12px' }}>
                        {item.howItemFound && item.howItemFound.length > 120
                          ? item.howItemFound.slice(0, 120) + "..."
                          : item.howItemFound || "No description provided"}
                      </p>
                      <p className='more-details-button' style={{ fontStyle: 'normal', fontWeight: 'bold', position: 'absolute', top: '200%', marginLeft: '170px', fontSize: '12px', cursor: 'pointer', width: '200px' }}>
                        More Details
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16" style={{ marginLeft: '10px' }}>
                          <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                        </svg>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{color: 'black'}}>No recent found items found.</p>
          )}
        </div>
      </div>
    </>
  );
}

export default UserFoundItemsPage;
