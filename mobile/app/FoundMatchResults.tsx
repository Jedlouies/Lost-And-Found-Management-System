import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timestamp, doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

import RatingModal from '../components/RatingModal';

interface PersonalInfo {
    firstName?: string;
    lastName?: string;
    profileURL?: string;
    [key: string]: any;
}

interface MatchItemDetails {
  itemId: string;
  itemName: string;
  images?: string[];
  locationLost?: string;
  locationFound?: string;
  personalInfo?: PersonalInfo;
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

interface ItemManagementData {
  itemId: string;
  itemName: string;
  images?: string[];
  dateSubmitted: string;
  type: 'Found' | 'Lost';
  locationFound?: string;
  locationLost?: string;
  category: string;
  status: string;
  itemDescription?: string;
  topMatches?: Match[];
  personalInfo?: PersonalInfo;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  [key: string]: any;
}

// --- Reusable Components ---
const MatchCard = ({ match, index, itemType }: { match: Match; index: number; itemType: string }) => {
  const matchItem = itemType === 'found' ? match.lostItem : match.foundItem;
  if (!matchItem) return null;

  const reporterInitials = `${matchItem.personalInfo?.firstName?.[0] || '?'}${matchItem.personalInfo?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <View style={styles.card}>
      <Text style={styles.matchTitle}>Top {index + 1} </Text>
      {matchItem.images && matchItem.images.length > 0 && (
        <Image source={{ uri: matchItem.images[0] }} style={styles.matchImage} />
      )}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Item ID:</Text> {matchItem.itemId}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Transaction ID:</Text> {match.transactionId}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text> {matchItem.itemName}</Text>
        <Text style={styles.detailRow}><Text style={styles.detailLabel}>Location:</Text> {matchItem.locationLost || matchItem.locationFound || 'N/A'}</Text>
      </View>
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Match Scores</Text>
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
      <View style={styles.reporterContainer}>
        <Text style={styles.reporterTitle}>Reported By</Text>
        <View style={styles.reporterInfo}>
            {matchItem.personalInfo?.profileURL ? (
                <Image source={{ uri: matchItem.personalInfo.profileURL }} style={styles.reporterImage} />
            ) : (
                <View style={styles.initialsContainer}>
                    <Text style={styles.initialsText}>{reporterInitials}</Text>
                </View>
            )}
            <Text style={styles.reporterName}>{matchItem.personalInfo?.firstName} {matchItem.personalInfo?.lastName || 'Unknown User'}</Text>
            <Text style={styles.reporterName}> - {matchItem.personalInfo?.course?.abbr}</Text>
        </View>
      </View>
    </View>
  );
};

// --- Main Screen Component ---
function FoundMatchResults() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [itemData, setItemData] = useState<ItemManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (params.itemData) {
      try {
        const parsedData = JSON.parse(params.itemData as string);
        setItemData(parsedData);
      } catch (e) {
        console.error("Failed to parse item data:", e);
        Alert.alert("Error", "Could not load item details.");
      }
    }
    setLoading(false);
  }, [params.itemData]);

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!itemData || !currentUser) return;
    setIsSubmittingRating(true);
    try {
        await addDoc(collection(db, "ratings"), {
            ratedItemId: itemData.itemId,
            userId: currentUser.uid,
            rating: rating,
            feedback: feedback || "",
            createdAt: serverTimestamp(),
            matchesRated: itemData.topMatches || [],
        });
        Alert.alert("Success", "Thank you for your feedback!");
        setShowRatingModal(false);
        router.push('/ItemManagementScreen'); // Navigate home after successful rating
    } catch (error) {
        console.error("Failed to submit rating:", error);
        Alert.alert("Error", "Could not submit your rating. Please try again.");
    } finally {
        setIsSubmittingRating(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  if (!itemData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><Text>No item data found.</Text></View>
      </SafeAreaView>
    );
  }

  const filteredMatches = itemData.topMatches || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.matchesSection}>
          {filteredMatches.length > 0 ? (
            filteredMatches.map((match, index) => (
              <MatchCard
                key={match.transactionId || index}
                match={match}
                index={index}
                itemType={itemData.type.toLowerCase()}
              />
            ))
          ) : (
            <View style={styles.card}><Text style={styles.noMatchesText}>No potential matches found by the AI.</Text></View>
          )}
        </View>

         {/* Action buttons */}
         <View style={styles.actionButtonContainer}>
             {/* ✨ FIX: Added back the "Report Another Item" button */}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/ReportFoundItemScreen')}>
                <Text style={styles.secondaryButtonText}>Report Another</Text>
            </TouchableOpacity>
            {/* ✨ FIX: "Done" button still triggers the rating modal */}
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowRatingModal(true)}>
                <Text style={styles.primaryButtonText}>Done & Rate</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>

      <RatingModal
        show={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        isSubmitting={isSubmittingRating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContainer: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' }, // Increased bottom margin
  detailsContainer: { marginBottom: 10 },
  detailRow: { fontSize: 16, color: '#444', marginBottom: 8 },
  detailLabel: { fontWeight: 'bold' },
  matchesSection: { marginTop: 10 },
  matchTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  matchImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 15 },
  scoresContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  scoresTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  scoreText: { fontSize: 14, color: '#555' },
  scoreRow: { marginBottom: 8 },
  progressBarBackground: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#28a745', borderRadius: 4 },
  reporterContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  reporterTitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center' },
  reporterImage: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
  initialsContainer: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  initialsText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  reporterName: { fontSize: 14, color: '#333' },
  actionButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between', // Changed to space-between
      marginTop: 20,
      marginBottom: 20,
      paddingHorizontal: 10, // Added padding for spacing
  },
  primaryButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: 'center',
      flex: 1, // Make buttons share width
      marginLeft: 5, // Space between buttons
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
      borderWidth: 1,
      borderColor: '#007AFF',
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: 'center',
      flex: 1, // Make buttons share width
      marginRight: 5, // Space between buttons
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
  noMatchesText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      paddingVertical: 20,
  }
});

export default FoundMatchResults;