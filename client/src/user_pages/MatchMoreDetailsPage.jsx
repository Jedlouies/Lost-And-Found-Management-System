import React from "react";
import { useParams, useLocation } from "react-router-dom";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader";
import "./styles/ItemMoreDetailsPage.css";

function MatchMoreDetailsPage() {
  const { uid } = useParams();
  const location = useLocation();
  const { item } = location.state || {};

  if (!item) return <p>No match data provided.</p>;

  // status color container
  const getStatusStyle = (status) => {
    if (!status) return { backgroundColor: "#ccc", color: "black" };
    switch (status.toLowerCase()) {
      case "posted": return { backgroundColor: "green", color: "white" };
      case "pending": return { backgroundColor: "orange", color: "white" };
      case "cancelled": return { backgroundColor: "red", color: "white" };
      default: return { backgroundColor: "#ccc", color: "black" };
    }
  };

  // Only show opposite type matches
  const filteredMatches = item.topMatches?.filter((match) => {
    if (item.type?.toLowerCase() === "found") {
      return match.lostItem; // only lost matches
    }
    if (item.type?.toLowerCase() === "lost") {
      return match.foundItem; // only found matches
    }
    return true;
  });

  return (
    <>
      <UserNavigationBar />
      <div className="manage-item-body">
        <UserBlankHeader />
        <div className="manage-item-container">

          {/* Reported Item */}
          <div style={{ marginBottom: "30px" }}>
            <h2>Reported Item</h2>
            {item.images?.length > 0 && (
              <img
                src={item.images[0]}
                alt="Main Item"
                style={{
                  width: "500px",
                  height: "500px",
                  borderRadius: "10px",
                  objectFit: "cover",
                }}
              />
            )}
            <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "530px",
                  width: "200px",
                  textAlign: "center",
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  ...getStatusStyle(item.status),
                }}
              >
                {item.status.toUpperCase()}
              </div>
            <div
              style={{
                position: "absolute",
                top: "10%",
                left: "35%",
                width: "55%",
                backgroundColor: "white",
                padding: "10px",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
              }}
            >
              
              <p><b>Item ID:</b> {item.itemId}</p>
              <p><b>Name:</b> {item.itemName}</p>
              <p><b>Category:</b> {item.category}</p>
              <p>
                <b>Date Reported:</b>{" "}
                {item.dateSubmitted ? new Date(item.dateSubmitted).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) : "N/A"}
              </p>
              <p><b>Location:</b> {item.location}</p>
              <p 
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '35%',
                  width: '500px',
                  height: '150px'
                }}
              >
                <b>Description:</b> {item.itemDescription || "No description provided"}
              </p>


            </div>
          </div>

          {/* Matches */}
          <div
            style={{
              position: "absolute",
              top: "45%",
              left: "35%",
              
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <h2>Matching Results</h2>
            <div style={{display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap'}}>
            {filteredMatches?.length > 0 ? (
              filteredMatches.map((match, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "10px",
                    width: "300px",
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    textAlign: 'center',
                    fontSize: '12px',
                    lineHeight: '.5',
                  }}
                >
                  <h4>Top {index + 1}</h4>

                  {item.type?.toLowerCase() === "found" && match.lostItem && (
                    <div>
                      
                      {match.lostItem.images?.[0] && (
                        <img
                          src={match.lostItem.images[0]}
                          alt="Lost Item"
                          style={{
                            width: "200px",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginBottom: "10px",
                          }}
                        />
                      )}
                      <p><b>Item ID:</b> {match.lostItem.itemId}</p>
                      <p><b>Transaction ID:</b> {match.transactionId}</p>
                      <p><b>Name:</b> {match.lostItem.itemName}</p>
                      <p><b>Location:</b> {match.lostItem.locationLost}</p>
                    </div>
                  )}

                  {item.type?.toLowerCase() === "lost" && match.foundItem && (
                    <div>
                      <h4>Found Item</h4>
                      {match.foundItem.images?.[0] && (
                        <img
                          src={match.foundItem.images[0]}
                          alt="Found Item"
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                      )}
                      <p><b>ID:</b> {match.foundItem.itemId}</p>
                      <p><b>Name:</b> {match.foundItem.itemName}</p>
                      <p><b>Location:</b> {match.foundItem.locationFound}</p>
                    </div>
                  )}

                  {match.scores && (
                    <div style={{ marginTop: "10px" }}>
                      <p>Scores</p>
                      <p><b>Overall:</b> {match.scores.overallScore}%</p>
                      <p><b>Description:</b> {match.scores.descriptionScore}%</p>
                      <p><b>Image:</b> {match.scores.imageScore}%</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No matches found for this item.</p>
            )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MatchMoreDetailsPage;
