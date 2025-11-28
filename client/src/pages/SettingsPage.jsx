import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
// Ensure 'collection' and 'getDocs' are imported
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import NavigationBar from '../components/NavigationBar';
import BlankHeader from '../components/BlankHeader';
import FloatingAlert from '../components/FloatingAlert';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import CropperModal from "../components/CropperModal";
import VerificationModal from "../components/VerificationModal";
import createVerificationCode from "../components/createVerificationCode.jsx";

function SettingsPage() {
  const { currentUser } = useAuth();
  const API = "https://server.spotsync.site";

  // ... (Keep all your existing state variables: profileImage, names, password states, etc.) ...
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
  const [pendingField, setPendingField] = useState(null);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingPassword, setPendingPassword] = useState(null);

  // --- 2FA & EXPORT STATES ---
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [verificationPurpose, setVerificationPurpose] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [educationSearch, setEducationSearch] = useState('');
  const [showEducationDropdown, setShowEducationDropdown] = useState(false);

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



  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString(); // Firestore Timestamp
    return new Date(timestamp).toLocaleDateString(); // JS Date or String
  };

  const handleDataExport = async () => {
    if (!currentUser) return;

    setExporting(true);

    // 1. OPEN WINDOW IMMEDIATELY (Before fetching data)
    // This connects the popup directly to the user's click, bypassing the blocker.
    const printWindow = window.open('', '_blank');

    // 2. Add a temporary loading state to the new window
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Generating Report...</title></head>
          <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="text-align: center;">
              <h2>Generating Full System Export...</h2>
              <p>Please wait while we fetch records from the database.</p>
              <div class="loader"></div>
            </div>
          </body>
        </html>
      `);
    } else {
      setExporting(false);
      setAlert({ message: "Pop-up blocked. Please allow pop-ups for this site.", type: "error" });
      return;
    }

    try {
      // 3. Fetch ALL Data (Now safe to take as long as needed)
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => doc.data());

      const itemMgmtSnap = await getDocs(collection(db, 'itemManagement'));
      const itemMgmtData = itemMgmtSnap.docs.map(doc => doc.data());

      const lostItemsSnap = await getDocs(collection(db, 'lostItems'));
      const lostItemsData = lostItemsSnap.docs.map(doc => doc.data());

      const foundItemsSnap = await getDocs(collection(db, 'foundItems'));
      const foundItemsData = foundItemsSnap.docs.map(doc => doc.data());

      const claimedItemsSnap = await getDocs(collection(db, 'claimedItems'));
      const claimedItemsData = claimedItemsSnap.docs.map(doc => doc.data());


      // 4. Generate HTML Report
      const html = `
        <html>
          <head>
            <title>SpotSync Full Database Export</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; font-size: 10px; }
                h1 { color: #007AFF; text-align: center; margin-bottom: 5px; }
                h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; margin-top: 25px; page-break-after: avoid; }
                p { font-size: 10px; color: #666; }
                .meta { text-align: center; font-size: 10px; color: #888; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 20px; page-break-inside: auto; }
                th, td { border: 1px solid #ccc; padding: 5px; text-align: left; vertical-align: top; word-wrap: break-word; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .empty { font-style: italic; color: #999; padding: 10px; }
                @media print {
                    @page { margin: 0.5cm; size: landscape; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
          </head>
          <body>
            <h1>SpotSync Full System Export</h1>
            <div class="meta">
                Generated By: ${firstName} ${lastName} (${email})<br/>
                Date: ${new Date().toLocaleString()}
            </div>

            <h2>All Users (${usersData.length})</h2>
            ${usersData.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>UID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Course/Dept</th>
                        <th>Date Created</th>
                    </tr>
                </thead>
                <tbody>
                ${usersData.map(u => `
                <tr>
                    <td>${u.uid || '-'}</td>
                    <td>${u.firstName} ${u.lastName}</td>
                    <td>${u.email}</td>
                    <td>${u.role || 'User'}</td>
                    <td>${u.course?.abbr || u.designation || '-'}</td>
                    <td>${formatDate(u.createdAt)}</td>
                </tr>
                `).join('')}
                </tbody>
            </table>` : '<div class="empty">No users found.</div>'}

            <h2>Lost Items (${lostItemsData.length})</h2>
            ${lostItemsData.length > 0 ? `
            <table>
                 <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Date Lost</th>
                        <th>Status</th>
                        <th>Reported By</th>
                    </tr>
                 </thead>
                 <tbody>
                ${lostItemsData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.locationLost || '-'}</td>
                    <td>${formatDate(item.dateLost)}</td>
                    <td>${item.status || '-'}</td>
                    <td>${item.personalInfo?.firstName || ''} ${item.personalInfo?.lastName || ''}</td>
                </tr>
                `).join('')}
                </tbody>
            </table>` : '<div class="empty">No lost items found.</div>'}

            <h2>Found Items (${foundItemsData.length})</h2>
            ${foundItemsData.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Date Found</th>
                        <th>Status</th>
                        <th>Found By</th>
                    </tr>
                </thead>
                <tbody>
                ${foundItemsData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.locationFound || '-'}</td>
                    <td>${formatDate(item.dateFound)}</td>
                    <td>${item.status || '-'}</td>
                    <td>${item.personalInfo?.firstName || ''} ${item.personalInfo?.lastName || ''}</td>
                </tr>
                `).join('')}
                </tbody>
            </table>` : '<div class="empty">No found items found.</div>'}


            <h2>Claimed Items Log (${claimedItemsData.length})</h2>
            ${claimedItemsData.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Name</th>
                        <th>Date Claimed</th>
                        <th>Claimed By</th>
                        <th>Handled By</th>
                    </tr>
                </thead>
                <tbody>
                ${claimedItemsData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${formatDate(item.dateClaimed || item.createdAt)}</td>
                    <td>${item.owner?.firstName || 'Unknown'} ${item.owner?.lastName || ''}</td>
                    <td>${item.founder || '-'}</td>
                </tr>
                `).join('')}
                </tbody>
            </table>` : '<div class="empty">No claimed items log found in "claimedItems" collection.</div>'}

            <h2>Item Management Logs (${itemMgmtData.length})</h2>
            ${itemMgmtData.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Log ID</th>
                        <th>Item Name</th>
                        <th>Action</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                ${itemMgmtData.map(item => `
                <tr>
                    <td>${item.itemId || '-'}</td>
                    <td>${item.itemName || '-'}</td>
                    <td>${item.action || item.type || '-'}</td>
                    <td>${formatDate(item.createdAt)}</td>
                    <td>${item.status || '-'}</td>
                </tr>
                `).join('')}
                </tbody>
            </table>` : '<div class="empty">No management logs found.</div>'}
            
            <script>
                // Automatically print when content is fully loaded
                window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;

      // 5. INJECT HTML INTO THE OPEN WINDOW
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
      }

    } catch (error) {
      console.error("Export Error:", error);
      setAlert({ message: "Could not generate the data export.", type: "error" });
      if (printWindow) printWindow.close(); // Close the blank window on error
    } finally {
      setExporting(false);
    }
  };
  // --- 2FA TOGGLE FUNCTION ---
  const handleToggle2FA = async () => {
    // ... (Your existing 2FA Logic remains the same)
    const action = is2FAEnabled ? "Disable" : "Enable";
    const confirm = window.confirm(`Do you want to ${action} Two-Factor Authentication? You will need to verify your email.`);
    if (!confirm) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const code = await createVerificationCode(user);
      await sendVerificationEmail(user, code);

      setVerificationPurpose('2FA_TOGGLE');
      setShowVerificationModal(true);
    } catch (error) {
      console.error(error);
      setAlert({ message: "Failed to initiate verification.", type: "error" });
    }
  };

  // ... (Rest of your component logic: handleChangePassword, sendVerificationEmail, useEffect, renders, etc. remain the same) ...

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

  // --- SYNC SEARCH BOX WITH SAVED DATA ---
  useEffect(() => {
    if (educationalAttainment) {
      setEducationSearch(educationalAttainment);
    }
  }, [educationalAttainment]);

  // --- FILTER LOGIC ---
  const filteredCourses = courseList.filter((c) => {
    const searchTerm = educationSearch.toLowerCase();
    return (
      c.abbr.toLowerCase().includes(searchTerm) ||
      c.name.toLowerCase().includes(searchTerm)
    );
  });

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

    if (educationSearch && !educationalAttainment) {
      const exactMatch = courseList.find(c => c.name === educationSearch);
      if (!exactMatch) {
        setAlert({ message: "Please select a valid Educational Attainment from the list.", type: "error" });
        return;
      }
    }

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
        course: { abbr: '1', name: '1' },
      };

      await updateUserInfo(currentUser.uid, updatedData);

      localStorage.setItem('educationalAttainment', educationalAttainment);

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

          // FETCH 2FA STATUS
          setIs2FAEnabled(userData.is2FAEnabled || false);

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

  // ... (Styles and Renders remain essentially the same, just keeping them concise for this answer) ...
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
    imageInputGroupH4: {
      marginBottom: '10px',
      fontSize: '1rem',
      color: '#333',
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
      backgroundColor: '#f9f9f9',
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      fontSize: '1rem',
      resize: 'vertical',
      marginBottom: '20px',
      color: '#333',
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
      borderLeft: window.innerWidth > 992 ? '1px solid #eee' : 'none',
      paddingLeft: window.innerWidth > 992 ? '30px' : '0',
      borderTop: window.innerWidth <= 992 ? '1px solid #eee' : 'none',
      paddingTop: window.innerWidth <= 992 ? '20px' : '0',
      marginTop: '0px',
    },
    otherSettingsP: {
      padding: '8px 0',
      margin: '0',
      cursor: 'pointer',
      color: '#4a4a4a',
    },
    otherSettingsPDisabled: {
      padding: '8px 0',
      margin: '0',
      color: 'gray',
    },
    dropdownWrapper: {
      position: 'relative',
      flex: 1,
      marginBottom: window.innerWidth < 992 ? '15px' : '0',
    },
    dropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '0 0 6px 6px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginTop: '-5px',
    },
    dropdownItem: {
      padding: '10px 15px',
      cursor: 'pointer',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '0.9rem',
      color: '#333',
    },
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
        onClose={() => {
          setShowVerificationModal(false);
          setVerificationPurpose(null);
        }}
        user={currentUser}
        sendVerificationEmail={sendVerificationEmail}
        onVerified={async () => {
          try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (verificationPurpose === 'PASSWORD_CHANGE' || !verificationPurpose) {
              const credential = EmailAuthProvider.credential(user.email, password);
              await reauthenticateWithCredential(user, credential);
              await updatePassword(user, pendingPassword);
              setAlert({ message: "Password updated successfully!", type: "success" });
              setPendingPassword(null);
              setPassword("");
              setNewPassword("");
              setConfirmNewPassword("");
            }
            else if (verificationPurpose === '2FA_TOGGLE') {
              const newValue = !is2FAEnabled;
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, { is2FAEnabled: newValue });
              setIs2FAEnabled(newValue);
              setAlert({
                message: `Two-Factor Authentication ${newValue ? 'Enabled' : 'Disabled'}`,
                type: "success"
              });
            }

            setShowVerificationModal(false);
          } catch (err) {
            console.error(err);
            setAlert({ message: "Verification failed.", type: "error" });
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

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!checkingPassword) {
                    handleConfirmPassword();
                  }
                }
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirmPassword} disabled={checkingPassword}>
            {checkingPassword ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Confirm"}
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
      <BlankHeader />

      <div style={styles.foundItemBody}>
        <div style={styles.settingsContainer}>
          <div style={styles.profileSettingsWrapper}>
            <div style={styles.mediaUploadSection}>
              <div style={styles.imageDisplayContainer}>
                {coverURL ? (
                  <img src={coverURL} alt="Cover" style={styles.coverDisplay} />
                ) : (
                  <div style={{ ...styles.coverDisplay, ...styles.coverPlaceholder }}>No Cover Photo</div>
                )}
                {profileURL ? (
                  <img src={profileURL} alt="Profile" style={styles.profileDisplay} />
                ) : (
                  <div style={{ ...styles.profileDisplay, ...styles.profilePlaceholder }}>{initials}</div>
                )}
              </div>

              <div style={styles.imageInputControls}>
                <div style={styles.imageInputGroup}>
                  <h4 style={styles.imageInputGroupH4}>Profile Picture</h4>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "profile")} />
                </div>
                <div style={styles.imageInputGroup}>
                  <h4 style={styles.imageInputGroupH4}>Cover Photo</h4>
                  <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, "cover")} />
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
                <input style={styles.formInput} placeholder='Email' type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input style={styles.formInput} placeholder='Contact Number' type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                <select style={styles.formInput} value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.dropdownWrapper}>
                <input
                  style={{ ...styles.formInput, width: '100%', color: '#333' }}
                  placeholder="Search Educational Attainment (e.g., BSIT)"
                  value={educationSearch}
                  onChange={(e) => {
                    setEducationSearch(e.target.value);
                    setShowEducationDropdown(true);
                    if (educationalAttainment && e.target.value !== educationalAttainment) {
                      setEducationalAttainment('');
                    }
                  }}
                  onFocus={() => setShowEducationDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowEducationDropdown(false);
                      const match = courseList.find(c =>
                        c.name === educationSearch ||
                        c.abbr.toLowerCase() === educationSearch.toLowerCase()
                      );

                      if (match) {
                        setEducationalAttainment(match.name);
                        setEducationSearch(match.name);
                      } else {
                        if (!educationalAttainment) {
                          setEducationSearch('');
                          setEducationalAttainment('');
                        } else {
                          setEducationSearch(educationalAttainment);
                        }
                      }
                    }, 200);
                  }}
                />
                {showEducationDropdown && (
                  <div style={styles.dropdownList}>
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((c, index) => (
                        <div
                          key={index}
                          style={styles.dropdownItem}
                          onMouseDown={() => {
                            setEducationalAttainment(c.name);
                            setEducationSearch(c.name);
                            setShowEducationDropdown(false);
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          {c.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '10px', color: '#999', fontSize: '0.9rem' }}>
                        No course found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <textarea style={styles.formTextarea} placeholder='Bio' value={bio} onChange={(e) => setBio(e.target.value)} />

              <div style={styles.formRow}>
                <select style={{ ...styles.formSelect, flex: 2 }} value={designation} onChange={(e) => setDesignation(e.target.value)}>
                  <option value="">Select Designation</option>
                  <option value="Director">Director</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin Staff">Admin Staff</option>
                  <option value="Clerk">Clerk</option>
                </select>
                <select style={{ ...styles.formSelect, flex: 1 }} value={yearsOfService} onChange={(e) => setYearsOfService(e.target.value)}>
                  <option value="">Select Years</option>
                  {[...Array(41).keys()].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <input style={styles.formInput} placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} />

              <button style={styles.formButton} onClick={handleSaveClick} disabled={updatingProfileInfo}>
                {updatingProfileInfo ? "Updating Profile..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div style={styles.otherSettings}>
            <h4>Privacy</h4>
            <p style={styles.otherSettingsP} onClick={() => setShowChangePasswordModal(true)}>
              Change Password
            </p>
            <div
              style={{ ...styles.otherSettingsP, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={handleToggle2FA}
            >
              <span>Two-Factor Authentication</span>
              <div style={{
                backgroundColor: is2FAEnabled ? '#e6f4ea' : '#f1f3f4',
                color: is2FAEnabled ? '#1e8e3e' : '#5f6368',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginLeft: '10px'
              }}>
                {is2FAEnabled ? "ON" : "OFF"}
              </div>
            </div>

            <h4>Database Management</h4>
            <div
              style={{ ...styles.otherSettingsP, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={!exporting ? handleDataExport : null}
            >
              <span>Data Export </span>
              {exporting ? (
                <Spinner as="span" animation="border" size="sm" variant="primary" />
              ) : (
                <span style={{ fontSize: '1.2rem', color: '#007bff' }}>&rsaquo;</span>
              )}
            </div>

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

export default SettingsPage;