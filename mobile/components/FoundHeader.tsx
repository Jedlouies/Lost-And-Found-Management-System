import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth"; // No longer needed here
import { auth } from "../firebase"; // No longer needed here

export default function FoundHeader({ userData }) {
  // ✅ MODIFIED: Get the new logout function from context
  const { currentUser, logout } = useAuth(); 
  const router = useRouter();
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const getInitials = () => {
    const firstName = userData?.firstName || "";
    const lastName = userData?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // ✅ Check if profile is complete (same style as LostHeader)
  const isProfileComplete = () => {
    return (
      userData &&
      userData.firstName &&
      userData.lastName &&
      userData.profileURL &&
      userData.address &&
      userData.bio &&
      userData.gender &&
      userData.contactNumber &&
      userData.course &&
      userData.coverURL &&
      userData.designation &&
      userData.section &&
      userData.middleName
    );
  };

  // ✅ MODIFIED: Use the context's logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
                  setDropdownVisible(false);
                  // Use replace to prevent the user from navigating back to the home screen
                  router.replace('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handlePostPress = () => {
    if (isProfileComplete()) {
      router.push("/UserFoundProcedureScreen"); // Navigate to post page
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Post Button + Message */}
      <View style={styles.postSection}>
        <TouchableOpacity
          style={[
            styles.postButton,
            !isProfileComplete() && { opacity: 0.5 },
          ]}
          onPress={handlePostPress}
          disabled={!isProfileComplete()}
        >
          <Text style={{ color: "#143447", fontWeight: "bold" }}>Post</Text>
        </TouchableOpacity>

        {!isProfileComplete() && (
          <Text style={styles.incompleteText}>
            Complete your profile to post
          </Text>
        )}
      </View>

      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => setDropdownVisible(true)}
      >
        {userData?.profileURL ? (
          <Image
            source={{ uri: userData.profileURL }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{getInitials()}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown Menu */}
      <Modal transparent={true} visible={isDropdownVisible} animationType="fade">
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
                <MaterialCommunityIcons
                  name="account-circle-outline"
                  size={22}
                  color="#333"
                />
                <Text style={styles.dropdownItemText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDropdownVisible(false);
                  router.push(`/UserSettingsScreen`);
                }}
              >
                <MaterialCommunityIcons
                  name="cog-outline"
                  size={22}
                  color="#333"
                />
                <Text style={styles.dropdownItemText}>Settings</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={22}
                  color="#D9534F"
                />
                <Text
                  style={[styles.dropdownItemText, { color: "#D9534F" }]}
                >
                  Logout
                </Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    height: 100,
    backgroundColor: "#143447",
  },
  postSection: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  postButton: {
    width: 60,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  incompleteText: {
    color: "#f5c542",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  initialsContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "flex-end",
  },
  dropdownContainer: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "white",
    borderRadius: 8,
    width: 180,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 10,
  },
});