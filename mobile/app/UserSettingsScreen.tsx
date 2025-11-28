import React, { useEffect, useState, useCallback } from 'react';
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
  BackHandler, 
} from 'react-native';
import { useAuth } from '../context/AuthContext'; 
import { useRouter, useFocusEffect } from 'expo-router'; 
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'; // Added imports
import { db } from '../firebase'; 
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword, User } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import * as Print from 'expo-print'; // NEW IMPORT
import * as Sharing from 'expo-sharing'; // NEW IMPORT

import VerificationModal from '../components/VerificationModal';
import createVerificationCode from '../utils/createVerificationCode';
import BlankHeader from '../components/BlankHeader';
import BottomNavBar from '../components/BottomNavBar';

const PLACEHOLDER_COLOR = "#A9A9A9";

interface Course {
  abbr: string;
  name: string;
}

function UserSettingsScreen() {
  const { currentUser } = useAuth();
  const API = "https://server.spotsync.site";
  const router = useRouter(); 

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
  
  // --- Profile States ---
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
  const [exporting, setExporting] = useState(false); // NEW STATE for export loading

  // --- 2FA State ---
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // --- Modal States ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  
  // --- Password Logic States ---
  const [password, setPassword] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // --- Verification Logic States ---
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const [verificationPurpose, setVerificationPurpose] = useState<'PASSWORD_CHANGE' | '2FA_TOGGLE' | null>(null);

  const courseList: Course[] = [
    { abbr: "BSAM", name: "Bachelor of Science in Applied Mathematics" },
    { abbr: "BSAP", name: "Bachelor of Science in Applied Physics" },
    // ... (rest of your courses)
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
          setIs2FAEnabled(data.is2FAEnabled || false);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
          setLoading(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  // ... (handleFileSelect, uploadImage, handleUpdate, handleConfirmPassword, sendVerificationEmail, handleChangePassword, handleToggle2FA remain the same)
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
                subject: "Security Verification",
                html: `
                    <h2>Security Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="letter-spacing: 5px;">${code}</h1>
                    <p>This code will expire in 10 minutes.</p>
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

      const code = await createVerificationCode(user.email, user.uid);
      await sendVerificationEmail(user, code);

      setVerificationPurpose('PASSWORD_CHANGE');
      setShowChangePasswordModal(false);
      setShowVerificationModal(true);

    } catch (err: any) {
      Alert.alert("Authentication Error", err.message || "Could not verify your current password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    if (loading) return;
    
    const action = is2FAEnabled ? "Disable" : "Enable";
    
    Alert.alert(
        `${action} Two-Factor Auth?`,
        `You will need to verify your email to ${action.toLowerCase()} 2FA.`,
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Proceed", 
                onPress: async () => {
                    try {
                        const auth = getAuth();
                        const user = auth.currentUser;
                        if (!user || !user.email) return;

                        setLoading(true);
                        const code = await createVerificationCode(user.email, user.uid);
                        await sendVerificationEmail(user, code);
                        
                        setVerificationPurpose('2FA_TOGGLE');
                        setShowVerificationModal(true);
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Error", "Failed to initiate verification.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]
    );
  };

  const handleDataExport = async () => {
    if (!currentUser) return;
    
    setExporting(true);
    try {
        const itemMgmtQ = query(
            collection(db, 'itemManagement'), 
            where('uid', '==', currentUser.uid)
        );
        const itemMgmtSnap = await getDocs(itemMgmtQ);
        const itemMgmtData = itemMgmtSnap.docs.map(doc => doc.data());

        const lostItemsQ = query(
            collection(db, 'lostItems'),
            where('archivedStatus', '==', false),
            where('status', 'in', ['Posted', 'posted']) 
        );
        const lostItemsSnap = await getDocs(lostItemsQ);
        
        const lostItemsData = lostItemsSnap.docs
            .map(doc => doc.data())
            .filter(item => item.claimStatus !== 'claimed');

        const foundItemsQ = query(
            collection(db, 'foundItems'),
            where('archivedStatus', '==', false),
            where('status', 'in', ['Posted', 'posted'])
        );
        const foundItemsSnap = await getDocs(foundItemsQ);
        
        const foundItemsData = foundItemsSnap.docs
            .map(doc => doc.data())
            .filter(item => item.claimStatus !== 'claimed');

        const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
                h1 { color: #007AFF; text-align: center; margin-bottom: 5px; }
                h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 30px; }
                p { font-size: 12px; color: #666; }
                .meta { text-align: center; font-size: 12px; color: #888; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .empty { font-style: italic; color: #999; padding: 10px; }
            </style>
          </head>
          <body>
            <h1>SpotSync Data Export</h1>
            <div class="meta">
                User: ${firstName} ${lastName}<br/>
                Email: ${email}<br/>
                Date: ${new Date().toLocaleDateString()}
            </div>

            <h2>Item Management (My History)</h2>
            ${itemMgmtData.length > 0 ? `
            <table>
                <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
                ${itemMgmtData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${item.type || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.locationLost || item.locationFound || '-'}</td>
                    <td>${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '-'}</td>
                    <td>${item.status || '-'}</td>
                </tr>
                `).join('')}
            </table>` : '<div class="empty">No item management history found.</div>'}

            <h2>Active Lost Items (Public)</h2>
            ${lostItemsData.length > 0 ? `
            <table>
                <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Date Lost</th>
                    <th>Description</th>
                </tr>
                ${lostItemsData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.dateFound || '-'}</td>
                    <td>${item.itemDescription || '-'}</td>
                </tr>
                `).join('')}
            </table>` : '<div class="empty">No active lost items found.</div>'}

            <h2>Active Found Items (Public)</h2>
            ${foundItemsData.length > 0 ? `
            <table>
                <tr>
                    <th>Item ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Date Found</th>
                    <th>Location Found</th>
                    <th>Description</th>
                </tr>
                ${foundItemsData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.dateFound || '-'}</td>
                    <td>${item.locationFound || '-'}</td>
                    <td>${item.itemDescription || '-'}</td>
                </tr>
                `).join('')}
            </table>` : '<div class="empty">No active found items found.</div>'}
          </body>
        </html>
        `;

        // 5. Generate PDF and Share
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
        console.error("Export Error:", error);
        Alert.alert("Export Failed", "Could not generate the data export.");
    } finally {
        setExporting(false);
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
              
              <TouchableOpacity style={styles.settingsRow} onPress={handleToggle2FA}>
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={styles.settingsRowText}>Two-Factor Authentication</Text>
                    <View style={[
                        styles.badge, 
                        { backgroundColor: is2FAEnabled ? '#e6f4ea' : '#f1f3f4' }
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            { color: is2FAEnabled ? '#1e8e3e' : '#5f6368' }
                        ]}>
                            {is2FAEnabled ? "ON" : "OFF"}
                        </Text>
                    </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.subSectionTitle}>Database Management</Text>
              

              {/* --- DATA EXPORT BUTTON --- */}
              <TouchableOpacity 
                style={styles.settingsRow} 
                onPress={handleDataExport}
                disabled={exporting}
              >
                <View style={{flexDirection:'row', alignItems:'center'}}>
                    <Text style={styles.settingsRowText}>Data Export</Text>
                    {exporting && <ActivityIndicator size="small" color="#007AFF" style={{marginLeft: 10}} />}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      )}

       {/* ... (Keep All Modals) ... */}
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
        onClose={() => {
            setShowVerificationModal(false);
            setVerificationPurpose(null);
        }}
        user={currentUser}
        sendVerificationEmail={sendVerificationEmail}
        onVerified={async () => {
            const user = getAuth().currentUser;
            
            if (verificationPurpose === 'PASSWORD_CHANGE' && user && pendingPassword) {
                try {
                    await updatePassword(user, pendingPassword);
                    Alert.alert("Success", "Password updated successfully!");
                    setPendingPassword(null);
                    setPassword(''); setNewPassword(''); setConfirmNewPassword('');
                } catch (error: any) {
                    Alert.alert("Error", "Failed to update password. " + error.message);
                }
            } 
            else if (verificationPurpose === '2FA_TOGGLE' && user) {
                try {
                    const newValue = !is2FAEnabled;
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, { is2FAEnabled: newValue });
                    setIs2FAEnabled(newValue);
                    Alert.alert("Success", `Two-Factor Authentication is now ${newValue ? 'Enabled' : 'Disabled'}.`);
                } catch (error) {
                    console.error(error);
                    Alert.alert("Error", "Failed to update 2FA settings.");
                }
            }
            setShowVerificationModal(false);
        }}
      />

      <BottomNavBar activeScreen="Profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    // ... (Keep existing styles) ...
    container: { flex: 1, backgroundColor: '#f0f2f5', paddingBottom: 100 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    settingsRowText: { fontSize: 16, color: '#333' },
    badge: {
        marginLeft: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default UserSettingsScreen;