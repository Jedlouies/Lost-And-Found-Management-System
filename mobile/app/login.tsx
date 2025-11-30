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
import { sendPasswordResetEmail, User } from "firebase/auth"; // Import User type
import { Ionicons } from "@expo/vector-icons";

// 1. IMPORTS FOR 2FA
import { useOfflineNotifier } from "../hooks/useOfflineNotifier"; 
import VerificationModal from "../components/VerificationModal"; // Ensure correct path
import createVerificationCode from "../utils/createVerificationCode"; // Ensure correct path

const PLACEHOLDER_COLOR = "#A9A9A9";
const API = "https://server.spotsync.site"; // Ensure this matches your other files

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { notifyOffline, OfflinePanelComponent } = useOfflineNotifier();

  const [formData, setFormData] = useState({ studentId: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Forgot Password States ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- 2FA Verification States ---
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [initialVerificationCode, setInitialVerificationCode] = useState(null);

  const handleInputChange = (name: string, value: string) => {
    setError(""); 
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // --- Helper: Send Email ---
  const sendVerificationEmail = async (user: User, code: string) => {
      try {
          await fetch(`${API}/api/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  to: user.email,
                  subject: "Login Verification Code",
                  html: `
                      <h2>Two-Factor Authentication</h2>
                      <p>Your login verification code is:</p>
                      <h1 style="letter-spacing: 5px;">${code}</h1>
                      <p>This code will expire in 10 minutes.</p>
                      <p>If you did not attempt to login, please change your password immediately.</p>
                  `,
              }),
          });
      } catch (error) {
          console.error("Failed to send email:", error);
          Alert.alert("Error", "Could not send verification email.");
      }
  };

  // --- Helper: Complete Login Navigation ---
  const finalizeLogin = async (uid: string) => {
      // Re-fetch strictly to determine role
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;

        if (role === 'admin') {
          router.replace(`/dashboard/${uid}`);
        } else {
          router.replace(`/home-screen`);
        }
      } else {
        setError('User data error: Role not found.');
      }
  };

  const handleSubmit = async () => {
    if (!formData.studentId || !formData.password) {
      return setError("Please fill out all fields.");
    }

    try {
      setError("");
      setLoading(true);

      // 1. Perform Basic Auth Login
      const userCredential = await login(formData.studentId, formData.password);
      const user = userCredential.user;
      
      // 2. Fetch User Data to Check 2FA Status
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        
        // --- 2FA CHECK ---
        if (userData.is2FAEnabled) {
             // A. 2FA is ON: Generate Code & Show Modal
             // Important: Pass email FIRST, then UID (Correct Order)
             if (user.email) {
                 const code = await createVerificationCode(user.email, user.uid);
                 await sendVerificationEmail(user, code);
                 
                 setPendingUser(user); // Save user to state
                 setInitialVerificationCode(code);
                 setShowVerificationModal(true); // Open Modal
             } else {
                 setError("User email not found for 2FA.");
             }
        } else {
             // B. 2FA is OFF: Proceed as normal
             await finalizeLogin(user.uid);
        }

      } else {
        setError('User data not found in database.');
      }
    } catch (error: any) {
      console.error("Login error:", error.code, error.message);

      // Error Handling (Keep your existing logic)
      if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') {
        notifyOffline(handleSubmit); 
      } 
      else if (error.message === "Student ID not found") {
        setError("No account found with that Student ID.");
      }
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError("Incorrect Student ID or password.");
      }
      else if (error.code === 'auth/user-not-found') {
        setError("This account no longer exists. Please contact support.");
      }
      else if (error.code === 'auth/too-many-requests') {
        setError("Access temporarily disabled. Please try again later.");
      }
      else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      // Only stop loading if we are NOT showing the modal
      // If modal opens, we want the screen to stay "busy" or just wait
      setLoading(false);
    }
  };

  // --- Function for "Forgot Password" (Keep existing) ---
  async function handlePasswordReset() {
    if (!forgotId) return;
    setResetting(true);
    setResetMessage('');
    try {
      const studentDocRef = doc(db, 'studentIndex', forgotId);
      const studentDocSnap = await getDoc(studentDocRef);
      if (!studentDocSnap.exists()) {
        throw new Error('No account found with that Student ID.');
      }
      const matchedEmail = studentDocSnap.data().email;
      await sendPasswordResetEmail(auth, matchedEmail);
      setResetMessage(`Password reset link sent to ${matchedEmail}`);
    } catch (err: any) {
      // ... (Keep existing error handling)
      if (err.message === 'No account found with that Student ID.') {
        setResetMessage('No account found with that Student ID.');
      } else {
        setResetMessage('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      {/* 2FA Verification Modal */}
      <VerificationModal
        show={showVerificationModal}
        onClose={() => {
            setShowVerificationModal(false);
            setPendingUser(null);
            // Optionally sign out if they cancel 2FA? 
            // auth.signOut(); 
        }}
        user={pendingUser} // Pass the user we just logged in
        sendVerificationEmail={sendVerificationEmail}
        initialCode={initialVerificationCode}
        onVerified={async () => {
            // Once 2FA is verified, finish the login
            if (pendingUser) {
                setShowVerificationModal(false);
                await finalizeLogin(pendingUser.uid);
            }
        }}
      />

      {/* Forgot Password Modal (Keep existing) */}
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

      {/* Main Screen (Keep existing) */}
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

      <OfflinePanelComponent />
    </>
  );
}

// ... (Styles remain exactly the same) ...
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
    marginVertical: 8, 
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15, 
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