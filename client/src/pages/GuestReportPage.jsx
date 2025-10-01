import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/GuestReportPage.css";
import Header from '../components/Header'
import { auth } from "../firebase";

export default function GuestReportPage() {
  const navigate = useNavigate();
  

  const handleChoice = (type) => {

    const uid = auth.currentUser?.uid; 
    if (!uid) {
      console.error("No user is signed in");
      return;
    }
    if (type === "lost") {
      navigate(`/guest/lost/${auth.currentUser?.uid}`);
    } else if (type === "found") {
      navigate(`/guest/found/${auth.currentUser?.uid}`);
    }
  };

  return (
    <>
        <Header className="header"></Header>
        <div className="guest-container" style={{width: '105%', height: '120vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
          
          <h1 style={{color: 'white'}}>When losing something <br /> doesn’t mean it’s gone forever </h1>
          <p style={{color: 'white'}}>Please choose what you want to report:</p>

          <div className="guest-buttons">
            <button className="lost-btn" onClick={() => handleChoice("lost")}>
              I Lost an Item
            </button>
            <button className="found-btn" onClick={() => handleChoice("found")}>
              I Found an Item
            </button>
          </div>''
        </div>

    </>
  );
}
