import React, { useRef, useState, useEffect } from 'react'
// import '../user_pages/styles/UserProfilePage.css' // We will use inline styles instead
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import { getAuth } from 'firebase/auth';
import NavigationBar from '../components/NavigationBar.jsx'
import BlankHeader from '../components/BlankHeader.jsx'
// import UserBlankHeader from '../user_components/UserBlankHeader.jsx' // Not used in this version
import { useNavigate, useLocation } from 'react-router-dom';
import UserNavigationBar from '../user_components/UserNavigationBar.jsx';
import UserBlankHeader from '../user_components/UserBlankHeader.jsx';
// import UserNavigationBar from '../user_components/UserNavigationBar.jsx'; // Not used in this version

// 🎨 MODERN STYLES DEFINITION
const styles = {
    // --- MAIN LAYOUT ---
    profileBody: {
        backgroundColor: '#f8f9fa', // Light background for contrast
        minHeight: '100vh',
        padding: '0',
    },
    mainContainer: {
        maxWidth: '1000px',
        width: '90%',
        margin: '50px auto 30px',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },

    // --- HEADER CARD (Cover & Profile) ---
    headerCard: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        marginBottom: '30px',
    },
    coverImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
        objectPosition: 'center',
        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', // Default gradient background
    },
    profileContent: {
        padding: '0 30px 30px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    },
    profilePictureWrapper: {
        marginTop: '-100px', // Pull up into cover area
        alignSelf: 'flex-start',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
    },
    profileImage: {
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '5px solid #ffffff', // White border separates it from the cover
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    profilePlaceholder: {
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        backgroundColor: '#007bff', // Clean blue
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '60px',
        border: '5px solid #ffffff',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    
    // --- DETAILS & ACTIONS ---
    nameDesignation: {
        marginLeft: '180px', // Offset to align with content next to profile image
        marginTop: '-70px', // Adjusted pull back up
        paddingTop: '20px',
    },
    nameH1: {
        fontSize: '2.5rem',
        color: '#343a40',
        margin: '0',
        fontWeight: '700',
    },
    designationH4: {
        fontSize: '1.2rem',
        color: '#6c757d',
        margin: '5px 0 0',
        fontWeight: '400',
    },

    quickActionsBar: {
        position: 'absolute',
        top: '20px',
        right: '30px',
        display: 'flex',
        gap: '10px',
        zIndex: 10,
    },
    actionButton: {
        padding: '8px 15px',
        borderRadius: '8px',
        border: '1px solid #007bff',
        backgroundColor: '#007bff',
        color: 'white',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.3s ease',
    },
    actionButtonSecondary: {
        backgroundColor: '#ffffff',
        color: '#007bff',
        border: '1px solid #007bff',
    },

    // --- DETAIL SECTIONS (Two Column) ---
    allProfileDetails: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // Two columns for details
        gap: '30px',
        marginTop: '30px',
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
    },
    detailHeader: { // New style for detail card headers
        borderBottom: '2px solid #333', 
        paddingBottom: '10px', 
        color: '#333',
        marginBottom: '15px'
    },
    detailP: {
        fontSize: '1rem',
        color: '#495057',
        borderBottom: '1px solid #f1f1f1',
        padding: '10px 0',
        margin: '0',
    },
    bioCard: {
        gridColumn: '1 / -1', // Bio spans both columns
        marginBottom: '30px',
    },
    bioContent: {
        fontSize: '1rem',
        lineHeight: '1.6',
        color: '#495057',
        marginTop: '15px',
        minHeight: '50px',
    }
};

function UserProfilePage() {
    const { currentUser } = useAuth();
    // ... other states initialized from localStorage ...
    const [profileURL, setProfileURL] = useState(localStorage.getItem('profileURL') || '');
    const [coverURL, setCoverURL] = useState(localStorage.getItem('coverURL') || '');
    const [firstName, setFirstName] = useState(localStorage.getItem('firstName') || '');
    const [lastName, setLastName] = useState(localStorage.getItem('lastName') || '');
    const [middleName, setMiddleName] = useState(localStorage.getItem('middleName') || '');
    const [gender, setGender] = useState(localStorage.getItem('gender') || '');
    const [email, setEmail] = useState(localStorage.getItem('email') || '');
    const [contactNumber, setContactNumber] = useState(localStorage.getItem('contactNumber') || '');
    const [address, setAddress] = localStorage.getItem('address') || '';
    const [designation, setDesignation] = useState(localStorage.getItem('designation') || '');
    const [role, setRole] = useState(localStorage.getItem('role') || '');
    const [studentId, setStudentId] = useState(localStorage.getItem('studentId') || '');
    const [uid, setUid] = useState(localStorage.getItem('uid') || '');
    const [bio, setBio] = useState(localStorage.getItem('bio') || '');
    const [educationalAttainment, setEducationalAttainment] = useState(localStorage.getItem('educationalAttainment') || '');
    const [yearsOfService, setYearsOfService] = useState(localStorage.getItem('yearsOfService') || '');
    const [yearLevel, setYearLevel] = useState(localStorage.getItem('yearLevel') || '');
    const [section, setSection] = useState(localStorage.getItem('section') || '')

    const [course, setCourse] = useState(() => {
        const courseString = localStorage.getItem('course');
        try {
            return courseString ? JSON.parse(courseString) : {};
        } catch (e) {
            console.error("Failed to parse course JSON from localStorage:", e);
            return {};
        }
    });
    
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;
    const location = useLocation();

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!currentUser) return;

            const hasCached = localStorage.getItem('firstName') && localStorage.getItem('lastName') && localStorage.getItem('profileURL')
                && localStorage.getItem('designation') && localStorage.getItem('coverURL') && localStorage.getItem('bio') && localStorage.getItem('role') &&
                localStorage.getItem('middleName') && localStorage.getItem('gender') && localStorage.getItem('email') && localStorage.getItem('contactNumber')
                && localStorage.getItem('address') && localStorage.getItem('studentId') && localStorage.getItem('educationalAttainment') && localStorage.getItem('yearsOfService')
                && localStorage.getItem('section') && localStorage.getItem('course') && localStorage.getItem('yearLevel');

            try {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    
                    // Retrieve course data, which should be an object from Firestore
                    const courseData = userData.course || {}; 
                    
                    setRole(userData.role || '');
                    setDesignation(userData.designation || '');
                    setFirstName(userData.firstName || '');
                    setLastName(userData.lastName || '');
                    setMiddleName(userData.middleName || '');
                    setGender(userData.gender || '');
                    setEmail(userData.email || '');
                    setContactNumber(userData.contactNumber || '');
                    setStudentId(userData.studentId || '');
                    setUid(userData.uid || '');
                    setBio(userData.bio || '');
                    setEducationalAttainment(userData.educationalAttainment || '');
                    setYearsOfService(userData.yearsOfService || '');
                    setCoverURL(userData.coverURL || '');
                    setProfileURL(userData.profileURL || '');
                    setCourse(courseData); // Set state to the object
                    setYearLevel(userData.yearLevel);
                    setSection(userData.section);

                    // Store all values in localStorage
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
                    localStorage.setItem('yearLevel', userData.yearLevel || '');
                    localStorage.setItem('section', userData.section || '');
                    localStorage.setItem('coverURL', userData.coverURL || '');
                    localStorage.setItem('profileURL', userData.profileURL || '');
                    
                    localStorage.setItem('course', JSON.stringify(courseData));
                }
            } catch (err) {
                console.error("Error fetching user info:", err);
            }
        };

        fetchUserDetails();
    }, [currentUser]);

    const handleEdit = (path) => {
        navigate(path)
    };

    return (
        <>
            <UserNavigationBar />
            <div style={styles.profileBody}>
                <UserBlankHeader /> 

                <div style={styles.mainContainer}>
                    
                    <div style={styles.headerCard}>
                        <img 
                            src={coverURL} 
                            alt="Cover" 
                            style={styles.coverImage} 
                        />
                        
                        <div style={styles.profileContent}>
                            
                            <div style={styles.quickActionsBar}>
                                <button 
                                    onClick={() => handleEdit(`/users/settings/${user?.uid}`)}
                                    style={{...styles.actionButton, ...styles.actionButtonSecondary}}
                                >
                                    Change Password
                                </button>
                                <button 
                                    onClick={() => handleEdit(`/users/settings/${user?.uid}`)}
                                    style={styles.actionButton}
                                >
                                    Edit Profile
                                </button>
                            </div>

                            <div style={styles.profilePictureWrapper}>
                                {profileURL ? (
                                    <img
                                        src={profileURL}
                                        alt='Profile'
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <div style={styles.profilePlaceholder}>
                                        {initials}
                                    </div>
                                )}
                            </div>

                            <div style={styles.nameDesignation}>
                                <h1 style={styles.nameH1}>{firstName} {lastName}</h1>
                                <h4 style={styles.designationH4}>{designation}</h4>
                            </div>
                        </div>
                    </div>

                    <div style={styles.allProfileDetails}>
                        
                        <div style={styles.detailCard}>
                            <h3 style={styles.detailHeader}>
                                Personal Information
                            </h3>
                            <p style={styles.detailP}>
                                <strong>Firstname: </strong>{firstName}
                            </p>
                            <p style={styles.detailP}>
                                <strong>Lastname: </strong>{lastName}
                            </p>
                            <p style={styles.detailP}>
                                <strong>Middle Name: </strong>{middleName || 'N/A'}
                            </p>
                            <p style={styles.detailP}>
                                <strong>Gender: </strong>{gender}
                            </p>
                            <p style={styles.detailP}>
                                <strong>Email: </strong>{email}
                            </p>
                            <p style={styles.detailP}>
                                <strong>Contact: </strong>{contactNumber}
                            </p>
                            <p style={{...styles.detailP, borderBottom: 'none'}}>
                                <strong>Address: </strong>{address || 'N/A'}
                            </p>
                        </div>
                        
                        <div style={styles.detailCard}>
                            <h3 style={styles.detailHeader}>
                                Account & Academic Details
                            </h3>
                            <p style={styles.detailP}>
                                <strong>Role: </strong>{designation}
                            </p>
                            {designation !== 'Student' && (
                                <>
                                    <p style={styles.detailP}>
                                        <strong>Educational Attainment:</strong> {educationalAttainment || 'N/A'}
                                    </p>
                                    <p style={styles.detailP}>
                                        <strong>Years of Service:</strong> {yearsOfService || 'N/A'}
                                    </p>
                                </>
                            )}
                            {designation === 'Student' && (
                                <>
                                    <p style={styles.detailP}>
                                        <strong>Student ID: </strong>{studentId || 'N/A'}
                                    </p>
                                    <p style={styles.detailP}>
                                        <strong>Course: </strong>{course.abbr || 'N/A'}
                                    </p>
                                    <p style={styles.detailP}>
                                        <strong>Year Level: </strong>{yearLevel || 'N/A'}
                                    </p>
                                    <p style={styles.detailP}>
                                        <strong>Section: </strong>{section || 'N/A'}
                                    </p>
                                </>
                            )}
                            <p style={{...styles.detailP, borderBottom: 'none'}}>
                                <strong>User ID: </strong>{uid}
                            </p>
                        </div>

                        <div style={{...styles.detailCard, ...styles.bioCard}}>
                            <h3 style={styles.detailHeader}>
                                Biography
                            </h3>
                            <p style={styles.bioContent}>
                                {bio || 'No biography provided.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserProfilePage