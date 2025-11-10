import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useRouter, Link } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";

// 1. IMPORT THE OFFLINE NOTIFIER HOOK
import { useOfflineNotifier } from "../hooks/useOfflineNotifier"; // Adjust path if needed

// Define placeholder color
const PLACEHOLDER_COLOR = "#A9A9A9";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // 2. INSTANTIATE THE HOOK
  const { notifyOffline, OfflinePanelComponent } = useOfflineNotifier();

  const [formData, setFormData] = useState({ studentId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- State for Forgot Password Modal ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (name, value) => {
    setError(""); // Clear error when user types
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.password) {
      return setError("Please fill out all fields.");
    }

    try {
      setError("");
      setLoading(true);

      const userCredential = await login(formData.studentId, formData.password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        if (role === 'admin') {
          router.replace(`/dashboard/${user.uid}`);
        } else {
          router.replace(`/home-screen`);
        }
      } else {
        setError('User data not found.');
      }
    } catch (error) {
      console.error("Login error:", error.code, error.message);

      // 3. --- NEW ERROR HANDLING ---

      // Network / Server Errors
      if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') {
        // Use the notifier to allow a retry
        notifyOffline(handleSubmit); 
      } 
      // Custom Error from AuthContext (Student ID not in Firestore)
      else if (error.message === "Student ID not found") {
        setError("No account found with that Student ID.");
      }
      // Wrong Password / Wrong ID
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError("Incorrect Student ID or password.");
      }
      // Account deleted from Auth but still in Firestore index
      else if (error.code === 'auth/user-not-found') {
        setError("This account no longer exists. Please contact support.");
      }
      // Email in Firestore is corrupted (e.g., "not-an-email")
      else if (error.code === 'auth/invalid-email') {
        setError("The email for this ID is invalid. Please contact support.");
      }
      // Brute-force protection
      else if (error.code === 'auth/too-many-requests') {
        setError("Access temporarily disabled due to too many login attempts. Please try again later.");
      }
      // Other Firebase server error
      else if (error.code === 'auth/internal-error') {
        setError("A server error occurred. Please try again in a moment.");
      }
      // Fallback for all other errors
      else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Function for "Forgot Password" ---
  async function handlePasswordReset() {
    if (!forgotId) return;
    setResetting(true);
    setResetMessage('');
    try {
      const studentDocRef = doc(db, 'studentIndex', forgotId);
      const studentDocSnap = await getDoc(studentDocRef);
      if (!studentDocSnap.exists()) {
        // This is our custom error
        throw new Error('No account found with that Student ID.');
      }
      const matchedEmail = studentDocSnap.data().email;
      await sendPasswordResetEmail(auth, matchedEmail);
      setResetMessage(`Password reset link sent to ${matchedEmail}`);
    } catch (err) {
      console.error("Password reset error:", err.code, err.message);

      // 4. --- NEW MODAL ERROR HANDLING ---
      if (err.code === 'auth/network-request-failed' || err.code === 'unavailable') {
        setResetMessage("Network error. Check connection and try again.");
      }
      // Custom error from logic above
      else if (err.message === 'No account found with that Student ID.') {
        setResetMessage('No account found with that Student ID.');
      }
      // Email in Firestore is corrupted
      else if (err.code === 'auth/invalid-email') {
        setResetMessage('The email for this ID is invalid. Contact support.');
      }
       // Brute-force protection
      else if (err.code === 'auth/too-many-requests') {
        setResetMessage('Too many requests. Please try again later.');
      }
      // Fallback
      else {
        setResetMessage('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            {!resetMessage.includes('sent') ? (
              <>
                <Text style={styles.modalText}>
                  Enter your Student ID to receive a password reset link.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Student ID"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={forgotId}
                  onChangeText={setForgotId}
                  keyboardType="number-pad"
                />
              </>
            ) : (
                <Text style={styles.modalText}>Check your email and follow the link to reset your password.</Text>
            )}

            {resetMessage && (
                <Text style={[styles.modalMessage, { color: resetMessage.includes('sent') ? 'green' : 'red' }]}>
                {resetMessage}
              </Text>
            )}

            <View style={styles.modalButtonRow}>
              {!resetMessage.includes('sent') ? (
                <>
                  <TouchableOpacity style={styles.modalButtonSecondary} onPress={() => setShowForgotModal(false)}>
                    <Text style={styles.modalButtonTextSecondary}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButtonPrimary} disabled={resetting || !forgotId} onPress={handlePasswordReset}>
                    {resetting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalButtonTextPrimary}>Send Link</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                  <TouchableOpacity style={styles.modalButtonPrimary} onPress={() => {
                    setShowForgotModal(false);
                    setResetMessage('');
                    setForgotId('');
                  }}>
                    <Text style={styles.modalButtonTextPrimary}>Back to Login</Text>
                  </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Screen */}
      <View style={styles.mainContainer}>
        <View style={styles.circle}>
          <Image source={require('../assets/images/spotsync-logo-white.png')} style={styles.logo} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Login</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.inputRegular} 
            placeholder="Student ID"
            placeholderTextColor={PLACEHOLDER_COLOR} 
            keyboardType="number-pad"
            onChangeText={(val) => handleInputChange("studentId", val)}
            value={formData.studentId}
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={PLACEHOLDER_COLOR} 
              secureTextEntry={!showPassword}
              onChangeText={(val) => handleInputChange("password", val)}
              value={formData.password}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.icon}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          
          <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => setShowForgotModal(true)}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={loading} style={styles.button} onPress={handleSubmit}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/create-account" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </View>

      {/* 5. RENDER THE OFFLINE PANEL */}
      <OfflinePanelComponent />
    </>
  );
}


// --- STYLES (no changes) ---
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f9ff",
  },
  container: {
    alignItems: "center",
    padding: 20,
  },
  circle: {
    width: '100%',
    height: 100,
    backgroundColor: '#143447',
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: '#333',
    marginTop: 20,
  },
  inputRegular: {
    width: "100%",
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    fontSize: 16,
    color: '#000000'
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    marginVertical: 8, // Matched to inputRegular
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  input: {
    flex: 1, // Takes up remaining space
    paddingVertical: 15, // Matches original padding
    fontSize: 16,
    color: "#000000",
  },
  icon: {
    marginLeft: 10,
    padding: 5,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 10, 
    width: "100%",
    alignItems: "center",
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerTextContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    marginBottom: 5,
  },
  errorText: {
    color: '#D8000C',
    backgroundColor: '#FFD2D2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  modalMessage: {
    marginTop: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButtonPrimary: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: '#333',
    fontWeight: 'bold',
  },
});