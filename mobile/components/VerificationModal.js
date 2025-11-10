import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import createVerificationCode from "../utils/createVerificationCode";

// Define placeholder color
const PLACEHOLDER_COLOR = "#A9A9A9";

// 1. Re-add `show` to the props
function VerificationModal({ show, user, onVerified, onClose, sendVerificationEmail }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expiryCountdown, setExpiryCountdown] = useState(120);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  
  const timerRef = useRef(null); // Use a ref to hold the timer ID

  // Function to start/restart the timer
  const startTimer = () => {
    // Clear any old timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Reset the countdown
    setExpiryCountdown(120);
    
    // Start a new timer
    timerRef.current = setInterval(() => {
      setExpiryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current); // Stop timer when it hits 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    // 2. Add `show` to the effect's condition
    // Only run if the modal is being shown and a user is present
    if (show && user) {
      // Reset all state when modal is opened
      setCode("");
      setError("");
      setMessage("");
      setVerified(false);
      startTimer(); // Call the timer function
    }

    // This cleanup runs when the modal is closed
    if (!show) {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    }

    // This cleanup runs if the component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [show, user]); // 3. Add `show` to the dependency array

  const handleVerify = async () => {
    if (!code) return;
    setVerifying(true);
    setError("");

    try {
      const q = query(
        collection(db, "verifications"),
        // Note: You may want to query by UID instead of email if emails can be changed
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

        setVerified(true);
        if (onVerified) {
            await onVerified(); // Call the onVerified callback from props
        }

        // Keep the success message for a moment before closing
        setTimeout(() => {
          onClose();
        }, 2000);
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
      setVerifying(true);

      const newCode = await createVerificationCode(user.uid, user.email);
      if (sendVerificationEmail) {
        await sendVerificationEmail(user, newCode);
      } else {
        console.warn("`sendVerificationEmail` function not provided.");
        Alert.alert("Dev Info", `New code is ${newCode}.`);
      }

      setMessage("New code has been sent to your email.");
      startTimer(); // Restart the timer
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend verification code.");
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    // 4. Use the `show` prop for the `visible` attribute
    <Modal transparent={true} visible={show} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {verified ? (
            <View style={styles.verifiedContainer}>
              <Text style={styles.verifiedText}>Verified Successfully!</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Email Verification</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to <Text style={{ fontWeight: "bold" }}>{user?.email}</Text>.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!verifying && expiryCountdown > 0}
              />

              <Text style={[styles.timerText, { color: expiryCountdown > 0 ? "gray" : "red" }]}>
                {expiryCountdown > 0
                  ? `Code expires in ${formatTime(expiryCountdown)}`
                  : "Code expired. Please request a new one."}
              </Text>

              {error && <Text style={styles.errorText}>{error}</Text>}
              {message && <Text style={styles.messageText}>{message}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.buttonSecondary} onPress={onClose} disabled={verifying}>
                  <Text style={styles.buttonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.buttonPrimary, (expiryCountdown <= 0 || verifying) && styles.buttonDisabled]}
                  onPress={handleVerify}
                  disabled={expiryCountdown <= 0 || verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonTextPrimary}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleResend} disabled={verifying}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 5,
  },
  timerText: {
    marginTop: 10,
    fontSize: 12,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
  messageText: {
    color: "green",
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  buttonPrimary: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginLeft: 5,
  },
  buttonSecondary: {
    backgroundColor: "#E9ECEF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginRight: 5,
  },
  buttonTextPrimary: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#AECBFA",
  },
  resendText: {
    color: "#007BFF",
    marginTop: 20,
    fontWeight: "bold",
  },
  verifiedContainer: {
    padding: 40,
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
  },
});

export default VerificationModal;