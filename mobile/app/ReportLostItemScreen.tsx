import React, { useEffect, useState } from 'react';
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
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, realtimeDB } from '../firebase';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const PLACEHOLDER_COLOR = "#A9A9A9";
const CHECKING_TEXT = "Checking your image if it contains inappropriate content...";
const CHECKING_SHORT = "Scanning...";
const INAPPROPRIATE_ALERT_TITLE = "Inappropriate Content Detected";
const INAPPROPRIATE_ALERT_MESSAGE = (flaggedCount: number) => 
  `${flaggedCount} image(s) were flagged for potentially inappropriate content (e.g., nudity, violence, self-harm, hate speech) and were not added. Please upload appropriate images.`;

interface UserData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  profileURL?: string;
  coverURL?: string;
  course?: { abbr: string; name: string };
  section?: string;
  yearLevel?: string;
  birthdate?: string;
  [key: string]: any;
}

// --- Constants ---
const WORD_LIMIT = 150;
const MAX_IMAGES = 1;

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
const YOUR_BACKEND_URL = "https://server.spotsync.site";

function ReportLostItemScreen() {
  const API = YOUR_BACKEND_URL;
  const { currentUser } = useAuth();
  const router = useRouter();
  const auth = getAuth();

  const [itemName, setItemName] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [locationLost, setLocationLost] = useState('');
  // 1. New State for Custom Location
  const [customLocation, setCustomLocation] = useState('');
  
  const [category, setCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [howItemLost, setHowItemLost] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const [userData, setUserData] = useState<UserData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isModerating, setIsModerating] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) { setLoadingUser(false); return; }
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        }
      } catch (err) { console.error("Error fetching user info:", err); }
      finally { setLoadingUser(false); }
    };
    fetchUserInfo();
  }, [currentUser]);

  const checkImageModeration = async (imageBase64: string): Promise<boolean | null> => {
    try {
      const response = await fetch(`${YOUR_BACKEND_URL}/api/moderate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: `data:image/jpeg;base64,${imageBase64}` })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Moderation check failed on backend (${response.status})`);
      }
      const data = await response.json(); 
      return data.isSafe;
    } catch (error: any) {
      console.error("Error calling backend for moderation:", error);
       throw error; 
    }
  };

  const processImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (isModerating) return;
    const currentImageCount = images.length;
    const remainingSlots = MAX_IMAGES - currentImageCount;

    if (assets.length > remainingSlots || remainingSlots <= 0) {
        Alert.alert("Limit Reached", `Only ${MAX_IMAGES} image allowed for this report. Please remove existing images to upload a new one.`);
        return;
    }

    const imagesToCheck = assets.slice(0, remainingSlots);
    const safeImagesToAdd: ImagePicker.ImagePickerAsset[] = [];
    let flaggedCount = 0;
    let fatalErrorOccurred = false; 

    setIsModerating(true); 

    try {
      for (const asset of imagesToCheck) {
        if (asset.base64) {
          const isSafeResult = await checkImageModeration(asset.base64);
          if (isSafeResult === true) {
            safeImagesToAdd.push(asset);
          } else if (isSafeResult === false) {
            flaggedCount++;
          } else {
            throw new Error("Image scanning service returned an unclear result. Aborting image addition.");
          }
        } else {
          console.warn("Asset missing base64 data, skipping moderation and addition:", asset.uri);
          fatalErrorOccurred = true; 
          Alert.alert("Image Error", "The captured image is missing required data and was skipped. Please try again.");
          break;
        }
      }
    } catch (error: any) {
       fatalErrorOccurred = true; 
       console.error("Moderation failed during image picking:", error);
       
       if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
          Alert.alert("Connection Error", "Could not connect to the image scanning service. Please check your internet and try again. No images were added.");
       } else if (error.message.includes("401") || error.message.includes("403")) {
          Alert.alert("Service Error", "The image scanning service failed due to an authentication issue. Please contact support. No images were added.");
       } else {
          Alert.alert("Scanning Failed", `Could not scan image content: ${error.message}. No images were added.`);
       }
    } finally {
      setIsModerating(false); 
    }

    if (!fatalErrorOccurred) {
      if (flaggedCount > 0) {
        Alert.alert(INAPPROPRIATE_ALERT_TITLE, INAPPROPRIATE_ALERT_MESSAGE(flaggedCount));
      }
      if (safeImagesToAdd.length > 0) {
        if (MAX_IMAGES === 1) {
            setImages(safeImagesToAdd);
        } else {
            setImages(prevImages => [...prevImages, ...safeImagesToAdd]);
        }
      }
    }
  };

  const handleImagePickLibrary = async () => {
    setShowImageSourceModal(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Allow access to photos."); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7, 
      base64: true, 
    });
    if (!result.canceled && result.assets) {
      await processImages(result.assets);
    }
  };

  const handleImagePickCamera = async () => {
    setShowImageSourceModal(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Allow access to the camera."); return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7, 
      base64: true, 
    });
    if (!result.canceled && result.assets) {
      await processImages(result.assets);
    }
  };

  const handleImagePick = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit Reached", `Only ${MAX_IMAGES} image is allowed for this report. Please remove the existing image to change it.`);
      return;
    }
    setShowImageSourceModal(true);
  };

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const uploadLostItemImage = async (fileAsset: ImagePicker.ImagePickerAsset, folder: string) => {
    if (!fileAsset.base64) throw new Error('Image asset missing base64 data for upload.'); 
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

  const notifyUser = async (uid: string, message: string, type = "item") => {
    if (!uid) return;
    const notifRef = ref(realtimeDB, `notifications/${uid}`);
    const newNotifRef = push(notifRef);
    await set(newNotifRef, {
      message, timestamp: rtdbServerTimestamp(), type, read: false,
    });
  };

  const handleSubmit = async () => {
    if (!currentUser || !userData) return Alert.alert('Error', 'User data not loaded.');
    
    // 2. Determine final location value
    const finalLocation = locationLost === 'Others' ? customLocation.trim() : locationLost;

    if (!itemName || !dateLost || !finalLocation || !category || !itemDescription || !howItemLost) return Alert.alert('Error', 'Please fill all required fields.');
    if (images.length === 0) return Alert.alert('Error', `Please upload at least one image (Max ${MAX_IMAGES} allowed).`);

    if (isModerating) {
        Alert.alert("Wait", "Image scanning is still in progress. Please wait for the process to complete before submitting the report.");
        return;
    }
    
    setIsSubmitting(true);
    setProgress(0);
    let createdItemManagementData = null;

    try {
      const imageURLs = [];
      if (images.length > 0) {
          for (const imageAsset of images) {
            const url = await uploadLostItemImage(imageAsset, `lost-items/${currentUser.uid}`);
            imageURLs.push(url);
          }
      }

      const customItemId = `ITM-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;

      const lostItemData = {
        itemId: customItemId, uid: currentUser.uid, images: imageURLs,
        itemName, dateLost, 
        locationLost: finalLocation, // 3. Use finalLocation here
        archivedStatus: false, founder: 'Unknown',
        owner: `${userData.firstName || ''} ${userData.lastName || ''}`,
        claimStatus: 'unclaimed', category, itemDescription, howItemLost,
        status: 'posted',
        personalInfo: userData, createdAt: serverTimestamp(),
      };

      const lostItemRef = await addDoc(collection(db, 'lostItems'), lostItemData);

      setIsMatching(true); 

      const interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 90) return 90; 
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 90);
        });
      }, 500);

      const matchResponse = await fetch(`${API}/api/match/lost-to-found`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uidLost: lostItemRef.id }),
      });

      if (!matchResponse.ok) {
           const errorBody = await matchResponse.text();
           console.error("Matching API Error:", matchResponse.status, errorBody);
           Alert.alert("Warning", "Report submitted, but initial AI matching failed. Matching will run again soon.");
      }

      clearInterval(interval); 
      setProgress(100);  
        
      const matches = matchResponse.ok ? await matchResponse.json() : [];
      const top4Matches = matches.slice(0, 4);

      createdItemManagementData = {
        itemId: customItemId, uid: currentUser.uid, images: imageURLs,
        archivedStatus: false, itemName,
        dateSubmitted: new Date().toISOString(),
        itemDescription, type: "Lost",
        locationLost: finalLocation, // 3. Use finalLocation here
        category, status: "Posted",
        highestMatchingRate: top4Matches?.[0]?.scores?.overallScore ?? 0,
        topMatches: top4Matches, personalInfo: userData,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'itemManagement'), createdItemManagementData);

      for (const match of top4Matches) {
        if (match.scores?.overallScore >= 60 && match.foundItem?.uid) {
          await notifyUser(
            match.foundItem.uid,
            `Your found item <b>${match.foundItem.itemName}</b> may possibly match a newly reported lost item: <b>${itemName}</b>.`,
            "item"
          );
          try {
            await fetch(`${API}/api/send-email`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: match.foundItem?.personalInfo?.email,
                subject: "Potential Match for Your Found Item",
                html: `<p>Hello,</p><p>Your found item <b>${match.foundItem.itemName}</b> may match a reported lost item: <b>${itemName}</b>.</p><p>Please log in to check details.</p>`,
              }),
            });
          } catch (emailError) { console.error(`Email send failed to finder ${match.foundItem?.personalInfo?.email}:`, emailError); }
        }
      }

      if (top4Matches.length > 0 && top4Matches[0].scores?.overallScore >= 60) {
          const topMatch = top4Matches[0];
          await notifyUser(
            currentUser.uid,
            `Hello ${userData.firstName}, we found a possible match for your lost item <b>${itemName}</b>: Found item <b>${topMatch.foundItem?.itemName}</b>. Please check your matches.`,
            "item"
          );
          try {
            await fetch(`${API}/api/send-email`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: userData.email,
                subject: "Potential Match Found for Your Lost Item!",
                html: `<p>Hello ${userData.firstName},</p><p>We found a potential match for your lost item <b>${itemName}</b>: Found item <b>${topMatch.foundItem?.itemName}</b>.</p><p>Please log in to view more details and verify.</p>`,
              })
            });
          } catch(emailError) { console.error("Email send failed to owner:", emailError); }
      } else {
          await notifyUser(
            currentUser.uid,
            `Hello <b>${userData.firstName}</b>, your lost item report for <b>${itemName}</b> has been submitted and posted. We'll notify you if a potential match is found.`,
            "item"
          );
      }

      Alert.alert("Success", "Lost item reported successfully!");

      router.push({
        pathname: "/LostMatchResults",
        params: { itemData: JSON.stringify(createdItemManagementData) }
      });

    } catch (error: any) {
      console.error("Submission Error:", error);
       if (error.message.includes('upload failed')) {
           Alert.alert('Image Upload Failed', "Could not upload one or more images. Please try again.");
       } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
            Alert.alert('Network Error', 'Could not submit the report. Please check your connection and try again.');
       }
       else {
            Alert.alert('Submission Failed', error.message || 'Could not submit the report.');
       }
    } finally {
      setIsSubmitting(false);
      setIsMatching(false);
    }
  };

  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const onDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDateValue) {
        setSelectedDate(selectedDateValue);
        const year = selectedDateValue.getFullYear();
        const month = (selectedDateValue.getMonth() + 1).toString().padStart(2, '0');
        const day = selectedDateValue.getDate().toString().padStart(2, '0');
        setDateLost(`${year}-${month}-${day}`);
    }
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
  };

  const renderPickerModal = (
    visible: boolean, onClose: () => void, title: string, data: string[],
    onSelect: (value: string) => void, search: string, setSearch: (value: string) => void
  ): React.ReactNode => {
    const filteredData = data.filter(item => item.toLowerCase().includes(search.toLowerCase()));
    return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
          <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={onClose}
          >
              <TouchableOpacity
                  activeOpacity={1}
                  style={styles.modalContent}
                  onPress={(e) => e.stopPropagation()}
              >
                  <Text style={styles.modalTitle}>{title}</Text>
                  <TextInput style={styles.modalSearchInput} placeholder={`Search ${title.toLowerCase()}...`} placeholderTextColor={PLACEHOLDER_COLOR} value={search} onChangeText={setSearch} />
                  <FlatList
                      data={filteredData}
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
              </TouchableOpacity>
          </TouchableOpacity>
      </Modal>
    );
  };

  if (loadingUser) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
       <Modal visible={isMatching} transparent={true} animationType="fade">
        <View style={styles.matchingOverlay}>
          <View style={styles.matchingContent}>
            <ActivityIndicator size="large" color="#BDDDFC" style={{ marginBottom: 20 }} />
            <Text style={styles.matchingText}>AI Matching...</Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </Modal>
       <Modal visible={isModerating} transparent={true} animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{CHECKING_TEXT}</Text>
        </View>
      </Modal>

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

      <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={200}
          >
        <View style={styles.formContainer}>
          <Text style={styles.mainTitle}>Report Lost Item</Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Item Details</Text>

            <Text style={styles.label}>Item Image</Text>
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
              placeholder="e.g., Blue Jansport Backpack"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={itemName}
              onChangeText={(text) => limitWords(text, setItemName, 5)}
              maxLength={50}
            />

            <Text style={styles.label}>Category</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.pickerButtonText, !category && styles.placeholderText]} numberOfLines={1}>{category || "Select Category"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Location & Time</Text>

            <Text style={styles.label}>Date Lost</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
               <Text style={[styles.pickerButtonText, !dateLost && styles.placeholderText]}>{dateLost || "Select Date"}</Text>
            </TouchableOpacity>
            {showDatePicker && (
               <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />
             )}

            <Text style={styles.label}>Location Lost</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowLocationModal(true)}>
              <Text style={[styles.pickerButtonText, !locationLost && styles.placeholderText]} numberOfLines={1}>{locationLost || "Select Location"}</Text>
            </TouchableOpacity>

            {/* 4. Display input for 'Others' */}
            {locationLost === 'Others' && (
                <View style={{ marginTop: -10, marginBottom: 20 }}>
                    <Text style={styles.label}>Specify Location</Text>
                    <TextInput
                        style={styles.inputField}
                        placeholder="Please type the specific location..."
                        placeholderTextColor={PLACEHOLDER_COLOR}
                        value={customLocation}
                        onChangeText={setCustomLocation}
                        maxLength={100}
                    />
                </View>
            )}

            <Text style={styles.label}>How might the item have been lost?</Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="Describe the circumstances (e.g., 'Left it near...') "
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={howItemLost}
              onChangeText={(text) => limitWords(text, setHowItemLost, WORD_LIMIT)}
              multiline
              maxLength={WORD_LIMIT * 10}
            />
              <Text style={styles.wordCount}>{countWords(howItemLost)}/{WORD_LIMIT} words</Text>
          </View>


          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Detailed Description</Text>
            <Text style={styles.label}>Item Description</Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="Provide specific details (color, brand, contents, unique marks...)"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={itemDescription}
              onChangeText={(text) => limitWords(text, setItemDescription, WORD_LIMIT)}
              multiline
              maxLength={WORD_LIMIT * 10}
            />
              <Text style={styles.wordCount}>{countWords(itemDescription)}/{WORD_LIMIT} words</Text>
          </View>


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
                 AI Matching may take several minutes due to processing.
               </Text>
          )}

        </View>
      </KeyboardAwareScrollView>

      {renderPickerModal(
          showLocationModal,
          () => {setLocationSearch(''); setShowLocationModal(false)},
          'Select Location', LOCATIONS,
          (loc) => {setLocationLost(loc); setShowLocationModal(false)},
          locationSearch, setLocationSearch
      )}

       {renderPickerModal(
          showCategoryModal,
          () => {setCategorySearch(''); setShowCategoryModal(false)},
          'Select Category', CATEGORIES,
          (cat) => {setCategory(cat); setShowCategoryModal(false)},
          categorySearch, setCategorySearch
      )}

    </SafeAreaView>
  );
}

const limitWords = (text: string, setFn: (value: string) => void, limit: number) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= limit) {
        setFn(text);
    } else {
        const currentValueWordCount = text.trim().split(/\s+/).filter(Boolean).length;
        if (currentValueWordCount > limit) {
            setFn(words.slice(0, limit).join(" "));
        }
    }
};


const styles = StyleSheet.create({
    matchingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  matchingContent: {
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#BDDDFC',
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#475C6F',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#BDDDFC',
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
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
  inputField: { // Unified style for standard text inputs
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
  pickerButton: { // Unified style for pickers (Date, Location, Category)
    backgroundColor: '#f9f9f9', 
    padding: 15, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    justifyContent: 'center', 
    marginBottom: 20 
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

// --- Image Picker Styles ---
  imagePreviewContainer: { 
    marginBottom: 20, 
    height: 130, // Increased height
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

// --- Submit/Status Styles ---
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


// --- Modal/Other styles (Mostly unchanged but included for completeness) ---
  loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 50 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#143447' },
  modalSearchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 16 },
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

export default ReportLostItemScreen;