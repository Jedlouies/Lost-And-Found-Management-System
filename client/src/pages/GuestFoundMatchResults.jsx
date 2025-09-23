import React from "react";
import "../user_pages/styles/FoundMatchResults.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GuestFoundMatchResults() {
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
              <p><b>Location Lost:</b> {selectedItem.locationLost}</p>
              <p><b>Date Lost:</b> {selectedItem.dateLost
                ? new Date(selectedItem.dateLost).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                : "N/A"}</p>
              <p><b>Description:</b> {selectedItem.howItemLost || "No description provided"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        {matches.length === 0 && (
          <p style={{ color: "white", marginTop: "20%", marginLeft: '40%' }}>
            No lost items matched your found report.
          </p>
        )}

        <h1 style={{ position: "absolute", top: "-8%", fontWeight: "bold", fontSize: "20px" }}>
          Matching Found Items (Guest)
        </h1>

        {matches.map((matches, index) => {
          const lostItem = matches.lostItem || {};
          const posterInfo = lostItem.personalInfo || {};
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

              <h2 style={{ color: "black", fontSize: "24px", fontWeight: "bold", marginTop: "-30px" }}>
                {lostItem.itemName || "Unnamed Item"}
              </h2>

              {lostItem.images && lostItem.images.length > 0 && (
                <img
                  src={lostItem.images[0]}
                  alt="Lost Item"
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

              {/* Similarity scores */}
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

              {/* Poster info */}
              <div className="results-more" style={{marginTop: '-90px'}}>
                <p className="text-sm" style={{ color: "black", fontSize: "12px" }}>
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
                    {lostItem.howItemLost || "No details on how item was lost."}
                  </p>
                </div>
              </div>

              <div className="matching-card-actions" style={{marginTop: '-250px'}}>
                <button onClick={() => setSelectedItem(lostItem)}>Details</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer buttons */}
      <div className="matching-buttons-footer">
        <button
          style={{ left: "72%", top: "92%" }}
          onClick={() => handleNavigate(`/guest/${currentUser?.uid || "anonymous"}`)}
        >
          Continue
        </button>

        <button
          style={{ left: "85%", top: "92%" }}
          onClick={() => handleNavigate(`/guest/found/${currentUser?.uid || "anonymous"}`)}
        >
          Report Another
        </button>
      </div>
    </>
  );
}
