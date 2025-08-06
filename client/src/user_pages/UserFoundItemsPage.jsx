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
  const [selectedCategory, setSelectedCategory] = useState('');
  

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

  const filteredLostItems = [...foundItems]
          .filter(item => {
            const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
          })
          .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost)); // sort after filter


  return (
    <>
      <UserNavigationBar />
      <div className='found-item-body'>
        <UserFoundHeader /> 
        <h1 style={{ fontSize: '30px', alignItems: 'center', top: '9%', fontWeight: '500', marginLeft: '20px', color: '#475C6F' }}>
          Found Items
        </h1>
          <div className='user-lost-searchBar'>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
            <input
              type="text"
              placeholder='Search'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              name="category"
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                position: 'relative',
                left: '80%',
                width: '150px',
                borderRadius: '5px',
                backgroundColor: 'transparent',
                border: '1px solid #475C6F',
                color: '#475C6F',
                cursor: 'pointer',
                height: '27px'
              }}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents">Documents</option>
              <option value="Accessories">Accessories</option>
              <option value="Others">Others</option>
            </select>
        </div>
        <div className='right-upper-panel'>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-bookmark" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
              </svg>
        </div>

        <div className="page-lost-container" ref={foundContainerRef}>
          {filteredLostItems.length > 0 ? (
            filteredLostItems.map((item, index) => (
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
