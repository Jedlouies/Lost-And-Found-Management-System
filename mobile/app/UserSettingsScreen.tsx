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
} from 'react-native';
import { useAuth } from '../context/AuthContext'; // Adjust path
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword, User } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Import icons

// Custom component imports
import VerificationModal from '../components/VerificationModal';
import createVerificationCode from '../utils/createVerificationCode';
import BlankHeader from '../components/BlankHeader';
import BottomNavBar from '../components/BottomNavBar';

// Define placeholder color
const PLACEHOLDER_COLOR = "#A9A9A9";

// --- Type Definitions ---
interface Course {
  abbr: string;
  name: string;
}

// --- Main Screen Component ---
function UserSettingsScreen() {
  const { currentUser } = useAuth();
  const API = "https://server.spotsync.site";

  const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [coverImage, setCoverImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [profileURL, setProfileURL] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [password, setPassword] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Verification States
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);

  const courseList: Course[] = [
    { abbr: "BSAM", name: "Bachelor of Science in Applied Mathematics" },
    { abbr: "BSAP", name: "Bachelor of Science in Applied Physics" },
    { abbr: "BSChem", name: "Bachelor of Science in Chemistry" },
    { abbr: "BSES", name: "Bachelor of Science in Environmental Science " },
    { abbr: "BSFT", name: "Bachelor of Science in Food Technology" },
    { abbr: "BSAuT", name: "Bachelor of Science in Autotronics" },
    { abbr: "BSAT", name: "Bachelor of Science in Automotive Technology" },
    { abbr: "BSEMT", name: "Bachelor of Science in Electro-Mechanical Technology" },
    { abbr: "BSET", name: "Bachelor of Science in Electronics Technology" },
    { abbr: "BSESM", name: "Bachelor of Science in Energy Systems and Management" },
    { abbr: "BSMET", name: "Bachelor of Science in Manufacturing Engineering Technology" },
    { abbr: "BTOM", name: "Bachelor of Technology, Operation, and Management" },
    { abbr: "BS MathEd", name: "Bachelor of Secondary Education Major in Mathematics" },
    { abbr: "BS SciEd", name: "Bachelor of Secondary Education Major in Science" },
    { abbr: "BTLED", name: "Bachelor of Technology and Livelihood Education" },
    { abbr: "BTVTed", name: "Bachelor of Technical-Vocational Teacher Education" },
    { abbr: "BTTE", name: "Bachelor of Technician Teacher Education" },
    { abbr: "STEM", name: "Senior High School - Science, Technology, Engineering and Mathematics" },
    { abbr: "BSArch", name: "Bachelor of Science in Architecture" },
    { abbr: "BSCE", name: "Bachelor of Science in Civil Engineering" },
    { abbr: "BSCPE", name: "Bachelor of Science in Computer Engineering" },
    { abbr: "BSEE", name: "Bachelor of Science in Electrical Engineering" },
    { abbr: "BSECE", name: "Bachelor of Science in Electronic Engineering" },
    { abbr: "BSGE", name: "Bachelor of Science in Geodetic Engineering" },
    { abbr: "BSME", name: "Bachelor of Science in Mechanical Engineering" },
    { abbr: "BSDS", name: "Bachelor of Science in Data Science" },
    { abbr: "BSIT", name: "Bachelor of Science in Information Technology" },
    { abbr: "BSTCM", name: "Bachelor of Science in Technology Communication Management" },
    { abbr: "BSCS", name: "Bachelor of Science in Computer Science" },
    { abbr: "COM", name: "College of Medicine (Night Class)" },
  ];

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setMiddleName(data.middleName || '');
          setEmail(data.email || '');
          setContactNumber(data.contactNumber || '');
          setBio(data.bio || '');
          setGender(data.gender || '');
          setCourse(data.course || null);
          setSection(data.section || '');
          setAddress(data.address || '');
          setProfileURL(data.profileURL || '');
          setCoverURL(data.coverURL || '');
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
          setLoading(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleFileSelect = async (field: 'profile' | 'cover') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to allow access to your photos to upload an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'profile' ? [1, 1] : [16, 9],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const croppedImage = result.assets[0];
      if (field === 'profile') {
        setProfileImage(croppedImage);
        setProfileURL(croppedImage.uri);
      } else {
        setCoverImage(croppedImage);
        setCoverURL(croppedImage.uri);
      }
    }
  };

  const uploadImage = async (fileAsset: ImagePicker.ImagePickerAsset, folder: string) => {
    const base64Img = `data:image/jpeg;base64,${fileAsset.base64}`;
    const formData = new FormData();
    formData.append('file', base64Img);
    formData.append('upload_preset', 'profiles');
    formData.append('folder', folder);
    const res = await fetch('https://api.cloudinary.com/v1_1/dunltzf6e/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed.');
    return data.secure_url;
  };

  const handleUpdate = async () => {
    if (!currentUser) return;
    try {
      let updatedProfileURL = profileURL;
      if (profileImage) {
        updatedProfileURL = await uploadImage(profileImage, `users/${currentUser.uid}`);
      }
      let updatedCoverURL = coverURL;
      if (coverImage) {
        updatedCoverURL = await uploadImage(coverImage, `users/${currentUser.uid}`);
      }
      const updatedData = {
        firstName, lastName, middleName, email, contactNumber,
        bio, gender, course, section, address,
        profileURL: updatedProfileURL,
        coverURL: updatedCoverURL,
      };
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updatedData);
      Alert.alert("Success", "Profile Information Updated!");
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setCheckingPassword(false);
      setShowPasswordModal(false);
      setPassword('');
    }
  };

  const handleConfirmPassword = async () => {
      setCheckingPassword(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) {
          setCheckingPassword(false);
          return;
      };
      try {
          const credential = EmailAuthProvider.credential(user.email, password);
          await reauthenticateWithCredential(user, credential);
          await handleUpdate();
      } catch (error) {
          Alert.alert("Authentication Failed", "The password you entered is incorrect.");
          setCheckingPassword(false);
      }
  };

  const sendVerificationEmail = async (user: User, code: string) => {
    try {
        await fetch(`${API}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: user.email,
                subject: "Verify your Account",
                html: `
                    <h2>Email Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="letter-spacing: 5px;">${code}</h1>
                    <p>This code will expire in 2 minutes.</p>
                `,
            }),
        });
    } catch (error) {
        console.error("Failed to send verification email:", error);
        Alert.alert("Error", "Could not send verification email.");
    }
  };

  const handleChangePassword = async () => {
    if (!password || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "Please fill all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New passwords do not match!");
      return;
    }
    setChangingPassword(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("No user logged in");

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setPendingPassword(newPassword);

      const email = user.email;
      if (!email) {
        Alert.alert("Error", "No email found for this account.");
        setChangingPassword(false);
        return;
      }

      const code = await createVerificationCode(user.uid, email);
      await sendVerificationEmail(user, code);

      setShowChangePasswordModal(false);
      setShowVerificationModal(true);

    } catch (err: any) {
      Alert.alert("Authentication Error", err.message || "Could not verify your current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlankHeader userData={userData} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView>
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={() => handleFileSelect('cover')}>
              {coverURL ? (
                <Image source={{ uri: coverURL }} style={styles.coverImage} />
              ) : (
                <View style={[styles.coverImage, styles.imagePlaceholder]}><Text style={styles.placeholderText}>Cover Photo</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileImageContainer} onPress={() => handleFileSelect('profile')}>
              {profileURL ? (
                <Image source={{ uri: profileURL }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.initialsContainer]}>
                  <Text style={styles.initialsText}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput style={styles.input} placeholder="Enter your first name" placeholderTextColor={PLACEHOLDER_COLOR} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput style={styles.input} placeholder="Enter your middle name" placeholderTextColor={PLACEHOLDER_COLOR} value={middleName} onChangeText={setMiddleName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} placeholder="Enter your last name" placeholderTextColor={PLACEHOLDER_COLOR} value={lastName} onChangeText={setLastName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="your.email@example.com" placeholderTextColor={PLACEHOLDER_COLOR} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput style={styles.input} placeholder="e.g., 09123456789" placeholderTextColor={PLACEHOLDER_COLOR} value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowGenderModal(true)}>
                <Text style={styles.pickerButtonText}>{gender || "Select Gender"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Course</Text>
              <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCourseModal(true)}>
                <Text style={styles.pickerButtonText} numberOfLines={1}>{course?.name || "Select Course"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Section</Text>
              <TextInput style={styles.input} placeholder="Enter your section" placeholderTextColor={PLACEHOLDER_COLOR} value={section} onChangeText={setSection} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput style={styles.input} placeholder="Enter your address" placeholderTextColor={PLACEHOLDER_COLOR} value={address} onChangeText={setAddress} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Tell us about yourself" placeholderTextColor={PLACEHOLDER_COLOR} value={bio} onChangeText={setBio} multiline />
            </View>

            <TouchableOpacity style={styles.saveButtonWide} onPress={() => setShowPasswordModal(true)}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <View style={styles.generalSettingsContainer}>
              <Text style={styles.sectionTitle}>General Settings</Text>
              <Text style={styles.subSectionTitle}>Privacy</Text>
              <TouchableOpacity style={styles.settingsButton} onPress={() => setShowChangePasswordModal(true)}>
                  <Text style={styles.settingsButtonText}>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert("TBD", "Two-Factor Authentication is not yet implemented.")}>
                <Text style={styles.settingsRowText}>Two-Factor Authentication</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.subSectionTitle}>Notification</Text>
              <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert("TBD", "This feature is not yet implemented.")}>
                <Text style={styles.settingsRowText}>Allow User Messages</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.subSectionTitle}>Database Management</Text>
              <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert("TBD", "This feature is not yet implemented.")}>
                <Text style={styles.settingsRowText}>Back up and Restore</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert("TBD", "This feature is not yet implemented.")}>
                <Text style={styles.settingsRowText}>Data Export</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      <Modal visible={showGenderModal} transparent={true} animationType="slide">
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPressOut={() => setShowGenderModal(false)}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Gender</Text>
                {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity key={g} style={styles.modalItem} onPress={() => {setGender(g); setShowGenderModal(false)}}>
                        <Text>{g}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCourseModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Course</Text>
                  <FlatList
                      data={courseList}
                      keyExtractor={(item) => item.abbr}
                      renderItem={({item}) => (
                          <TouchableOpacity style={styles.modalItem} onPress={() => {setCourse(item); setShowCourseModal(false)}}>
                              <Text>{item.name}</Text>
                          </TouchableOpacity>
                      )}
                  />
                   <TouchableOpacity style={styles.closeButtonWide} onPress={() => setShowCourseModal(false)}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Confirm Your Password</Text>
                <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor={PLACEHOLDER_COLOR} secureTextEntry value={password} onChangeText={setPassword}/>
                <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setShowPasswordModal(false)}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleConfirmPassword} disabled={checkingPassword}>
                        {checkingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Confirm</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <Modal visible={showChangePasswordModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TextInput style={styles.input} placeholder="Current Password" placeholderTextColor={PLACEHOLDER_COLOR} secureTextEntry onChangeText={setPassword} />
                <TextInput style={styles.input} placeholder="New Password" placeholderTextColor={PLACEHOLDER_COLOR} secureTextEntry onChangeText={setNewPassword} />
                <TextInput style={styles.input} placeholder="Confirm New Password" placeholderTextColor={PLACEHOLDER_COLOR} secureTextEntry onChangeText={setConfirmNewPassword} />
                <View style={styles.modalButtonRow}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setShowChangePasswordModal(false)}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword} disabled={changingPassword}>
                        {changingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Next</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <VerificationModal
        show={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        user={currentUser}
        sendVerificationEmail={sendVerificationEmail}
        onVerified={async () => {
            try {
                const user = getAuth().currentUser;
                if (user && pendingPassword) {
                    await updatePassword(user, pendingPassword);
                    Alert.alert("Success", "Password updated successfully!");
                    setShowVerificationModal(false);
                    setPendingPassword(null);
                    setPassword(''); setNewPassword(''); setConfirmNewPassword('');
                }
            } catch (error: any) {
                Alert.alert("Error", "Failed to update password. Please try again.");
            }
        }}
      />

      <BottomNavBar activeScreen="Profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5', paddingBottom: 100 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageSection: { marginBottom: 60, },
    coverImage: { width: '100%', height: 150, backgroundColor: '#ccc' },
    profileImageContainer: { position: 'absolute', top: 100, alignSelf: 'center', borderWidth: 3, borderColor: '#fff', borderRadius: 50, elevation: 5 },
    profileImage: { width: 100, height: 100, borderRadius: 50 },
    initialsContainer: { backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
    initialsText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
    placeholderText: { color: '#666' },
    formContainer: { paddingHorizontal: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, marginTop: 10, color: '#333' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#555', marginBottom: 5, fontWeight: '500' },
    input: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    pickerButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' },
    pickerButtonText: { fontSize: 16, color: '#333' },
    saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', flex: 1, marginLeft: 5},
    saveButtonWide: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    closeButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 5 },
    closeButtonWide: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    closeButtonText: { color: '#fff', fontWeight: 'bold' },
    modalButtonRow: { flexDirection: 'row', marginTop: 20 },
    generalSettingsContainer: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 10 },
    subSectionTitle: { fontSize: 16, fontWeight: '600', color: '#444', marginTop: 20, marginBottom: 10 },
    settingsButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', marginBottom: 10 },
    settingsButtonText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
    settingsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    settingsRowText: {
        fontSize: 16,
        color: '#333',
    },
});

export default UserSettingsScreen;