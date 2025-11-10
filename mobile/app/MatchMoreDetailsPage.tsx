import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Assuming these are your custom navigation components
import BlankHeader from '../components/BlankHeader';
import BottomNavBar from '../components/BottomNavBar';

// --- Type Definitions ---
interface MatchItemDetails {
  itemId: string;
  itemName: string;
  images?: string[];
  locationLost?: string;
  locationFound?: string;
}

interface Match {
  transactionId: string;
  lostItem?: MatchItemDetails;
  foundItem?: MatchItemDetails;
  scores: {
    overallScore: number;
    descriptionScore: number;
    imageScore: number;
  };
}

interface Item {
  itemId: string;
  itemName: string;
  images?: string[];
  dateSubmitted?: string | Timestamp;
  type: 'Lost' | 'Found' | 'Unknown';
  location: string;
  category: string;
  status: string;
  itemDescription?: string;
  topMatches?: Match[];
}

// --- Reusable Components ---
const ReportedItemCard = ({ item }: { item: Item }) => {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "posted": return styles.statusPosted;
      case "pending": return styles.statusPending;
      case "cancelled": return styles.statusCancelled;
      default: return styles.statusDefault;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Reported Item</Text>
      {item.images && item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.mainImage} />
      )}
      <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
        <Text style={styles.statusBadgeText}>{item.status?.toUpperCase()}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Item ID:</Text> {item.itemId}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text> {item.itemName}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Category:</Text> {item.category}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Date Reported:</Text> {formatDate(item.dateSubmitted)}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Location:</Text> {item.locationLost || item.locationFound}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Description:</Text> {item.itemDescription || "No description"}</Text>
      </View>
    </View>
  );
};

// ✨ FIX: Updated MatchCard to include progress bars
const MatchCard = ({ match, index, itemType }: { match: Match; index: number; itemType: string }) => {
  const matchItem = itemType === 'found' ? match.lostItem : match.foundItem;
  if (!matchItem) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.matchTitle}>Top {index + 1} Match</Text>
      {matchItem.images && matchItem.images.length > 0 && (
        <Image source={{ uri: matchItem.images[0] }} style={styles.matchImage} />
      )}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Item ID:</Text> {matchItem.itemId}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Transaction ID:</Text> {match.transactionId}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text> {matchItem.itemName}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Location:</Text> {matchItem.locationLost || matchItem.locationFound}</Text>
      </View>
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Scores</Text>
        <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>Overall: {match.scores.overallScore}%</Text>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${match.scores.overallScore}%` }]} />
            </View>
        </View>
        <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>Description: {match.scores.descriptionScore}%</Text>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${match.scores.descriptionScore}%` }]} />
            </View>
        </View>
        <View style={styles.scoreRow}>
            <Text style={styles.scoreText}>Image: {match.scores.imageScore}%</Text>
            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${match.scores.imageScore}%` }]} />
            </View>
        </View>
      </View>
    </View>
  );
};

// --- Main Screen Component ---
function MatchMoreDetailsPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const item: Item | undefined = params.item ? JSON.parse(params.item as string) : undefined;
  
  const [userData, setUserData] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleBackPress = () => {
      if (router.canGoBack()) {
          router.back();
      }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>No match data provided.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredMatches = item.topMatches?.filter((match) => {
    if (item.type?.toLowerCase() === "found") return match.lostItem;
    if (item.type?.toLowerCase() === "lost") return match.foundItem;
    return false;
  }) || [];

  return (
    <SafeAreaView style={styles.container}>
      
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ReportedItemCard item={item} />
        
        <View style={styles.matchesSection}>
          <Text style={styles.sectionTitle}>Matching Results</Text>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => (
              <MatchCard key={index} match={match} index={index} itemType={item.type.toLowerCase()} />
            ))
          ) : (
            <View style={styles.card}>
                <Text style={styles.detailRow}>No matching items found.</Text>
            </View>
          )}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  mainImage: { width: '100%', height: 300, borderRadius: 8, marginBottom: 15 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusBadgeText: { color: '#fff', fontWeight: 'bold' },
  statusPosted: { backgroundColor: 'green' },
  statusPending: { backgroundColor: 'orange' },
  statusCancelled: { backgroundColor: 'red' },
  statusDefault: { backgroundColor: '#ccc' },
  detailsContainer: { marginBottom: 10 },
  detailRow: { fontSize: 16, color: '#444', marginBottom: 8 },
  detailLabel: { fontWeight: 'bold' },
  matchesSection: { marginTop: 10 },
  matchTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  matchImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
  scoresContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  scoresTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  scoreText: { fontSize: 14, color: '#555' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    backgroundColor: 'white',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    opacity: 0.7,
  },
  // ✨ FIX: New styles for the progress bars
  scoreRow: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#28a745', // Green color
    borderRadius: 4,
  },
});

export default MatchMoreDetailsPage;