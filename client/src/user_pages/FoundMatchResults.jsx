import React from 'react';
import './styles/FoundMatchResults.css';
import UserFoundItemsPage from './UserFoundItemsPage';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from "firebase/auth";



export default function FoundMatchResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const matches = (state?.matches || [])
    .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
    .slice(0, 4); 

  const auth = getAuth();
  const user = auth.currentUser; 
  
  const handleNavigate = (path) => {
    navigate(path)
  }

  return (
    <>
    <UserFoundItemsPage />
    <div className='background'/>
          <button className='more-match'>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-cpu" viewBox="0 0 16 16" style={{marginRight: '10px'}}>
          <path d="M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14 4.5h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14a2.5 2.5 0 0 1-2.5 2.5v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 2 11.5H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2v-1H.5a.5.5 0 0 1 0-1H2A2.5 2.5 0 0 1 4.5 2V.5A.5.5 0 0 1 5 0m-.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3zM5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5zM6.5 6a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
        </svg>
        Match More
        </button>
    <div className="p-6">
      {matches.length === 0 && <p>No matches found.</p>}
      <h1 style={{position: 'absolute', top: '-8%', fontWeight: 'bold', fontSize: '20px'}}>Matching Result</h1>


      {matches.map((match, index) => {
        const lostItem = match.lostItem || {};
        const posterInfo = lostItem.personalInfo || {};
        const scores = match.scores || {};

        return (
          <div key={index} className='matching-card'>
            
            <p className="text-lg font-bold text-blue-600 mb-2" style={{position: 'relative', color: 'black', marginLeft: '45%', fontSize: '50px', fontWeight: 'bold'}}>
              {index + 1}
            </p>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'black', fontSize: '24px ', fontWeight: 'bold' }}>
                {lostItem.itemName || 'Unnamed Item'}
              </h2>
             {lostItem.images && lostItem.images.length > 0 && (
              <img
                src={lostItem.images[0]}
                alt="Lost Item"
                className="images"
                style={{ border: '2px solid #475C6F', width: '100px', height: '100px', objectFit: 'cover', borderRadius: '200px', marginTop: '20px' }}
              />
            )}
            <div className='matching-results' >
                  <p style={{ color: 'black' }}>
                    <strong>Image Similarity:</strong> {scores.imageScore || 0}%
                  </p>
                  <div className='progress-bar-full'>
                    <div
                      className="progress-bar-percentage"
                      style={{ width: `${(scores.imageScore || 0) * 1.9}px` }}
                    ></div>
                  </div>
                  <br />
                  <p style={{ color: 'black' }}>
                    <strong>Name Similarity:</strong> {scores.nameScore || 0}%
                  </p>
                  <div className='progress-bar-full'>
                    <div
                      className="progress-bar-percentage"
                      style={{ width: `${(scores.nameScore || 0) * 1.9}px` }}
                    ></div>
                  </div>
                  <br />
                  <p style={{ color: 'black' }}>
                    <strong>Description Similarity:</strong> {scores.descriptionScore || 0}%
                  </p>
                  <div className='progress-bar-full'>
                    <div
                      className="progress-bar-percentage"
                      style={{ width: `${(scores.descriptionScore || 0) * 1.9}px` }}
                    ></div>
                  </div>
                  <br />
                  <p style={{ color: 'black' }}>
                    <strong>Location Similarity:</strong> {scores.locationScore || 0}%
                  </p>
                   <div className='progress-bar-full'>
                  <div
                      className="progress-bar-percentage"
                      style={{ width: `${(scores.locationScore || 0) * 1.9}px` }}
                    ></div>
                  </div>
                  <br />
                  <p className="font-semibold text-blue-700" style={{ color: 'black' }}>
                    <strong>Overall Match:</strong> {scores.overallScore || 0}%
                  </p>
                  <div className='progress-bar-full'>
                  <div
                      className="progress-bar-percentage"
                      style={{ width: `${(scores.overallScore || 0) * 1.9}px` }}
                    ></div>
                  </div>
                  <br />
                  
            </div>

            <div className='results-more'>
              <p className="text-sm text-gray-600 mb-2" style={{ color: 'black', fontSize: '12px'}}>
                <strong>Transaction ID:</strong> {match.transactionId}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16" style={{marginLeft: '5px', cursor: 'pointer'}}>
                  <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                </svg>

              </p>

            

              
              <div className='matching-profile-info' style={{backgroundColor: '#cbcbcb', borderRadius: '20px', position: 'relative', height: '50px', width: '310px', padding: '5px'}}>
                  <img src={posterInfo.profileURL} alt="img" style={{position: 'absolute', width: '40px', height: '40px', objectFit: 'cover', borderRadius: '40px'}}/>
                  <div className='owner-info' style={{ color: 'black', position: 'absolute',   marginLeft: '60px' }}>
                    <p style={{ color: 'black', fontSize: '20px', fontWeight: 'bold' }}>
                      {posterInfo.firstName} {posterInfo.lastName}
                    </p>
                    <p style={{ color: 'black', fontStyle: 'italic' }}>
                      {posterInfo.course}
                    </p>

                  </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-quote" viewBox="0 0 16 16">
                <path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388q0-.527.062-1.054.093-.558.31-.992t.559-.683q.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 9 7.558V11a1 1 0 0 0 1 1zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612q0-.527.062-1.054.094-.558.31-.992.217-.434.559-.683.34-.279.868-.279V3q-.868 0-1.52.372a3.3 3.3 0 0 0-1.085.992 4.9 4.9 0 0 0-.62 1.458A7.7 7.7 0 0 0 3 7.558V11a1 1 0 0 0 1 1z"/>
              </svg>
                <div className='howItemLost'>
                    <p style={{color: 'black', fontSize: '12px', position: 'absolute',  width: '300px', height: '100px'}}>{lostItem.howItemLost}</p>
                  </div>
              </div>
              <div className='matching-card-actions'>
                <button>Details</button>
              </div>
              
          </div>
           
        );
      })}
      </div>
      <div className='matching-buttons-footer'>
        <button style={{left: '72%', top: '92%'}} className={`${location.pathname === `/users/item-management/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/users/item-management/${user?.uid}`)}>
          Continue
        </button>
        <button style={{left: '85%', top: '92%'}} className={`${location.pathname === `/users/found-items/procedure/item-details/${user?.uid}` ? 'active' : ''}`} onClick={() => handleNavigate(`/users/found-items/procedure/item-details/${user?.uid}`)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16" style={{marginRight: '10px'}}>
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9"/>
            <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"/>
          </svg>
          Match Another
        </button>
      
    </div>

    </>
  );
}
