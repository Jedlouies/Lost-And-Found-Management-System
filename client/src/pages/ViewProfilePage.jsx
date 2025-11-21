import React, { useRef, useState, useEffect } from 'react'
// import './styles/ViewProfilePage.css' // Replaced with inline styles
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.jsx';
import NavigationBar from '../components/NavigationBar.jsx'
import BlankHeader from '../components/BlankHeader.jsx'
import { useNavigate, useParams } from 'react-router-dom';
import UserNavigationBar from '../user_components/UserNavigationBar.jsx'; // Not used in Admin/View context
import TableHeader from '../components/TablesHeader.jsx'; // Using BlankHeader for consistent spacing

// 🎨 MODERN STYLES DEFINITION (Copied from ProfilePage.jsx for consistency)
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
        // Not used here, but kept for context consistency if needed
        display: 'none', 
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


function ViewProfilePage() {
  const { uid } = useParams();  
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  // const profileRef = useRef(null); // useRef not needed here

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!uid) return;

      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUserDetails();
  }, [uid]);

  if (!userData) return <p style={{textAlign: 'center', marginTop: '50px'}}>Loading profile...</p>;

  const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
  // Ensure default values are handled for rendering details
  const courseAbbr = userData.course?.abbr || 'N/A';
  const courseName = userData.course?.name || '';
  const yearLevel = userData.yearLevel || 'N/A';
  const section = userData.section || 'N/A';
  const role = userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User';


  return (
    <>
      <NavigationBar />
      <div style={styles.profileBody}>
        <BlankHeader /> {/* Use BlankHeader for consistent page spacing */}

        <div style={styles.mainContainer}>
          
          {/* 1. PROFILE HEADER CARD */}
          <div style={styles.headerCard}>
            <img 
              src={userData.coverURL || ''} 
              alt="Cover" 
              style={styles.coverImage} 
            />
            
            <div style={styles.profileContent}>
              
              {/* Quick Actions Bar (Intentionally removed for ViewPage) */}
              
              <div style={styles.profilePictureWrapper}>
                {userData.profileURL ? (
                  <img
                    src={userData.profileURL}
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
                <h1 style={styles.nameH1}>{userData.firstName} {userData.lastName}</h1>
                <h4 style={styles.designationH4}>{role}</h4>
              </div>
            </div>
          </div>

          {/* 2. PROFILE DETAILS GRID */}
          <div style={styles.allProfileDetails}>
            
            {/* LEFT COLUMN: Personal Info */}
            <div style={styles.detailCard}>
              <h3 style={styles.detailHeader}>
                Personal Information
              </h3>
              <p style={styles.detailP}>
                <strong>Firstname: </strong>{userData.firstName || 'N/A'}
              </p>
              <p style={styles.detailP}>
                <strong>Lastname: </strong>{userData.lastName || 'N/A'}
              </p>
              <p style={styles.detailP}>
                <strong>Middle Name: </strong>{userData.middleName || 'N/A'}
              </p>
              <p style={styles.detailP}>
                <strong>Gender: </strong>{userData.gender || 'N/A'}
              </p>
              <p style={styles.detailP}>
                <strong>Email: </strong>{userData.email || 'N/A'}
              </p>
              <p style={styles.detailP}>
                <strong>Contact: </strong>{userData.contactNumber || 'N/A'}
              </p>
              <p style={{...styles.detailP, borderBottom: 'none'}}>
                <strong>Address: </strong>{userData.address || 'N/A'}
              </p>
            </div>
            
            {/* RIGHT COLUMN: Academic Details */}
            <div style={styles.detailCard}>
              <h3 style={styles.detailHeader}>
                Account & Academic Details
              </h3>
              <p style={styles.detailP}>
                <strong>Role: </strong>{role}
              </p>
              
              {/* Conditional rendering based on role */}
              {role === 'User' && (
                  <>
                      <p style={styles.detailP}>
                          <strong>Student ID: </strong>{userData.studentId || 'N/A'}
                      </p>
                      <p style={styles.detailP}>
                          <strong>Course: </strong>{courseAbbr} - {courseName}
                      </p>
                      <p style={styles.detailP}>
                          <strong>Year Level: </strong>{yearLevel}
                      </p>
                      <p style={styles.detailP}>
                          <strong>Section: </strong>{section}
                      </p>
                  </>
              )}
              {role.role !== 'User' && (
                  <>
                      <p style={styles.detailP}>
                          <strong>Educational Attainment:</strong> {userData.educationalAttainment || 'N/A'}
                      </p>
                      <p style={styles.detailP}>
                          <strong>Years of Service:</strong> {userData.yearsOfService || 'N/A'}
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
                {userData.bio || 'No biography provided.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ViewProfilePage;