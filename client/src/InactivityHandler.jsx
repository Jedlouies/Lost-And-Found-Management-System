// InactivityHandler.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export default function InactivityHandler({ timeout = 5 * 60 * 1000 }) {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShowModal(true); // show modal after inactivity
    }, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleGoToLogin = () => {
    setShowModal(false);
    localStorage.clear();
    sessionStorage.clear();
    navigate("/log-in", { replace: true });
  };

  const handleContinue = () => {
    setShowModal(false);
    resetTimer();
  };

  return (
    <Modal show={showModal} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>Session Inactive</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        You’ve been inactive for a while. Do you want to continue your session?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleContinue}>
          Continue Session
        </Button>
        <Button variant="primary" onClick={handleGoToLogin}>
          Go to Log In
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
