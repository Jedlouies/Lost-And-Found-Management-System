import React, { useState, useRef, useEffect } from 'react';
import UserNavigationBar from '../user_components/UserNavigationBar';
import './styles/UserLostItemPage.css';
import UserLostHeader from '../user_components/UserLostHeader';
import 'bootstrap/dist/css/bootstrap.min.css';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function UserLostItemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const lostContainerRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingLost, setLoadingLost] = useState(true);
  
  
  

  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingLost(true);


        const lostSnapshot = await getDocs(collection(db, 'lostItems'));
        const lostData = lostSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLostItems(lostData);
        setLoadingLost(false);
      } catch (error) {
        console.error("Error fetching lost items:", error);
      }
    };
    fetchItems();
  }, []);

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

    useEffect(() => {
      if (!currentUser) return;

      const fetchSaved = async () => {
        try {
          const snapshot = await getDocs(collection(db, "users", currentUser.uid, "savedItems"));
          const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setSavedItems(items);
        } catch (error) {
          console.error("Error fetching saved items:", error);
        }
      };

      fetchSaved();
    }, [currentUser]);

    const toggleSave = async (item) => {
      if (!currentUser) {
        alert("Please login to save items");
        return;
      }

      const ref = doc(db, "users", currentUser.uid, "savedItems", item.id);

      if (savedItems.some((saved) => saved.id === item.id)) {
        await deleteDoc(ref);
        setSavedItems((prev) => prev.filter((saved) => saved.id !== item.id));
      } else {
        await setDoc(ref, item);
        setSavedItems((prev) => [...prev, item]);
      }
    };

  const filteredLostItems = [...lostItems]
    .filter(item => item.claimStatus !== "claimed")
    .filter(item => item.archivedStatus !== true)
    .filter(item => {
      const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost));

  return (
    <>
        {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)} 
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxHeight: "70%",
              overflowY: "auto",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            <h3 style={{ marginBottom: "15px", color: "#475C6F" }}>
              Saved Items 
            </h3>
            {savedItems.length > 0 ? (
              savedItems.map((item) => (
                <div
                  className="saved-items-container"
                  key={item.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    marginBottom: "10px",
                    borderRadius: "5px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "10px", flex: 1, cursor: "pointer" }}
                    onClick={() =>
                      navigate(`/users/lost-items/more-details/${item.id}`, {
                        state: { type: "lost", item },
                      })
                    }
                  >
                    {item.images?.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt="saved"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "5px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          background: "#eee",
                          borderRadius: "5px",
                        }}
                      />
                    )}
                    <div>
                      <strong style={{ color: "black" }}>
                        {item.personalInfo?.firstName}'s {item.itemName}
                      </strong>
                      <p style={{ fontSize: "12px", margin: 0, color: "black" }}>
                        {item.personalInfo?.course?.abbr} Student
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleSave(item);
                    }}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p>No saved items yet.</p>
            )}

            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "10px",
                background: "#475C6F",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "8px 12px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <UserNavigationBar />
      <div className='lost-item-body'>
        <UserLostHeader />
        <div className='user-lost-header-space' style={{ position: 'relative', top: '20px', width: '100%', height: '50px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
        <div className="user-lost-searchBar2">
          <h1
            style={{
              position: "absolute",
              left: "-15%",
              top: "2%",
              fontSize: "30px",
              fontWeight: "bold",
              color: "#475C6F",
            }}
          >
            Lost Items
          </h1>
          <input
            type="text"
            placeholder="Search"
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
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
            <option value="Clothing & Apparel">Clothing & Apparel</option>
            <option value="Bags & Luggage">Bags & Luggage</option>
            <option value="Documents & IDs">Documents & IDs</option>
            <option value="Books & Stationery">Books & Stationery</option>
            <option value="Household Items">Household Items</option>
            <option value="Sports & Fitness">Sports & Fitness</option>
            <option value="Health & Personal Care">Health & Personal Care</option>
            <option value="Toys & Games">Toys & Games</option>
            <option value="Food & Beverages">Food & Beverages</option>
            <option value="Automotive">Automotive Items</option>
            <option value="Automotive Items Instruments">Musical Instruments</option>
            <option value="Pet Items">Pet Items</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="right-upper-panel" style={{ position: "absolute" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            fill="currentColor"
            className="bi bi-bookmark"
            viewBox="0 0 16 16"
            style={{ cursor: "pointer" }}
            onClick={() => setShowModal(true)}
          >
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
          </svg>
                        {savedItems.length > 0 && (
            <span
              style={{
                position: "relative",
                top: "-10px",
                left: "-20%",
                background: "red",
                color: "white",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: "12px",
              }}
            >
              {savedItems.length}
            </span>
          )}

        </div>

        </div>


        {loadingLost ? (
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              marginTop: "280px" 
            }}
          >
            <img 
              src="/Spin_black.gif" 
              alt="Loading..." 
              style={{ width: "60px", height: "60px" }} 
            />
          </div>
        ) : (
        <div className="page-lost-container" ref={lostContainerRef}>
           {filteredLostItems.length > 0 ? (
              filteredLostItems.map((item, index) => {
              const isSaved = savedItems.some((saved) => saved.id === item.id);
              return (
                <div
                  className="found-item-card"
                  key={index}
                  style={{ cursor: "pointer", position: "relative" }}
                  onClick={() =>
                    navigate(`/users/lost-items/more-details/${item.id}`, {
                      state: { type: "lost", item }
                    })
                  }
                >
                  <div className="lost-card-image">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt="img"
                        style={{ width: "300px", height: "200px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                  </div>
                  <div className="card-details">
                    <h4>{item.itemName}</h4>
                    <div className="own">
                    {item.isGuest ? (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "blue",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        Guest
                      </div>
                    ) : item.personalInfo?.profileURL ? (
                      <img
                        src={item.personalInfo.profileURL}
                        alt="profile"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "40px",
                          backgroundColor: "navy",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {`${item.personalInfo?.firstName?.[0] || ""}${
                          item.personalInfo?.lastName?.[0] || ""
                        }`.toUpperCase()}
                      </div>
                    )}

                    <p>
                      <strong style={{ fontSize: "14px" }}>
                        {item.isGuest === true
                          ? item.personalInfo?.firstName || "Guest"
                          : `${item.personalInfo?.firstName || ""} ${item.personalInfo?.lastName || ""}`.trim()}
                      </strong>
                      <br />
                      {item.isGuest !== true && (
                        <span>
                          {item.personalInfo?.course?.abbr
                            ? `${item.personalInfo.course.abbr} Student`
                            : "Unknown"}
                        </span>
                      )}
                      </p>
                    </div>

                    <p style={{ marginTop: "10px", fontSize: "12px", color: 'black', height: '60px', width: '250px', textAlign: 'left', marginLeft: '10px' }}>
                      {item.howItemLost && item.howItemLost.length > 120
                        ? item.howItemLost.slice(0, 120) + "..."
                        : item.howItemLost}
                    </p>
                  </div>

                  {/* Save/Unsave Star */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // prevent navigation
                      toggleSave(item);
                    }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      cursor: "pointer",
                    }}
                  >
                    {isSaved ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="gold"
                        className="bi bi-star-fill"
                        viewBox="0 0 16 16"
                      >
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="gray"
                        className="bi bi-star"
                        viewBox="0 0 16 16"
                      >
                        <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "black" }}>No recent found items found.</p>
          )}
        </div>
        )}
      </div>
    </>
  );
}

export default UserLostItemsPage;
