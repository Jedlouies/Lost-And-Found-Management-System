import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";
import createVerificationCode from "./createVerificationCode.jsx";

function VerificationModal({ show, onClose, user, sendVerificationEmail, onVerified }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expiryCountdown, setExpiryCountdown] = useState(600); // 600s = 10 min

  // countdown timer for expiry
  useEffect(() => {
    if (expiryCountdown <= 0) return;
    const timer = setInterval(() => setExpiryCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [expiryCountdown]);

  const handleVerify = async () => {
    try {
      const q = query(
        collection(db, "verifications"),
        where("email", "==", user.email),
        where("code", "==", code)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        const now = Timestamp.now();

        if (now.seconds - data.createdAt.seconds > 120) {
          setError("Code expired. Please request a new one.");
          return;
        }

        alert("Email verified successfully!");
        onVerified();
        onClose();
      } else {
        setError("Invalid code.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Verification failed. Please try again.");
    }
  };

  const handleResend = async () => {
    try {
      setError("");
      setMessage("");

      const newCode = await createVerificationCode(user);
      await sendVerificationEmail(user, newCode);

      setMessage("New code has been sent.");
      setExpiryCountdown(600); // reset countdown
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend verification code.");
    }
  };

  // format countdown as MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton={false}>
        <Modal.Title>Email Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ color: "black" }}>
          We sent a 6-digit code to <strong>{user?.email}</strong>. Enter it below:
        </p>
        <Form.Control
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p style={{ marginTop: "10px", color: expiryCountdown > 0 ? "black" : "red" }}>
          {expiryCountdown > 0
            ? `Code will expire in ${formatTime(expiryCountdown)}`
            : "Code expired. Please request a new one."}
        </p>
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="outline-primary"
          onClick={handleResend}
          disabled={expiryCountdown > 0 && expiryCountdown <= 600 && expiryCountdown > 540} // optional: only allow resend after 1 min
        >
          Resend Code
        </Button>
        <Button variant="primary" onClick={handleVerify} disabled={expiryCountdown <= 0}>
          Verify
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default VerificationModal;
