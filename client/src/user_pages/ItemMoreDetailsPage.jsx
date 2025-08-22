import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

function ItemMoreDetailsPage() {
  const { uid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { item: stateItem, type: stateType } = location.state || {};
  const [item, setItem] = useState(stateItem || null);
  const [type, setType] = useState(stateType || null);
  const [loading, setLoading] = useState(!stateItem);

  // 🔹 Fetch item if no state was passed (e.g., page refresh)
  useEffect(() => {
    const fetchItem = async () => {
      if (item) return; // already from state

      try {
        // Try Lost Items first
        let docRef = doc(db, "lostItems", uid);
        let docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem(docSnap.data());
          setType("lost");
        } else {
          // Try Found Items if not in Lost
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

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={() => navigate(-1)}>⬅ Back</button>
      <h1>{item.itemName}</h1>

      {item.images?.length > 0 && (
        <img
          src={item.images[0]}
          alt="Item"
          style={{ width: "400px", borderRadius: "10px" }}
        />
      )}

      {type === "lost" && (
        <>
          <h3>How It Was Lost</h3>
          <p>{item.howItemLost || "No description provided"}</p>
          <h4>Date Lost:</h4>
          <p>{item.dateLost ? new Date(item.dateLost).toLocaleString() : "N/A"}</p>
        </>
      )}

      {type === "found" && (
        <>
          <h3>How It Was Found</h3>
          <p>{item.howItemFound || "No description provided"}</p>
          <h4>Date Found:</h4>
          <p>{item.dateFound ? new Date(item.dateFound).toLocaleString() : "N/A"}</p>
        </>
      )}

      <h3>Reported By</h3>
      <p>
        {item.personalInfo?.firstName} {item.personalInfo?.lastName} –{" "}
        {item.personalInfo?.course}
      </p>
    </div>
  );
}

export default ItemMoreDetailsPage;
