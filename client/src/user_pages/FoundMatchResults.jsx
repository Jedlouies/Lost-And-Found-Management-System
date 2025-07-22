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
    .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0)) // Sort descending
    .slice(0, 4); 

  return (
    <>
    <UserFoundItemsPage />
    <div className="p-6">
      {matches.length === 0 && <p>No matches found.</p>}

      {matches.map((match, index) => {
        const lostItem = match.lostItem || {};
        const posterInfo = lostItem.personalInfo || {};
        const scores = match.scores || {};

        return (
          <div key={index} className="p-4 border rounded bg-gray-50 mb-6">
            
            <p className="text-lg font-bold text-blue-600 mb-2" style={{position: 'relative', color: 'black', marginLeft: '40%', fontSize: '50px', fontWeight: 'bold', color: '#475C6F'}}>
              {index + 1}
            </p>
             {lostItem.images && lostItem.images.length > 0 && (
              <img
                src={lostItem.images[0]}
                alt="Lost Item"
                className="images"
                style={{ border: '2px solid #475C6F', width: '100px', height: '100px', objectFit: 'cover', borderRadius: '200px' }}
              />
            )}
            <div className='matching-results'>
                  <p style={{ color: 'black' }}>
                    <strong>Image Similarity:</strong> {scores.imageScore || 0}%
                  </p>
                  <p style={{ color: 'black' }}>
                    <strong>Name Similarity:</strong> {scores.nameScore || 0}%
                  </p>
                  <p style={{ color: 'black' }}>
                    <strong>Description Similarity:</strong> {scores.descriptionScore || 0}%
                  </p>
                  <p style={{ color: 'black' }}>
                    <strong>Category Similarity:</strong> {scores.categoryScore || 0}%
                  </p>
                  <p style={{ color: 'black' }}>
                    <strong>Location Similarity:</strong> {scores.locationScore || 0}%
                  </p>
                  <p className="font-semibold text-blue-700" style={{ color: 'black' }}>
                    <strong>Overall Match:</strong> {scores.overallScore || 0}%
                  </p>
                  <div ></div>
            </div>

          
            <p className="text-sm text-gray-600 mb-2" style={{ color: 'black' }}>
              <strong>Transaction ID:</strong> {match.transactionId}
            </p>

           
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'black', fontSize: '30px ', fontWeight: 'bold' }}>
              {lostItem.itemName || 'Unnamed Item'}
            </h2>
            
            <img src={posterInfo.profileURL} alt="img" style={{position: 'absolute', width: '40px', height: '40px', objectFit: 'cover', borderRadius: '40px'}}/>
            <div className='owner-info' style={{ color: 'black', position: 'absolute',  top: '20%' }}>
              <p style={{ color: 'black',}}>
                {posterInfo.firstName} {posterInfo.lastName}
              </p>
              <p style={{ color: 'black' }}>
                {posterInfo.course}
              </p>
            </div>

           

            <p style={{ color: 'black' }}>
              <strong>Location Lost:</strong> {lostItem.locationLost}
            </p>
            <p style={{ color: 'black' }}>
              <strong>Category:</strong> {lostItem.category}
            </p>
           

            </div>
        );
      })}

    </div>

    </>
  );
}
