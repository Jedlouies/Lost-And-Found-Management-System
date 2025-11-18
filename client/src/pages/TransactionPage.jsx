import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import NavigationBar from "../components/NavigationBar";
import "./styles/TransactionPage.css";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import BlankHeader from "../components/BlankHeader";
import FloatingAlert from "../components/FloatingAlert";
import { useAuth } from "../context/AuthContext";

// 🔹 Bootstrap imports
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function TransactionPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const { currentUser } = useAuth();
   const user = auth.currentUser;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [alert, setAlert] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔹 Reusable avatar component
const ProfileAvatar = ({ personalInfo }) => {
  const size = 50;

  if (personalInfo?.firstName === "Guest" || personalInfo?.isGuest) {
    // Case 1: Guest
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "blue",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        Guest
      </div>
    );
  } else if (!personalInfo?.profileURL) {
    // Case 2: Initials fallback
    const initials = `${personalInfo?.firstName?.[0] || ""}${
      personalInfo?.lastName?.[0] || ""
    }`.toUpperCase();

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "navy",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "19px",
        }}
      >
        {initials || "?"}
      </div>
    );
  } else {
    // Case 3: Profile Image
    return (
      <img
        src={personalInfo.profileURL}
        alt="profile"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }
};


  useEffect(() => {
    setIsModalOpen(true); // Open modal when page loads
  }, []);

  // 🔹 Fetch specific match
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setAlert({
        message: "Please enter a transaction ID.",
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      const matchesRef = collection(db, "matches");
      const snapShot = await getDocs(matchesRef);

      const foundMatch = snapShot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .find(
          (match) =>
            match.transactionId?.toLowerCase() === searchQuery.toLowerCase()
        );

      if (foundMatch) {
        if (foundMatch.claimStatus === "claimed") {
          setAlert({
            message: "Item already claimed!",
            type: "warning",
          });
          setLoading(false);
          return;
        }
        setSelectedMatch(foundMatch);
        setIsModalOpen(false);
        setAlert(null);
      } else {
        setSelectedMatch(null);
        setAlert({
          message: "No transaction found with that ID.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      setAlert({
        message: "Error searching for transaction.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  

    return (
      <>
      
        <NavigationBar />
        <div className='transaction-body'>
          <BlankHeader />
          {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

{/* 🔹 Bootstrap Modal */}
<Modal
  show={isModalOpen}
  onHide={() => {
    // Only allow Cancel to close, not clicking outside or pressing ESC
    setIsModalOpen(false);
    navigate(`/admin/found-items/${user?.uid}`); // go back to lost-items when cancel/close
  }}
  centered
  backdrop="static"  // prevents clicking outside to close
  keyboard={false}   // prevents ESC to close
  dialogClassName="custom-modal-width" // custom width class
>
  <Modal.Header>
    <Modal.Title>Transaction ID</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form.Control
      type="text"
      placeholder="Enter Transaction ID"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
    />
  </Modal.Body>
  <Modal.Footer>
    <Button
      variant="secondary"
      onClick={() => {
        setIsModalOpen(false);
        navigate(`/admin/found-items/${user?.uid}`); // redirect when cancel
      }}
    >
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSearch} disabled={loading}>
      {loading ? <Spinner animation="border" size="sm" /> : "Search"}
    </Button>
  </Modal.Footer>
</Modal>

        {/* 🔹 Open Modal Button */}
        
          <div className='transaction-content'>
           
            {selectedMatch?.lostItem ? (
              <div className='itemLostTransaction'>
                 <h2>Lost Item</h2>
                <img src={selectedMatch.lostItem.images} alt="img" style={{width: '250px', height: '250px', borderRadius: '10px', objectFit: 'cover'}}/>
                <p style={{fontSize: '30px', fontWeight: 'bolder'}}> {selectedMatch.lostItem.itemName}</p>
                <span style={{fontSize: '10px'}}>Item ID Number: {selectedMatch.lostItem.itemId}</span>
                <div style={{width: '70%', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0F0F0', padding: '10px', borderRadius: '10px'}}> 
                <div
                  style={{
                    width: "70%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "#F0F0F0",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <ProfileAvatar personalInfo={selectedMatch.lostItem.personalInfo} />
                  <div style={{ display: "flex", flexDirection: "column", height: "90%" }}>
                    <span style={{ fontSize: "15px", fontWeight: "bold" }}>
                      {selectedMatch.lostItem.personalInfo?.firstName || "Guest"}{" "}
                      {selectedMatch.lostItem.personalInfo?.lastName || ""}
                    </span>
                    <span style={{ fontSize: "15px" }}>
                      {selectedMatch.lostItem.personalInfo?.course?.abbr || ""}
                    </span>
                  </div>
                </div>
                </div>
                <div className='item-transaction-details'>
                  <div>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Date Lost:</strong> {selectedMatch.lostItem.dateLost}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Category:</strong> {selectedMatch.lostItem.category}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Location Lost:</strong> {selectedMatch.lostItem.locationLost}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Claim Status:</strong> {selectedMatch.lostItem.claimStatus}</p>

                  </div>
                  <div>
                    <p 
                      style={{fontSize: '12px', marginLeft: '10px', position: 'relative'}}
                      className="hover-text"
                    >
                      <strong>Description:</strong> 
                      <span className="truncate">{selectedMatch.lostItem.itemDescription}</span>
                      <span className="tooltip-panel">{selectedMatch.lostItem.itemDescription}</span>
                    </p>

                    <p 
                      style={{fontSize: '12px', marginLeft: '10px', position: 'relative'}}
                      className="hover-text"
                    >
                      <strong>How item lost:</strong> 
                      <span className="truncate">{selectedMatch.lostItem.howItemLost}</span>
                      <span className="tooltip-panel">{selectedMatch.lostItem.howItemLost}</span>
                    </p>
                  </div>
                </div>         
              </div>
           ) : (
              <p>No lost item details</p>
            )}

            <div className='transactionScores'>
              <h4>Results</h4>
              <div className='scoreResults'>
              <span style={{ fontSize: '15px', color: 'black'}}>
                Image Rate:  
                {selectedMatch?.scores?.imageScore != null
                  ? ` ${Math.round(selectedMatch.scores.imageScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.imageScore != null
                      ? `${selectedMatch.scores.imageScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '15px', color: 'black'}}>
                Description Rate:  
                {selectedMatch?.scores?.descriptionScore != null
                  ? ` ${Math.round(selectedMatch.scores.descriptionScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.descriptionScore != null
                      ? `${selectedMatch.scores.descriptionScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

               <span style={{ fontSize: '15px', color: 'black'}}>
                Name Rate:  
                {selectedMatch?.scores?.nameScore != null
                  ? ` ${Math.round(selectedMatch.scores.nameScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.nameScore != null
                      ? `${selectedMatch.scores.nameScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '15px', color: 'black'}}>
                Location Rate:  
                {selectedMatch?.scores?.locationScore != null
                  ? ` ${Math.round(selectedMatch.scores.locationScore)}%`
                  : 'N/A'}
              </span>
              <div> className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.locationScore != null
                      ? `${selectedMatch.scores.locationScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '15px', color: 'black'}}>
                Category Rate:  
                {selectedMatch?.scores?.categoryScore != null
                  ? ` ${Math.round(selectedMatch.scores.categoryScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.categoryScore != null
                      ? `${selectedMatch.scores.categoryScore}%`
                      : '0%'
                  }}
                ></div>
              </div>
              

              <span style={{ fontSize: '15px', color: 'black'}}>
                Overall Rate:  
                {selectedMatch?.scores?.overallScore != null
                  ? ` ${Math.round(selectedMatch.scores.overallScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.overallScore != null
                      ? `${selectedMatch.scores.overallScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              </div>
            </div>


            
            {selectedMatch?.foundItem ? (
              <div className='itemFoundTransaction'>
                <h2>Found Item</h2>
                <img src={selectedMatch.foundItem.images} alt="img" style={{width: '250px', height: '250px', borderRadius: '10px', objectFit: 'cover'}}/>
                <p style={{fontSize: '30px', fontWeight: 'bolder'}}> {selectedMatch.foundItem.itemName}</p>
                <span style={{fontSize: '10px'}}>Item ID Number: {selectedMatch.foundItem.itemId}</span>
                <div style={{width: '70%', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0F0F0', padding: '10px', borderRadius: '10px'}}> 
                <div
                  style={{
                    width: "70%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    backgroundColor: "#F0F0F0",
                    padding: "10px",
                    borderRadius: "10px",
                  }}
                >
                  <ProfileAvatar personalInfo={selectedMatch.foundItem.personalInfo} />
                  <div style={{ display: "flex", flexDirection: "column", height: "90%" }}>
                    <span style={{ fontSize: "15px", fontWeight: "bold" }}>
                      {selectedMatch.foundItem.personalInfo?.firstName || "Guest"}{" "}
                      {selectedMatch.foundItem.personalInfo?.lastName || ""}
                    </span>
                    <span style={{ fontSize: "15px" }}>
                      {selectedMatch.foundItem.personalInfo?.course?.abbr || ""}
                    </span>
                  </div>
                </div>
                  
                </div>
                <div className='item-transaction-details'>
                  <div>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Date Found:</strong> {selectedMatch.foundItem.dateFound}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Category:</strong> {selectedMatch.foundItem.category}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Location Found:</strong> {selectedMatch.foundItem.locationFound}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Claim Status:</strong> {selectedMatch.foundItem.claimStatus}</p>

                  </div>
                  <div>
                    <p 
                      style={{fontSize: '12px', marginLeft: '10px', position: 'relative'}}
                      className="hover-text"
                    >
                      <strong>Description:</strong> 
                      <span className="truncate">{selectedMatch.foundItem.itemDescription}</span>
                      <span className="tooltip-panel">{selectedMatch.foundItem.itemDescription}</span>
                    </p>

                    <p 
                      style={{fontSize: '12px', marginLeft: '10px', position: 'relative'}}
                      className="hover-text"
                    >
                      <strong>How item found:</strong> 
                      <span className="truncate">{selectedMatch.foundItem.howItemFound}</span>
                      <span className="tooltip-panel">{selectedMatch.foundItem.howItemFound}</span>
                    </p>                  </div>
                </div>         
              </div>
            ) : (
              <p>No found item details</p>
            )}
          </div>
         <button
            className={`transaction-process-btn ${
              location.pathname === `/admin/process-claim/${selectedMatch?.id}` ? "active" : ""
            }`}
            onClick={() => {
              const isGuestClaimant =
                selectedMatch?.lostItem?.personalInfo?.firstName === "Guest";

              if (isGuestClaimant) {
                navigate(`/admin/guest/process-claim/${currentUser.uid}`, {
                  state: { match: selectedMatch, userId: currentUser.uid },
                });
              } else {
                navigate(`/admin/process-claim/${currentUser.uid}`, {
                  state: { match: selectedMatch, userId: currentUser.uid },
                });
              }
            }}
          >
            Process
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="25"
              fill="currentColor"
              className="bi bi-forward"
              viewBox="0 0 16 16"
            >
              <path d="M9.502 5.513a.144.144 0 0 0-.202.134V6.65a.5.5 0 0 1-.5.5H2.5v2.9h6.3a.5.5 0 0 1 .5.5v1.003c0 .108.11.176.202.134l3.984-2.933.042-.028a.147.147 0 0 0 0-.252l-.042-.028zM8.3 5.647a1.144 1.144 0 0 1 1.767-.96l3.994 2.94a1.147 1.147 0 0 1 0 1.946l-3.994 2.94a1.144 1.144 0 0 1-1.767-.96v-.503H2a.5.5 0 0 1-.5-.5v-3.9a.5.5 0 0 1 .5-.5h6.3z"/>
            </svg>
          </button>

        
          <button
            className="transaction-process-btn"
            style={{
              left: '60%'
            }}
            onClick={() => setIsModalOpen(true)}
          >
            Change Transaction
          </button>
        

        </div>
        
      </>
    );
  }

  export default TransactionPage;
