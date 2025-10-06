// components/RatingModal.jsx
import React, { useState } from "react";
import "./styles/RatingModal.css";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function GuestRatingModal({ onClose }) {
  const auth = getAuth();
  const user = auth.currentUser; 
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleStarClick = async (value) => {
    setRating(value);

    try {
      await addDoc(collection(db, "ratings"), {
        rating: value,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);

      // Wait 1.5 sec then close and redirect
      setTimeout(() => {
        onClose(); 
        navigate(`/guest/${user?.uid}`);
      }, 2000);
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  return (
    <div className="rating-modal-overlay">
      <div className="rating-modal">
        <h2>
          {submitted ? "Thanks for your feedback!" : "Rate our matching!"}
        </h2>

        {/* Show stars only if not submitted */}
        {!submitted && (
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= rating ? "selected" : ""}`}
                onClick={() => handleStarClick(star)}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
