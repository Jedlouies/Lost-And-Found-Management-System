import React, { useState } from "react";
import "./styles/RatingModal.css";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

export default function RatingModal({ onClose }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a rating before submitting.");
    setLoading(true); // ✅ Start loading

    try {
      await addDoc(collection(db, "ratings"), {
        rating,
        feedback,
        userId: user?.uid || "guest",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);

      setTimeout(() => {
        setLoading(false); // ✅ Stop loading
        onClose();
        navigate(`/users/item-management/${user?.uid}`);
      }, 2000);
    } catch (error) {
      console.error("Error saving rating:", error);
      setLoading(false);
    }
  };

  return (
    <div className="rating-modal-overlay">
      <div className="rating-modal">
        <h2>
          {submitted
            ? "Thanks for your feedback!"
            : loading
            ? "Submitting your feedback..."
            : "Rate our matching!"}
        </h2>

        {/* Spinner when loading */}
        {loading ? (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <img
              src="/Spin_black.gif"
              alt="Loading..."
              style={{ width: "60px", height: "60px" }}
            />
          </div>
        ) : !submitted ? (
          <>
            {/* ⭐ Rating stars */}
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= rating ? "selected" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* 📝 Feedback textarea */}
            <textarea
              placeholder="Tell us what you think (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              style={{
                width: "100%",
                minHeight: "80px",
                marginTop: "15px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "white",
                resize: "none",
                color: "black",
                fontFamily: "inherit",
              }}
            />

            {/* ✅ Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                marginTop: "15px",
                backgroundColor: "#475C6F",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
