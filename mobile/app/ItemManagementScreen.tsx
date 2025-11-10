import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import { useRouter } from 'expo-router';
import { db } from '../firebase'; // Adjust path if needed
import { collection, onSnapshot, query, where, doc, updateDoc, getDocs, getDoc, Timestamp } from 'firebase/firestore'; // Import getDoc
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BlankHeader from '../components/BlankHeader';
import BottomNavBar from '../components/BottomNavBar';

// --- Type Definitions ---
interface Item {
  id: string;
  itemName: string;
  images: string[];
  date: string;
  type: 'Lost' | 'Found' | 'Unknown';
  location: string;
  category: string;
  status: 'Posted' | 'Claimed' | 'Pending' | 'Cancelled' | string;
  highestMatchingRate: number;
  createdAt?: Timestamp;
  [key: string]: any;
}

// --- Item Card Component ---
const ItemCard = ({ item, onSelect, isSelected, onOpenMenu }: { item: Item; onSelect: (id: string) => void; isSelected: boolean; onOpenMenu: (item: Item) => void; }) => {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'posted': return styles.statusPosted;
      case 'claimed': return styles.statusClaimed;
      case 'pending': return styles.statusPending;
      case 'cancelled': return styles.statusCancelled;
      default: return {};
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(item.id)}
    >
      <Image
        source={item.images && item.images.length > 0 ? { uri: item.images[0] } : require('../assets/images/favicon.png')}
        style={styles.itemImage}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
          <View style={[styles.typeBadge, item.type?.toLowerCase() === 'lost' ? styles.typeLost : styles.typeFound]}>
            <Text style={styles.typeBadgeText}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.itemInfo}>ID: {item.id}</Text>
        <Text style={styles.itemInfo}>Date: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : "N/A"}</Text>
        <View style={styles.matchingRateContainer}>
          <Text style={styles.matchingRateText}>Match Rate: {item.highestMatchingRate || 0}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${item.highestMatchingRate || 0}%` }]} />
          </View>
        </View>
        <View style={[styles.statusContainer, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.menuButton} onPress={() => onOpenMenu(item)}>
        <MaterialCommunityIcons name="dots-vertical" size={24} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// --- Main Screen Component ---
function ItemManagementScreen() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [userData, setUserData] = useState(null); // ✅ FIX: Added state for userData

  const itemsPerPage = 10;

  useEffect(() => {
    if (!currentUser) { 
        setLoading(false); 
        return; 
    }
    setLoading(true);

    // ✅ FIX: Fetch User Data
    const fetchUserData = async () => {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserData(userSnap.data());
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        }
    };

    fetchUserData();
    
    // Fetch Item Management Data
    const q = query(collection(db, 'itemManagement'), where("uid", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const managementItems = snapshot.docs.map(doc => ({
        id: doc.data().itemId,
        ...doc.data()
      })) as Item[];
      setItems(managementItems);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching items:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const archiveItem = async (itemId: string) => {
    try {
      const q = query(collection(db, "itemManagement"), where("itemId", "==", itemId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { archivedStatus: true });
        Alert.alert("Success", `Item ${itemId} has been archived.`);
      }
    } catch (error) {
      console.error("Error archiving item:", error);
      Alert.alert("Error", "Failed to archive item.");
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName?.toLowerCase().includes(searchQuery.toLowerCase());
    const itemDate = item.createdAt?.toDate ? item.createdAt.toDate() : null;
    const matchesYear = selectedYear === "" || (itemDate && itemDate.getFullYear().toString() === selectedYear);
    return matchesSearch && matchesYear;
  });

  const displayedItems = filteredItems.slice(0, currentPage * itemsPerPage);

  const handleLoadMore = () => {
    if ((currentPage * itemsPerPage) < filteredItems.length) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleSelectItem = (itemId: string) => {
    if (!bulkMode) {
      const item = items.find(i => i.id === itemId);
      if (item) handleOpenMenu(item);
      return;
    }
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    setSelectedItems(newSelection);
  };
  
  const handleOpenMenu = (item: Item) => {
    setActiveItem(item);
    setShowActionMenu(true);
  };

  const years = ["2025", "2024", "2023", "2022"];

  const handleViewDetailsAction = () => {
    if (activeItem) {
      router.push({
        pathname: "/MatchMoreDetailsPage",
        params: { item: JSON.stringify(activeItem) },
      });
    }
    setShowActionMenu(false);
    setActiveItem(null);
  };

  const handleArchiveAction = () => {
    if (activeItem) {
        archiveItem(activeItem.id);
    }
    setShowActionMenu(false);
    setActiveItem(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlankHeader userData={userData} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Item Management</Text>
        <TouchableOpacity onPress={() => setBulkMode(!bulkMode)}>
            <MaterialCommunityIcons name={bulkMode ? "close-box-multiple" : "check-box-multiple-outline"} size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.yearButton} onPress={() => setShowYearModal(true)}>
          <Text style={styles.yearButtonText}>{selectedYear || "Year"}</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelect={handleSelectItem}
              onOpenMenu={handleOpenMenu}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
          ListFooterComponent={
            (currentPage * itemsPerPage) < filteredItems.length ? (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Modals */}
      <Modal visible={showYearModal} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowYearModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Year</Text>
            {years.map(year => (
              <TouchableOpacity key={year} style={styles.modalOption} onPress={() => { setSelectedYear(year); setShowYearModal(false); }}>
                <Text style={styles.modalOptionText}>{year}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalOption} onPress={() => { setSelectedYear(""); setShowYearModal(false); }}>
              <Text style={styles.modalOptionText}>All Years</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showActionMenu} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowActionMenu(false)}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{activeItem?.itemName}</Text>
                <TouchableOpacity style={styles.modalOption} onPress={handleViewDetailsAction}>
                    <MaterialCommunityIcons name="eye-outline" size={22} color="#333" />
                    <Text style={styles.modalOptionText}>View Details</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={styles.modalOption} onPress={handleArchiveAction}>
                    <MaterialCommunityIcons name="archive-arrow-down-outline" size={22} color="#D9534F" />
                    <Text style={[styles.modalOptionText, {color: '#D9534F'}]}>Archive Item</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>
      <BottomNavBar activeScreen="Items" />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    filtersContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
    searchInput: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, marginRight: 10, backgroundColor: '#fff', fontSize: 16 },
    yearButton: { flexDirection: 'row', height: 44, alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
    yearButtonText: { marginRight: 5, fontSize: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    cardSelected: { borderColor: '#007AFF', backgroundColor: '#e6f2ff' },
    itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
    cardContent: { flex: 1, justifyContent: 'space-between' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    itemName: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 5 },
    itemInfo: { fontSize: 14, color: '#666' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    typeLost: { backgroundColor: '#dc3545' },
    typeFound: { backgroundColor: '#007BFF' },
    matchingRateContainer: { marginTop: 5 },
    matchingRateText: { fontSize: 12, color: '#555', marginBottom: 3 },
    progressBarBackground: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#28a745', borderRadius: 3 },
    statusContainer: { alignSelf: 'flex-start', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, marginTop: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
    statusPosted: { backgroundColor: '#28a745' },
    statusClaimed: { backgroundColor: '#17a2b8' },
    statusPending: { backgroundColor: '#ffc107' },
    statusCancelled: { backgroundColor: '#dc3545' },
    menuButton: { padding: 8, justifyContent: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
    loadMoreButton: { padding: 16, alignItems: 'center' },
    loadMoreText: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '80%', maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalOptionText: { fontSize: 16, marginLeft: 10 },
});

export default ItemManagementScreen;