import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext'; // Adjust path
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BlankHeader from '../components/BlankHeader'; // Adjust path
import BottomNavBar from '../components/BottomNavBar'; // Adjust path

// --- Type Definitions ---
interface UserData {
  firstName?: string;
  lastName?: string;
  profileURL?: string;
  // Add other fields as needed
  [key: string]: any;
}

function UserFoundProcedureScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const auth = getAuth();
  const user = auth.currentUser;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  const handleGotIt = () => {
    // Navigate to the next screen for reporting a found item
    // Adjust the path according to your Expo Router setup
    router.push(`/ReportFoundItemScreen`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Item Found Procedures</Text>

          <MaterialCommunityIcons
            name="exclamation-thick" // Using a similar icon
            size={70}
            color="orange"
            style={styles.icon}
          />

          <View style={styles.remindersBox}>
            <Text style={styles.remindersText}>
              <Text style={{ fontWeight: 'bold' }}>Reminders:</Text> To ensure that any lost item is returned only to the rightful owner and handled with transparency and security, all items found must be surrendered to the Office of Student Affairs (OSA).
            </Text>
          </View>

          <Text style={styles.stepsTitle}>Step by Step</Text>

          <Text style={styles.stepText}>
            1. After finding a lost item, the founder must submit an image and detailed description through the system. The submission will be marked as pending and not visible to the public.
          </Text>
          <Text style={styles.stepText}>
            2. The item must then be surrendered to the Office of Student Affairs (OSA) along with the completion of a Found Item Report Form. This ensures the item is securely documented and stored.
          </Text>
          <Text style={styles.stepText}>
            3. The system will use AI to compare the submitted item with existing lost item reports. A match rate will be shown to the founder, indicating how closely the item matches potential claims.
          </Text>
          <Text style={styles.stepText}>
            4. Even if a high match rate is detected, the item will remain in OSA custody and the post will stay pending. Only OSA staff can verify ownership and approve the release of the item.
          </Text>
          <Text style={styles.stepText}>
            5. Once the rightful owner provides valid proof and is verified by OSA, the item will be returned and the post updated as "claimed." This process ensures fairness, security, and proper item recovery.
          </Text>

          <TouchableOpacity style={styles.gotItButton} onPress={handleGotIt}>
            <Text style={styles.gotItButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D9D9D9', // Light gray background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
  },
  scrollContent: {
    paddingBottom: 80, // Ensure space above BottomNavBar
  },
  contentContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF', // White container background
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  icon: {
    marginBottom: 15,
  },
  remindersBox: {
    width: '100%',
    padding: 15,
    backgroundColor: '#FFF3CD', // Light yellow for reminders
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEEBA',
    marginBottom: 20,
  },
  remindersText: {
    fontSize: 16,
    color: '#856404', // Darker yellow text
    lineHeight: 22,
  },
  stepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    alignSelf: 'flex-start', // Align title to the left
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    textAlign: 'left', // Ensure text is left-aligned
    width: '100%', // Take full width for alignment
  },
  gotItButton: {
    backgroundColor: '#007AFF', // Blue button
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: 'center',
  },
  gotItButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserFoundProcedureScreen;