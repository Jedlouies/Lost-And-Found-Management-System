import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert, // Use React Native Alert
  ActivityIndicator,
  SafeAreaView, // Use SafeAreaView for top/bottom padding
  KeyboardAvoidingView, // Helps with keyboard overlap
  Platform,
  StatusBar, // For status bar styling
} from "react-native";
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Type for navigation
import { db } from "../firebase"; // Assuming firebase config is adapted
import { setDoc, doc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // Assuming context is adapted
import VerificationModal from "../components/VerificationModal"; // Assuming adapted RN component
import createVerificationCode from "../utils/createVerificationCode"; // Assuming adapted RN helper
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Example icon library
import { router } from "expo-router";

// Define your Stack Navigator Param List if you use one
// Replace 'any' with your actual screen names if possible
type RootStackParamList = {
  GuestHome: { userId: string }; // Example target route
  // Add other routes here
};
type GuestEmailNavigationProp = NativeStackNavigationProp<RootStackParamList>;


// Define AlertType for better state management
type AlertState = {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
};

export default function GuestEmailRequestPage() {
  const navigation = useNavigation<GuestEmailNavigationProp>();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(""); // For displaying errors inline
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null); // For floating alerts

  // const API = "http://localhost:4000";
  const API = "https://server.spotsync.site";

  // --- Helper Functions (Mostly Unchanged) ---
  async function sendVerificationEmail(user: { email: string }, code: string) {
    try {
        await fetch(`${API}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            to: user.email,
            subject: "Verify your Spotsync Email",
            html: `
            <h2>Email Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 2 minutes.</p>
            `,
        }),
        });
    } catch (networkError) {
        console.error("Network error sending verification email:", networkError);
        // Show an alert to the user about the network issue
         Alert.alert("Network Error", "Could not send verification email. Please check your connection and try again.");
         throw networkError; // Re-throw to stop the process in handleSave
    }
  }

  // --- Main Save/Submit Logic ---
  async function handleSave() {
    setError(""); // Clear previous inline errors
    setAlert(null); // Clear previous floating alerts

    if (!currentUser) {
      setError("No user session found. Please restart the app.");
      return;
    }
    if (!email.trim()) {
        setError("Please enter a valid email address.");
        return;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        setError("Invalid email format.");
        return;
    }


    setLoading(true);
    const trimmedEmail = email.trim(); // Use trimmed email

    try {
      // Prevent duplicate emails (excluding other guests)
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", trimmedEmail));
      const querySnapshot = await getDocs(q);

      let isDuplicate = false;
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        // Check if the email exists and the user is NOT a guest
        if (userData.role && userData.role !== "guest") {
          isDuplicate = true;
        }
      });

      if (isDuplicate) {
        setError("This email is already registered by another user.");
        setLoading(false);
        return;
      }

      setPendingEmail(trimmedEmail);
      const fakeUser = { email: trimmedEmail }; 
      const code = await createVerificationCode(fakeUser); // Assuming adapted for RN
      await sendVerificationEmail(fakeUser, code); // Send email

      setShowVerifyModal(true); 

    } catch (err: any) { // Catch errors from checks or email sending
      console.error("Error during email save process:", err);
      if (err.message?.includes("Network Error")) {
          setError("Failed to send verification email due to network issues.");
      } else {
          setError(err.message || "Failed to initiate email verification.");
      }

    } finally {
      router.replace(`/GuestReportScreen`); // Navigate to GuestReportScreen after handling
      setLoading(false); // Stop loading indicator
    }
  }

  // --- Called After Verification Success ---
  async function handleVerified() {
    if (!currentUser) {
        setError("Verification successful, but user session lost. Please restart.");
        setShowVerifyModal(false);
        return;
    }
    setLoading(true); // Show loading while saving to Firestore
    try {
        // Save guest email and role to Firestore using the currentUser's UID
        await setDoc(
            doc(db, "users", currentUser.uid),
            {
            email: pendingEmail || null, // Use the verified email
            role: "guest",
            createdAt: new Date(), // Use Firestore timestamp if preferred: serverTimestamp()
            emailVerified: true, // Mark as verified
            },
            { merge: true } // Merge to avoid overwriting other potential guest data
        );

        setShowVerifyModal(false); // Close modal
        setPendingEmail(""); // Clear pending email

        // Navigate to the next guest screen
        navigation.navigate('GuestHome', { userId: currentUser.uid }); // Adjust route name as needed

    } catch(firestoreError: any) {
        console.error("Error saving verified guest email:", firestoreError);
        setError("Verification successful, but failed to save email. Please try logging in later or contact support.");
        // Keep modal open or close? Closing might be less confusing.
        setShowVerifyModal(false);
    } finally {
        setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Verification Modal */}
        {showVerifyModal && (
          <VerificationModal
            show={showVerifyModal}
            onClose={() => setShowVerifyModal(false)}
            user={{ email: pendingEmail }} // Pass the email being verified
            sendVerificationEmail={sendVerificationEmail} // Function to resend
            onVerified={handleVerified} // Function to call on success
            // Ensure VerificationModal is adapted for React Native
          />
        )}

        {/* Floating Alert Display */}
        {alert?.visible && (
            <View style={styles.alertContainer}>
                {/* Basic Alert Display - Replace with your FloatingAlert component */}
                <Text style={[styles.alertText, { color: alert.type === 'error' ? 'red' : 'green' }]}>
                    {alert.message}
                </Text>
             </View>
         )}


        <View style={styles.card}>
          <Text style={styles.title}>Guest Email</Text>
          <Text style={styles.subtitle}>
            Provide an email to receive updates about lost items. You can skip this, but you won't get notifications.
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputContainer}>
             <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              editable={!loading} // Disable input while loading
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Save & Continue</Text>
            )}
          </TouchableOpacity>

          {/* Optional Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
                if (!currentUser) return; // Basic check
                navigation.navigate('GuestHome', { userId: currentUser.uid }); // Navigate without saving email
            }}
            disabled={loading}
          >
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFEFF4', // Light gray background
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400, // Max width for larger screens
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#143447', // Navy color
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputIcon: {
      marginRight: 8,
  },
  input: {
    flex: 1, // Take remaining space
    height: 45, // Consistent height
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#143447', // Navy color
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', // Center ActivityIndicator
    minHeight: 48, // Ensure button has minimum height for loader
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a9b4bf', // Lighter color when disabled
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#007AFF', // Standard blue link color
    fontSize: 14,
  },
   alertContainer: { // Simple style for floating alert area
      position: 'absolute',
      top: 50, // Adjust as needed
      left: 20,
      right: 20,
      padding: 10,
      borderRadius: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
      zIndex: 1500, // Ensure it's above other content
      alignItems: 'center',
   },
   alertText: {
       fontSize: 14,
       fontWeight: 'bold',
   },
});