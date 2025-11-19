import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavigationBar from '../components/NavigationBar';
import BlankHeader from '../components/BlankHeader';
import './styles/SettingsPage.css';
import FloatingAlert from '../components/FloatingAlert';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import CropperModal from "../components/CropperModal";
import VerificationModal from "../components/VerificationModal";
import createVerificationCode from "../components/createVerificationCode.jsx";
import { updatePassword } from "firebase/auth";




function SettingsPage() {
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
  const [updatingProfileInfo, setUpdatingProfileInfo] = useState(false);


  const [alert, setAlert] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [checkingPassword, setCheckingPassword] = useState(false);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [pendingField, setPendingField] = useState(null); // "profile" or "cover"

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
const [newPassword, setNewPassword] = useState("");
const [confirmNewPassword, setConfirmNewPassword] = useState("");
const [changingPassword, setChangingPassword] = useState(false);

const [showVerificationModal, setShowVerificationModal] = useState(false);
const [pendingPassword, setPendingPassword] = useState(null);

  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();




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
  { abbr: "PhD MathEdSci", name: "Doctor of Philosophy in Mathematics Sciences" },
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
    setAlert({ message: err.message || "Error reauthenticating.", type: "error" });
  }

  setChangingPassword(false);
};

async function sendVerificationEmail(userData, code) {
  await fetch("http://localhost:4000/api/send-email", {
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
            middleName !== (localStorage.getItem('middleName') || '') ||
            email !== (localStorage.getItem('email') || '') ||
            contactNumber !== (localStorage.getItem('contactNumber') || '') ||
            bio !== (localStorage.getItem('bio') || '') ||
            designation !== (localStorage.getItem('designation') || '') ||
            gender !== (localStorage.getItem('gender') || '') ||
            yearsOfService !== (localStorage.getItem('yearsOfService') || '') ||
            educationalAttainment !== (localStorage.getItem('educationalAttainment') || '') ||
            address !== (localStorage.getItem('address') || '') 
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
    setAlert({ message: "Incorrect Password", type: "error" });
  } finally {
    setCheckingPassword(false); 
  }
};


const handleUpdate = async () => {
  if (!currentUser) return;

  setUpdatingProfileInfo(true); 
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

    const updatedData = {
      firstName,
      lastName,
      bio,
      middleName,
      email,
      contactNumber,
      coverURL: updatedCoverURL,
      profileURL: updatedProfileURL,
      designation,
      educationalAttainment,
      gender,
      yearsOfService,
      address,
      section: '1',
      course: {abbr: '1', name: '1'},
    };

    await updateUserInfo(currentUser.uid, updatedData);
    setAlert({ message: "Profile Information Updated!", type: "success" });
  } catch (err) {
    console.error("Error updating profile:", err);
    setAlert({ message: "Failed", type: "error" });
  } finally {
    setUpdatingProfileInfo(false);
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
          localStorage.setItem('educationalAttainment', userData.educationalAttainment || '');
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
      setAlert({ message: "Failed to update password.", type: "error" });
    }
  }}
/>

      <Modal show={showChangePasswordModal} onHide={() => setShowChangePasswordModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Change Password</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form.Group>
      <Form.Label>Current Password</Form.Label>
      <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </Form.Group>
    <Form.Group>
      <Form.Label>New Password</Form.Label>
      <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
    </Form.Group>
    <Form.Group>
      <Form.Label>Confirm New Password</Form.Label>
      <Form.Control type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
    </Form.Group>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowChangePasswordModal(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleChangePassword} disabled={changingPassword}>
      {changingPassword ? <Spinner animation="border" size="sm" /> : "Change Password"}
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
      <NavigationBar />
      <div className='found-item-body'>
        <BlankHeader />

          <div className='upload-section1' style={{display: 'flex', flexDirection: 'column'}}>
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

        <div style={{marginTop: '10px'}}>
          <h4>Cover Photo</h4>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, "cover")}
      />   
        </div>
        </div>
      </div>
        <div className='user-info-form' style={{display: 'flex', flexDirection: 'column', gap: '10px', position: 'absolute', top: '55%', left: '7%'}}>
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
          <select placeholder='Educational Attainment' value={educationalAttainment} style={{width: '100%'}} onChange={(e) => setEducationalAttainment(e.target.value)} >
              <option value="">Select Educational Attainment</option>
              {courseList.map((c, index) => (
                <option key={index} value={c.name}>
                  {c.name} 
                </option>
              ))}
            </select>
          <textarea placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} />
          <div style={{display: 'flex', gap: '10px', }}>
            <select placeholder='Designation' style={{width: '400px'}} value={designation} onChange={(e) => setDesignation(e.target.value)}>
              <option value="">Select Designation</option>
              <option value="Director">Director</option>
              <option value="Secretary">Secretary</option>
              <option value="Treasurer">Treasurer</option>
              <option value="Auditor">Auditor</option>
              <option value="Staff">Staff</option>
              <option value="Admin Staff">Admin Staff</option>
              <option value="Clerk">Clerk</option>
              
            </select>
            <select value={yearsOfService} onChange={(e) => setYearsOfService(e.target.value)}>
              <option value="">Select Years</option>
              {[...Array(41).keys()].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>          
          </div> 
          <input placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />

          <button onClick={handleSaveClick} disabled={updatingProfileInfo}>
            {updatingProfileInfo ? "Updating Profile..." : "Save Changes"}
          </button>


<div className='other-settings' style={{marginTop: '30px'}}>
  <h4>Privacy</h4>
  <p 
    style={{cursor: "pointer", color: "black"}} 
    onClick={() => setShowChangePasswordModal(true)}
  >
    Change Password
  </p>
  <p style={{color: "gray"}}>Two-Factor Authentication (coming soon)</p>

  <h4>Database Management</h4>
  <p style={{color: "gray"}}>Back up and Restore (coming soon)</p>
  <p style={{color: "gray"}}>Data Export (coming soon)</p>

  <h4>Notification</h4>
  <p style={{color: "gray"}}>Allow User Messages (coming soon)</p>
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

export default SettingsPage;