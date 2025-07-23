import React from 'react';
import './styles/FoundMatchResults.css';
import UserFoundItemsPage from './UserFoundItemsPage';
import { useLocation, useNavigate } from 'react-router-dom';

const ProgressBar = ({ value }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  

  let color = 'red';
  if (percentage >= 70) color = 'green';
  else if (percentage >= 40) color = 'yellow';

  return (
    <div className="w-full bg-gray-300 rounded-full h-5 relative overflow-hidden shadow-inner">
      <div
        className={`${color}`}
        style={{ width: `${percentage}%` }}
      ></div>
      <span className="absolute inset-0 text-xs font-bold text-center text-black flex items-center justify-center">
        {percentage}%
      </span>
    </div>
  );
};

export default function FoundMatchResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const matches = (state?.matches || [])
    .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
    .slice(0, 4); 

  return (
    <>
    <UserFoundItemsPage />
    <div className="p-6">
      {matches.length === 0 && <p>No matches found.</p>}
      <h1 style={{position: 'absolute', top: '-10%', left: '35%', fontWeight: 'bold'}}>AI Matching Result</h1>

      {matches.map((match, index) => {
        const lostItem = match.lostItem || {};
        const posterInfo = lostItem.personalInfo || {};
        const scores = match.scores || {};

        return (
          <div key={index} className='matching-card'>
            
            <p className="text-lg font-bold text-blue-600 mb-2" style={{position: 'relative', color: 'black', marginLeft: '45%', fontSize: '50px', fontWeight: 'bold', color: '#475C6F'}}>
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

    </>
  );
}
