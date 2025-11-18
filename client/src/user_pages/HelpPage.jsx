import React from "react";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader";
import "./styles/HelpPage.css";

function HelpPage() {
  const helpSections = [
    {
      title: "Getting Started",
      content: (
        <>
          <h5>What is SpotSync?</h5>
          <p>
            SpotSync is USTP CDO’s digital lost-and-found management system that helps students, faculty,
            staff, and non-staff report lost items, post found items, and quickly match reports to return
            belongings to their rightful owners.
          </p>
          <h5>Who can use it?</h5>
          <p>
            All USTP CDO students, faculty, staff and non-staff with a valid campus email and ID number.
            USTP guests can also report lost items.
          </p>
        </>
      ),
    },
    {
      title: "How to Report a Lost Item",
      content: (
        <ol>
          <li>Go to “Lost Items” in the app.</li>
          <li>Click “Report Lost Item.”</li>
          <li>Fill in the required details:
            <ul>
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
        <ol>
          <li>Go to “Found Items.”</li>
          <li>Tap “Report Found Item.”</li>
          <li>Upload item details:
            <ul>
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
        <p>
          SpotSync automatically matches reports based on item description, category, location, photo
          similarity, and unique identifiers. You will receive an email or in-app notification once a match is found.
        </p>
      ),
    },
    {
      title: "Claiming & Retrieving Items",
      content: (
        <ol>
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
        <ul>
          <li>SpotSync protects your privacy. Contact numbers are hidden.</li>
          <li>Communication happens inside the app until a match is confirmed.</li>
          <li>Item handovers should be at OSA or other safe public spots on campus.</li>
        </ul>
      ),
    },
    {
      title: "Item Status Guide",
      content: (
        <ul>
          <li>Lost – Item reported missing</li>
          <li>Found – Item reported discovered</li>
          <li>Matched – Potential owner identified</li>
          <li>For Verification – OSA checking ownership</li>
          <li>Claimed – Item successfully returned</li>
          <li>Archived – Old or resolved reports stored</li>
        </ul>
      ),
    },
    {
      title: "Policies",
      content: (
        <>
          <h5>Holding Period</h5>
          <p>Found items stored at OSA are kept for a defined period per campus policy, then disposed or donated.</p>
          <h5>Accuracy of Reports</h5>
          <p>Submit honest and accurate details. False claims may result in system restrictions.</p>
          <h5>Unclaimed Items</h5>
          <p>After the holding period, unclaimed items may be donated, recycled, or properly disposed.</p>
        </>
      ),
    },
    {
      title: "Troubleshooting & FAQs",
      content: (
        <ul>
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
        <>
          <p>Contact:</p>
          <p>📍 Office of Student Affairs – USTP CDO</p>
          <p>📧 Email: [Insert campus email]</p>
          <p>🕘 Office Hours: 8:00 AM – 5:00 PM, Monday to Friday</p>
          <p>Or use the in-app Support Form for technical issues or feedback.</p>
        </>
      ),
    },
  ];

  return (
    <>
      <UserNavigationBar />
      <div className="help-page-body">
        <UserBlankHeader />
        <div className="help-page-container">
          <h2>SpotSync Help Center</h2>
          <p>Welcome to the SpotSync Help Center! Here, you’ll find everything you need to know about reporting, finding, and claiming items within the USTP CDO campus.</p>

          {helpSections.map((section, idx) => (
            <div key={idx} className="help-section mb-4">
              <h4>{section.title}</h4>
              <div className="help-content">{section.content}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default HelpPage;
