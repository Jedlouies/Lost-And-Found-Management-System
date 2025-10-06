import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";
import createVerificationCode from "./createVerificationCode.jsx";

function VerificationModal({ show, onClose, user, sendVerificationEmail, onVerified }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expiryCountdown, setExpiryCountdown] = useState(120);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (show) {
      setExpiryCountdown(120);
      setCode("");
      setError("");
      setMessage("");
      setVerified(false);

      const timer = setInterval(() => {
        setExpiryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [show]);

  const handleVerify = async () => {
    setVerifying(true);
    setError("");

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
          setVerifying(false);
          return;
        }

        // ✅ Success
        setVerified(true);
        await onVerified();

        // Auto-close after 3s
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError("Invalid code.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setError("");
      setMessage("");

      const newCode = await createVerificationCode(user);
      await sendVerificationEmail(user, newCode);

      setMessage("New code has been sent to your email.");
      setExpiryCountdown(120); // reset countdown
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend verification code.");
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !verifying && expiryCountdown > 0) {
      e.preventDefault(); // prevent accidental form submission
      handleVerify();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
      {!verified ? (
        <>
          <Modal.Header>
            <Modal.Title>Email Verification</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{ color: "black" }}>
              We sent a 6-digit code to <strong>{user?.email}</strong>.
            </p>
            <Form.Control
              type="text"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyPress} // 👈 Enable Enter key to verify
              disabled={verifying || expiryCountdown <= 0}
            />
            <p
              style={{
                marginTop: "10px",
                color: expiryCountdown > 0 ? "black" : "red",
                fontSize: "12px",
              }}
            >
              {expiryCountdown > 0
                ? `Code will expire in ${formatTime(expiryCountdown)}`
                : "Code expired. Please request a new one."}
            </p>
            {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
            {message && <p style={{ color: "green", marginTop: "10px" }}>{message}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose} disabled={verifying}>
              Cancel
            </Button>
            <Button variant="outline-primary" onClick={handleResend} disabled={verifying}>
              Resend Code
            </Button>
            <Button
              variant="primary"
              onClick={handleVerify}
              disabled={expiryCountdown <= 0 || verifying}
            >
              {verifying ? (
                <>
                  <Spinner animation="border" size="sm" /> Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </Modal.Footer>
        </>
      ) : (
        <Modal.Body
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          ✅ Email Verified Successfully!
        </Modal.Body>
      )}
    </Modal>
  );
}

export default VerificationModal;
