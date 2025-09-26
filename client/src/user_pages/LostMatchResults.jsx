import React from "react";
import '../user_pages/styles/LostMatchResults.css'
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import UserLostItemsPage from '../user_pages/UserLostItemsPage' 

export default function GuestLostMatchResults() {
  const { state } = useLocation();
   const { currentUser } = useAuth();
  const navigate = useNavigate();

  const matches = (state?.matches || [])
    .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
    .slice(0, 4);

  const [selectedItem, setSelectedItem] = React.useState(null);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <>
      {selectedItem && (
        <div className="floating-panel">
          <div className="floating-panel-content">
            <button className="close-btn" onClick={() => setSelectedItem(null)}>X</button>
            
            <h2>{selectedItem.itemName}</h2>
            
            {selectedItem.images?.[0] && (
              <img
                src={selectedItem.images[0]}
                alt="Item"
                style={{ width: "300px", height: "300px", objectFit: "cover", borderRadius: "10px" }}
              />
            )}
            <div style={{
              position: "absolute",
              textAlign: "left",
              marginTop: "20px",
              top: "50px",
              left: "350px",
              fontSize: "12px",
              color: "black"
            }}>
              <p><b>Item ID:</b> {selectedItem.itemId}</p>
              <p><b>Category:</b> {selectedItem.category}</p>
              <p><b>Location Found:</b> {selectedItem.locationFound}</p>
              <p><b>Date Found:</b> {selectedItem.dateFound
                ? new Date(selectedItem.dateFound).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "N/A"}</p>
              <p><b>Description:</b> {selectedItem.howItemFound || "No description provided"}</p>
            </div>
          </div>
        </div>
      )}
      <div className="p-6" style={{position: 'absolute', top: '7%', left: '5%', padding: '20px', backgroundColor: 'white', width: '100%', height: '130vh'}}>
        {matches.length === 0 && (
          <p style={{ color: "black", marginTop: "20%", marginLeft: '40%' }}>
            No found items matched your lost report.
          </p>
        )}

        <h1 style={{ position: "absolute", fontWeight: "bold", fontSize: "20px" }}>
          Matching Lost Items
        </h1>

        {matches.map((matches, index) => {
          const foundItem = matches.foundItem || {};
          const posterInfo = foundItem.personalInfo || {};
          const scores = matches.scores || {};

          return (
            <div key={index} className="matching-card">
              <p
                style={{
                  position: "relative",
                  color: "#475C6F",
                  marginLeft: "45%",
                  fontSize: "50px",
                  fontWeight: "bold"
                }}
              >
                {index + 1}
              </p>

              <h2 style={{ color: "black", fontSize: "24px", fontWeight: "bold", marginTop: '-30px' }}>
                {foundItem.itemName || "Unnamed Item"}
              </h2>

              {foundItem.images && foundItem.images.length > 0 && (
                <img
                  src={foundItem.images[0]}
                  alt="Found Item"
                  className="images"
                  style={{
                    border: "2px solid #475C6F",
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "200px",
                    marginTop: "20px"
                  }}
                />
              )}

              <div className="matching-results">
                <p style={{ color: "black" }}><strong>Image Similarity:</strong> {scores.imageScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage" style={{ width: `${(scores.imageScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{ color: "black" }}><strong>Name Similarity:</strong> {scores.nameScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage" style={{ width: `${(scores.nameScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{ color: "black" }}><strong>Description Similarity:</strong> {scores.descriptionScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage" style={{ width: `${(scores.descriptionScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{ color: "black" }}><strong>Location Similarity:</strong> {scores.locationScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage" style={{ width: `${(scores.locationScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{ color: "black" }}><strong>Overall Match:</strong> {scores.overallScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage" style={{ width: `${(scores.overallScore || 0) * 1.9}px` }}></div>
                </div>
              </div>

              <div className="results-more">
                <p className="text-sm" style={{ color: "black", fontSize: "12px" , marginTop: '-70px'}}>
                  <strong>Transaction ID:</strong> {matches.transactionId}
                </p>

                <div className="matching-profile-info"
                  style={{
                    backgroundColor: "#cbcbcb",
                    borderRadius: "20px",
                    position: "relative",
                    height: "50px",
                    width: "310px",
                    padding: "5px"
                  }}>
                  <img src={posterInfo.profileURL} alt="poster"
                    style={{
                      position: "absolute",
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "40px"
                    }} />
                  <div className="owner-info" style={{ marginLeft: "60px" }}>
                    <p style={{ fontSize: "20px", fontWeight: "bold", color: "black" }}>
                      {posterInfo.firstName} {posterInfo.lastName}
                    </p>
                    <p style={{ color: "black", fontStyle: "italic" }}>
                      {posterInfo.course
                        ? typeof posterInfo.course === "object"
                          ? `${posterInfo.course.abbr || ""}`
                          : "N/A"
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="howItemLost">
                  <p style={{
                    color: "black",
                    fontSize: "12px",
                    position: "absolute",
                    width: "300px",
                    height: "100px"
                  }}>
                    {foundItem.howItemFound || "No details on how item was found."}
                  </p>
                </div>
              </div>

              <div className="matching-card-actions" style={{marginTop: '-300px'}}>
                <button onClick={() => setSelectedItem(foundItem)}>Details</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="matching-buttons-footer">
        <button
          style={{ left: "72%", top: "92%" }}
          onClick={() => handleNavigate(`/users/item-management/${currentUser.uid}`)}
        >
          Continue
        </button>

        <button
          style={{ left: "85%", top: "92%" }}
          onClick={() => handleNavigate(`/users/lost-items/procedure/item-details/${currentUser.uid}`)}
        >
          Report Another
        </button>
      </div>
    </>
  );
}
