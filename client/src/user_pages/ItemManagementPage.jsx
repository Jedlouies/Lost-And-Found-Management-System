import React, { useState, useEffect } from 'react';
import NavigationBar from '../components/NavigationBar';
import './styles/ItemManagementPage.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { getDocs } from "firebase/firestore";
import UserNavigationBar from '../user_components/UserNavigationBar';
import UserBlankHeader from '../user_components/UserBlankHeader';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import FloatingAlert from '../components/FloatingAlert';
import { set } from 'firebase/database';



function ItemManagementPage() {
  const [items, setItems] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser; 
  const { match, item } = location.state || {};

  const [selectedYear, setSelectedYear] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
const [selectedItems, setSelectedItems] = useState([]);
const [alert, setAlert] = useState(null);
const [loading, setLoading] = useState(true);





  const itemsPerPage = 6;

useEffect(() => {
    if (!currentUser) return; 

    setLoading(true);
    
    const q = query(
      collection(db, 'itemManagement'),
      where("uid", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const managementItems = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.itemId,
            itemName: data.itemName || 'Unnamed',
            images: data.images || [],
            date: data.dateSubmitted || 'N/A',
            type: data.type || 'Unknown',
            location: data.locationFound || data.locationLost ||'N/A',
            category: data.category || 'N/A',
            claimStatus: data.claimStatus || 'unclaimed',
            status: data.status || 'N/A',   
            highestMatchingRate: data.highestMatchingRate || 'N/A',
            ...data
          };
        });
        setItems(managementItems);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching item management data:", error);
      }
    );

    return () => unsubscribe(); 
  }, [currentUser]); 

const filteredItems = items.filter(item => {
  const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());

  const itemDate = item.dateSubmitted
    ? new Date(item.dateSubmitted)
    : item.createdAt?.toDate
    ? item.createdAt.toDate()
    : null;

  const matchesYear =
    selectedYear === "" ||
    (itemDate && itemDate.getFullYear().toString() === selectedYear);

  return matchesSearch && matchesYear;
});

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleNavigate = (path) => {
  navigate(path);
  };

  const archiveItem = async (itemId) => {
  try {
    const q = query(collection(db, "itemManagement"), where("itemId", "==", itemId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref; 
      await updateDoc(docRef, { archivedStatus: true });
      console.log(`Item ${itemId} archived successfully`);
      setAlert({ type: "success", message: `Item ${itemId} archived successfully` });
    } else {
      console.error("No document found with itemId:", itemId);
    }
  } catch (error) {
    console.error("Error archiving item:", error);
  }
}

  return (
    <>
        {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

      <UserNavigationBar />
      <div className='manage-item-body'>
        <UserBlankHeader />
        <div className='manage-item-container'>
          <div className='manage-spacing' style={{ position: 'relative', top: '20px', width: '100%', height: '40px', justifyContent: 'left', alignItems: 'center', display: 'flex', marginBottom: '20px' }}>
            <h1 >
            Item Manage
            </h1>
            <div className='user-lost-searchBar2' style={{ left: '0', position: 'relative', marginLeft: '10%'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#475C6F" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input
                type="text"
                placeholder='Search'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='actions-row' style={{width: '20%', marginLeft: '10%', top: '0', fontSize: '1rem'}}>
              Academic Year:
              <select
                name="year"
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  marginLeft: "10px",
                  width: "120px",
                  borderRadius: "5px",
                  backgroundColor: "transparent",
                  border: "1px solid #475C6F",
                  color: "#475C6F",
                  cursor: "pointer",
                  height: "27px",
                }}
              >
                <option value="">Select Year</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

          </div>

          <div>
            <table className='manage-item-table' style={{marginTop: '20px'}}>
              <thead style={{borderRadius: '10px'}}>
                <tr>
                  <th style={{minWidth: '180px'}}>Item ID No.</th>
                  <th style={{minWidth: '110px'}}>Image</th>
                  <th style={{minWidth: '100px'}}>Name</th>
                  <th>Date Submitted</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Highest Matching Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      <img src="/Spin_black.gif" alt="Loading..." style={{ width: "50px" }} />
                    </td>
                  </tr>
                ) : displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => {
                    const normalizedStatus = item.status?.toLowerCase() || "";

                    return (
                      <tr
                        className="body-row"
                        key={index}
                        onClick={() => {
                          if (bulkMode) {
                            if (selectedItems.includes(item.id)) {
                              setSelectedItems((prev) => prev.filter((id) => id !== item.id));
                            } else {
                              setSelectedItems((prev) => [...prev, item.id]);
                            }
                          }
                        }}
                        style={{
                          cursor: bulkMode ? "pointer" : "default",
                          backgroundColor: selectedItems.includes(item.id) ? "#d6eaf8" : "transparent",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <td style={{ minWidth: "180px" }}>{item.id}</td>
                        <td style={{ minWidth: "110px" }}>
                          {item.images && item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt="item"
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                                borderRadius: "50px",
                              }}
                            />
                          ) : (
                            "No Image"
                          )}
                        </td>
                        <td style={{ minWidth: "100px" }}>{item.itemName}</td>
                        <td>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "N/A"}</td>
                        <td>{item.type}</td>
                        <td
                          style={{
                            position: "relative",
                            maxWidth: "120px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span className="location-text">
                            {item.location && item.location.length > 15
                              ? item.location.substring(0, 15) + "..."
                              : item.location || "N/A"}
                          </span>

                          {item.location && <div className="floating-location">{item.location}</div>}
                        </td>
                        <td>{item.category}</td>
                        <td>
                          <span
                            className={`status-cell ${
                              normalizedStatus === "pending"
                                ? "status-pending"
                                : normalizedStatus === "cancelled"
                                ? "status-cancelled"
                                : normalizedStatus === "posted"
                                ? "status-posted"
                                : normalizedStatus === "claimed"
                                ? "status-claimed"
                                : ""
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ position: "relative", minWidth: "160px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginRight: "20px",
                              gap: "5px",
                            }}
                          >
                            <span>{item.highestMatchingRate}%</span>
                            <div className="highest-matching-rate-full">
                              <div
                                className="manage-highest-matching-rate"
                                style={{ width: `${(item.highestMatchingRate || 0) * 1.0}px` }}
                              />
                            </div>
                          </div>

                          {/* Dropdown */}
                          <Dropdown style={{ position: "absolute", top: 25, right: 10 }}>
                            <Dropdown.Toggle
                              as="div"
                              id={`dropdown-toggle-${index}`}
                              style={{
                                width: "25px",
                                height: "25px",
                                opacity: 0,
                                cursor: "pointer",
                                position: "absolute",
                                top: 0,
                                right: 0,
                                zIndex: 10,
                              }}
                            />
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() =>
                                  navigate(`/users/item-management/more-details/${user.uid}`, {
                                    state: { item },
                                  })
                                }
                              >
                                View Item Details
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="25"
                            height="25"
                            fill="currentColor"
                            className="bi bi-three-dots-vertical"
                            viewBox="0 0 16 16"
                            style={{ position: "absolute", top: 25, right: 10 }}
                          >
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                          </svg>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // ✅ No items state
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                      No items found.
                    </td>
                  </tr>
                )}
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
  );
}

export default ItemManagementPage;
