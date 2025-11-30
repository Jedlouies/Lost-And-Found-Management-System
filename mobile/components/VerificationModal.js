import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import createVerificationCode from "../utils/createVerificationCode";

const PLACEHOLDER_COLOR = "#A9A9A9";
const EXPIRY_SECONDS = 120; // 2 minutes

function VerificationModal({ show, user, onVerified, onClose, sendVerificationEmail, initialCode }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(EXPIRY_SECONDS);

  const [availableCodes, setAvailableCodes] = useState([]);
  const timerRef = useRef(null);

  // Start timer helper
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(EXPIRY_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let unsubscribe = () => {};
    if ((show ?? true) && user?.email) {
      // Seed initial code if provided (don't overwrite later)
      const initialEntry = initialCode
        ? [{ code: String(initialCode).trim(), createdAt: "initial", id: "initial" }]
        : [];

      setAvailableCodes(initialEntry);

      const q = query(collection(db, "verifications"), where("email", "==", user.email));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const codesFromDb = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          codesFromDb.push({
            code: String(data.code).trim(),
            createdAt: data.createdAt,
            id: doc.id
          });
        });

        // Merge: keep any initial entry that isn't present in the DB results
        const merged = [...codesFromDb];
        if (initialCode) {
          const exists = codesFromDb.some(c => c.code === String(initialCode).trim());
          if (!exists) merged.push({ code: String(initialCode).trim(), createdAt: "initial", id: "initial" });
        }

        setAvailableCodes(merged);
      }, (err) => {
        console.error("[RealTime] Listener Error:", err);
      });

      // Reset UI
      setCode("");
      setError("");
      setSuccessMessage("");
      setIsVerified(false);
      setLoading(false);
      startTimer();
    }

    return () => {
      unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show, user?.email, initialCode]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleVerify = async () => {
    if (!code) {
      setError("Please enter the code.");
      return;
    }
    setLoading(true);
    setError("");

    setTimeout(async () => {
      try {
        const inputCode = code.toString().trim();
        const match = availableCodes.find(c => c.code === inputCode);

        if (!match) {
          setError("Invalid code. Please wait a moment if you just requested it.");
          setLoading(false);
          return;
        }

        // If match is the seeded initial entry, accept it here (backend will clean up/confirm later)
        if (match.id !== "initial") {
          // Validate expiry (Firestore Timestamp expected)
          if (!match.createdAt || !match.createdAt.seconds) {
            // if createdAt is malformed, fail-safe: allow only very recent (skip)
            setError("Code validation failed. Please request a new code.");
            setLoading(false);
            return;
          }
          const now = Timestamp.now();
          const secondsElapsed = now.seconds - match.createdAt.seconds;
          if (secondsElapsed > EXPIRY_SECONDS) {
            setError("This code has expired. Please request a new one.");
            setLoading(false);
            return;
          }
        }

        setIsVerified(true);
        if (timerRef.current) clearInterval(timerRef.current);

        if (onVerified) await onVerified();

        setTimeout(() => {
          if (onClose) onClose();
        }, 600);

      } catch (err) {
        console.error("[Verify] Error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleResend = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");
    setCode("");

    try {
      // IMPORTANT: Use the same seed the parent used (studentId)
      const seed = user?.studentId ?? user?.studentId ?? ""; // fallback to studentId
      const newCode = await createVerificationCode(user.email, seed);
      if (sendVerificationEmail) {
        await sendVerificationEmail(user, newCode);
        setSuccessMessage(`New code sent to ${user.email}`);
        // add new code to availableCodes immediately to improve UX
        setAvailableCodes(prev => {
          const exists = prev.some(c => c.code === String(newCode).trim());
          if (exists) return prev;
          return [{ code: String(newCode).trim(), createdAt: "initial", id: "initial" }, ...prev];
        });
        startTimer();
      } else {
        setError("System error: Cannot send email.");
      }
    } catch (err) {
      console.error("[Resend] Error:", err);
      setError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={show ?? true} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isVerified ? (
            <View style={styles.centerContent}>
              <Text style={styles.successTitle}>✅ Verified!</Text>
              <Text style={styles.subtitle}>Redirecting...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Email Verification</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{"\n"}
                <Text style={{ fontWeight: "bold" }}>{user?.email}</Text>
              </Text>

              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!loading && countdown > 0}
              />

              <Text style={[styles.timerText, { color: countdown > 0 ? "#666" : "red" }]}>
                {countdown > 0 ? `Code expires in ${formatTime(countdown)}` : "Code expired. Please request a new one."}
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.buttonSecondary} onPress={onClose} disabled={loading}>
                  <Text style={styles.buttonTextSecondary}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.buttonPrimary, (countdown <= 0 || loading) && styles.buttonDisabled]}
                  onPress={handleVerify}
                  disabled={countdown <= 0 || loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.buttonTextPrimary}>Verify</Text>}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={loading}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// (styles unchanged - paste your existing style object)
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "85%", backgroundColor: "white", borderRadius: 16, padding: 24, alignItems: "center", elevation: 5 },
  centerContent: { alignItems: 'center', paddingVertical: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#333" },
  successTitle: { fontSize: 22, fontWeight: "bold", color: "#28a745", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20, lineHeight: 20 },
  input: { width: "100%", backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 15, textAlign: "center", fontSize: 24, fontWeight: "bold", letterSpacing: 8, color: "#333" },
  timerText: { marginTop: 12, fontSize: 13, fontWeight: "500" },
  errorText: { color: "#dc3545", marginTop: 10, fontSize: 13, textAlign: 'center' },
  successText: { color: "#28a745", marginTop: 10, fontSize: 13, textAlign: 'center' },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 25, gap: 10 },
  buttonPrimary: { backgroundColor: "#007AFF", paddingVertical: 12, borderRadius: 8, alignItems: "center", flex: 1 },
  buttonSecondary: { backgroundColor: "#e4e6eb", paddingVertical: 12, borderRadius: 8, alignItems: "center", flex: 1 },
  buttonDisabled: { backgroundColor: "#b3d7ff" },
  buttonTextPrimary: { color: "white", fontWeight: "bold", fontSize: 16 },
  buttonTextSecondary: { color: "#444", fontWeight: "bold", fontSize: 16 },
  resendButton: { marginTop: 20, padding: 10 },
  resendText: { color: "#007AFF", fontWeight: "600", fontSize: 14 },
});

export default VerificationModal;
