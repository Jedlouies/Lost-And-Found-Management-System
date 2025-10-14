import React, { useEffect, useState, useRef } from 'react';
import './styles/FeedbackChart.css';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function FeedBackChart() {
  const [ratings, setRatings] = useState({1:[],2:[],3:[],4:[],5:[]}); // only actual feedback
  const [allRatingsCount, setAllRatingsCount] = useState({1:0,2:0,3:0,4:0,5:0}); // include null for percentage
  const [hoveredRating, setHoveredRating] = useState(null);
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    const fetchRatings = async () => {
      const ratingsSnapshot = await getDocs(collection(db, 'ratings'));
      const tempRatings = {1:[],2:[],3:[],4:[],5:[]};
      const tempCounts = {1:0,2:0,3:0,4:0,5:0};

      ratingsSnapshot.forEach(doc => {
        const data = doc.data();
        if(data.rating >= 1 && data.rating <= 5) {
          tempCounts[data.rating]++; // count all for percentage
          if(data.feedback && data.feedback.trim() !== ''){
            tempRatings[data.rating].push(data.feedback); // only actual feedback
          }
        }
      });

      setRatings(tempRatings);
      setAllRatingsCount(tempCounts);
    };
    fetchRatings();
  }, []);

  const getStars = (rating) => {
    const stars = [];
    for(let i=1;i<=5;i++){
      stars.push(
        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="30" height="30"
          fill={i<=rating ? '#FFD700' : '#ccc'} viewBox="0 0 16 16">
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 
          6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 
          0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 
          3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>
      );
    }
    return stars;
  };

  const getPercentage = (rating) => {
    const total = Object.values(allRatingsCount).reduce((sum, count) => sum + count, 0);
    if(total === 0) return 0;
    return (allRatingsCount[rating] / total) * 100;
  };

  const startSlideshow = (rating) => {
    const feedbacks = ratings[rating] || [];
    if(feedbacks.length === 0) return; // only start slideshow if feedback exists

    setCurrentFeedbackIndex(0);
    setCountdown(5);

    if(intervalRef.current) clearInterval(intervalRef.current);
    if(countdownRef.current) clearInterval(countdownRef.current);

    // Slideshow interval
    intervalRef.current = setInterval(() => {
      setCurrentFeedbackIndex(prev => (prev + 1) % feedbacks.length);
      setCountdown(5);
    }, 5000);

    // Countdown interval
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 5));
    }, 1000);
  };

  const handleMouseEnter = (e, rating) => {
    const rect = containerRef.current.getBoundingClientRect();
    setHoverPos({ top: e.clientY - rect.top + 10, left: e.clientX - rect.left });
    setHoveredRating(rating);
    startSlideshow(rating);
  };

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    setHoverPos({ top: e.clientY - rect.top + 10, left: e.clientX - rect.left });
  };

  const handleMouseLeave = () => {
    setHoveredRating(null);
    setCurrentFeedbackIndex(0);
    setCountdown(5);
    if(intervalRef.current) clearInterval(intervalRef.current);
    if(countdownRef.current) clearInterval(countdownRef.current);
  };

  return (
    <div className="feedback-body" ref={containerRef} style={{ width:'100%', padding:'10px', position:'relative' }}>
      {[5,4,3,2,1].map(rating => (
        <div key={rating} className="feedback-rows" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}
          onMouseEnter={(e)=>handleMouseEnter(e, rating)}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="stars-group" style={{ display:'flex', gap:'5px' }}>
            {getStars(rating)}
          </div>
          <span style={{ fontWeight:'500', color:'#475C6F', whiteSpace:'nowrap' }}>
            {getPercentage(rating).toFixed(2)}%
          </span>
        </div>
      ))}

      {hoveredRating && ratings[hoveredRating]?.length > 0 && (
        <div style={{
          position: 'absolute',
          top: hoverPos.top,
          left: hoverPos.left,
          backgroundColor: '#fff',
          color: '#000',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          zIndex: 9999,
          maxHeight: '150px',
          overflowY: 'auto',
          width: '300px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          wordWrap: 'break-word',
        }}>
          <p style={{margin:'5px 0', color: 'black'}}>
            {ratings[hoveredRating][currentFeedbackIndex]}
          </p>
          <p style={{margin:'5px 0', fontSize:'12px', color:'#555', textAlign:'right'}}>
            {countdown}s
          </p>
        </div>
      )}
    </div>
  );
}

export default FeedBackChart;
