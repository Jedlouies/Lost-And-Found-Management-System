import React from "react";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader";
// import "./styles/HelpPage.css"; // Using inline styles

// 🎨 MODERN UI STYLES DEFINITION (Adapted for a clean, card-based help center)
const styles = {
    pageBody: {
        backgroundColor: '#f0f2f5',
        minHeight: '100vh',
        padding: '20px 0',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    pageContainer: {
        maxWidth: '1000px',
        width: '95%',
        margin: '20px auto',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    mainTitle: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#143447',
        marginBottom: '10px',
    },
    introText: {
        fontSize: '1rem',
        color: '#6c757d',
        marginBottom: '40px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px',
        lineHeight: '1.5',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
    },
    sectionCard: {
        padding: '25px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        textAlign: 'left',
        transition: 'box-shadow 0.2s',
    },
    sectionCardHover: {
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    },
    sectionHeader: {
        fontSize: '1.3rem',
        fontWeight: '600',
        color: '#000000ff',
        marginBottom: '15px',
        borderBottom: '2px solid #000000ff',
        paddingBottom: '5px',
        display: 'block',
    },
    contentStyle: {
        fontSize: '0.95rem',
        color: '#000000ff',
        lineHeight: '1.6',
    }
};

function HelpPage() {
  const helpSections = [
    {
      title: "Getting Started",
      content: (
        <>
          <h5 style={{fontWeight: '600', color: '#143447', fontSize: '1.1rem'}}>What is SpotSync?</h5>
          <p style={styles.contentStyle}>
            SpotSync is USTP CDO’s digital lost-and-found management system that helps students, faculty,
            staff, and non-staff report lost items, post found items, and quickly match reports to return
            belongings to their rightful owners.
          </p>
          <h5 style={{fontWeight: '600', color: '#143447', fontSize: '1.1rem', marginTop: '15px'}}>Who can use it?</h5>
          <p style={styles.contentStyle}> 
            All USTP CDO students, faculty, staff and non-staff with a valid campus email and ID number.
            USTP guests can also report lost items.
          </p>
        </>
      ),
    },
    {
      title: "How to Report a Lost Item",
      content: (
        <ol style={{paddingLeft: '20px', ...styles.contentStyle}}>
          <li>Go to “Lost Items” in the app.</li>
          <li>Click “Report Lost Item.”</li>
          <li>Fill in the required details:
            <ul style={{marginTop: '5px', listStyleType: 'disc'}}>
              <li>Item name & description</li>
              <li>Category (e.g., gadgets, cards, clothing)</li>
              <li>Last known location</li>
              <li>Date/time lost</li>
              <li>Photo (highly recommended)</li>
            </ul>
          </li>
          <li>Submit your report and wait for a notification if there’s a match.</li>
          <li>Tip: More details = higher match accuracy.</li>
        </ol>
      ),
    },
    {
      title: "How to Report a Found Item",
      content: (
        <ol style={{paddingLeft: '20px', ...styles.contentStyle}}>
          <li>Go to “Found Items.”</li>
          <li>Tap “Report Found Item.”</li>
          <li>Upload item details:
            <ul style={{marginTop: '5px', listStyleType: 'disc'}}>
              <li>Clear photo</li>
              <li>Exact location found</li>
              <li>Date/time found</li>
              <li>Unique features (scratches, stickers, etc.)</li>
            </ul>
          </li>
          <li>Submit the report.</li>
          <li>Campus admin may verify and hold the item at OSA if needed.</li>
        </ol>
      ),
    },
    {
      title: "How Matching Works",
      content: (
        <p style={styles.contentStyle}>
          SpotSync automatically matches reports based on item description, category, location, photo
          similarity, and unique identifiers. You will receive an email or in-app notification once a match is found.
        </p>
      ),
    },
    {
      title: "Claiming & Retrieving Items",
      content: (
        <ol style={{paddingLeft: '20px', ...styles.contentStyle}}>
          <li>Open the notification and confirm the match.</li>
          <li>Follow the system guidance to OSA for verification and release.</li>
          <li>Present proof of ownership (photo, receipt, unique description, ID).</li>
          <li>Once verified, OSA will hand over your item.</li>
        </ol>
      ),
    },
    {
      title: "Communication & Safety",
      content: (
        <ul style={{paddingLeft: '20px', ...styles.contentStyle}}>
          <li>SpotSync protects your privacy. Contact numbers are hidden.</li>
          <li>Communication happens inside the app until a match is confirmed.</li>
          <li>Item handovers should be at OSA or other safe public spots on campus.</li>
        </ul>
      ),
    },
    {
      title: "Item Status Guide",
      content: (
        <ul style={{paddingLeft: '20px', ...styles.contentStyle}}>
          <li>**Lost** – Item reported missing</li>
          <li>**Found** – Item reported discovered</li>
          <li>**Matched** – Potential owner identified</li>
          <li>**For Verification** – OSA checking ownership</li>
          <li>**Claimed** – Item successfully returned</li>
          <li>**Archived** – Old or resolved reports stored</li>
        </ul>
      ),
    },
    {
      title: "Policies",
      content: (
        <>
          <h5 style={{fontWeight: '600', color: '#143447', fontSize: '1.1rem'}}>Holding Period</h5>
          <p style={styles.contentStyle}>Found items stored at OSA are kept for a defined period per campus policy, then disposed or donated.</p>
          <h5 style={{fontWeight: '600', color: '#143447', fontSize: '1.1rem', marginTop: '15px'}}>Accuracy of Reports</h5>
          <p style={styles.contentStyle}>Submit honest and accurate details. False claims may result in system restrictions.</p>
          <h5 style={{fontWeight: '600', color: '#143447', fontSize: '1.1rem', marginTop: '15px'}}>Unclaimed Items</h5>
          <p style={styles.contentStyle}>After the holding period, unclaimed items may be donated, recycled, or properly disposed.</p>
        </>
      ),
    },
    {
      title: "Troubleshooting & FAQs",
      content: (
        <ul style={{paddingLeft: '20px', ...styles.contentStyle}}>
          <li>Can’t find my lost item? Use filters, check category, or check again later.</li>
          <li>No match notification? Wait — matches depend on other reports and details.</li>
          <li>Someone claimed my found item but unsure? Let OSA verify. Don’t hand it over directly.</li>
          <li>Can I delete/edit my report? Yes, update/remove in “My Reports”.</li>
          <li>Suspicious listing? Tap “Report Post” for campus admin review.</li>
        </ul>
      ),
    },
    {
      title: "Need More Help?",
      content: (
        <div style={styles.contentStyle}>
          <p style={{color: 'black'}}>Contact:</p>
          <p style={{color: 'black'}}>📍 Office of Student Affairs – USTP CDO</p>
          <p style={{color: 'black'}}>📧 Email: [Insert campus email]</p>
          <p style={{color: 'black'}}>🕘 Office Hours: 8:00 AM – 5:00 PM, Monday to Friday</p>
          <p style={{color: 'black'}}>Or use the in-app Support Form for technical issues or feedback.</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <UserNavigationBar />
              <UserBlankHeader />

      <div style={styles.pageBody}>
        <div style={styles.pageContainer}>
          <h2 style={styles.mainTitle}>SpotSync Help Center</h2>
          <p style={styles.introText}>
            Welcome to the SpotSync Help Center! Here, you’ll find everything you need to know about reporting, finding, and claiming items within the USTP CDO campus.
          </p>

          <div style={styles.grid}>
            {helpSections.map((section, idx) => (
              <div 
                key={idx} 
                style={styles.sectionCard} 
                className="help-section" 
                onMouseOver={(e) => e.currentTarget.style.boxShadow = styles.sectionCardHover.boxShadow}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)'}
              >
                <h4 style={styles.sectionHeader}>{section.title}</h4>
                <div className="help-content">{section.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default HelpPage;