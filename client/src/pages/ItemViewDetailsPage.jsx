import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader"
import '../user_pages/styles/ItemMoreDetailsPage.css';
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";

function ItemViewDetailsPage() {
  const { uid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser; 

  

  const { item: stateItem, type: stateType } = location.state || {};
  const [item, setItem] = useState(stateItem || null);
  const [type, setType] = useState(stateType || null);
  const [loading, setLoading] = useState(!stateItem);

  {/* 👤 Helper function for rendering user */}
const renderUser = (userData, isGuest = false) => {
  if (isGuest) {
    return (
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px',
        }}
      >
        Guest
      </div>
    );
  } else if (userData?.profileURL) {
    return (
      <img
        src={userData.profileURL}
        alt="profile"
        style={{
          width: '50px',
          height: '50px',
          objectFit: 'cover',
          borderRadius: '50%',
        }}
      />
    );
  } else {
    return (
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'navy',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
      >
        {`${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`.toUpperCase()}
      </div>
    );
  }
};


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
      <NavigationBar/>
      <div className='manage-item-body' >
        <BlankHeader/>
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
                <p>{item.dateLost ? new Date(item.dateLost).toLocaleDateString() : "N/A"}</p>
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
                <p>{item.dateFound ? new Date(item.dateFound).toLocaleDateString() : "N/A"}</p>
                <h3>Location Found:</h3>
                <p>{item.locationFound}</p>
                <h3>Category:</h3>
                <p>{item.category}</p>
              </>
            )}

{/* --- Owner --- */}
<h3>Owner</h3>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  {type === "lost"
    ? renderUser(item.personalInfo, item.isGuest)
    : renderUser(item.claimedBy, item.isGuest)}

  <p style={{ margin: 0 }}>
    {type === "lost"
      ? `${item.personalInfo?.firstName || ''} ${item.personalInfo?.lastName || ''}`.trim()
      : `${item.claimedBy?.firstName || ''} ${item.claimedBy?.lastName || ''}`.trim()}{" "}
    – {type === "lost"
      ? item.personalInfo?.course?.abbr || 'Unknown'
      : item.claimedBy?.course?.abbr || 'Unknown'}
  </p>
</div>

{/* --- Founder --- */}
<h3>Founder</h3>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  {type === "lost"
    ? renderUser(item.foundBy, item.foundBy?.isGuest)
    : renderUser(item.personalInfo, item.isGuest)}

  <p style={{ margin: 0 }}>
    {type === "lost"
      ? `${item.foundBy?.firstName || ''} ${item.foundBy?.lastName || ''}`.trim()
      : `${item.personalInfo?.firstName || ''} ${item.personalInfo?.lastName || ''}`.trim()}{" "}
    – {type === "lost"
      ? item.foundBy?.course?.abbr || 'Unknown'
      : item.personalInfo?.course?.abbr || 'Unknown'}
  </p>
</div>


      

          </div>
        </div>
      </div>
    </>
  );
}

export default ItemViewDetailsPage;
