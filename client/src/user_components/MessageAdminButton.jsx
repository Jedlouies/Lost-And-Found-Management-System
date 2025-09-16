import React, { useState } from "react";
import { db } from "../firebase";
import { getDocs, collection, query, where } from "firebase/firestore";
import { getDatabase, ref, push, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { useAuth } from "../context/AuthContext";
import FloatingAlert from "../components/FloatingAlert";

const dbRealtime = getDatabase();

export default function MessageAdminButton({ setAlert }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  const sendMessageToAdmins = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      
      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        for (let adminDoc of adminSnap.docs) {
          const adminId = adminDoc.id;
          const notifRef = ref(dbRealtime, `notifications/${adminId}`);
          const newNotifRef = push(notifRef);
        await set(newNotifRef, {
        from: {uid: currentUser?.uid, name: currentUser?.firstName + " " + currentUser?.lastName},
        message,
        timestamp: rtdbServerTimestamp(),
        type: "user-message",
        read: false,
        });
        }
      }

      setMessage("");
      setIsOpen(false);
      setAlert({ type: "success", message: "Message sent", visible: true });
    } catch (error) {
      console.error("Error sending message:", error);
    setAlert({ type: "error", message: "Failed to send message.", visible: true });
    }
    setLoading(false);
  };

  return (
    <>
      {alert.visible && (
        <FloatingAlert
            message={alert.message}
            type={alert.type}
            visible={alert.visible}
            onClose={() => setAlert({ ...alert, visible: false })}
        />
        )}

      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#475C6F",
          color: "white",
          fontSize: "28px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0px 4px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
      >
        💬
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "280px",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "15px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message to admin..."
            style={{
              backgroundColor: 'transparent',
              color: 'black',
              resize: "none",
              width: "100%",
              height: "80px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              padding: "8px",
              fontSize: "14px",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginRight: "10px",
                padding: "6px 12px",
                border: "none",
                borderRadius: "6px",
                backgroundColor: "#ccc",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={sendMessageToAdmins}
              disabled={loading}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "6px",
                backgroundColor: "#475C6F",
                color: "white",
                cursor: "pointer",
              }}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
