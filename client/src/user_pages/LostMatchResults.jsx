import React from 'react';
import './styles/LostMatchResults.css';
import UserLostItemsPage from './UserLostItemsPage';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";

export default function LostMatchResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const matches = (state?.matches || [])
    .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
    .slice(0, 4);

  const auth = getAuth();
  const user = auth.currentUser;

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
            <div style={{position: 'absolute', textAlign: 'left', marginTop: '20px', top: '50px', left: '350px', fontSize: '12px', color: 'black'}}>
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

      <UserLostItemsPage />
      <div className='background'/>
          <button className="more-match">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
            className="bi bi-cpu" viewBox="0 0 16 16" style={{ marginRight: '10px' }}>
            <path d="M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0m-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3zM5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5zM6.5 6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z" />
          </svg>
          Match More
        </button>
      <div className="p-7">
        
        {matches.length === 0 && <p style={{color: 'black', marginTop: '20px'}}>No found items matched your lost report.</p>}

        <h1 style={{ position: 'absolute', top: '-8%', fontWeight: 'bold', fontSize: '20px' }}>
          Matching Lost Items
        </h1>



        {matches.map((match, index) => {
          const foundItem = match.foundItem || {};
          const posterInfo = foundItem.personalInfo || {};
          const scores = match.scores || {};
          
          console.log(`Match #${index + 1} Scores:`, scores);

          return (
            <div key={index} className="matching-card">
              <p className="text-lg font-bold text-blue-600 mb-2"
                style={{
                  position: 'relative',
                  color: '#475C6F',
                  marginLeft: '45%',
                  fontSize: '50px',
                  fontWeight: 'bold'
                }}>
                {index + 1}
              </p>

              <h2 className="text-lg font-semibold mb-1"
                style={{ color: 'black', fontSize: '24px', fontWeight: 'bold' }}>
                {foundItem.itemName || 'Unnamed Item'}
              </h2>

              {foundItem.images && foundItem.images.length > 0 && (
                <img
                  src={foundItem.images[0]}
                  alt="Found Item"
                  className="images"
                  style={{
                    border: '2px solid #475C6F',
                    width: '100px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '200px',
                    marginTop: '20px'
                  }}
                />
              )}

              <div className="matching-results">
                <p style={{color: 'black'}}><strong>Image Similarity:</strong> {scores.imageScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage"
                    style={{ width: `${(scores.imageScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{color: 'black'}}><strong>Name Similarity:</strong> {scores.nameScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage"
                    style={{ width: `${(scores.nameScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{color: 'black'}}><strong>Description Similarity:</strong> {scores.descriptionScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage"
                    style={{ width: `${(scores.descriptionScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{color: 'black'}}><strong>Location Similarity:</strong> {scores.locationScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage"
                    style={{ width: `${(scores.locationScore || 0) * 1.9}px` }}></div>
                </div>
                <br />
                <p style={{color: 'black'}}><strong>Overall Match:</strong> {scores.overallScore || 0}%</p>
                <div className="progress-bar-full">
                  <div className="progress-bar-percentage"
                    style={{ width: `${(scores.overallScore || 0) * 1.9}px` }}></div>
                </div>
              </div>

              {/* Poster Info */}
              <div className="results-more">
                <p className="text-sm" style={{ color: 'black', fontSize: '12px' }}>
                  <strong>Transaction ID:</strong> {match.transactionId}
                </p>

                <div className="matching-profile-info"
                  style={{
                    backgroundColor: '#cbcbcb',
                    borderRadius: '20px',
                    position: 'relative',
                    height: '50px',
                    width: '310px',
                    padding: '5px'
                  }}>
                  <img src={posterInfo.profileURL} alt="poster"
                    style={{
                      position: 'absolute',
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '40px'
                    }} />
                  <div className="owner-info" style={{ marginLeft: '60px'}}>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
                      {posterInfo.firstName} {posterInfo.lastName}
                    </p>
                     <p style={{ color: 'black', fontStyle: 'italic' }}>
                  {posterInfo.course
                    ? typeof posterInfo.course === "object"
                      ? `${posterInfo.course.abbr || ""}`
                      : "N/A"
                    : "N/A"}
                </p>
                  </div>
                </div>

                {/* How item was found */}
                <div className="howItemLost">
                  <p style={{
                    color: 'black',
                    fontSize: '12px',
                    position: 'absolute',
                    width: '300px',
                    height: '100px'
                  }}>
                    {foundItem.howItemFound || 'No details on how item was found.'}
                  </p>
                </div>
              </div>

              <div className="matching-card-actions">
                <button onClick={() => setSelectedItem(foundItem)}>
                  Details
                </button>
              </div>

            </div>
          );
        })}
      </div>
        <div className="matching-buttons-footer">
          <button
            style={{ left: '72%' , top: '92%' }}
            onClick={() => handleNavigate(`/home/${user?.uid}`)}
          >
            Continue
          </button>

          <button
            style={{ left: '85%', top: '92%' }}
            onClick={() =>
              handleNavigate(`/users/item-management/${user?.uid}`)
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              fill="currentColor" className="bi bi-arrow-repeat"
              viewBox="0 0 16 16" style={{ marginRight: '10px' }}>
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
              <path fillRule="evenodd"
                d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z" />
            </svg>
            Match Another
          </button>
        </div>

    </>
  );
}
