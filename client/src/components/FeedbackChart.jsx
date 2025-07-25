import React, { useState } from 'react';
import './styles/FeedBackChart.css';

function FeedBackChart() {
  const [percentages, setPercentages] = useState([20.34, 34.45, 13.34, 23.56, 23.21]);

  const getStars = (index) => {
    const maxStars = 5;
    const fullStars = maxStars - index;
    const emptyStars = maxStars - fullStars;

    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`filled-${i}`} xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#475C6F" className="bi bi-star-fill" viewBox="0 0 16 16">
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#475C6F" className="bi bi-star" viewBox="0 0 16 16">
          <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className='feedback-body'>
      {percentages.map((percent, index) => (
        <div key={index} className='feedback-rows'>
          {getStars(index)}
          <span className="percentage-text" style={{ marginLeft: '120px', fontWeight: '500', color: '#475C6F' }}>
            {percent.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default FeedBackChart;
