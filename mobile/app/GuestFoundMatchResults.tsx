import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal, // For details popup
  Clipboard, // For copying transaction ID
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAuth } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GuestRatingModal from '../components/GuestRatingModal'; // Assuming RN version exists

// --- Type Definitions (Identical to GuestLostMatchResults) ---
interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  profileURL?: string;
  course?: { abbr: string; name: string };
  [key: string]: any;
}

interface MatchItemDetails {
  itemId: string;
  itemName: string;
  images?: string[];
  locationLost?: string;
  locationFound?: string;
  dateLost?: string; // Changed from dateFound
  howItemLost?: string; // Changed from howItemFound
  category?: string;
  personalInfo?: PersonalInfo;
}

interface Match {
  transactionId: string;
  lostItem?: MatchItemDetails; // This will be the item lost by others
  foundItem?: MatchItemDetails; // This will be the guest's item
  scores: {
    overallScore: number;
    descriptionScore: number;
    imageScore: number;
    locationScore?: number;
    nameScore?: number;
  };
}

// Define nav types (adjust as needed)
type RootStackParamList = {
  GuestHome: { userId: string };
  GuestFoundItemForm: { userId: string };
  [key: string]: any;
};
type MatchResultsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Reusable Match Card ---
const MatchCard = ({ match, index, onDetailsClick }: { match: Match; index: number; onDetailsClick: (item: MatchItemDetails) => void }) => {
  // Guest reported FOUND, so we display the LOST item
  const matchItem = match.lostItem;
  if (!matchItem) return null;

  const posterInfo = matchItem.personalInfo || {};
  const scores = match.scores || {};
  const reporterInitials = `${posterInfo.firstName?.[0] || '?'}${posterInfo.lastName?.[0] || ''}`.toUpperCase();
  
  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied", "Transaction ID copied to clipboard.");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.matchTitle}>Top {index + 1} Match</Text>
      
      {matchItem.images && matchItem.images.length > 0 && (
        <Image source={{ uri: matchItem.images[0] }} style={styles.matchImage} />
      )}
      
      <Text style={styles.detailRow}><Text style={styles.detailLabel}>Item:</Text> {matchItem.itemName}</Text>
      
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Match Scores</Text>
        {/* Overall */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Overall: {scores.overallScore || 0}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${scores.overallScore || 0}%` }]} />
          </View>
        </View>
        {/* Others */}
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Image: {scores.imageScore || 0}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${scores.imageScore || 0}%` }]} />
          </View>
        </View>
         <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Name: {scores.nameScore || 0}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${scores.nameScore || 0}%` }]} />
          </View>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Description: {scores.descriptionScore || 0}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${scores.descriptionScore || 0}%` }]} />
          </View>
        </View>
         <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Location: {scores.locationScore || 0}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${scores.locationScore || 0}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.reporterContainer}>
        <Text style={styles.reporterTitle}>Lost By</Text>
        <View style={styles.reporterInfo}>
          {posterInfo.profileURL && posterInfo.profileURL !== 'Guest' ? (
            <Image source={{ uri: posterInfo.profileURL }} style={styles.reporterImage} />
          ) : (
            <View style={styles.initialsContainer}>
              <Text style={styles.initialsText}>{reporterInitials}</Text>
            </View>
          )}
          <View style={styles.reporterTextContainer}>
            <Text style={styles.reporterName}>{posterInfo.firstName} {posterInfo.lastName}</Text>
             <Text style={styles.reporterMeta}>
                {posterInfo.course ? (posterInfo.course.abbr || "N/A") : "N/A"}
             </Text>
          </View>
        </View>
      </View>

       <TouchableOpacity style={styles.detailsButton} onPress={() => onDetailsClick(matchItem)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Details Modal ---
const ItemDetailModal = ({ item, visible, onClose }: { item: MatchItemDetails | null; visible: boolean; onClose: () => void }) => {
    if (!item) return null;
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                     <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>{item.itemName}</Text>

                    {item.images?.[0] && (
                        <Image source={{ uri: item.images[0] }} style={styles.modalImage} />
                    )}
                    
                    <ScrollView style={styles.modalDetailsContainer}>
                        <Text style={styles.modalDetailRow}><Text style={styles.detailLabel}>Item ID:</Text> {item.itemId}</Text>
                        <Text style={styles.modalDetailRow}><Text style={styles.detailLabel}>Category:</Text> {item.category || 'N/A'}</Text>
                        <Text style={styles.modalDetailRow}><Text style={styles.detailLabel}>Location Lost:</Text> {item.locationLost || 'N/A'}</Text>
                        <Text style={styles.modalDetailRow}>
                            <Text style={styles.detailLabel}>Date Lost:</Text> 
                            {item.dateLost ? new Date(item.dateLost).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                        </Text>
                        <Text style={styles.modalDetailRow}>
                            <Text style={styles.detailLabel}>Circumstances:</Text> {item.howItemLost || 'No description provided.'}
                        </Text>
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};


// --- Main Screen Component ---
export default function GuestFoundMatchResults() {
  const params = useLocalSearchParams();
  const navigation = useNavigation<MatchResultsNavigationProp>();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [selectedItem, setSelectedItem] = useState<MatchItemDetails | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (params.matches) {
      try {
        const parsedMatches = JSON.parse(params.matches as string) as Match[];
        const sortedMatches = parsedMatches
          .sort((a, b) => (b.scores?.overallScore || 0) - (a.scores?.overallScore || 0))
          .slice(0, 4);
        setMatches(sortedMatches);
      } catch (e) {
        console.error("Failed to parse matches:", e);
        Alert.alert("Error", "Could not load match results.");
      }
    }
  }, [params.matches]);

  const handleNavigate = () => {
    setShowRatingModal(true);
  };

  const handleMatchAnother = () => {
    if (!currentUser?.uid) return;
    navigation.navigate('GuestFoundItemForm', { userId: currentUser.uid });
  };
  
   const handleRatingSubmit = (rating: number, feedback: string) => {
     console.log("Rating:", rating, "Feedback:", feedback);
     Alert.alert("Feedback Submitted", "Thank you!");
     setShowRatingModal(false);
     navigation.navigate('GuestHome', { userId: currentUser!.uid });
   };

  return (
    <SafeAreaView style={styles.container}>
      <ItemDetailModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <GuestRatingModal
         show={showRatingModal}
         onClose={() => setShowRatingModal(false)}
         onSubmit={handleRatingSubmit}
         isSubmitting={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.pageTitle}>Matching Found Item</Text>
        {matches.length === 0 ? (
          <View style={styles.card}><Text style={styles.noMatchesText}>No potential matches found by the AI.</Text></View>
        ) : (
          matches.map((match, index) => (
            <MatchCard
              key={match.transactionId || index}
              match={match}
              index={index}
              onDetailsClick={setSelectedItem}
            />
          ))
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleNavigate}>
          <Text style={styles.secondaryButtonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleMatchAnother}>
          <MaterialCommunityIcons name="sync" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Match Another</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles (Identical to GuestLostMatchResults) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', marginTop: Platform.OS === 'android' ? 25 : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContainer: { padding: 16, paddingBottom: 100 },
  pageTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#143447',
      textAlign: 'center',
      marginBottom: 20,
  },
  card: { 
      backgroundColor: '#fff', 
      borderRadius: 12, 
      padding: 16, 
      marginBottom: 20, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.1, 
      shadowRadius: 4, 
      elevation: 3 
  },
  matchTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#007AFF' },
  matchImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15, backgroundColor: '#eee' },
  detailsContainer: { marginBottom: 15 },
  detailRow: { fontSize: 16, color: '#444', marginBottom: 8 },
  detailLabel: { fontWeight: 'bold' },
  scoresContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  scoresTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  scoreText: { fontSize: 14, color: '#555' },
  scoreRow: { marginBottom: 8 },
  progressBarBackground: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#28a745', borderRadius: 4 },
  reporterContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  reporterTitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center' },
  reporterImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  initialsContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#143447', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  initialsText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  reporterTextContainer: { flex: 1 },
  reporterName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  reporterMeta: { fontSize: 13, color: '#666' },
  detailsButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 15,
  },
  detailsButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: 'bold',
  },
  actionButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
      paddingHorizontal: 15,
      paddingBottom: Platform.OS === 'ios' ? 30 : 15,
      backgroundColor: '#ffffff',
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
  },
  primaryButton: {
      backgroundColor: '#143447',
      paddingVertical: 14,
      borderRadius: 25,
      alignItems: 'center',
      flex: 1,
      marginLeft: 5,
      flexDirection: 'row',
      justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#143447',
      paddingVertical: 14,
      borderRadius: 25,
      alignItems: 'center',
      flex: 1,
      marginRight: 5,
  },
  secondaryButtonText: { color: '#143447', fontSize: 16, fontWeight: 'bold' },
  noMatchesText: { fontSize: 16, color: '#666', textAlign: 'center', paddingVertical: 20 },
  // Modal Styles
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalContent: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
  },
  modalCloseButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 5,
      zIndex: 1,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#143447',
      marginBottom: 15,
      textAlign: 'center',
  },
  modalImage: {
      width: '100%',
      height: 250,
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: '#eee',
  },
   modalDetailsContainer: {
       maxHeight: 150,
   },
  modalDetailRow: {
      fontSize: 15,
      color: '#333',
      marginBottom: 10,
      lineHeight: 22,
  },
});