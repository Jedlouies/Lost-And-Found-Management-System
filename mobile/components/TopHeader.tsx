import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth'; 
import { auth } from '../firebase'; 

export default function TopHeader({ userData }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const getInitials = () => {
    const firstName = userData?.firstName || '';
    const lastName = userData?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setDropdownVisible(false);
      router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{userData?.firstName || 'User'}</Text>
      </View>

      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => setDropdownVisible(true)} 
      >
        {userData?.profileURL ? (
          <Image source={{ uri: userData.profileURL }} style={styles.profileImage} />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{getInitials()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isDropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDropdownVisible(false);
                  router.push(`/UserProfileScreen`);
                }}
              >
                <MaterialCommunityIcons name="account-circle-outline" size={22} color="#333" />
                <Text style={styles.dropdownItemText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDropdownVisible(false);
                  router.push(`/UserSettingsScreen`);
                }}
              >
                <MaterialCommunityIcons name="cog-outline" size={22} color="#333" />
                <Text style={styles.dropdownItemText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={22} color="#D9534F" />
                <Text style={[styles.dropdownItemText, { color: '#D9534F' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 100,
    backgroundColor: '#143447',
  },
  welcomeText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileImage: {
    marginTop: 20,
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // --- ✅ New Styles for Dropdown ---
  modalOverlay: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 40, // Adjust this to position the dropdown below the header
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    width: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
});