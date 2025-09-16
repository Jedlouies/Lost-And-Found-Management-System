import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { addDoc, collection, setDoc, doc } from "firebase/firestore";
import { Form, Button, Card, Alert } from "react-bootstrap";
import { useAuth } from '../context/AuthContext'; 
import Header from "../components/Header";

export default function GuestEmailRequestPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSave(e) {
  e.preventDefault();
  try {
    if (!currentUser) {
      setError("No user session found.");
      return;
    }

    await setDoc(doc(db, "users", currentUser.uid), {
      email: email || null,
      role: "guest",
      createdAt: new Date(),
    });

    navigate(`/guest/${currentUser.uid}`);
  } catch (err) {
    console.error("Error creating guest:", err);
    setError("Failed to save guest info.");
  }
}

  function handleSkip() {
    navigate(`/guest/${currentUser.uid}`);
  }

  return (
    <>
        <Header />
        <div className="background2">
        <div className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: "25rem" }}>
        <Card.Body>
          <h3 className="text-center mb-3">Email Address</h3>
          <p className="text-muted text-center">
            Provide your email to receive updates about your lost item.  
            If you skip, you won’t get any notifications.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label>Email (Optional)</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={handleSkip}>
                Skip
              </Button>
              <Button variant="primary" type="submit">
                Save & Continue
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>

    </div>

    </>
  );
}
