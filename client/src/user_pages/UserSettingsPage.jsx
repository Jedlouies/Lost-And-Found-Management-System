import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import UserNavigationBar from '../user_components/UserNavigationBar';
import DashboardHeader from '../components/DashboardHeader';
import UserBlankHeader from '../user_components/UserBlankHeader';
// NOTE: Commented out external CSS imports
// import '../pages/styles/SettingsPage.css';
import FloatingAlert from '../components/FloatingAlert';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword  } from "firebase/auth";
import { set } from 'firebase/database';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
// import '../user_pages/styles/UserSettingsPage.css' // Main CSS integrated inline below
import CropperModal from "../components/CropperModal";
import VerificationModal from "../components/VerificationModal";
import createVerificationCode from "../components/createVerificationCode.jsx"; 


function UserSettingsPage() {
  //const API = "http://localhost:4000";
  const API = "https://server.spotsync.site";


  const { currentUser } = useAuth();

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
  const [coverURL, setCoverURL] = useState(localStorage.getItem('coverURL') || '');
  const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [contactNumber, setContactNumber] = useState(localStorage.getItem('contactNumber') || '');
  const [bio, setBio] = useState('');
  const [designation, setDesignation] = useState('1');
  const [gender, setGender] = useState('');
  const [yearsOfService, setYearsOfService] = useState('1');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [educationalAttainment, setEducationalAttainment] = useState('1');
  const [address, setAddress] = useState('');
    const [updatingProfileInfo, setUpdatingProfileInfo] = useState(false);


  const [alert, setAlert] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');

   const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);

  const [pendingField, setPendingField] = useState(null); 

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
const [pendingPassword, setPendingPassword] = useState(null);
const [yearLevel, setYearLevel] = useState(localStorage.getItem('yearLevel') || '');


const [selectedCourse, setSelectedCourse] = useState(() => {
    try {
        const courseData = localStorage.getItem('course');
        return courseData ? JSON.parse(courseData) : null;
    } catch (e) {
        console.error("Error parsing course from localStorage:", e);
        return null;
    }
});


   const courseList = [
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

  { abbr: "MSAMS", name: "Master of Science in Applied Mathematics Sciences" },
  { abbr: "MSETS", name: "Master of Science in Environmental Science and Technology" },

  { abbr: "MITO", name: "Master in Industrial Technology and Operations" },

  { abbr: "DTE", name: "Doctor in Technology Education" },
  { abbr: "PhD MathEdSci", name: "Doctor of Philosophy in Mathematics Sciences " },
  { abbr: "PhD MathEd", name: "Doctor of Philosophy in Mathematics Education" },
  { abbr: "PhD SciEd Chem", name: "Doctor of Philosophy in Science Education Major in Chemistry" },
  { abbr: "PhD EPM", name: "Doctor of Philosophy in Educational Planning and Management" },
  { abbr: "MEPM", name: "Master in Education Planning and Management" },
  { abbr: "MATESL", name: "Master of Arts in Teaching English as Second Language" },
  { abbr: "MATSpEd", name: "Master of Arts in Teaching Special Education" },
  { abbr: "MSMathEd", name: "Master of Science in Mathematics Education" },
  { abbr: "MSEd Physics", name: "Master of Science Education Major in Physics" },
  { abbr: "MSTMath", name: "Master of Science in Teaching Mathematics" },
  { abbr: "MPA", name: "Master in Public Administration" },
  { abbr: "MTTE", name: "Master in Technician Teacher Education" },
  { abbr: "MTTEd", name: "Master of Technical and Technology Education" },

  { abbr: "MEng", name: "Master of Engineering Program" },
  { abbr: "MSEE", name: "Master of Science in Electrical Engineering" },
  { abbr: "MSSDPS", name: "Master of Science in Sustainable Development Professional Science" },
  { abbr: "MPSEM", name: "Master in Power System Engineering and Management" },

  { abbr: "MSTCM", name: "Master of Science in Technology Communication Management" },
  { abbr: "MIT", name: "Master in Information Technology" },

  { abbr: "MPS-DSPE", name: "Master in Public Sector Major in Digital Service Platforms and E-Governance" },
  { abbr: "MPS-SD", name: "Master in Public Sector Innovation Major in Sustainable Development" },
  { abbr: "MPS-PPS", name: "Master in Public Sector Innovation Major in Public Policy Studies" },
];

// NEW FUNCTION: Updates personalInfo field across item collections
const updateRelatedItemInfo = async (uid, updatedData) => {
  const collectionsToUpdate = ['foundItems', 'lostItems', 'itemManagement'];

  for (const collectionName of collectionsToUpdate) {
    const q = query(
      collection(db, collectionName),
      where('uid', '==', uid)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      
      querySnapshot.forEach((docSnap) => {
        const newPersonalInfo = {
          address: updatedData.address,
          contactNumber: updatedData.contactNumber,
          email: updatedData.email,
          firstName: updatedData.firstName,
          lastName: updatedData.lastName,
          middleName: updatedData.middleName,
          profileURL: updatedData.profileURL,
         coverURL: updatedData.coverURL,
         course: updatedData.course,         
        };
        
        batch.update(docSnap.ref, { personalInfo: newPersonalInfo });
      });

      await batch.commit();
      console.log(`Successfully updated ${querySnapshot.size} documents in ${collectionName}`);
    }
  }
};

const handleChangePassword = async () => {
  if (!password || !newPassword || !confirmNewPassword) {
    setAlert({ message: "Please fill all fields.", type: "error" });
    return;
  }

  if (newPassword !== confirmNewPassword) {
    setAlert({ message: "Passwords do not match!", type: "error" });
    return;
  }

  setChangingPassword(true);

  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) throw new Error("No user logged in");

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    setPendingPassword(newPassword);

    const code = await createVerificationCode(user);
    await sendVerificationEmail(user, code);

    setShowChangePasswordModal(false);
    setShowVerificationModal(true);

  } catch (err) {
    console.error("Error during password change:", err);
    setAlert({ message: err.message || "Error reauthenticating user.", type: "error" });
  }

  setChangingPassword(false);
};

async function sendVerificationEmail(userData, code) {
  await fetch(`${API}/api/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: userData.email,
      subject: "Verify your Spotsync Account",
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 5px;">${code}</h1>
        <p>This code will expire in 2 minutes.</p>
      `,
    }),
  });
}


const handleFileSelect = (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result);
        setCropAspect(field === "profile" ? 1 : 16 / 9); 
        setPendingField(field);
        setCropperOpen(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async (croppedBase64) => {
    const res = await fetch(croppedBase64);
    const blob = await res.blob();
    const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });

    if (pendingField === "profile") {
      setProfileImage(file);
    } else if (pendingField === "cover") {
      setCoverImage(file);
    }
  };



  const updateUserInfo = async (uid, updatedData) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updatedData);
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  const reauthenticateUser = async (password) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user || !user.email) throw new Error("No user logged in.");

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
};

const handleSaveClick = () => {
  setShowPasswordModal(true);
};


const handleConfirmPassword = async () => {
  setCheckingPassword(true); 
  try {
    await reauthenticateUser(password);
    setShowPasswordModal(false);
    setPassword('');

    const checkProfileInfoChanged = () => {
      if (profileImage || coverImage) return true;

      if (
        firstName !== localStorage.getItem('firstName') ||
        lastName !== localStorage.getItem('lastName') ||
        middleName !== localStorage.getItem('middleName') || 
        email !== localStorage.getItem('email') ||           
        contactNumber !== localStorage.getItem('contactNumber') || 
        bio !== (localStorage.getItem('bio') || '') ||       
        gender !== (localStorage.getItem('gender') || '') ||  
        section !== (localStorage.getItem('section') || '') ||
        yearLevel !== (localStorage.getItem('yearLevel') || '') || 
        address !== (localStorage.getItem('address') || '') || 
        (selectedCourse && selectedCourse.abbr) !== 
        (JSON.parse(localStorage.getItem('course') || 'null')?.abbr || '') 
      ) {
        return true;
      }
      return false;
    };
    
    if (checkProfileInfoChanged()) {
      setUpdatingProfileInfo(true);
      await handleUpdate();
      setUpdatingProfileInfo(false);
    } else {
      setAlert({ message: "No changes detected. Reauthentication successful!", type: "success" });
    }
  } catch (err) {
    console.error("Password incorrect:", err);
    setAlert({ message: err.message || "Incorrect Password", type: "error" });
  } finally {
    setCheckingPassword(false); 
  }
};

const handleUpdate = async () => {
  if (!currentUser) return;

  try {
    
    let updatedProfileURL = profileURL;
    if (profileImage) {
      updatedProfileURL = await uploadImage(profileImage, `users/${currentUser.uid}`, "profileURL");
      setProfileURL(updatedProfileURL);
    }

    let updatedCoverURL = coverURL;
    if (coverImage) {
      updatedCoverURL = await uploadImage(coverImage, `users/${currentUser.uid}`, "coverURL");
      setCoverURL(updatedCoverURL);
    }

    const courseToSave = selectedCourse ? { abbr: selectedCourse.abbr, name: selectedCourse.name } : null;

    const updatedData = {
      firstName,
      lastName,
      bio,
      middleName,
      email,
      contactNumber,
      yearLevel,
      coverURL: updatedCoverURL,
      profileURL: updatedProfileURL,
      designation: 'Student',
      educationalAttainment: '1',
      course: courseToSave,
      gender,
      yearsOfService: '1',
      address,
      section,
    };

    await updateUserInfo(currentUser.uid, updatedData);
    
    await updateRelatedItemInfo(currentUser.uid, updatedData);
    
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    localStorage.setItem('middleName', middleName);
    localStorage.setItem('email', email);
    localStorage.setItem('contactNumber', contactNumber);
    localStorage.setItem('bio', bio);
    localStorage.setItem('gender', gender);
    localStorage.setItem('section', section);
    localStorage.setItem('address', address);
    localStorage.setItem('yearLevel', yearLevel);
    localStorage.setItem('course', JSON.stringify(courseToSave)); // FIX: JSON.stringify
    localStorage.setItem('designation', updatedData.designation);
    localStorage.setItem('educationalAttainment', updatedData.educationalAttainment);
    localStorage.setItem('yearsOfService', updatedData.yearsOfService);


    setAlert({ message: "Profile Information Updated!", type: "success" });

  } catch (err) {
    console.error("Error updating profile:", err);
    setAlert({ message: "Failed", type: "error" });
  }
};
  useEffect(() => {
    const fetchUserImages = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setMiddleName(userData.middleName || '');
          setEmail(userData.email || '');
          setContactNumber(userData.contactNumber || '');
          setBio(userData.bio || '');
          setDesignation(userData.designation || '');
          setGender(userData.gender || '');
          setYearsOfService(userData.yearsOfService || '');
          setEducationalAttainment(userData.educationalAttainment || '');
          setSelectedCourse(
            userData.course && userData.course.abbr ? userData.course : null
          );
          setSection(userData.section || '');
          setAddress(userData.address);
            setYearLevel(userData.yearLevel || '');

          localStorage.setItem('role', userData.role || '');
          localStorage.setItem('designation', userData.designation || '');
          localStorage.setItem('firstName', userData.firstName || '');
          localStorage.setItem('lastName', userData.lastName || '');
          localStorage.setItem('middleName', userData.middleName || '');
          localStorage.setItem('gender', userData.gender || '');
          localStorage.setItem('email', userData.email || '');
          localStorage.setItem('contactNumber', userData.contactNumber || '');
          localStorage.setItem('address', userData.address || '');
          localStorage.setItem('studentId', userData.studentId || '');
          localStorage.setItem('uid', userData.uid || '');
          localStorage.setItem('bio', userData.bio || '');
          localStorage.setItem('section', userData.section || '');
        localStorage.setItem('yearLevel', userData.yearLevel || '');
          localStorage.setItem('educationalAttainment', userData.educationalAttainment || '');
          localStorage.setItem('course', JSON.stringify(userData.course || null));
          localStorage.setItem('yearsOfService', userData.yearsOfService || '');
          if (userData.profileURL) {
            setProfileURL(userData.profileURL);
            localStorage.setItem('profileURL', userData.profileURL);
          }

          if (userData.coverURL) {
            setCoverURL(userData.coverURL);
            localStorage.setItem('coverURL', userData.coverURL);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user images:', err);
      }
    };

    fetchUserImages();
  }, [currentUser]);

  const handleProfileChange = (e) => {
    if (e.target.files[0]) setProfileImage(e.target.files[0]);
  };

  

  const handleCoverChange = (e) => {
    if (e.target.files[0]) setCoverImage(e.target.files[0]);
  };

  const uploadImage = async (file, folder, updateField) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'profiles');
    formData.append('folder', folder);

    const res = await fetch('https://api.cloudinary.com/v1_1/dunltzf6e/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed.');

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { [updateField]: data.secure_url });

    localStorage.setItem(updateField, data.secure_url);
    window.dispatchEvent(new Event('profileImageUpdated'));

    return data.secure_url;
  };

  const handleProfileUpload = async () => {
    if (!profileImage || !currentUser) return alert('Missing profile image or user.');
    setUploadingProfile(true);
    try {
      const url = await uploadImage(profileImage, `users/${currentUser.uid}`, 'profileURL');
      setProfileURL(url);
      setAlert({ message: "Profile Picture Uploaded!", type: "success" });
    } catch (err) {
      console.error(err);
      setAlert({ message: "Upload Failed!", type: "error" });
    }
    setUploadingProfile(false);
  };

  const handleCoverUpload = async () => {
    if (!coverImage || !currentUser) return alert('Missing cover image or user.');
    setUploadingCover(true);
    try {
      const url = await uploadImage(coverImage, `users/${currentUser.uid}`, 'coverURL');
      setCoverURL(url);
      setAlert({ message: "Cover Picture Uploaded!", type: "success" });
    } catch (err) {
      console.error(err);
      setAlert({ message: "Upload Failed!", type: "error" });
    }
    setUploadingCover(false);
  };
    
    const styles = {
        foundItemBody: {
            backgroundColor: '#f4f4f4',
            padding: '20px',
            minHeight: '100vh',
        },
        settingsContainer: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '30px',
            maxWidth: '1200px',
            margin: '20px auto',
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 992 ? '2fr 1fr' : '1fr',
            gap: '40px',
        },
        profileSettingsWrapper: {
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
        },
        mediaUploadSection: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        imageDisplayContainer: {
            position: 'relative',
            marginBottom: '60px', 
        },
        coverDisplay: {
            height: '200px',
            width: '100%',
            borderRadius: '8px',
            objectFit: 'cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#555',
            border: '1px solid #ddd',
        },
        coverPlaceholder: {
            height: '200px',
            width: '100%',
            borderRadius: '8px',
            backgroundColor: '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#555',
            border: '1px solid #ddd',
        },
        profileDisplay: {
            position: 'absolute',
            bottom: '-60px',
            left: '20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            objectFit: 'cover',
            backgroundColor: 'navy',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '40px',
            fontWeight: 'bold',
            border: '4px solid white',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        },
        profilePlaceholder: {
            position: 'absolute',
            bottom: '-60px',
            left: '20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'navy',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '40px',
            fontWeight: 'bold',
            border: '4px solid white',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        },
        imageInputControls: {
            display: 'flex',
            gap: '20px',
            paddingTop: '20px',
            flexDirection: window.innerWidth < 576 ? 'column' : 'row',
        },
        imageInputGroup: {
            flex: 1,
        },
        userInfoForm: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '0px',
        },
        userInfoFormH4: {
            borderBottom: '2px solid #eee',
            paddingBottom: '10px',
            marginBottom: '20px',
            fontSize: '1.2rem',
        },
        formRow: {
            display: 'flex',
            gap: '15px',
            marginBottom: '15px',
            flexDirection: window.innerWidth < 992 ? 'column' : 'row',
        },
        formInput: {
            flex: 1,
            padding: '10px 15px',
            backgroundColor: '#f9f9f9', 
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '1rem',
            marginBottom: window.innerWidth < 992 ? '15px' : '0',
            color: '#333',
        },
        formSelect: {
            width: '100%',
            padding: '10px 15px',
            backgroundColor: '#f9f9f9', 
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '1rem',
            color: '#333',
        },
        formTextarea: {
            width: '100%',
            minHeight: '100px',
            padding: '10px 15px',
            color: '#333',
            backgroundColor: '#f9f9f9', 
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '1rem',
            resize: 'vertical',
            marginBottom: '20px',
        },
        formButton: {
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.1rem',
        },
        otherSettings: {
            // No absolute positioning needed anymore
            borderLeft: window.innerWidth > 992 ? '1px solid #eee' : 'none',
            paddingLeft: window.innerWidth > 992 ? '30px' : '0',
            borderTop: window.innerWidth <= 992 ? '1px solid #eee' : 'none',
            paddingTop: window.innerWidth <= 992 ? '20px' : '0',
        },
        otherSettingsP: {
            padding: '8px 0',
            margin: '0',
            cursor: 'pointer',
            color: '#4a4a4a',
            // Note: Cannot easily replicate :hover effects inline
        }
    };

  return (
    <>
      {updatingProfileInfo && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    flexDirection: 'column',
    color: 'white',
    fontSize: '1.5rem'
  }}>
    <Spinner animation="border" variant="light" style={{ width: '3rem', height: '3rem' }} />
    <span style={{ marginTop: '1rem' }}>Updating Profile...</span>
  </div>
)}
    
      <UserNavigationBar />
<VerificationModal
  show={showVerificationModal}
  onClose={() => setShowVerificationModal(false)}
  user={currentUser}
  sendVerificationEmail={sendVerificationEmail}
  onVerified={async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, pendingPassword);

      setAlert({ message: "Password updated successfully!", type: "success" });
      setPendingPassword(null);
      setShowVerificationModal(false);

      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

    } catch (err) {
      console.error("Error updating password:", err);
      setAlert({
        message: "Failed to update password. Please try again.",
        type: "error",
      });
    }
  }}
/>

<Modal
  show={showChangePasswordModal}
  onHide={() => setShowChangePasswordModal(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Change Password</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Form.Group className="mb-3">
      <Form.Label>Current Password</Form.Label>
      <Form.Control
        type="password"
        placeholder="Enter current password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </Form.Group>

    <Form.Group className="mb-3">
      <Form.Label>New Password</Form.Label>
      <Form.Control
        type="password"
        placeholder="Enter new password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
    </Form.Group>

    <Form.Group>
      <Form.Label>Confirm New Password</Form.Label>
      <Form.Control
        type="password"
        placeholder="Confirm new password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
      />
    </Form.Group>
  </Modal.Body>

  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowChangePasswordModal(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleChangePassword} disabled={changingPassword}>
      {changingPassword ? (
        <>
          <Spinner as="span" animation="border" size="sm" /> Changing...
        </>
      ) : (
        "Change Password"
      )}
    </Button>
  </Modal.Footer>
</Modal>

      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Your Password</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group controlId="passwordInput">
            <Form.Label>Enter Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowPasswordModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmPassword} 
            disabled={checkingPassword}
          >
            {checkingPassword ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                /> Checking...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </Modal.Footer>
      </Modal>



        {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}
      <UserNavigationBar />
<UserBlankHeader />
      <div style={styles.foundItemBody}>
        
        <div style={styles.settingsContainer}>
          
          <div style={styles.profileSettingsWrapper}>
            <div style={styles.mediaUploadSection}>
              <div style={styles.imageDisplayContainer}>
                {coverURL ? (
                  <img 
                    src={coverURL} 
                    alt="Cover" 
                    style={styles.coverDisplay}
                  />
                ) : (
                  <div style={{...styles.coverDisplay, ...styles.coverPlaceholder}}>
                    No Cover Photo
                  </div>
                )}

                {profileURL ? (
                  <img 
                    src={profileURL} 
                    alt="Profile" 
                    style={styles.profileDisplay}
                  />
                ) : (
                  <div style={{...styles.profileDisplay, ...styles.profilePlaceholder}}>
                    {initials}
                  </div>
                )}
              </div>
              
              <div style={styles.imageInputControls}>
                <div style={styles.imageInputGroup}>
                  <h4 style={{...styles.imageInputGroupH4, marginTop: '0'}}>Profile Picture</h4>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "profile")}
                  />          
                </div>     
                
                <div style={styles.imageInputGroup}>
                  <h4 style={{...styles.imageInputGroupH4, marginTop: '0'}}>Cover Photo</h4>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, "cover")}
                  />        
                </div>
              </div>
            </div>
            
            <div style={styles.userInfoForm}>
              <h4 style={styles.userInfoFormH4}>Profile Information</h4>
              
              <div style={styles.formRow}>
                <input style={styles.formInput} placeholder='First Name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <input style={styles.formInput} placeholder='Middle Name' value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                <input style={styles.formInput} placeholder='Last Name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              
              <div style={styles.formRow}>
                <select 
                        style={{...styles.formInput, flex: 1}} 
                        value={yearLevel} 
                        onChange={(e) => setYearLevel(e.target.value)}
                    >
                        <option value="">Select Year Level</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                    </select>
                <input style={styles.formInput} placeholder='Email' type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input style={styles.formInput} placeholder='Contact Number' type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                <select 
                  style={styles.formInput} 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)} 
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <select
                style={styles.formSelect}
                value={selectedCourse ? selectedCourse.abbr : ""}
                onChange={(e) => {
                  const found = courseList.find(c => c.abbr === e.target.value);
                  setSelectedCourse(found || null);
                }}
              >
                <option value="">Select Course</option>
                {courseList.map((c) => (
                  <option key={c.abbr} value={c.abbr}>
                    {c.name}
                  </option>
                ))}
              </select>

              <textarea style={styles.formTextarea} placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} />
              
              <div style={styles.formRow}>
                <input placeholder='Section' style={{...styles.formInput, width: '100%'}} value={section} onChange={(e) => setSection(e.target.value)} />    
              </div> 
              
              <input style={styles.formInput} placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />

              <button style={styles.formButton} onClick={handleSaveClick} disabled={updatingProfileInfo}>
                {updatingProfileInfo ? "Updating Profile..." : "Save Changes"}
              </button>
            </div>
          </div>
          
          <div style={styles.otherSettings}>
            <h4>Privacy</h4>
            <p 
              style={styles.otherSettingsP} 
              onClick={() => setShowChangePasswordModal(true)}
            >
              Change Password
            </p>                
            <p style={styles.otherSettingsP}>Two-Factor Authentication</p>
            <h4>Database Management</h4>
            <p style={styles.otherSettingsP}>Back up and Restore</p>
            <p style={styles.otherSettingsP}>Data Export</p>
            <h4>Notification</h4>
            <p style={styles.otherSettingsP}>Allow User Messages</p>
          </div>
        </div>
      </div>
    <CropperModal
        show={cropperOpen}
        imageSrc={cropImageSrc}
        aspect={cropAspect}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropSave}
      />
    </>
  );
}

export default UserSettingsPage;