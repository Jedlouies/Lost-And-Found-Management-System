import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import createVerificationCode from "../utils/createVerificationCode";
import VerificationModal from "../components/VerificationModal";
import { useRouter, Link } from "expo-router";
import { signInAnonymously } from "firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";

// 1. IMPORT THE HOOK
import { useOfflineNotifier } from "../hooks/useOfflineNotifier"; // Adjust path if needed

const PLACEHOLDER_COLOR = "#A9A9A9";

export default function CreateAccountScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  // ✅ Corrected API URL (just in case)
  const API = "https://server.spotsync.site"; 

  // 2. INSTANTIATE THE HOOK
  const { notifyOffline, OfflinePanelComponent } = useOfflineNotifier();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (name, value) => {
    setError("");
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  // --- 👇 [FIX #2 - More Robust Server Handling] ---
  async function sendVerificationEmail(userData, code) {
    try {
      const response = await fetch(`${API}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userData.email,
          subject: "Verify your Spotsync Account",
          html: `<h2>Email Verification</h2><p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 2 minutes.</p>`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Server Error:", response.status, errorBody);
        
        // --- UPDATED: Check for *any* 4xx client error ---
        // This catches 400, 404, 422, etc.
        if (response.status >= 400 && response.status < 500) { 
          throw new Error("Invalid email address provided.");
        }
        // --- End Update ---
        
        // All 5xx server errors will fall through
        throw new Error(`Email server failed. Please try again later. (Status: ${response.status})`);
      }

      return;

    } catch (err) {
      console.error("Failed to send verification email:", err);
      
      if (err.message.includes('Email server failed') || err.message.includes('Invalid email address')) {
        throw err;
      }

      throw new Error("Could not contact verification server. Check your network.");
    }
  }

  async function handleSubmit() {
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }
    for (const key in formData) {
      if (!formData[key]) {
        return setError("Please fill out all fields.");
      }
    }

    // --- 👇 [FIX #1 - Client-Side Email Check] ---
    // This regex checks for a basic email structure (e.g., user@domain.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setError("The email address is not valid.");
    }
    // --- End Fix ---

    try {
      setError("");
      setLoading(true);
      const userData = { ...formData };

      const code = await createVerificationCode(userData.email); 
      await sendVerificationEmail(userData, code);

      setPendingUserData(userData);
      setShowVerifyModal(true);
    } catch (err) {
      console.error("Handle submit error:", err);
      
      if (err.message.includes('network') || err.message.includes('Failed to fetch') || err.code === 'unavailable') {
        notifyOffline(handleSubmit);
      } 
      else if (err.message.includes('Invalid email address')) {
        setError("The email address is not valid.");
      }
      else if (err.message.includes('Email server failed')) {
        setError("Could not send verification email. The server had an error. Please try again later.");
      }
      else if (err.code === 'auth/invalid-email') {
         setError("The email address is not valid.");
      }
      else if (err.code === 'auth/too-many-requests') {
         setError("Too many requests. Please try again later.");
      }
      else {
        setError(err.message || "An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function finalizeSignup() {
    setIsFinalizing(true);
    try {
      if (!pendingUserData) throw new Error("No user data to process.");

      await signup(
        pendingUserData.email,
        pendingUserData.password,
        pendingUserData.firstName,
        pendingUserData.lastName,
        pendingUserData.contactNumber,
        pendingUserData.studentId
      );

      Alert.alert("Success", "Account created! You can now log in.");
      router.replace("/login");
    } catch (err) {
      console.error("Finalize Signup error:", err.code, err.message);
      
      if (err.code === 'unavailable' || err.code === 'auth/network-request-failed') {
        notifyOffline(finalizeSignup);
      } 
      else if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use by another account.");
        setShowVerifyModal(false); 
      } 
      else if (err.code === 'auth/invalid-email') {
        setError("The email address is not valid. Please try again.");
        setShowVerifyModal(false);
      } 
      else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. It must be at least 6 characters.");
        setShowVerifyModal(false);
      } 
      else if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please try again later.");
        setShowVerifyModal(false);
      }
      else if (err.message.includes("Student ID already in use")) {
         setError("This Student ID is already registered.");
         setShowVerifyModal(false);
      }
      else {
        setError(err.message || "An unknown error occurred during signup.");
        setShowVerifyModal(false);
      }
    } finally {
      setIsFinalizing(false);
    }
  }

  const handleGuest = async () => {
    try {
      setGuestLoading(true);
      const userCredential = await signInAnonymously(auth);
      router.replace(`/GuestEmailScreen`);
    } catch (error) {
      console.error("Guest signin error:", error.code, error.message);
      
      if (error.code === 'auth/network-request-failed' || error.message.includes('network')) {
        notifyOffline(handleGuest); 
      } 
      else if (error.code === 'auth/operation-not-allowed') {
        Alert.alert("Error", "Guest sign-in is currently disabled by the administrator.");
      }
      else {
        Alert.alert("Error", "Could not sign in as guest. Please try again later.");
      }
    } finally {
      setGuestLoading(false);
    }
  };

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <>
      {showVerifyModal && (
        <VerificationModal
          user={pendingUserData}
          onVerified={finalizeSignup}
          onClose={() => setShowVerifyModal(false)}
          sendVerificationEmail={sendVerificationEmail}
          isVerifying={isFinalizing}
        />
      )}

      <Modal visible={guestLoading} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Creating Guest ID...</Text>
        </View>
      </Modal>

      <View style={styles.mainContainer}>
        <View style={styles.circle}>
          <Image
            source={require("../assets/images/spotsync-logo-white.png")}
            style={styles.logo}
          />
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          <Text style={styles.title}>Create Account</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.inputRegular}
            placeholder="First Name"
            placeholderTextColor={PLACEHOLDER_COLOR}
            onChangeText={(val) => handleInputChange("firstName", val)}
            value={formData.firstName}
          />
          <TextInput
            style={styles.inputRegular}
            placeholder="Last Name"
            placeholderTextColor={PLACEHOLDER_COLOR}
            onChangeText={(val) => handleInputChange("lastName", val)}
            value={formData.lastName}
          />
          <TextInput
            style={styles.inputRegular}
            placeholder="Student ID"
            placeholderTextColor={PLACEHOLDER_COLOR}
            keyboardType="number-pad"
            onChangeText={(val) => handleInputChange("studentId", val)}
            value={formData.studentId}
          />
          <TextInput
            style={styles.inputRegular}
            placeholder="Email"
            placeholderTextColor={PLACEHOLDER_COLOR}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(val) => handleInputChange("email", val)}
            value={formData.email}
          />
          <TextInput
            style={styles.inputRegular}
            placeholder="Contact Number"
            placeholderTextColor={PLACEHOLDER_COLOR}
            keyboardType="phone-pad"
            onChangeText={(val) => handleInputChange("contactNumber", val)}
            value={formData.contactNumber}
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

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={PLACEHOLDER_COLOR}
              secureTextEntry={!showConfirmPassword}
              onChangeText={(val) => handleInputChange("confirmPassword", val)}
              value={formData.confirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.icon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color="#888"
              />
            </TouchableOpacity>

            {passwordsMatch && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="green"
                style={styles.checkIcon}
              />
            )}
          </View>

          <TouchableOpacity
            disabled={loading}
            style={styles.button}
            onPress={handleSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerTextContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
      
      <OfflinePanelComponent />
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f5f9ff",
  },
  container: {
    alignItems: "center",
    padding: 20,
    paddingBottom: 50,
  },
  circle: {
    width: "100%",
    height: 100,
    backgroundColor: "#143447",
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    marginTop: 20,
  },
  inputRegular: {
    width: "100%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    padding: 15,
    marginVertical: 6,
    fontSize: 16,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    marginVertical: 6,
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
  checkIcon: {
    marginLeft: 5,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerTextContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  linkText: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "bold",
  },
  guestButton: {
    marginTop: 15,
    padding: 10,
  },
  guestButtonText: {
    color: "#555",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#D8000C",
    backgroundColor: "#FFD2D2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontWeight: "bold",
    width: "100%",
    textAlign: "center",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 18,
  },
});