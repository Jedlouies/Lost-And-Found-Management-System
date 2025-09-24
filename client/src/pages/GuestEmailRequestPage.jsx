import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { setDoc, doc } from "firebase/firestore";
import { query, where, collection, getDocs } from "firebase/firestore";
import { Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import { useAuth } from '../context/AuthContext'; 
import Header from "../components/Header";

export default function GuestEmailRequestPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (!currentUser) {
        setError("No user session found.");
        return;
      }

      setLoading(true); 

      if (email) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("This email is already registered in the system.");
        setLoading(false);
        return;
      }
    }

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          email: email || null,
          role: "guest",
          createdAt: new Date(),
        },
        { merge: true } 
      );

      navigate(`/guest/${currentUser.uid}`);
    } catch (err) {
      console.error("Error creating guest:", err);
      setError("Failed to save guest info.");
    } finally {
      setLoading(false); 
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
              <p  style={{color: 'red'}}>
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
                    disabled={loading}
                  />
                </Form.Group>

                <div className="d-flex justify-content-between">
                
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        /> 
                      </>
                    ) : (
                      "Save & Continue"
                    )}
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
