import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  Image,
  SafeAreaView,
  BackHandler,
  ScrollView, // Added ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext'; 
import { useRouter, useFocusEffect } from 'expo-router'; 
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LostHeader from '../components/LostHeader';
import BottomNavBar from '../components/BottomNavBar';
import { useOfflineNotifier } from '../hooks/useOfflineNotifier'; 

const ItemCard = ({ item, isSaved, onSaveToggle, onCardPress }) => {
  const reporter = item.personalInfo;
  const isGuest = item.isGuest === true;

  const getInitials = () => {
    if (isGuest || !reporter) return "G";
    return `${(reporter.firstName || '').charAt(0)}${(reporter.lastName || '').charAt(0)}`.toUpperCase();
  };

  return (
    <TouchableOpacity style={styles.itemCard} onPress={() => onCardPress(item)}>
      <Image
        source={item.images && item.images.length > 0 ? { uri: item.images[0] } : require('../assets/images/favicon.png')}
        style={styles.itemImage}
      />
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={(e) => {
          e && e.stopPropagation && e.stopPropagation();
          onSaveToggle(item);
        }}
      >
        <MaterialCommunityIcons name={isSaved ? "star" : "star-outline"} size={28} color={isSaved ? "#FFD700" : "white"} />
      </TouchableOpacity>
      <View style={styles.cardDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.howItemLost}</Text>
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

export default function LostItemsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/home-screen');
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        if (subscription?.remove) {
             subscription.remove();
        }
      };
    }, [router])
  );

  const { notifyOffline, OfflinePanelComponent } = useOfflineNotifier();
  
  const [userData, setUserData] = useState(null);
  const [lostItems, setLostItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(null);

  const categories = ["Electronics", "Accessories", "Clothing & Apparel", "Bags & Luggage", "Documents & IDs", "Books & Stationery",
    "Household Items", "Sports & Fitness", "Health & Personal Care", "Toys & Games", "Food & Beverages", 
    "Automotive Items", "Musical Instruments", "Pet Items", "Others"];

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
        }

        const lostSnapshot = await getDocs(collection(db, 'lostItems'));
        const lostData = lostSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLostItems(lostData);

        const savedSnapshot = await getDocs(collection(db, "users", currentUser.uid, "savedItems"));
        const savedData = savedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSavedItems(savedData);
      } catch (error) {
        console.error("Error fetching data:", error.code, error.message);
        if (error.code === 'unavailable' || error.code === 'auth/network-request-failed') {
          notifyOffline(fetchData); 
        } else {
          Alert.alert("Error", "Failed to load item data.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, notifyOffline]); 

  const toggleSave = async (item) => {
    if (!currentUser) return;
    const ref = doc(db, "users", currentUser.uid, "savedItems", item.id);
    const isCurrentlySaved = savedItems.some(saved => saved.id === item.id);

    try {
      if (isCurrentlySaved) {
        setIsRemoving(item.id);
        await deleteDoc(ref);
        setSavedItems(prev => prev.filter(saved => saved.id !== item.id));
      } else {
        await setDoc(ref, { ...item, savedAt: new Date() });
        setSavedItems(prev => [...prev, { id: item.id, ...item }]);
      }
    } catch (error) {
      if (error.code === 'unavailable') {
        Alert.alert("Network Error", "Could not save item. Please check your connection.");
      } else {
        Alert.alert("Error", "Could not save item.");
      }
    } finally {
        setIsRemoving(null);
    }
  };

  const filteredLostItems = lostItems
    .filter(item => item.claimStatus !== "claimed" && item.archivedStatus !== true)
    .filter(item => {
      const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.dateLost) - new Date(a.dateLost));

  const onCardPress = (item) => {
    router.push({ pathname: `/items/${item.id}`, params: { type: 'lost' } });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <LostHeader userData={userData} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lost Items</Text>
        <TouchableOpacity style={styles.savedButton} onPress={() => setShowSavedModal(true)}>
          <MaterialCommunityIcons name="bookmark-multiple" size={28} color="#333" />
          {savedItems.length > 0 && (
            <View style={styles.savedBadge}><Text style={styles.savedBadgeText}>{savedItems.length}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for an item..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.categoryButton} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.categoryButtonText}>{selectedCategory || 'Category'}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Items List */}
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredLostItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              isSaved={savedItems.some(saved => saved.id === item.id)}
              onSaveToggle={toggleSave}
              onCardPress={onCardPress}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 80 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No lost items found.</Text>}
        />
      )}
      
      {/* Saved Items Modal */}
      <Modal visible={showSavedModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Items</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSavedModal(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#555" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={savedItems}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const dateKey = item.dateLost ? 'dateFound' : 'dateLost'; 
                const dateTimestamp = item[dateKey]; 
                
                let formattedDate = 'N/A';
                if (dateTimestamp && typeof dateTimestamp.seconds === 'number') {
                    formattedDate = new Date(dateTimestamp.seconds * 1000).toLocaleDateString();
                } else if (item.savedAt && typeof item.savedAt.seconds === 'number') {
                    formattedDate = new Date(item.savedAt.seconds * 1000).toLocaleDateString();
                }

                const isDeleting = isRemoving === item.id;

                return (
                  <TouchableOpacity style={styles.savedItemRow} onPress={() => onCardPress(item)} disabled={isDeleting}>
                    <Image
                      source={item.images && item.images.length > 0 ? { uri: item.images[0] } : require('../assets/images/favicon.png')}
                      style={styles.savedItemImage}
                    />
                    <View style={styles.savedItemDetails}>
                      <Text style={styles.savedItemName} numberOfLines={1}>{item.itemName}</Text>
                      <Text style={styles.savedItemCategory}>Category: {item.category || 'N/A'}</Text>
                      <Text style={styles.savedItemDate}>Reported: {formattedDate}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.unsaveButton, isDeleting && styles.unsaveButtonLoading]}
                        onPress={(e) => { 
                            e.stopPropagation();
                            toggleSave(item);
                        }}
                        disabled={isDeleting} 
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <MaterialCommunityIcons name="bookmark-off" size={24} color="#FFF" />
                        )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>You have no saved items.</Text>}
              contentContainerStyle={styles.savedListContent}
            />
          </View>
        </View>
      </Modal>

       {/* Category Picker Modal - SCROLLABLE FIX */}
      <Modal visible={showCategoryModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a Category</Text>
            
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => { setSelectedCategory(''); setShowCategoryModal(false); }}
              >
                <Text style={styles.categoryItemText}>All Categories</Text>
              </TouchableOpacity>
              
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryItem}
                  onPress={() => { setSelectedCategory(cat); setShowCategoryModal(false); }}
                >
                  <Text style={styles.categoryItemText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{ marginTop: 10, alignSelf: 'center', paddingVertical: 10 }}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={{ color: 'blue', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavBar activeScreen="Lost" />
      <OfflinePanelComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f9ff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  savedButton: { padding: 5 },
  savedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonText: { fontWeight: 'bold', marginRight: 5 },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: { width: '100%', height: 200, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 5,
    borderRadius: 20,
  },
  cardDetails: { padding: 15 },
  itemName: { fontSize: 18, fontWeight: 'bold' },
  itemDescription: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 10 },
  reporterInfoContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  reporterImage: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  reporterInitialsContainer: { width: 30, height: 30, borderRadius: 15, marginRight: 8, backgroundColor: '#143447', justifyContent: 'center', alignItems: 'center' },
  reporterInitialsText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  reporterTextContainer: { flex: 1 },
  reporterName: { fontWeight: 'bold', fontSize: 14 },
  reporterCourse: { fontSize: 12, color: '#888' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', 
    alignItems: 'center' 
  }, 
  modalContainer: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    padding: 15,
    maxHeight: '80%',
    width: '90%', 
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  }, 
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333'
  },
  modalCloseButton: {
    padding: 5,
  },
  savedItemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 5,
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
  },
  savedItemImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 10, 
    marginRight: 15,
    backgroundColor: '#eee' 
  },
  savedItemDetails: {
    flex: 1,
  },
  savedItemName: { 
    fontSize: 16, 
    fontWeight: 'bold',
    color: '#143447', 
  },
  savedItemCategory: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  savedItemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  unsaveButton: {
    backgroundColor: '#FF6347', 
    borderRadius: 20,
    padding: 8,
    marginLeft: 10,
  },
  unsaveButtonLoading: {
    opacity: 0.7,
  },
  savedListContent: {
    paddingBottom: 10,
  },
  categoryItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoryItemText: { fontSize: 16, textAlign: 'center' },
});