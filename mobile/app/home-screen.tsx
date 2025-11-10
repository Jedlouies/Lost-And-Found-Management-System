import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  SafeAreaView,
  Animated, // Added for floating alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TopHeader from '../components/TopHeader';
import BottomNavBar from '../components/BottomNavBar';
import { ImageBackground } from 'expo-image';
import { useOfflineNotifier } from '../hooks/useOfflineNotifier';
import MessageAdminButton from '../components/MessageAdminButton'; // Import the new component

const { width } = Dimensions.get('window');

// --- Simple Floating Alert Component for Home Screen ---
// Note: This is an implementation of the FloatingAlert functionality 
// required by the MessageAdminButton's original design.
const LocalFloatingAlert = ({ message, type, visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    let timer;
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(onClose);
        }, 3000); // Display for 3 seconds
      });
    }

    // Cleanup function to clear the timeout if the component unmounts or state changes
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  // Use a conditional render or a check on animation value to prevent layout shift
  if (!visible && fadeAnim.__getValue() === 0) return null;

  const backgroundColor = type === 'success' ? '#4CAF50' : '#F44336';
  const icon = type === 'success' ? 'check-circle-outline' : 'alert-circle-outline';

  return (
    <Animated.View style={[
      localAlertStyles.alertContainer, 
      { backgroundColor, opacity: fadeAnim }
    ]}>
      <MaterialCommunityIcons name={icon} size={20} color="white" style={localAlertStyles.alertIcon} />
      <Text style={localAlertStyles.alertText}>{message}</Text>
    </Animated.View>
  );
};

// --- Styles for LocalFloatingAlert ---
const localAlertStyles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 99, // Below FAB, but above most content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertIcon: {
    marginRight: 10,
  },
  alertText: {
    color: 'white',
    fontWeight: 'bold',
    flexShrink: 1,
  },
});
// ------------------------------------


export default function HomeScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { notifyOffline, OfflinePanelComponent } = useOfflineNotifier();

  const [userData, setUserData] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loadingLost, setLoadingLost] = useState(true);
  const [loadingFound, setLoadingFound] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  // NEW State for managing the local alert/notification
  const [alert, setAlert] = useState({ message: '', type: 'success', visible: false });


  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData(data);
          const hasEmptyFields = Object.values(data).some((value) => value === "");
          setIsPanelVisible(hasEmptyFields);
        }
        
        const lostSnapshot = await getDocs(collection(db, 'lostItems'));
        setLostItems(lostSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const foundSnapshot = await getDocs(collection(db, 'foundItems'));
        setFoundItems(foundSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching items:", error);
        if (error.code === 'unavailable' || error.code === 'auth/network-request-failed') {
          notifyOffline(loadData);
        }
      } finally {
        setLoadingLost(false);
        setLoadingFound(false);
      }
    };

    loadData();
  }, [currentUser, notifyOffline]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const recentLostItems = lostItems
    .filter(item => item.claimStatus !== "claimed" && item.archivedStatus !== true && item.status !== "pending")
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost))
    .slice(0, 10);

  const recentFoundItems = foundItems
    .filter(item => item.claimStatus !== "claimed" && item.archivedStatus !== true && item.status !== "pending")
    .sort((a, b) => new Date(b.dateFound) - new Date(a.dateFound))
    .slice(0, 10);

  const renderItemCard = ({ item, type }) => {
    const reporter = item.personalInfo;
    const isGuest = item.isGuest === true;
    
    const getInitials = () => {
      if (isGuest || !reporter) return "G";
      return `${(reporter.firstName || '').charAt(0)}${(reporter.lastName || '').charAt(0)}`.toUpperCase();
    };

    return (
      <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push({ 
        pathname: `/items/${item.id}`, 
        params: { type: type } 
      })}
    >
        <Image
          source={item.images && item.images.length > 0 ? { uri: item.images[0] } : require('../assets/images/favicon.png')}
          style={styles.itemImage}
        />
        <View style={styles.cardDetails}>
          <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
          <Text style={styles.itemDescription} numberOfLines={1}>
            {type === 'lost' ? item.howItemLost : item.howItemFound}
          </Text>
          <View style={styles.reporterInfoContainer}>
            {isGuest ? (
              <View style={styles.reporterInitialsContainer}><MaterialCommunityIcons name="account-question" size={20} color="white" /></View>
            ) : reporter?.profileURL ? (
              <Image source={{ uri: reporter.profileURL }} style={styles.reporterImage} />
            ) : (
              <View style={styles.reporterInitialsContainer}><Text style={styles.reporterInitialsText}>{getInitials()}</Text></View>
            )}
            <View style={styles.reporterTextContainer}>
              <Text style={styles.reporterName} numberOfLines={1}>
                {isGuest ? 'Guest User' : `${reporter?.firstName || ''} ${reporter?.lastName || ''}`.trim()}
              </Text>
              {!isGuest && (
                <Text style={styles.reporterCourse} numberOfLines={1}>
                  {reporter?.course?.abbr ? `${reporter.course.abbr} Student` : 'Unknown Course'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <TopHeader userData={userData} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {isPanelVisible && (
          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelText}>Please complete your profile.</Text>
            <TouchableOpacity onPress={() => router.push(`/UserSettingsScreen`)}>
              <Text style={styles.infoPanelButton}>Go to Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/UserLostProcedureScreen`)}
          >
            <MaterialCommunityIcons name="magnify-minus-outline" size={24} color="#ffffffff" />
            <Text style={styles.actionButtonText}>I Lost an Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { marginLeft: 15 }]}
            onPress={() => router.push(`/UserFoundProcedureScreen`)}
          >
            <MaterialCommunityIcons name="magnify-plus-outline" size={24} color="#ffffffff" />
            <Text style={styles.actionButtonText}>I Found an Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.banner}>
          <ImageBackground
            source={require('../assets/images/landing-page-img.png')}
            style={styles.background}
            resizeMode="cover"
          >
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </ImageBackground>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bag-personal-off-outline" size={28} color="#475C6F" />
            <Text style={styles.sectionTitle}>Recent Lost Items</Text>
            <TouchableOpacity onPress={() => router.push(`/LostItemScreen`)}>
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </View>
          {loadingLost ? (
            <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 50 }} />
          ) : (
            <FlatList
              horizontal
              data={recentLostItems}
              renderItem={({ item }) => renderItemCard({ item, type: 'lost' })}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No recent lost items found.</Text>}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="bag-checked" size={28} color="#475C6F" />
            <Text style={styles.sectionTitle}>Recent Found Items</Text>
            <TouchableOpacity onPress={() => router.push(`/FoundItemScreen`)}>
              <Text style={styles.moreText}>More</Text>
            </TouchableOpacity>
          </View>
          {loadingFound ? (
            <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 50 }}/>
          ) : (
            <FlatList
              horizontal
              data={recentFoundItems}
              renderItem={({ item }) => renderItemCard({ item, type: 'found' })}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No recent found items found.</Text>}
            />
          )}
        </View>
      </ScrollView>
      
      {/* -------------------------------------- */}
      {/* Render the new MessageAdminButton */}
      {/* -------------------------------------- */}
      <MessageAdminButton 
        onSendSuccess={(message) => setAlert({ message, type: 'success', visible: true })}
        onSendError={(message) => setAlert({ message, type: 'error', visible: true })}
      />
      {/* Render the local alert */}
      <LocalFloatingAlert 
        message={alert.message}
        type={alert.type}
        visible={alert.visible}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
      />

      <BottomNavBar activeScreen="Home" />
      <OfflinePanelComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f9ff',
    paddingBottom: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  background: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoPanel: {
    backgroundColor: '#fff3cd',
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  infoPanelText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  infoPanelButton: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#143447',
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FFFFFF'
  },
  banner: {
    width: '90%',
    height: 120,
    borderRadius: 15,
    alignSelf: 'center',
    marginTop: 20,
    overflow: 'hidden',
  },
  dateText: {
    fontSize: 16,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    marginTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  moreText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  itemCard: {
    width: width * 0.7,
    height: 280,
    backgroundColor: 'white',
    borderRadius: 15,
    marginRight: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '55%',
  },
  cardDetails: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
    color: '#666',
    width: width - 30,
  },
  reporterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  reporterImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  reporterInitialsContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#143447',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reporterInitialsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reporterTextContainer: {
    flex: 1,
  },
  reporterName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  reporterCourse: {
    fontSize: 12,
    color: '#888',
  },
});