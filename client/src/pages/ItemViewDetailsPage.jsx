import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import './styles/ItemViewDetailsPage.css';
import BlankHeader from "../components/BlankHeader";
import NavigationBar from "../components/NavigationBar";

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
      <div className='manage-item-body'>
        <BlankHeader/>
        <div className="manage-item-container">

          <h1 style={{left: '50%'}}>{item.itemName}</h1>

          {item.images?.length > 0 && (
            <img
              src={item.images[0]}
              alt="Item"
              style={{ width: "600px", height: "600px", borderRadius: "10px", objectFit: 'cover' }}
            />
          )}

          <div className="more-details-information" style={{position: 'absolute',top: '10%', left: '50%' , maxWidth: '600px'}}>
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

                <div className="item-view-profiles-container" >
                                  <h3>Owner</h3>
                  <div 
                    style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}} 
                    onClick={() => navigate(`/admin/view-profile/${item.uid}`)}  
                  >
                    <img src={item.personalInfo?.profileURL} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50px'}}/>
                    <p>
                      {item.personalInfo?.firstName} {item.personalInfo?.lastName} – {item.personalInfo?.course}
                    </p>
                  </div>
                  </div>
              <div className="item-view-profiles-container" >
            <h3>Founder</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}
            onClick={() => navigate(`/admin/view-profile/${item.foundBy?.uid}`)}
            >
              <img src={item.foundBy?.profileURL} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50px'}}/>
              <p>
                {item.foundBy?.firstName} {item.foundBy?.lastName} –{" "}
                {item.foundBy?.course}
              </p>

            </div>
            </div>

                

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
              <div className="item-view-profiles-container">
                  <h3>Founder</h3>
                <div 
                  style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}} 
                  onClick={() => navigate(`/admin/view-profile/${item.uid}`)}  
                >
                  <img src={item.personalInfo?.profileURL} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50px'}}/>
                  <p>
                    {item.personalInfo?.firstName} {item.personalInfo?.lastName} – {item.personalInfo?.course}
                  </p>
                </div>
              </div>
             <div className="item-view-profiles-container">
            <h3>Owner</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}
            onClick={() => navigate(`/admin/view-profile/${item.claimedBy?.uid}`)} >
              <img src={item.claimedBy?.profileURL} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50px'}}/>
              <p>
                {item.claimedBy?.firstName} {item.claimedBy?.lastName} –{" "}
                {item.claimedBy?.course}
              </p>
              
              
            </div>
              </div>
             
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ItemViewDetailsPage;
