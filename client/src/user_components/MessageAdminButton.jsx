  import React, { useState, useEffect, useRef } from "react"; 
  import { db } from "../firebase";
  import { getDocs, collection, query, where } from "firebase/firestore";

  import {
    getDatabase,
    ref,
    push,
    set,
    serverTimestamp as rtdbServerTimestamp,
    runTransaction,
    child,
    onValue,
    get,
    update,
  } from "firebase/database";

  import { useAuth } from "../context/AuthContext"; 
  import { getAuth } from "firebase/auth"; 
  import FloatingAlert from "../components/FloatingAlert";

  const dbRealtime = getDatabase();
  const MAX_OPEN_CONVERSATIONS = 5;

  function ConversationView({ conversation, onClose, onReply, onBackToList }) {
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const { currentUser } = useAuth();

    if (!conversation) return null;

    const messages = conversation.messages
      ? Object.entries(conversation.messages)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      : [];

    const chatAreaRef = useRef(null);

    useEffect(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, [messages.length]);

    useEffect(() => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !conversation.id || conversation.status !== 'open') return;

      const db = getDatabase();
      const convoMessagesRef = ref(db, `userConversations/${user.uid}/conversations/${conversation.id}/messages`);

      get(convoMessagesRef).then(snapshot => {
        if (snapshot.exists()) {
          const updates = {};
          snapshot.forEach(childSnapshot => {
            const msg = childSnapshot.val();
            if (msg.from === 'admin' && msg.read === false) {
              updates[`${childSnapshot.key}/read`] = true;
            }
          });
          if (Object.keys(updates).length > 0) {
            update(convoMessagesRef, updates).catch(err => console.error("Failed to mark messages as read:", err));
          }
        }
      });
    }, [conversation.id, messages.length]);

    const handleSendReply = async () => {
      if (!replyText.trim() || sending) return;
      setSending(true);
      try {
        await onReply(conversation.id, replyText);
        setReplyText("");
      } catch (error) {
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="conversation-view-panel">
          <button onClick={onBackToList} className="back-button">
              &larr; Back to List
          </button>
        <div className="panel-header">
          <h3>{conversation.subject}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="status-container">
          <span>Status: <span style={{ color: conversation.status === 'open' ? 'orange' : 'green', fontWeight: 'bold' }}>{conversation.status.toUpperCase()}</span></span>
          <span className="last-activity">Last: {new Date(conversation.lastMessageAt).toLocaleTimeString()}</span>
        </div>
        <div className="chat-area" ref={chatAreaRef}>
          {messages.length === 0 ? (
            <p className="empty-chat">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.from === 'user' ? 'user' : 'admin'}`}>
                <div className="message-bubble">
                  <span className="message-sender">{msg.from === 'user' ? 'You' : 'Admin'}:</span>
                  <p className="message-text">{msg.text}</p>
                  <span className="message-timestamp">
                    {new Date(msg.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="panel-footer">
          {conversation.status === 'open' ? (
            <div className="reply-input-container">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="reply-input"
                rows="2"
                disabled={sending}
              />
              <button onClick={handleSendReply} disabled={!replyText.trim() || sending} className="send-button">
                {sending ? (
                    <div className="spinner"></div> 
                ) : (
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        fill="currentColor" 
                        viewBox="0 0 16 16"
                    >
                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.5 9.75a.75.75 0 0 1 .124-1.33L15.314.036a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.155 2.113 6.636 10.07Z"/>
                    </svg>
                )}
              </button>
            </div>
          ) : (
            <p className="resolved-text">This conversation is marked as RESOLVED.</p>
          )}
        </div>
      </div>
    );
  }

  export default function MessageAdminButton({ onSendSuccess, onSendError }) {
    const { currentUser } = useAuth();
    const [alertState, setAlertState] = useState({ message: "", type: "info", visible: false });
    const userName = currentUser?.firstName && currentUser?.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser?.email || "Unknown User";
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [isViewConvoModalOpen, setIsViewConvoModalOpen] = useState(false);
    const [conversationSubject, setConversationSubject] = useState("");
    const [initialMessage, setInitialMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [openConversationCount, setOpenConversationCount] = useState(0);
    const [activeConversations, setActiveConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);

    const showAlert = (message, type = "info") => {
      setAlertState({ message, type, visible: true });
      setTimeout(() => setAlertState(prev => ({ ...prev, visible: false })), 3000);
    };
    const handleSuccess = (message) => { showAlert(message, "success"); if (onSendSuccess) onSendSuccess(message); };
    const handleError = (message) => { showAlert(message, "error"); if (onSendError) onSendError(message); };

    useEffect(() => { 
        if (!currentUser?.uid) return;
        const convosRootRef = ref(dbRealtime, `userConversations/${currentUser.uid}/conversations`);
        const unsubscribe = onValue(convosRootRef, (snapshot) => {
          let count = 0;
          const convoList = [];
          if (snapshot.exists()) {
            Object.entries(snapshot.val()).forEach(([id, data]) => {
              const convo = { id, ...data };
              let unreadCount = 0;
              if (convo.messages) {
                unreadCount = Object.values(convo.messages).filter((msg) => msg && msg.from === "admin" && msg.read === false).length;
              }
              convo.unreadCount = unreadCount;
              if (convo.status === "open") count++;
              convoList.push(convo);
            });
            convoList.sort((a, b) => {
              if (a.status === "open" && b.status !== "open") return -1;
              if (a.status !== "open" && b.status === "open") return 1;
              return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
            });
          }
          setOpenConversationCount(count);
          setActiveConversations(convoList);
          setSelectedConversation((prev) => {
            if (!prev) return null;
            const updated = convoList.find((c) => c.id === prev.id);
            return updated || null;
          });
        }, (error) => {
          console.error("Error listening to conversations:", error);
          handleError("Could not load conversations.");
        });
        return () => unsubscribe();
    }, [currentUser?.uid]);

    const startNewConversation = async () => { 
        if (!currentUser || !currentUser.uid) return handleError("User not logged in.");
        if (!conversationSubject.trim() || !initialMessage.trim()) return handleError("Subject and message are required.");
        if (openConversationCount >= MAX_OPEN_CONVERSATIONS) {
            alert(`Limit Reached: You already have ${MAX_OPEN_CONVERSATIONS} open conversations.`); return;
        }
        setLoading(true);
        try {
            const userConvoRef = ref(dbRealtime, `userConversations/${currentUser.uid}/conversations`);
            const newConvoRef = push(userConvoRef); const newConvoId = newConvoRef.key;
            if (!newConvoId) throw new Error("Failed to create conversation ID.");
            const messagesRef = child(newConvoRef, "messages"); const initialMessageRef = push(messagesRef); const initialMessageId = initialMessageRef.key;
            if (!initialMessageId) throw new Error("Failed to create message ID.");
            const conversationData = {
                status: "open", subject: conversationSubject.trim(), startedAt: rtdbServerTimestamp(), lastMessageAt: rtdbServerTimestamp(),
                user: { uid: currentUser.uid, name: userName },
                messages: { [initialMessageId]: { from: "user", text: initialMessage.trim(), timestamp: rtdbServerTimestamp(), read: false } }
            };
            const openCountRef = ref(dbRealtime, `userConversations/${currentUser.uid}/metadata/openCount`);
            const countSnapshotBefore = await get(openCountRef); const currentValBefore = countSnapshotBefore.val() || 0;
            if (currentValBefore >= MAX_OPEN_CONVERSATIONS) throw new Error("Conversation limit reached concurrently.");
            await runTransaction(openCountRef, (currentCount) => { const currentVal = currentCount || 0; if (currentVal >= MAX_OPEN_CONVERSATIONS) return; return currentVal + 1; });
            const countSnapshotAfter = await get(openCountRef); if ((countSnapshotAfter.val() || 0) <= currentValBefore) throw new Error("Failed to update conversation count.");
            await set(newConvoRef, conversationData);
            const adminQuery = query(collection(db, "users"), where("role", "==", "admin")); const adminSnap = await getDocs(adminQuery);
            const notificationsPromises = adminSnap.docs.map(adminDoc => {
                const adminId = adminDoc.id; const notifRef = ref(dbRealtime, `notifications/${adminId}`); const newNotif = push(notifRef);
                return set(newNotif, { from: { uid: currentUser.uid, name: userName }, message: `<b>NEW CONVERSATION:</b> ${conversationSubject.trim()}`, timestamp: rtdbServerTimestamp(), type: "user-message", read: false, convoId: newConvoId, userUid: currentUser.uid });
            }); await Promise.all(notificationsPromises);
            setConversationSubject(""); setInitialMessage(""); setIsNewConvoModalOpen(false); handleSuccess(`New conversation started: "${conversationSubject.trim()}"`);
            const localNewConvo = { id: newConvoId, subject: conversationData.subject, status: 'open', lastMessageAt: Date.now(), messages: { [initialMessageId]: { id: initialMessageId, from: 'user', text: conversationData.messages[initialMessageId].text, timestamp: Date.now(), read: false } }, unreadCount: 0, user: conversationData.user };
            setSelectedConversation(localNewConvo); setIsViewConvoModalOpen(true);
        } catch (error) { console.error("Error starting new conversation:", error); handleError(error.message || "Failed to start conversation."); } finally { setLoading(false); }
    };
    const handleUserReply = async (convoId, text) => { /* ... Keep handleUserReply logic ... */
        if (!currentUser?.uid) { handleError("User not authenticated."); throw new Error("User not authenticated."); }
        if (!text.trim()) return;
        const userUid = currentUser.uid; const messagesRef = ref(dbRealtime, `userConversations/${userUid}/conversations/${convoId}/messages`); const convoRef = ref(dbRealtime, `userConversations/${userUid}/conversations/${convoId}`);
        try {
            const newReplyRef = push(messagesRef); await set(newReplyRef, { from: "user", text: text.trim(), timestamp: rtdbServerTimestamp(), read: false });
            await update(convoRef, { lastMessageAt: rtdbServerTimestamp() });
            const adminQuery = query(collection(db, "users"), where("role", "==", "admin")); const adminSnap = await getDocs(adminQuery);
            const currentConvo = activeConversations.find(c => c.id === convoId); const currentConvoSubject = currentConvo ? currentConvo.subject : 'N/A';
            const notificationsPromises = adminSnap.docs.map(adminDoc => {
                const adminId = adminDoc.id; const notifRef = ref(dbRealtime, `notifications/${adminId}`); const newNotif = push(notifRef);
                return set(newNotif, { from: { uid: userUid, name: userName }, message: `User ${userName} replied to conversation: ${currentConvoSubject}`, timestamp: rtdbServerTimestamp(), type: "user-message", read: false, convoId: convoId, userUid: userUid });
            }); await Promise.all(notificationsPromises);
            handleSuccess("Reply sent.");
        } catch (error) { console.error("Error sending user reply:", error); handleError("Failed to send reply."); throw error; }
    };
    const handleOpenNewConvoModal = () => { 
        if (openConversationCount >= MAX_OPEN_CONVERSATIONS) { alert(`Limit Reached: You have ${MAX_OPEN_CONVERSATIONS} active conversations.`); return; }
        setConversationSubject(""); setInitialMessage(""); setIsNewConvoModalOpen(true);
    };
    const handleViewConvoList = () => { setSelectedConversation(null); setIsViewConvoModalOpen(true); };
    const handleOpenSpecificConvo = (convo) => { setSelectedConversation(convo); };
    const closeViewModal = () => { setIsViewConvoModalOpen(false); setSelectedConversation(null); };
    const totalUnread = activeConversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);

    return (
      <>
        {alertState.visible && (
          <FloatingAlert
              message={alertState.message}
              type={alertState.type}
              onClose={() => setAlertState({ ...alertState, visible: false })}
          />
        )}

        <button onClick={handleViewConvoList} className="fab">
          💬
          {totalUnread > 0 && (
            <span className="fab-badge">{totalUnread}</span>
          )}
        </button>

        {isNewConvoModalOpen && (
          <div className="modal-overlay" onClick={() => setIsNewConvoModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Start New Conversation ({openConversationCount}/{MAX_OPEN_CONVERSATIONS})</h3>
              <label htmlFor="convoSubject">Subject (Max 50 chars)</label>
              <input
                id="convoSubject"
                type="text"
                value={conversationSubject}
                onChange={(e) => setConversationSubject(e.target.value)}
                placeholder="e.g., Report Bug, Question..."
                maxLength={50}
              />
              <label htmlFor="initialMessage">Initial Message</label>
              <textarea
                id="initialMessage"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Describe your issue..."
                rows="4"
                maxLength={500}
              />
              <div className="button-container">
                <button onClick={() => setIsNewConvoModalOpen(false)} className="cancel-button">
                  Cancel
                </button>
                <button
                  onClick={startNewConversation}
                  disabled={loading || !conversationSubject.trim() || !initialMessage.trim()}
                  className="send-button"
                >
                  {loading ? <div className="spinner-small"></div> : "Start Conversation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isViewConvoModalOpen && (
          <div className="modal-overlay" onClick={closeViewModal}>
            {selectedConversation ? (
              <div className="modal-content-full" onClick={(e) => e.stopPropagation()}>
                <ConversationView
                  conversation={selectedConversation}
                  onClose={closeViewModal}
                  onReply={handleUserReply}
                  onBackToList={() => setSelectedConversation(null)}
                />
              </div>
            ) : (
              <div className="modal-content list-modal" onClick={(e) => e.stopPropagation()}>
                <div className="list-header">
                  <h3>Your Conversations ({openConversationCount} Open)</h3>
                  <button onClick={closeViewModal} className="close-btn list-close-btn">&times;</button>
                </div>
                <div className="convo-list-container">
                  {activeConversations.length === 0 && <p className="empty-list">No conversations yet.</p>}
                  {activeConversations.map((convo) => {
                    const unreadCount = convo.unreadCount || 0;
                    const convoId = convo.id || `unknown-${Math.random()}`;
                    const convoSubject = convo.subject || "No Subject";
                    const convoStatus = convo.status || "unknown";
                    const convoLastMessageAt = convo.lastMessageAt || Date.now();
                    return (
                      <div
                        key={convoId}
                        className={`convo-list-item ${unreadCount > 0 ? 'unread' : ''} ${convoStatus === 'resolved' ? 'resolved' : ''}`}
                        onClick={() => handleOpenSpecificConvo(convo)}
                      >
                        <div className="convo-info">
                          <span className={`convo-subject ${unreadCount > 0 ? 'unread-subject' : ''}`}>
                            {convoSubject}
                          </span>
                          <span className="convo-meta">
                            <span style={{ 
                                fontWeight: 'bold', 
                                color: convoStatus === 'open' ? 'green' : 'red'
                            }}>
                              {convoStatus.toUpperCase()}
                            </span>
                            {' | Last: '}
                            {new Date(convoLastMessageAt).toLocaleDateString()}
                          </span>
                        </div>
                        {unreadCount > 0 && <span className="convo-badge">{unreadCount}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="list-footer">
                  {openConversationCount < MAX_OPEN_CONVERSATIONS && (
                      <button className="start-new-button" onClick={() => { setIsViewConvoModalOpen(false); setTimeout(handleOpenNewConvoModal, 100); }}>
                        + Raise a concern ({openConversationCount}/{MAX_OPEN_CONVERSATIONS})
                      </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <style jsx global>{`
          .fab {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: #143447; /* Dark blue */
            color: white;
            font-size: 28px;
            border: none;
            cursor: pointer;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.3);
            z-index: 1050;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .fab-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: red;
            color: white;
            border-radius: 50%;
            width: 22px;
            height: 22px;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 1px solid white;
          }
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1100;
          }
          .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            width: 90%;
            max-width: 400px; /* Max width for new convo modal */
            display: flex;
            flex-direction: column;
            gap: 10px; /* Space between elements */
          }
          .modal-content h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #143447;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .modal-content label {
            font-weight: 600;
            font-size: 0.9em;
            color: #333;
          }
          .modal-content input,
          .modal-content textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 1em;
            margin-bottom: 5px; 
            box-sizing: border-box; 
            resize: vertical; 
            background-color: #f9f9f9;
            color: #333;
          }
          .modal-content textarea {
              min-height: 80px;
          }
          .button-container {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
          }
          .modal-content button {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 600;
          }
          .cancel-button {
            background-color: #e5e5ea;
            color: #007AFF;
          }
          .send-button {
            background-color: #007AFF;
            color: white;
          }
          .send-button:disabled {
            background-color: #AECBFA;
            cursor: not-allowed;
          }
          .spinner-small {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 2px solid white;
            width: 14px;
            height: 14px;
            animation: spin 1s linear infinite;
          }

          .modal-content.list-modal {
            max-width: 500px;
            padding: 0;
            max-height: 80vh;
            display: flex; 
            flex-direction: column;
            overflow: hidden; 
          }
          .list-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 15px;
              border-bottom: 1px solid #eee;
              background-color: #f9f9f9;
              flex-shrink: 0; /* Prevent header from shrinking */
          }
          .list-header h3 {
              border-bottom: none;
              padding-bottom: 0;
              margin-bottom: 0;
              flex-grow: 1;
          }
          .list-close-btn {
              background: none;
              border: none;
              font-size: 24px;
              color: #555;
              padding: 0 5px;
              cursor: pointer;
          }
          .convo-list-container {
              overflow-y: auto; 
              flex-grow: 1; 
              padding: 0; 
          }
          .convo-list-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 15px; /* Add padding here */
              border-bottom: 1px solid #f0f0f0;
              cursor: pointer;
              transition: background-color 0.2s;
          }
          .convo-list-item:hover { background-color: #f5f5f5; }
          .convo-info { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; margin-right: 10px; }
          .convo-subject { font-size: 1em; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .convo-subject.unread-subject { font-weight: bold; }
          .convo-meta { font-size: 0.8em; color: #666; margin-top: 3px; }
          .convo-list-item.unread { background-color: #eef7ff; }
          .convo-list-item.resolved { opacity: 1; color: #ff0000ff; }
          .convo-badge { background-color: #007AFF; color: white; border-radius: 50%; min-width: 20px; height: 20px; padding: 0 6px; font-size: 12px; font-weight: bold; display: flex; justify-content: center; align-items: center; }

          .empty-list {
              text-align: center;
              color: #999;
              padding: 30px 15px;
          }
          .list-footer {
              padding: 10px 15px; /* Padding for the footer */
              border-top: 1px solid #eee;
              background-color: #f9f9f9;
              flex-shrink: 0; /* Prevent footer from shrinking */
          }
          .start-new-button {
            display: block;
            background-color: #007AFF;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            /* Remove margin: 15px; */
            cursor: pointer;
            text-align: center;
            font-weight: 600;
            width: 100%; /* Make button full width in footer */
          }

          .modal-content-full {
              width: 100%;
              height: 100%;
              background-color: #f0f2f5;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
              position: relative;
              display: flex; /* Make it flex for ConversationView */
              flex-direction: column; /* Stack ConversationView vertically */
          }

          .conversation-view-panel { display: flex; flex-direction: column; height: 100%; background-color: #f0f2f5; position: relative; }
          .back-button { position: absolute; top: 10px; left: 10px; background-color: rgba(0,0,0,0.5); color: white; border: none; border-radius: 6px; padding: 5px 10px; cursor: pointer; z-index: 10; font-size: 0.9em; }
          .conversation-view-panel .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background-color: white; border-bottom: 1px solid #eee; flex-shrink: 0;}
          .conversation-view-panel .panel-header h3 { margin: 0; font-size: 1.1em; color: #143447; flex-grow: 1; margin-right: 10px; padding-left: 80px; text-align: center; }
          .conversation-view-panel .close-btn { background: none; border: none; font-size: 24px; color: #555; cursor: pointer; padding: 0 5px; }
          .conversation-view-panel .status-container { display: flex; justify-content: space-between; padding: 8px 15px; background-color: #f9f9f9; border-bottom: 1px solid #eee; font-size: 0.85em; color: #333; flex-shrink: 0;}
          .conversation-view-panel .last-activity { color: #666; }
          .conversation-view-panel .chat-area { flex-grow: 1; overflow-y: auto; padding: 15px; background-color: #e5ddd5; }
          .conversation-view-panel .empty-chat { text-align: center; color: #777; padding: 20px; }
          .conversation-view-panel .message-row { display: flex; margin-bottom: 10px; }
          .conversation-view-panel .message-row.user { justify-content: flex-end; }
          .conversation-view-panel .message-row.admin { justify-content: flex-start; }
          .conversation-view-panel .message-bubble { min-width: 10%; max-width: 75%; padding: 20px 20px; border-radius: 12px; box-shadow: 0 1px 1px rgba(0,0,0,0.1); position: relative; word-wrap: break-word; }
          .conversation-view-panel .message-row.user .message-bubble { background-color: #dcf8c6; border-top-right-radius: 2px; }
          .conversation-view-panel .message-row.admin .message-bubble { background-color: white; border-top-left-radius: 2px; }
          .conversation-view-panel .message-sender { font-weight: bold; font-size: 0.9em; margin-bottom: 3px; display: block; color: #007AFF; }
          .conversation-view-panel .message-row.user .message-sender { color: #143447; }
          .conversation-view-panel .message-text { font-size: 0.95em; line-height: 1.4; color: #333; margin: 0; padding-bottom: 15px; }
          .conversation-view-panel .message-timestamp { font-size: 0.7em; color: #777; position: absolute; bottom: 5px; right: 10px; }
          .conversation-view-panel .panel-footer { padding: 10px 15px; background-color: #f0f0f0; border-top: 1px solid #ccc; flex-shrink: 0;}
          .conversation-view-panel .reply-input-container { display: flex; align-items: flex-end; gap: 10px; }
          .conversation-view-panel .reply-input { flex-grow: 1; resize: none; border: 1px solid #ccc; border-radius: 18px; padding: 8px 12px; min-height: 36px; max-height: 100px; font-size: 0.95em; background-color: white; box-sizing: border-box; color: black; }
          .conversation-view-panel .send-button { background-color: #007AFF; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 1.2em; flex-shrink: 0; }
          .conversation-view-panel .send-button:disabled { background-color: #AECBFA; cursor: not-allowed; }
          .conversation-view-panel .resolved-text { text-align: center; color: green; font-weight: 600; padding: 10px 0; }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }