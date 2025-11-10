import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar, // For status bar styling
  Alert, // For error handling if needed
} from 'react-native';
// 1. Import useRouter from expo-router
import { useRouter } from 'expo-router'; 
// 2. Remove react-navigation imports
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Type for navigation
import { getAuth } from 'firebase/auth'; // Import getAuth
import Header from '../components/Header'; // Assuming RN version exists

// 3. Remove react-navigation type definitions
// type RootStackParamList = {
//   GuestLostItemForm: { userId: string }; // Example route name for lost item form
//   GuestFoundItemForm: { userId: string }; // Example route name for found item form
//   // Add other routes here
// };
// type GuestReportNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GuestReportPage() {
  // 4. Use the useRouter hook
  const router = useRouter(); 
  const auth = getAuth(); // Initialize auth
  const currentUser = auth.currentUser; // Get current user

  const handleChoice = (type: 'lost' | 'found') => {
    if (!currentUser?.uid) {
      console.error("No user is signed in");
      Alert.alert("Error", "No user session found. Please restart the app."); // Inform user
      return;
    }

    const userId = currentUser.uid;

    if (type === "lost") {
      // 5. Use router.replace to navigate
      // Assumes your file is at app/guest/lost/[userId].tsx
      // If your file is at app/GuestLostItemForm.tsx, use:
      // router.replace({ pathname: '/GuestLostItemForm', params: { userId } });
      router.replace(`/GuestReportLostScreen`); 
    } else if (type === "found") {
      // 5. Use router.replace to navigate
      // Assumes your file is at app/guest/found/[userId].tsx
      // If your file is at app/GuestFoundItemForm.tsx, use:
      // router.replace({ pathname: '/GuestFoundItemForm', params: { userId } });
      router.replace(`/GuestReportFoundScreen`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#143447" /> {/* Match background */}
      {/* Assuming Header component is adapted for React Native */}
      {/* <Header /> */}
      {/* Placeholder for Header if not available */}
       <View style={styles.headerPlaceholder}>
            <Text style={styles.headerText}>SpotSync</Text>
       </View>

      <View style={styles.container}>
        <Text style={styles.title}>
          When losing something doesn’t mean it’s gone forever
        </Text>
        <Text style={styles.subtitle}>Please choose what you want to report:</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.lostButton]}
            onPress={() => handleChoice("lost")}
            activeOpacity={0.7} // Add touch feedback
          >
            {/* Optional Icon */}
            {/* <MaterialCommunityIcons name="magnify-minus-outline" size={24} color="#FFF" style={styles.buttonIcon} /> */}
            <Text style={styles.buttonText}>I Lost an Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.foundButton]}
            onPress={() => handleChoice("found")}
            activeOpacity={0.7} // Add touch feedback
          >
            {/* Optional Icon */}
            {/* <MaterialCommunityIcons name="hand-pointing-up" size={24} color="#143447" style={styles.buttonIcon} /> */}
            <Text style={[styles.buttonText, styles.foundButtonText]}>I Found an Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#143447', // Navy background for the whole screen
  },
  // Placeholder style if Header component isn't ready
  headerPlaceholder: {
      height: 190,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF', // Or your header color
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
   },
   headerText: {
       fontSize: 50,
       fontWeight: 'bold',
       color: '#143447',
   },
  container: {
    flex: 1, // Take remaining space
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    paddingHorizontal: 30, // Add horizontal padding
    paddingBottom: 40, // Add some padding at the bottom
  },
  title: {
    fontSize: 26, // Slightly smaller for mobile
    fontWeight: 'bold',
    color: '#FFFFFF', // White text
    textAlign: 'center',
    marginBottom: 15, // Space below title
    lineHeight: 34, // Improve readability
  },
  subtitle: {
    fontSize: 16,
    color: '#BDDDFC', // Light blue text
    textAlign: 'center',
    marginBottom: 40, // More space before buttons
  },
  buttonContainer: {
    width: '100%', // Make container full width
    alignItems: 'center', // Center buttons horizontally if needed
  },
  button: {
    flexDirection: 'row', // For icon and text alignment
    width: '90%', // Make buttons slightly less than full width
    paddingVertical: 18, // Increase padding for better touch area
    borderRadius: 10, // Rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Space between buttons
    shadowColor: "#000", // Add shadow for depth
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lostButton: {
    backgroundColor: '#FF6347', // Example: Tomato color for Lost
  },
  foundButton: {
    backgroundColor: '#FFFFFF', // White background for Found
    borderWidth: 1,
    borderColor: '#143447', // Navy border
  },
  buttonText: {
    color: '#ffffffff', // Default white text
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  foundButtonText: {
     color: '#143447', // Navy text for found button
  },
  // Optional style for icons inside buttons
  // buttonIcon: {
  //   marginRight: 10,
  // },
});