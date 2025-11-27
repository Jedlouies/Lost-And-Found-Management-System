import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView, 
  Platform,
  StatusBar, 
} from "react-native";
import { useNavigation } from '@react-navigation/native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; 
import { db } from "../firebase"; 
import { setDoc, doc, collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; 
import VerificationModal from "../components/VerificationModal";
import createVerificationCode from "../utils/createVerificationCode"; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { router } from "expo-router";

type RootStackParamList = {
  GuestHome: { userId: string }; 
};
type GuestEmailNavigationProp = NativeStackNavigationProp<RootStackParamList>;


type AlertState = {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
};

export default function GuestEmailRequestPage() {
  const navigation = useNavigation<GuestEmailNavigationProp>();
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [alert, setAlert] = useState<AlertState | null>(null); 

  // const API = "http://localhost:4000";
  const API = "https://server.spotsync.site";

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
         Alert.alert("Network Error", "Could not send verification email. Please check your connection and try again.");
         throw networkError; 
    }
  }

  async function handleSave() {
    setError("");
    setAlert(null); 

    if (!currentUser) {
      setError("No user session found. Please restart the app.");
      return;
    }
    if (!email.trim()) {
        setError("Please enter a valid email address.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        setError("Invalid email format.");
        return;
    }


    setLoading(true);
    const trimmedEmail = email.trim();

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", trimmedEmail));
      const querySnapshot = await getDocs(q);

      let isDuplicate = false;
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
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
      const code = await createVerificationCode(fakeUser); 
      await sendVerificationEmail(fakeUser, code); 

      setShowVerifyModal(true); 

    } catch (err: any) { 
      console.error("Error during email save process:", err);
      if (err.message?.includes("Network Error")) {
          setError("Failed to send verification email due to network issues.");
      } else {
          setError(err.message || "Failed to initiate email verification.");
      }

    } finally {
      router.replace(`/GuestReportScreen`);
      setLoading(false); 
    }
  }

  async function handleVerified() {
    if (!currentUser) {
        setError("Verification successful, but user session lost. Please restart.");
        setShowVerifyModal(false);
        return;
    }
    setLoading(true); 
    try {
        await setDoc(
            doc(db, "users", currentUser.uid),
            {
            email: pendingEmail || null, 
            role: "guest",
            createdAt: new Date(),
            emailVerified: true, 
            },
            { merge: true } 
        );

        setShowVerifyModal(false); 
        setPendingEmail(""); 

        navigation.navigate('GuestHome', { userId: currentUser.uid }); 

    } catch(firestoreError: any) {
        console.error("Error saving verified guest email:", firestoreError);
        setError("Verification successful, but failed to save email. Please try logging in later or contact support.");
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
        {showVerifyModal && (
          <VerificationModal
            show={showVerifyModal}
            onClose={() => setShowVerifyModal(false)}
            user={{ email: pendingEmail }} 
            sendVerificationEmail={sendVerificationEmail}
            onVerified={handleVerified} 
          />
        )}

        {alert?.visible && (
            <View style={styles.alertContainer}>
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