import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust this path if needed
import { useAuth } from '../../context/AuthContext'; // Adjust this path if needed
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons'; // ✅ Import Feather for back icon

// A helper component to keep the UI clean
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function ItemMoreDetailsScreen() {
  const { id, type } = useLocalSearchParams(); 
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !type) return;

    const fetchItem = async () => {
      try {
        const collectionName = type === 'lost' ? 'lostItems' : 'foundItems';
        const docRef = doc(db, collectionName, String(id));
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, type]);

  const handleClaim = () => {
    if (type === "lost") {
      router.push(`/UserFoundProcedureScreen`);
    } else if (type === "found") {
      router.push(`/UserLostProcedureScreen`);
    }
  };
  
  const getInitials = () => {
    if (item?.isGuest || !item?.personalInfo) return "G";
    const { firstName = '', lastName = '' } = item.personalInfo;
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  const reporter = item.personalInfo;
  const isGuest = item.isGuest === true;

  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* ✅ FIX: Added the Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {item.images?.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="image-off" size={100} color="#ccc" />
          </View>
        )}
        <View style={styles.detailsContainer}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemId}>Item ID: {item.itemId}</Text>

          <DetailRow 
            label={type === 'lost' ? "How It Was Lost" : "How It Was Found"}
            value={type === 'lost' ? item.howItemLost : item.howItemFound || "No description"}
          />
          <DetailRow 
            label={type === 'lost' ? "Date Lost" : "Date Found"}
            value={item.dateLost || item.dateFound ? new Date(item.dateLost || item.dateFound).toLocaleString() : "N/A"}
          />
          <DetailRow 
            label={type === 'lost' ? "Location Lost" : "Location Found"}
            value={item.locationLost || item.locationFound}
          />
          <DetailRow label="Category" value={item.category} />

          <Text style={styles.reporterTitle}>Reported By</Text>
          <View style={styles.reporterInfoContainer}>
             {isGuest ? (
              <View style={styles.reporterInitialsContainer}>
                <MaterialCommunityIcons name="account-question" size={24} color="white" />
              </View>
            ) : reporter?.profileURL ? (
              <Image source={{ uri: reporter.profileURL }} style={styles.reporterImage} />
            ) : (
              <View style={styles.reporterInitialsContainer}>
                <Text style={styles.reporterInitialsText}>{getInitials()}</Text>
              </View>
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
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.claimButton} onPress={handleClaim}>
          <Text style={styles.claimButtonText}>
            {type === "lost" ? "I Found This Item" : "I Own This Item"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f9ff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { paddingBottom: 100 },
  itemImage: {
    width: '100%',
    height: 300,
  },
  placeholderImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  // ✅ FIX: Style for the back button
  backButton: {
    position: 'absolute',
    top: 50, // Adjust this based on your status bar height
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  itemId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  detailRow: {
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  reporterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  reporterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  reporterInitialsContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#143447',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reporterInitialsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  reporterTextContainer: {
    flex: 1,
  },
  reporterName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  reporterCourse: {
    fontSize: 14,
    color: '#888',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 120,
  },
  claimButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});