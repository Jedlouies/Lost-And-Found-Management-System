import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { setDoc, doc, collection, getDocs, query, where } from "firebase/firestore";
import { Form, Card, Alert, Spinner, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext"; 
import Header from "../components/Header";
// Removed: import VerificationModal from "../components/VerificationModal";
// Removed: import createVerificationCode from "../components/createVerificationCode.jsx";

export default function GuestEmailRequestPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Removed state: const [showVerifyModal, setShowVerifyModal] = useState(false);
  // Removed state: const [pendingEmail, setPendingEmail] = useState("");

  //const API = "http://localhost:4000";
  const API = "https://server.spotsync.site";
 
  // --- Start: Helper Functions (MODIFIED Functionality) ---
  /*
  // Removed: sendVerificationEmail is no longer needed
  async function sendVerificationEmail(user, code) { ... } 
  */

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    
    try {
      if (!currentUser) {
        setError("No user session found.");
        return;
      }

      setLoading(true);
      const userUid = currentUser.uid;

      // --- 1. Prevent duplicate emails (Logic preserved) ---
      if (email) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          let isDuplicate = false;
          querySnapshot.forEach((docSnap) => {
            const userData = docSnap.data();
            if (userData.role !== "guest") {
              isDuplicate = true;
            }
          });

          if (isDuplicate) {
            setError("This email is already registered in the system.");
            setLoading(false);
            return;
          }
        }
      }

      // --- 2. Directly save the email and mark role as guest ---
      await setDoc(
        doc(db, "users", userUid),
        {
          email: email.trim() || null, // Save entered email (or null if empty)
          role: "guest",
          createdAt: new Date(),
          emailVerified: false, // Explicitly false since verification is skipped
        },
        { merge: true }
      );
      
      // --- 3. Navigate to the next step ---
      navigate(`/guest/${userUid}`);

    } catch (err) {
      console.error("Error saving guest info:", err);
      setError("Failed to save guest info. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    // Background and centering container
    mainContainer: {
      minHeight: '120vh',
      background: 'linear-gradient(135deg, #475C6F 0%, #1c2c36 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '50px 0',
    },
    // Card styling
    formCard: {
      width: "90%",
      maxWidth: "450px",
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
      padding: '20px',
    },
    // Heading
    heading: {
      color: '#143447', // Dark blue text
      textAlign: 'center',
      marginBottom: '15px',
      fontWeight: '700',
    },
    // Instructional text
    instructionText: {
      color: '#555',
      fontSize: '0.95rem',
      marginBottom: '20px',
      textAlign: 'center',
    },
    // Input field
    inputField: {
      borderColor: '#475C6F',
      borderRadius: '8px',
      padding: '12px 15px',
    },
    // Button styling
    saveButton: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: '600',
      width: '100%',
      marginTop: '15px',
      transition: 'background-color 0.2s',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
    },
    // Skip link (optional alternative if user skips email)
    skipLink: {
        fontSize: '0.9rem',
        color: '#475C6F',
        marginTop: '15px',
        cursor: 'pointer',
        textDecoration: 'underline',
    }
  };
  // --- End: Inline Styles ---


  return (
    <>
      <Header />

      {/* VerificationModal is no longer rendered */}

      <div style={styles.mainContainer}>
        <Card style={styles.formCard}>
          <Card.Body>
            <h3 style={styles.heading}>Provide Contact Email</h3>
            <p style={styles.instructionText}>
              Providing your email will help us contact you if a match is found for your lost item, or if the owner of a found item needs to be contacted.
            </p>

            {error && <Alert variant="danger" style={{ textAlign: 'center' }}>{error}</Alert>}

            <Form onSubmit={handleSave}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Enter your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.inputField}
                  disabled={loading}
                  // Removed 'required' attribute
                />
              </Form.Group>

              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  type="submit"
                  style={styles.saveButton}
                  // Button is disabled only when loading
                  disabled={loading}
                  onMouseEnter={(e) => !loading ? e.currentTarget.style.backgroundColor = '#005bb5' : null}
                  onMouseLeave={(e) => !loading ? e.currentTarget.style.backgroundColor = '#007AFF' : null}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Save & Continue to Report"
                  )}
                </Button>
                
              </div>
            </Form>
            
            {/* Optional: Add a simple skip link if the user leaves the email empty */}
            {/* If you want a separate button for skipping:
            <p 
                style={styles.skipLink}
                onClick={() => navigate(`/guest/${currentUser.uid}`)} 
            >
                Continue without saving email
            </p>
            */}

          </Card.Body>
        </Card>
      </div>
    </>
  );
}