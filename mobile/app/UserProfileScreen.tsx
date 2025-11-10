import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { db } from '../firebase';
import { useRouter } from 'expo-router';
import BlankHeader from '../components/BlankHeader';
import BottomNavBar from '../components/BottomNavBar';

// --- Type Definitions ---
interface UserData {
  profileURL?: string;
  coverURL?: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  middleName?: string;
  gender?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  studentId?: string;
  bio?: string;
  course?: {
    abbr: string;
    name: string;
  };
  section?: string;
  // Add any other fields you expect from Firestore
  [key: string]: any; 
}

function UserProfileScreen() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
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

  const handleEdit = () => {
    // Navigate to the settings screen
    router.push('/UserSettingsScreen'); 
  };

  const initials = `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <BlankHeader userData={userData} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <KeyboardAwareScrollView 
        contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={150}>
          <View style={styles.profileContainer}>
            <Image 
              source={userData?.coverURL ? { uri: userData.coverURL } : require('../assets/images/favicon.png')} // Provide a default cover
              style={styles.coverImage} 
            />
            <View style={styles.profilePictureContainer}>
              {userData?.profileURL ? (
                <Image
                  source={{ uri: userData.profileURL }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={[styles.profilePicture, styles.initialsContainer]}>
                  <Text style={styles.initialsText}>{initials}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.userName}>{userData?.firstName} {userData?.lastName}</Text>
            <Text style={styles.userDesignation}>{userData?.designation}</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{userData?.bio || "No bio available."}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>First Name:</Text>
                <Text style={styles.detailValue}>{userData?.firstName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Name:</Text>
                <Text style={styles.detailValue}>{userData?.lastName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gender:</Text>
                <Text style={styles.detailValue}>{userData?.gender}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Course:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {userData?.course?.name ? `${userData.course.abbr} – ${userData.course.name}` : "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Section:</Text>
                <Text style={styles.detailValue}>{userData?.section}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{userData?.email}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact #:</Text>
                <Text style={styles.detailValue}>{userData?.contactNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>{userData?.address}</Text>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      )}

      <BottomNavBar activeScreen="Items" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#ccc',
  },
  profilePictureContainer: {
    marginTop: -75, // Half of the profile picture height
    borderWidth: 5,
    borderColor: 'white',
    borderRadius: 75,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  initialsContainer: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 60,
    fontWeight: 'bold',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  userDesignation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  bioText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1, // Allow text to wrap
    textAlign: 'right',
  },
});

export default UserProfileScreen;