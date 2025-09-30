import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader"
import './styles/ItemMoreDetailsPage.css';

function ItemMoreDetailsPage() {
  const { uid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser; 

  

  const { item: stateItem, type: stateType } = location.state || {};
  const [item, setItem] = useState(stateItem || null);
  const [type, setType] = useState(stateType || null);
  const [loading, setLoading] = useState(!stateItem);

  useEffect(() => {
    const fetchItem = async () => {
      if (item) return;

      try {
        let docRef = doc(db, "lostItems", uid);
        let docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem(docSnap.data());
          setType("lost");
        } else {
          docRef = doc(db, "foundItems", uid);
          docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setItem(docSnap.data());
            setType("found");
          }
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [uid, item]);

  if (loading) return <p>Loading item details...</p>;
  if (!item) return <p>No item data found.</p>;

  
  const handleClaim = () => {
    if (type === "lost") {
      navigate(`/users/found-items/procedure/${user?.uid}`);
    } else if (type === "found") {
      navigate(`/users/lost-items/procedure/${user?.uid}`);
    }
  };

  return (
    <>
      <UserNavigationBar/>
      <div className='manage-item-body' >
        <UserBlankHeader/>
        <div className="manage-item-container">

          <h1 style={{left: '50%', opacity: '1'}}>{item.itemName}</h1>

          <div className="item-image" style={{position: 'absolute', width: '45%', minHeight: '125%', maxHeight: '145%', borderRadius: '10px', backgroundColor: 'white'}}>
            {item.images?.length > 0 && (
            <img
              src={item.images[0]}
              alt="Item"
              style={{width: '100%', objectFit: 'cover', height: '100%', maxHeight: '150%'}}
            />
          )}

          </div>

          
          <div className="more-details-information2" >
            {type === "lost" && (
              <>
                <p>{item.itemId}</p>
                <h3>How It Was Lost</h3>
                <p>{item.howItemLost || "No description provided"}</p>
                <h3>Date Lost:</h3>
                <p>{item.dateLost ? new Date(item.dateLost).toLocaleString() : "N/A"}</p>
                <h3>Location Lost:</h3>
                <p>{item.locationLost}</p>
                <h3>Category:</h3>
                <p>{item.category}</p>
              </>
            )}

            {type === "found" && (
              <>
                <p>{item.itemId}</p>
                <h3>How It Was Found</h3>
                <p>{item.howItemFound || "No description provided"}</p>
                <h3>Date Found:</h3>
                <p>{item.dateFound ? new Date(item.dateFound).toLocaleString() : "N/A"}</p>
                <h3>Location Found:</h3>
                <p>{item.locationFound}</p>
                <h3>Category:</h3>
                <p>{item.category}</p>
              </>
            )}

            <h3>Reported By</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <img src={item.personalInfo?.profileURL} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50px'}}/>
              <p>
                {item.personalInfo?.firstName} {item.personalInfo?.lastName} –{" "}
                {item.personalInfo?.course.abbr}
              </p>

            </div>

      
            <button 
              onClick={handleClaim} 
              style={{
                padding: "10px 20px",
                backgroundColor: "#475C6F",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: '200px'
            
              }}
            >
              {type === "lost" ? "I Found This Item" : "I Own This Item"}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}

export default ItemMoreDetailsPage;
