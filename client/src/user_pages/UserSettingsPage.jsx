import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import UserNavigationBar from '../user_components/UserNavigationBar';
import DashboardHeader from '../components/DashboardHeader';
import UserBlankHeader from '../user_components/UserBlankHeader';
import '../pages/styles/SettingsPage.css';
import FloatingAlert from '../components/FloatingAlert';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword  } from "firebase/auth";
import { set } from 'firebase/database';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import '../user_pages/styles/UserSettingsPage.css'
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
  const [designation, setDesignation] = useState('');
  const [gender, setGender] = useState('');
  const [yearsOfService, setYearsOfService] = useState('');
  const [educationalAttainment, setEducationalAttainment] = useState('');
  const [address, setAddress] = useState('');

  const [alert, setAlert] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [course, setCourse] = useState('');
  const [section, setSection] = useState('');

   const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1); // default square for profile

  const [pendingField, setPendingField] = useState(null); // profile or cover

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  // Change Password Modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
const [pendingPassword, setPendingPassword] = useState(null);





   const courseList = [
  // College of Science and Mathematics - CSM (Undergraduate)
  { abbr: "BSAM", name: "Bachelor of Science in Applied Mathematics" },
  { abbr: "BSAP", name: "Bachelor of Science in Applied Physics" },
  { abbr: "BSChem", name: "Bachelor of Science in Chemistry" },
  { abbr: "BSES", name: "Bachelor of Science in Environmental Science " },
  { abbr: "BSFT", name: "Bachelor of Science in Food Technology" },

  // College of Technology - COT (Undergraduate)
  { abbr: "BSAuT", name: "Bachelor of Science in Autotronics" },
  { abbr: "BSAT", name: "Bachelor of Science in Automotive Technology" },
  { abbr: "BSEMT", name: "Bachelor of Science in Electro-Mechanical Technology" },
  { abbr: "BSET", name: "Bachelor of Science in Electronics Technology" },
  { abbr: "BSESM", name: "Bachelor of Science in Energy Systems and Management" },
  { abbr: "BSMET", name: "Bachelor of Science in Manufacturing Engineering Technology" },
  { abbr: "BTOM", name: "Bachelor of Technology, Operation, and Management" },

  // College of Science and Technology Education - CSTE (Undergraduate)
  { abbr: "BS MathEd", name: "Bachelor of Secondary Education Major in Mathematics" },
  { abbr: "BS SciEd", name: "Bachelor of Secondary Education Major in Science" },
  { abbr: "BTLED", name: "Bachelor of Technology and Livelihood Education" },
  { abbr: "BTVTed", name: "Bachelor of Technical-Vocational Teacher Education" },
  
  { abbr: "BTTE", name: "Bachelor of Technician Teacher Education" },

  // Senior High School - SHS
  { abbr: "STEM", name: "Senior High School - Science, Technology, Engineering and Mathematics" },
  

  // College of Engineering and Architecture - CEA (Undergraduate)
  { abbr: "BSArch", name: "Bachelor of Science in Architecture" },
  { abbr: "BSCE", name: "Bachelor of Science in Civil Engineering" },
  { abbr: "BSCPE", name: "Bachelor of Science in Computer Engineering" },
  { abbr: "BSEE", name: "Bachelor of Science in Electrical Engineering" },
  { abbr: "BSECE", name: "Bachelor of Science in Electronic Engineering" },
  { abbr: "BSGE", name: "Bachelor of Science in Geodetic Engineering" },
  { abbr: "BSME", name: "Bachelor of Science in Mechanical Engineering" },

  // College of Information Technology and Computing - CITC (Undergraduate)
  { abbr: "BSDS", name: "Bachelor of Science in Data Science" },
  { abbr: "BSIT", name: "Bachelor of Science in Information Technology" },
  { abbr: "BSTCM", name: "Bachelor of Science in Technology Communication Management" },
  { abbr: "BSCS", name: "Bachelor of Science in Computer Science" },

  // College of Medicine - COM
  { abbr: "COM", name: "College of Medicine (Night Class)" },

  // -------- GRADUATE PROGRAMS --------

  // CSM Graduate
  { abbr: "MSAMS", name: "Master of Science in Applied Mathematics Sciences" },
  { abbr: "MSETS", name: "Master of Science in Environmental Science and Technology" },

  // COT Graduate
  { abbr: "MITO", name: "Master in Industrial Technology and Operations" },

  // CSTE Graduate
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

  // CEA Graduate
  { abbr: "MEng", name: "Master of Engineering Program" },
  { abbr: "MSEE", name: "Master of Science in Electrical Engineering" },
  { abbr: "MSSDPS", name: "Master of Science in Sustainable Development Professional Science" },
  { abbr: "MPSEM", name: "Master in Power System Engineering and Management" },

  // CITC Graduate
  { abbr: "MSTCM", name: "Master of Science in Technology Communication Management" },
  { abbr: "MIT", name: "Master in Information Technology" },

  // Institute of Governance, Innovation and Sustainability
  { abbr: "MPS-DSPE", name: "Master in Public Sector Major in Digital Service Platforms and E-Governance" },
  { abbr: "MPS-SD", name: "Master in Public Sector Innovation Major in Sustainable Development" },
  { abbr: "MPS-PPS", name: "Master in Public Sector Innovation Major in Public Policy Studies" },
];

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

    // Step 1: Reauthenticate with current password
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Step 2: Save new password temporarily
    setPendingPassword(newPassword);

    // Step 3: Send verification email
    const code = await createVerificationCode(user);
    await sendVerificationEmail(user, code);

    // Step 4: Open verification modal
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
        setCropAspect(field === "profile" ? 1 : 16 / 9); // profile = square, cover = wide
        setPendingField(field);
        setCropperOpen(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async (croppedBase64) => {
    // Convert base64 -> File for upload
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
      await updateDoc(userRef, updatedData);s
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
    await handleUpdate(); 
  } catch (err) {
    console.error("Password incorrect:", err);
    setAlert({ message: "Incorrect Password", type: "error" });
  }
  setCheckingPassword(false);
};

  const selectedCourse = courseList.find(
  (c) => c.abbr === course || c.name === course
);

const handleUpdate = async () => {
  if (!currentUser) return;

  try {
    
    let updatedProfileURL = profileURL;
    if (profileImage) {
      updatedProfileURL = await uploadImage(profileImage, `users/${currentUser.uid}`, "profileURL");
      setProfileURL(updatedProfileURL);
    }

    // Upload cover image if a new one is selected
    let updatedCoverURL = coverURL;
    if (coverImage) {
      updatedCoverURL = await uploadImage(coverImage, `users/${currentUser.uid}`, "coverURL");
      setCoverURL(updatedCoverURL);
    }

    // Update user details
    const updatedData = {
      firstName,
      lastName,
      bio,
      middleName,
      email,
      contactNumber,
      coverURL: updatedCoverURL,
      profileURL: updatedProfileURL,
      designation: 'Student',
      educationalAttainment: '1',
      course: selectedCourse ? { abbr: selectedCourse.abbr, name: selectedCourse.name } : null,
      gender,
      yearsOfService: '1',
      address,
      section,
    };

    await updateUserInfo(currentUser.uid, updatedData);
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
          setCourse(userData.course || '');
          setSection(userData.section || '');
          setAddress(userData.address);

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
          localStorage.setItem('educationalAttainment', userData.educationalAttainment || '');
          localStorage.setItem('course', userData.course || '');
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

  return (
    <>
    
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
      <div className='found-item-body'>
        <UserBlankHeader />
        <div className='settings-container' >
          <div className='upload-section1' style={{display: 'flex', flexDirection: 'column'}}>
          {/* Cover Photo */}
            {coverURL ? (
              <div>
                <img 
                  src={coverURL} 
                  alt="Cover" 
                  style={{ height: '100px', width: '550px', borderRadius: '10px', objectFit: 'cover' }} 
                />
              </div>
            ) : (
              <div 
                style={{ 
                  height: '100px', 
                  width: '550px', 
                  borderRadius: '10px', 
                  backgroundColor: 'gray', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  border: '2px solid black'
                }}
              >
                No Picture
              </div>
            )}

            {/* Profile Photo */}
            {profileURL ? (
              <div>
                <img 
                  src={profileURL} 
                  alt="Profile" 
                  style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', marginTop: '-20px'}} 
                />
              </div>
            ) : (
              <div 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '50%', 
                  backgroundColor: 'navy', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '30px', 
                  fontWeight: 'bold', 
                  marginTop: '-20px',
                  border: '2px solid black'
                }}
              >
                {initials}
              </div>
            )}

          <div >
          <h4>Profile Picture</h4>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, "profile")}
      />          
          </div>     
        </div>
        

        <div className='upload-section2'>

        <div style={{marginTop: '20px'}}>
          <h4>Cover Photo</h4>
<input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, "cover")}
      />        

        </div>
        </div>
      </div>
        <div className='user-info-form' style={{display: 'flex', flexDirection: 'column', gap: '10px', position: 'absolute', top: '50%', left: '2%'}}>
          <h4>Profile Information</h4>
          <div style={{display: 'flex', gap: '10px'}}>
            <input placeholder='First Name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input placeholder='Middle Name' value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            <input placeholder='Last Name' value={lastName} onChange={(e) => setLastName(e.target.value)} />

          </div>
          <div style={{display: 'flex', gap: '10px', }}>
            <input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder='Contact Number' value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
            <select 
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
            value={course} 
            style={{ width: '100%' }} 
            onChange={(e) => setCourse(e.target.value)} 
          >
            <option value="">Select Course</option>
            {courseList.map((c, index) => (
              <option key={index} value={c.abbr}>
                {c.name} 
              </option>
            ))}
          </select>

          <textarea placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} />
          <div style={{display: 'flex', gap: '10px', }}>
              <input placeholder='Section' style={{width: '100%'}} value={section} onChange={(e) => setSection(e.target.value)} />    
          </div> 
          <input placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />

          <button onClick={handleSaveClick}>Save Changes</button>

          
            <div className='other-settings'>
              <h4>Privacy</h4>
              <p style={{cursor:"pointer", color:"black"}} onClick={() => setShowChangePasswordModal(true)}>
                  Change Password
                </p>                
                <p>Two-Factor Authentication</p>
              <h4>Database Management</h4>
                <p>Back up and Restore</p>
                <p>Data Export</p>
              <h4>Notification</h4>
                <p>Allow User Messages</p>
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