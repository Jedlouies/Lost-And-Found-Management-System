// src/components/FloatingAlert.jsx
import React, { useEffect } from "react";
import "./styles/FloatingAlert.css";

function FloatingAlert({ message, type = "info", onClose }) {
  // auto close after 3s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`floating-alert floating-${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}

export default FloatingAlert;
