import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, realtimeDB } from '../firebase';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router'; 
import * as ImagePicker from 'expo-image-picker';
import { ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// --- Type Definitions ---
interface UserData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  profileURL?: string;
  coverURL?: string;
  course?: any; 
  section?: string;
  yearLevel?: string;
  birthdate?: string;
}

// --- Constants ---
const API = "https://server.spotsync.site";
const PLACEHOLDER_COLOR = "#A9A9A9";
const WORD_LIMIT = 150;
const MAX_IMAGES = 1; 
const CHECKING_TEXT = "Checking image for inappropriate content...";
const CHECKING_SHORT = "Scanning...";
const INAPPROPRIATE_ALERT_TITLE = "Inappropriate Content Detected";
const INAPPROPRIATE_ALERT_MESSAGE = (flaggedCount: number) => 
  `${flaggedCount} image(s) were flagged and not added. Please upload appropriate images.`;

// --- Lists (from original file) ---
const LOCATIONS = [
    "Arts and Culture Building", "Guidance and Testing Center", "College of Medicine",
    "Old Engineering Building", "ICT Building", "Administration Building",
    "Finance and Accounting Building / SHS Building", "Gymnasium Lobby", "Gymnasium",
    "Culinary Building", "NSTP Building", "Cafeteria", "Guardhouse", "LRC",
    "Girl’s Trade Building", "Food Innovation Center", "University Health Center (with OSA)",
    "Old Science Building", "Old Education Building", "Old Student Center", "Science Complex",
    "Engineering Complex (Right Wing)", "Engineering Complex (Left Wing)",
    "Student Center & Education Complex", "Fabrication Laboratory Shop", "Technology Building",
    "Faculty Resource Center", "Campus Residences / Dorm (new)", "Fab Lab Building",
    "Child Minding Center", "BGMS", "Supply and Property Management Section",
    "Waiting Shed (Building 24)", "Movable Classroom 1", "Movable Classroom 2",
    "Movable Classroom 3", "Movable Classroom 4", "Movable Classroom 5",
    "Movable Classroom 6", "Movable Classroom 7", "Movable Classroom 8", "Others",
];
const CATEGORIES = [
    "Electronics", "Accessories", "Clothing & Apparel", "Bags & Luggage",
    "Documents & IDs", "Books & Stationery", "Household Items", "Sports & Fitness",
    "Health & Personal Care", "Toys & Games", "Food & Beverages", "Automotive Items",
    "Musical Instruments", "Pet Items", "Others",
];


// --- Main Screen Component ---
function GuestReportLostPage() {
  const { currentUser } = useAuth();
  const router = useRouter(); 
  const auth = getAuth();

  // Form State
  const [itemName, setItemName] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [locationLost, setLocationLost] = useState('');
  const [category, setCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [howItemLost, setHowItemLost] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]); 

  // User Data State (pre-filled for guest)
  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState(''); 
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState(''); 
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profileURL, setProfileURL] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [owner, setOwner] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isModerating, setIsModerating] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);

  // Fetch Guest Info (mainly for email)
  useEffect(() => {
    const fetchGuestInfo = async () => {
      if (!currentUser?.uid) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as UserData;
          
          setEmail(userData.email || ""); 
          
          const fName = userData.firstName || "Guest";
          const lName = userData.lastName || ""; 
          
          setFirstName(fName);
          setLastName(lName);
          setOwner(`${fName} ${lName}`.trim()); 

          setMiddleName(userData.middleName || "");
          setContactNumber(userData.contactNumber || "");
          setAddress(userData.address || "");
          setProfileURL(userData.profileURL || "");
          setCoverURL(userData.coverURL || "");
          setCourse(userData.course || "");
          setSection(userData.section || "");
          setYearLevel(userData.yearLevel || "");
          setBirthdate(userData.birthdate || "");
          
        } else {
          console.warn("Guest user document not found in Firestore.");
          setOwner("Guest"); 
        }
      } catch (err) {
        console.error("Error fetching guest user info:", err);
        setOwner("Guest");
      }
    };
    fetchGuestInfo();
  }, [currentUser]);

  // --- Image Moderation ---
  const checkImageModeration = async (imageBase64: string): Promise<boolean | null> => {
    try {
      const response = await fetch(`${API}/api/moderate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:image/jpeg;base64,${imageBase64}` })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Moderation check failed (${response.status})`);
      }
      const data = await response.json();
      return data.isSafe;
    } catch (error: any) {
      console.error("Error calling backend for moderation:", error);
      throw error;
    }
  };
  
  const processImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (assets.length > remainingSlots) {
      Alert.alert("Limit Reached", `You can only upload ${MAX_IMAGES} image(s).`);
    }
    const imagesToCheck = assets.slice(0, remainingSlots);
    const safeImagesToAdd: ImagePicker.ImagePickerAsset[] = [];
    let flaggedCount = 0; let fatalErrorOccurred = false;
    setIsModerating(true);
    try {
      for (const asset of imagesToCheck) {
        if (asset.base64) {
          const isSafeResult = await checkImageModeration(asset.base64);
          if (isSafeResult === true) safeImagesToAdd.push(asset);
          else if (isSafeResult === false) flaggedCount++;
          else throw new Error("Image scanning returned an unclear result.");
        } else { Alert.alert("Image Error", "A selected image was missing data and was skipped."); }
      }
    } catch (error: any) {
      fatalErrorOccurred = true;
      Alert.alert("Scanning Failed", `Could not scan image: ${error.message}. No images were added.`);
    } finally {
      setIsModerating(false);
    }
    if (!fatalErrorOccurred) {
      if (flaggedCount > 0) Alert.alert(INAPPROPRIATE_ALERT_TITLE, INAPPROPRIATE_ALERT_MESSAGE(flaggedCount));
      if (safeImagesToAdd.length > 0) setImages(prev => [...prev, ...safeImagesToAdd]);
    }
  };
  const handleImagePickLibrary = async () => {
    setShowImageSourceModal(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission required", "Allow access to photos.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.7, base64: true,
    });
    if (!result.canceled && result.assets) await processImages(result.assets);
  };
  const handleImagePickCamera = async () => {
    setShowImageSourceModal(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission required", "Allow access to camera.");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets) await processImages(result.assets);
  };
  const handleImagePick = () => setShowImageSourceModal(true);
  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  // --- Upload & Notification ---
  const uploadLostItemImage = async (fileAsset: ImagePicker.ImagePickerAsset, folder: string) => {
    const base64Img = `data:image/jpeg;base64,${fileAsset.base64}`;
    const formData = new FormData();
    formData.append('file', base64Img);
    formData.append('upload_preset', 'lost-items');
    formData.append('folder', folder);
    const res = await fetch('https://api.cloudinary.com/v1_1/dunltzf6e/image/upload', {
      method: 'POST', body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Image upload failed.');
    return data.secure_url;
  };

  const notifyUser = async (uid: string, message: string, type = "match") => {
    if (!uid) return;
    const notifRef = ref(realtimeDB, `notifications/${uid}`);
    const newNotifRef = push(notifRef);
    await set(newNotifRef, {
      message,
      timestamp: rtdbServerTimestamp(),
      type,
      read: false,
    });
  };

  // --- Submit Logic ---
  const handleSubmit = async () => {
    if (!itemName || !dateLost || !locationLost || !category || !itemDescription || !howItemLost) {
      return Alert.alert('Error', 'Please fill all required fields.');
    }
    if (images.length === 0) {
      return Alert.alert('Error', 'Please upload at least one image.');
    }
    if (isModerating) {
      return Alert.alert("Wait", "Image scanning is in progress. Please wait.");
    }
    
    setIsSubmitting(true);
    setIsMatching(true); 

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User session ended. Please restart.");
      const uid = user.uid;

      // 1. Upload images
      const imageURLs = [];
      for (const imageAsset of images) {
        const url = await uploadLostItemImage(imageAsset, `lost-items/${uid}`);
        imageURLs.push(url);
      }

      // 2. Generate Item ID
      const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

      // 3. Save to lostItems
      const docRef = await addDoc(collection(db, 'lostItems'), {
        itemId: customItemId,
        uid,
        images: imageURLs,
        itemName,
        dateLost,
        locationLost,
        archivedStatus: false,
        isGuest: true,
        founder: 'Unknown',
        owner: owner,
        claimStatus: 'unclaimed',
        category,
        itemDescription,
        howItemLost,
        personalInfo: {
          firstName, middleName, lastName, email, contactNumber,
          address, profileURL, coverURL, course, section, yearLevel, birthdate,
        },
        createdAt: serverTimestamp(),
      });

      // 4. Trigger Matching & Notifications
      const matchResponse = await fetch(`${API}/api/match/lost-to-found`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uidLost: docRef.id }),
      });

      if (!matchResponse.ok) throw new Error("Matching service failed");
      const matches = await matchResponse.json();
      
      const top4Matches = matches.slice(0, 4);
      for (let i = 0; i < top4Matches.length; i++) {
        const match = top4Matches[i];
        if (match.scores?.overallScore >= 60 && match.foundItem?.uid) {
          await notifyUser(
            match.foundItem?.uid,
            `Your found item <b>${match.foundItem.itemName}</b> may possibly match a new lost item: <b>${itemName}</b>.`
          );
          await fetch(`${API}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: match.foundItem?.personalInfo?.email || "",
              subject: "Possible Match for Your Found Item",
              html: `<p>Hello,</p><p>Your found item <b>${match.foundItem.itemName}</b> may match a newly reported lost item: <b>${itemName}</b>.</p><p>Please log in to check the details.</p>`
            })
          });
        }
        
        if (i === 0 && match.scores?.overallScore >= 60 && email) { 
          const bestMatch = top4Matches[0];
          const notifyMsg = `This is the most possible match for your lost item <b>${itemName}</b>: Found item <b>${bestMatch.foundItem?.itemName} : Transaction ID: ${bestMatch.transactionId}</b>.`;
          await notifyUser(currentUser.uid, notifyMsg);
          await fetch(`${API}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,  
              subject: "Best Match Found for Your Lost Item",
              html: `<p>Hello ${firstName},</p><p>${notifyMsg.replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>')}</p><p>Please return to the app to view more details.</p>`
            })
          });
        }
      }

      // 5. Save to itemManagement
      await addDoc(collection(db, 'itemManagement'), {
        itemId: customItemId,  
        uid,
        images: imageURLs,
        itemName,
        archivedStatus: false,
        dateSubmitted: new Date().toISOString(),
        itemDescription,
        type: "Lost",  
        location: locationLost,
        category,
        status: "Posted",
        createdAt: serverTimestamp(),
      });

      // 6. Navigate to results page using router.replace
      router.replace({
        pathname: "/GuestLostMatchResults", // Adjust path
        params: { matches: JSON.stringify(matches) }
      });

    } catch (error: any) {
      console.error(error);
      Alert.alert('Submission Failed', error.message || 'Could not submit the report.');
    } finally {
      setIsSubmitting(false);
      setIsMatching(false);
    }
  };

  // --- Helper Functions ---
  const limitWords = (newText: string, currentText: string, setFn: (value: string) => void, limit: number) => {
    const words = newText.split(/\s+/).filter(Boolean);
    if (words.length > limit) {
      // Only block typing if they are adding text, not deleting
      if (newText.length > currentText.length) {
        setFn(words.slice(0, limit).join(" "));
      } else {
         setFn(newText); // Allow deleting
      }
    } else {
      setFn(newText);
    }
  };

  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  
  const onDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    // Always close the picker modal/view after an action on both platforms
    setShowDatePicker(false); 

    // Only update the state if the user confirmed a date ("set" event)
    if (event.type === 'set' && selectedDateValue) {
        setSelectedDate(selectedDateValue);
        setDateLost(selectedDateValue.toISOString().split('T')[0]); // Format YYYY-MM-DD
    }
    // If event.type is 'dismissed' (Android cancel) or 'cancel' (iOS), do nothing
  };
  
  // Modal Renderer
  const renderPickerModal = (
    visible: boolean, onClose: () => void, title: string, data: string[],
    onSelect: (value: string) => void, search: string, setSearch: (value: string) => void
  ) => (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput style={styles.modalSearchInput} placeholder={`Search ${title.toLowerCase()}...`} placeholderTextColor={PLACEHOLDER_COLOR} value={search} onChangeText={setSearch} />
          <FlatList
            data={data.filter(item => item.toLowerCase().includes(search.toLowerCase()))}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.modalEmptyText}>No matches found</Text>}
          />
          <TouchableOpacity style={styles.closeButtonWide} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Moderation Loading Modal */}
      <Modal visible={isModerating} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{CHECKING_TEXT}</Text>
        </View>
      </Modal>

      {/* Image Source Modal */}
      <Modal visible={showImageSourceModal} transparent={true} animationType="slide" onRequestClose={() => setShowImageSourceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.imageSourceModalContent}>
            <Text style={styles.imageSourceModalTitle}>Select Image Source</Text>
            <TouchableOpacity style={styles.imageSourceOption} onPress={handleImagePickCamera}>
              <MaterialCommunityIcons name="camera" size={24} color="#007AFF" style={{ marginRight: 10 }} />
              <Text style={styles.imageSourceOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageSourceOption} onPress={handleImagePickLibrary}>
              <MaterialCommunityIcons name="image-multiple" size={24} color="#007AFF" style={{ marginRight: 10 }} />
              <Text style={styles.imageSourceOptionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageSourceModalClose} onPress={() => setShowImageSourceModal(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Form */}
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 100 : 200}
      >
        <View style={styles.formContainer}>
          <Text style={styles.mainTitle}>Report Lost Item</Text>

          {/* SECTION 1: Item Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Item Details</Text>
            <Text style={styles.label}>Item Image (Max 1)</Text>
            <ScrollView horizontal style={styles.imagePreviewContainer} showsHorizontalScrollIndicator={false}>
              {images.map((image, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                    <MaterialCommunityIcons name="close-circle" size={28} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={[styles.addImageButton, isModerating && styles.buttonDisabled]}
                  onPress={handleImagePick}
                  disabled={isModerating}
                >
                  {isModerating ? (
                    <ActivityIndicator color="#007AFF" size="small" />
                  ) : (
                    <MaterialCommunityIcons name="camera-plus-outline" size={30} color="#007AFF" />
                  )}
                  <Text style={styles.addImageText}>{isModerating ? CHECKING_SHORT : 'Add Image'}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <Text style={styles.label}>Item Name (Max 5 words)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g., Black Leather Wallet"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={itemName}
              onChangeText={(text) => limitWords(text, itemName, setItemName, 5)} // Use 5 word limit
              maxLength={50}
            />

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.pickerButtonText, !category && styles.placeholderText]} numberOfLines={1}>{category || "Select Category"}</Text>
            </TouchableOpacity>
          </View>

          {/* SECTION 2: Circumstance Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Location & Time</Text>

            <Text style={styles.label}>Date Lost</Text>
            {/* 🔑 FIX: Simplified Date Picker logic */}
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.pickerButtonText, !dateLost && styles.placeholderText]}>{dateLost || "Select Date"}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
            {/* 🔑 END FIX */}

            <Text style={styles.label}>Location Lost</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowLocationModal(true)}>
              <Text style={[styles.pickerButtonText, !locationLost && styles.placeholderText]} numberOfLines={1}>{locationLost || "Select Location"}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>How was the item lost?</Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="Describe the circumstances (e.g., 'Last saw it on a bench near...') "
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={howItemLost}
              onChangeText={(text) => limitWords(text, howItemLost, setHowItemLost, WORD_LIMIT)}
              multiline
            />
            <Text style={styles.wordCount}>{countWords(howItemLost)}/{WORD_LIMIT} words</Text>
          </View>

          {/* SECTION 3: Item Description */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Detailed Description</Text>
            <Text style={styles.label}>Item Description</Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="Provide specific details (color, brand, unique marks, estimated value...)"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={itemDescription}
              onChangeText={(text) => limitWords(text, itemDescription, setItemDescription, WORD_LIMIT)}
              multiline
            />
            <Text style={styles.wordCount}>{countWords(itemDescription)}/{WORD_LIMIT} words</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (isSubmitting || isMatching || isModerating) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || isMatching || isModerating}
          >
            {isMatching ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}> AI Matching...</Text>
              </>
            ) : isSubmitting ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}> Submitting...</Text>
              </>
            ) : isModerating ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}> {CHECKING_SHORT}</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
          
          {isMatching && (
             <Text style={styles.infoText}>
               AI Matching may take several minutes.
             </Text>
           )}
        </View>
      </KeyboardAwareScrollView>

      {/* Location Modal */}
      {renderPickerModal(
        showLocationModal,
        () => { setLocationSearch(''); setShowLocationModal(false); },
        'Select Location', LOCATIONS,
        (loc) => { setLocationLost(loc); setShowLocationModal(false); },
        locationSearch, setLocationSearch
      )}

      {/* Category Modal */}
      {renderPickerModal(
        showCategoryModal,
        () => { setCategorySearch(''); setShowCategoryModal(false); },
        'Select Category', CATEGORIES,
        (cat) => { setCategory(cat); setShowCategoryModal(false); },
        categorySearch, setCategorySearch
      )}
    </SafeAreaView>
  );
}

// --- 🔑 Corrected Helper Function ---
const limitWords = (newText: string, currentText: string, setFn: (value: string) => void, limit: number) => {
    const words = newText.split(/\s+/).filter(Boolean);
    if (words.length > limit) {
        // Only enforce limit if user is typing *more* characters
        // This allows them to delete/backspace
        if (newText.length > currentText.length) {
            setFn(words.slice(0, limit).join(" "));
        } else {
             setFn(newText); // Allow deleting
        }
    } else {
        setFn(newText);
    }
};

// --- Styles (Borrowed from ReportFoundItemScreen.tsx) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scrollContent: { paddingBottom: 100 },
  formContainer: { padding: 15, paddingBottom: 30 },
  mainTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#143447', 
    marginBottom: 25, 
    textAlign: 'center' 
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#143447', 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  label: { 
    fontSize: 14, 
    color: '#444', 
    marginBottom: 6, 
    fontWeight: '600' 
  },
  inputField: {
    backgroundColor: '#f9f9f9', 
    paddingHorizontal: 15, 
    paddingVertical: 14, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    fontSize: 16, 
    marginBottom: 20,
    color: '#333',
  },
  textArea: { 
    height: 120, 
    textAlignVertical: 'top', 
    marginBottom: 5 
  },
  pickerButton: {
    backgroundColor: '#f9f9f9', 
    padding: 15, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    justifyContent: 'center', 
    marginBottom: 20,
    minHeight: 50, // Ensure consistent height
  },
  pickerButtonText: { 
    fontSize: 16, 
    color: '#333' 
  },
  placeholderText: {
    color: PLACEHOLDER_COLOR,
  },
  wordCount: { 
    textAlign: 'right', 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 15 
  },
  imagePreviewContainer: { 
    marginBottom: 20, 
    height: 130,
    paddingBottom: 10,
  },
  addImageButton: { 
    width: 100, 
    height: 100, 
    borderRadius: 8, 
    backgroundColor: '#eef4ff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#007AFF', 
    borderStyle: 'dashed',
    marginRight: 10,
    padding: 5,
  },
  addImageText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '600'
  },
  imagePreviewWrapper: { 
    position: 'relative', 
    marginRight: 15,
    width: 100,
    height: 100,
  },
  imagePreview: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  removeImageButton: { 
    position: 'absolute', 
    top: -10, 
    right: -10, 
    backgroundColor: 'white', 
    borderRadius: 14,
    zIndex: 10,
  },
  submitButton: { 
    backgroundColor: '#143447',
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 15, 
    flexDirection: 'row', 
    justifyContent: 'center',
    shadowColor: '#143447',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  buttonDisabled: { 
    backgroundColor: '#98A9B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  infoText: { 
    textAlign: 'center', 
    fontSize: 12, 
    color: '#666', 
    marginTop: 8 
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#143447' },
  modalSearchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16, color: '#333' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16, color: '#333' },
  modalEmptyText: { textAlign: 'center', color: '#888', padding: 10 },
  closeButtonWide: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
  imageSourceModalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '80%', alignItems: 'center' },
  imageSourceModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  imageSourceOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%', justifyContent: 'flex-start' },
  imageSourceOptionText: { fontSize: 16, color: '#333' },
  imageSourceModalClose: { marginTop: 15, padding: 10, backgroundColor: '#6c757d', borderRadius: 8, width: '100%', alignItems: 'center' },
});

export default GuestReportLostPage;