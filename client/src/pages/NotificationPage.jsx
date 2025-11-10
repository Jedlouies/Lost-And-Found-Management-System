import React, { useEffect, useState } from "react";
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import "../user_pages/styles/UserNotificationPage.css";
import "../pages/styles/NotificationPage.css";
import FloatingAlert from "../components/FloatingAlert";
import { 
    getDatabase, 
    ref, 
    onValue, 
    remove,
    update, 
    get, 
    runTransaction,
    push,
    set, // <--- FIX 1: Added missing 'set' function
    serverTimestamp as rtdbServerTimestamp,
} from "firebase/database";
import { getAuth } from "firebase/auth";

const typeConfig = {
  "transaction": { title: "Transaction Processed", icon: "bi-cash-stack", color: "green" },
  "system": { title: "System Update", icon: "bi-gear-fill", color: "#007bff" },
  "reminder": { title: "Reminder", icon: "bi-bell-fill", color: "orange" },
  "item": { title: "Item Update", icon: "bi-info-circle", color: "#062949ff" },
};


function ConversationPanel({ conversation, onClose, adminName, onReply, onResolve, allConversations }) {
    const [replyText, setReplyText] = useState('');

    const liveConvosArray = allConversations[conversation.user.uid] || [];
    const liveConversation = liveConvosArray.find(c => c.id === conversation.id) || conversation;
    
    const messages = liveConversation.messages ? Object.entries(liveConversation.messages).map(([id, msg]) => ({ id, ...msg })) : [];
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    
    messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    useEffect(() => {
        const user = getAuth().currentUser;
        if (!user || !liveConversation.user?.uid || liveConversation.status !== 'open') return;

        const db = getDatabase();
        const convoMessagesRef = ref(db, `userConversations/${liveConversation.user.uid}/conversations/${liveConversation.id}/messages`);
        
        get(convoMessagesRef).then(snapshot => {
            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach(childSnapshot => {
                    const msg = childSnapshot.val();
                    if (msg.from === 'user' && msg.read === false) {
                        updates[`${childSnapshot.key}/read`] = true;
                    }
                });
                
                if (Object.keys(updates).length > 0) {
                     update(convoMessagesRef, updates)
                        .then(() => console.log("Successfully marked messages as read."))
                        .catch(err => console.error("FAILED to mark user messages as read:", err)); 
                }
            }
        });
    }, [liveConversation.id, liveConversation.user?.uid, liveConversation.status]);

    useEffect(() => {
        const chatWindow = document.getElementById('chat-area');
        if (chatWindow) {
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    }, [messages.length]); 

    const handleReply = () => {
        if (replyText.trim()) {
            onReply(liveConversation.user.uid, liveConversation.id, replyText);
            setReplyText('');
        }
    };

    return (
        <div className="conversation-panel-modal-admin">
            <div className="panel-header-admin">
                <h3>{liveConversation.subject}</h3>
                <span className={`status-badge status-${liveConversation.status}`}>
                    {liveConversation.status.toUpperCase()}
                </span>
                <button onClick={onClose} className="close-btn-admin">
                    &times;
                </button>
            </div>
            
            <div className="panel-user-info-admin">
                User: <strong>{liveConversation.user.name}</strong> (UID: {liveConversation.user.uid})
            </div>

            <div className="chat-area-admin" id="chat-area">
                {messages.map(msg => (
                    <div key={msg.id} className={`chat-message-admin message-${msg.from}`}>
                        <div className="message-bubble-admin">
                            <strong>{msg.from === 'user' ? liveConversation.user.name : adminName}:</strong>
                            <p dangerouslySetInnerHTML={{ __html: msg.text }} style={{color: 'black'}}/>
                        </div>
                        <small className="message-timestamp-admin" style={{color: 'black'}}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '...'}
                        </small>
                    </div>
                ))}
            </div>

                <div className="panel-footer-admin">
                {liveConversation.status === 'open' ? (
                    <>
                    <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                        if (e.shiftKey) {
                            return;
                        } else {
                            e.preventDefault();
                            handleReply();
                        }
                        }
                    }}
                    placeholder="Type your response..."
                    rows="2"
                    className="reply-input-admin"
                    />
                    <div className="reply-actions-admin">
                        <button onClick={handleReply} disabled={!replyText.trim()} className="reply-btn-admin">
                        Send Reply
                        </button>
                        <button
                        onClick={() => setShowConfirmModal(true)}
                        className="resolve-btn-admin"
                        >
                        Resolve & Close
                        </button>
                    </div>
                    </>
                ) : (
                    <p className="resolved-text-admin">This conversation is marked as resolved.</p>
                )}
                </div>
                {showConfirmModal && (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal">
            <h4>Confirm Resolution</h4>
            <p>Are you sure you want to mark this conversation as resolved and close it?</p>
            <div className="confirm-actions">
                <button
                className="confirm-btn"
                onClick={() => {
                    onResolve(liveConversation.user.uid, liveConversation.id);
                    setShowConfirmModal(false);
                }}
                >
                Yes, Close Conversation
                </button>
                <button
                className="cancel-btn"
                onClick={() => setShowConfirmModal(false)}
                >
                Cancel
                </button>
            </div>
            </div>
        </div>
        )}

        </div>

    );

}
// --- Main Admin Notification Page ---
function NotificationPage() {
  const [groupedSystemNotifications, setGroupedSystemNotifications] = useState({});
  const [allConversations, setAllConversations] = useState({}); // {uid: {convoId: data}}
  const [activeConversation, setActiveConversation] = useState(null);
  const [alert, setAlert] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const adminName = user ? (user.displayName || user.email) : 'Admin';


  // --- Firebase Listeners ---
  useEffect(() => {
    if (!user) return;
    const db = getDatabase();
    const adminUid = user.uid;
    
    // 1. System Notifications (Listen to admin's own UID)
    const systemNotifsRef = ref(db, `notifications/${adminUid}`);
    const unsubscribeSystem = onValue(systemNotifsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        
        // Filter out user-message types as they are handled in the conversation panel
        const systemNotifs = parsed.filter(n => n.type !== 'user-message');

        systemNotifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const limited = systemNotifs.slice(0, 20);
        setGroupedSystemNotifications(groupByDate(limited));
      } else {
        setGroupedSystemNotifications({});
      }
    });


    // 2. All User Conversations (Listen to the root node for ALL users)
    const allConvosRef = ref(db, `userConversations`);
    const unsubscribeConvos = onValue(allConvosRef, (snapshot) => {
        const conversationsByUid = {};

        if (snapshot.exists()) {
            snapshot.forEach(userSnapshot => {
                const uid = userSnapshot.key;
                const convosData = userSnapshot.child('conversations').val(); 
                
                if (convosData) {
                    conversationsByUid[uid] = Object.entries(convosData)
                        .map(([convoId, data]) => {
                            let unreadUserMessages = 0;
                            if (data.messages) {
                                unreadUserMessages = Object.values(data.messages)
                                    .filter(msg => msg.from === 'user' && msg.read === false).length;
                            }
                            
                            // FIX: Ensure mandatory fields have safe fallbacks
                            const conversationStatus = data.status || 'open';
                            const lastActivityTime = data.lastMessageAt || data.startedAt || 0;

                            return { 
                                id: convoId, 
                                unreadCount: unreadUserMessages,
                                // FIX: Ensure user name is always available
                                user: { uid, name: data.user?.name || `User ${uid.substring(0, 4)}` }, 
                                status: conversationStatus,
                                lastMessageAt: lastActivityTime,
                                ...data 
                            };
                        })
                        .filter(convo => convo.status === 'open') // Only show open convos in the panel
                        .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)); // Sort by recent activity
                }
            });
        }
        setAllConversations(conversationsByUid);
    });


    return () => {
        unsubscribeSystem();
        unsubscribeConvos();
    };
  }, [user]);

  // --- Helper Functions ---
  const groupByDate = (notifications) => {
    const groups = {}; 
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    notifications.forEach((n) => {
      const ts = n.timestamp ? new Date(n.timestamp) : new Date();
      const diffDays = Math.floor((now.getTime() - ts.getTime()) / day);

      let groupName;
      if (diffDays === 0) groupName = "Today";
      else if (diffDays === 1) groupName = "Yesterday";
      else if (diffDays <= 7) groupName = "Last 7 Days";
      else groupName = "Older";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(n);
    });

    return Object.fromEntries(
        Object.entries(groups).filter(([, items]) => items.length > 0)
    );
  };

  // --- Conversation Actions ---
  const handleOpenConversation = (convo) => {
    setActiveConversation(convo);
  };

  const handleReply = async (userUid, convoId, text) => {
    const db = getDatabase();
    const user = getAuth().currentUser; // Get Admin User for security context
    
    if (!user) {
      setAlert({ message: "Admin authentication failed. Cannot send reply.", type: "error" });
      return;
    }

    const messagesRef = ref(db, `userConversations/${userUid}/conversations/${convoId}/messages`);
    const lastMessageRef = ref(db, `userConversations/${userUid}/conversations/${convoId}`);
    
    try {
        // 1. Push the new admin message
        const newReply = push(messagesRef);
        await set(newReply, { // FIX: 'set' is now imported correctly
            from: 'admin',
            text: text,
            timestamp: rtdbServerTimestamp(),
            read: false, 
        });
    
        // 2. Update the last message time on the conversation thread
        await update(lastMessageRef, {
            lastMessageAt: rtdbServerTimestamp(),
        });
    
        // 3. Send a notification to the user who owns the thread
        const userNotifRef = ref(db, `notifications/${userUid}`);
        await push(userNotifRef, {
            from: { uid: user.uid, name: adminName },
            message: `Admin replied to your conversation: <b>${activeConversation.subject}</b>.`,
            timestamp: rtdbServerTimestamp(),
            type: "user-message",
            read: false,
        });

        setAlert({ message: "Reply sent to user.", type: "success" });

    } catch (error) {
        console.error("Reply Failed, check security rules or path:", error);
        setAlert({ message: "Reply failed. Check database permissions.", type: "error" });
    }
  };

  const handleResolve = async (userUid, convoId) => {
    const db = getDatabase();
    
    try {
        // 1. Decrease the openCount atomically via transaction
        await runTransaction(ref(db, `userConversations/${userUid}/metadata/openCount`), (currentCount) => {
            if (currentCount > 0) {
                return currentCount - 1;
            }
            return currentCount;
        });
    
        // 2. Update the conversation status
        const convoStatusRef = ref(db, `userConversations/${userUid}/conversations/${convoId}`);
        await update(convoStatusRef, {
            status: 'resolved',
            lastMessageAt: rtdbServerTimestamp(), 
        });

        setAlert({ message: "Conversation resolved and closed.", type: "success" });
        setActiveConversation(null); 
    } catch (error) {
        console.error("Resolve Failed, check security rules or path:", error);
        setAlert({ message: "Resolution failed. Check database permissions.", type: "error" });
    }
  };
  
  // Delete system notification
  const handleDelete = (notifId) => {
    if (!user) return;
    const db = getDatabase();
    const notifRef = ref(db, `notifications/${user.uid}/${notifId}`);
    remove(notifRef)
      .then(() => {
        setAlert({ message: "Notification Deleted", type: "success" });
      })
      .catch((err) => console.error("Error deleting notification:", err));
  };


  // --- Render Logic ---
  const allOpenConvosList = Object.values(allConversations).flat()
    .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

  const totalOpenConvos = allOpenConvosList.length;
  const totalUnreadConvos = allOpenConvosList.reduce((acc, convo) => acc + convo.unreadCount, 0);


  return (
    <>
      {alert && (
        <FloatingAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <NavigationBar />
      <div className="admin-page-container">
        <BlankHeader />
        <div className="admin-notification-grid">
          
          {/* LEFT PANE: User Conversations */}
          <div className="conversations-pane">
            <h2 className="pane-title">
                User Conversations 
                {totalOpenConvos > 0 && <span> ({totalOpenConvos} Open)</span>}
            </h2>
            <p className="unread-summary-admin">
                Total Unread User Messages: 
                <span className="unread-count-text-admin"> {totalUnreadConvos}</span>
            </p>

            <div className="convo-list-admin">
              {totalOpenConvos === 0 ? (
                <p className="empty-message-admin">No active conversations. Great job!</p>
              ) : (
                allOpenConvosList.map((convo) => (
                  <div
                    key={convo.user.uid + convo.id}
                    className={`convo-item-admin ${convo.unreadCount > 0 ? 'unread-item-admin' : ''} ${activeConversation && activeConversation.id === convo.id ? 'active-item-admin' : ''}`}
                    onClick={() => handleOpenConversation(convo)}
                  >
                    <div className="convo-header-admin">
                        <strong className="convo-subject-admin">{convo.subject}</strong>
                        {convo.unreadCount > 0 && <span className="convo-badge-admin">{convo.unreadCount}</span>}
                    </div>
                    <small className="convo-meta-admin">
                        From: {convo.user.name} | Last: {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleDateString() : 'New'}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANE: System/General Notifications */}
          <div className="system-notifications-pane">
            <h2 className="pane-title">System & Item Notifications</h2>
            
            {Object.keys(groupedSystemNotifications).length === 0 ? (
                <p className="empty-message-admin">No new system or item notifications.</p>
            ) : (
                Object.entries(groupedSystemNotifications).map(
                    ([section, items]) =>
                        items.length > 0 && (
                            <div key={section}>
                                <h3 className="section-header-admin">{section}</h3>
                                {items.map((n) => {
                                    const config = typeConfig[n.type] || { title: "Notification", icon: "bi-info-circle", color: "#062949ff" };

                                    return (
                                        <div className="system-card-admin" key={n.id}>
                                            <div className="card-content-admin">
                                                <i className={`bi ${config.icon}`} style={{ color: config.color, fontSize: "20px" }}></i>
                                                <div className="card-text-admin">
                                                    <strong style={{ color: config.color }}>{config.title}</strong>
                                                    <span dangerouslySetInnerHTML={{ __html: n.message }} />
                                                </div>
                                            </div>
                                            <div className="card-actions-admin">
                                                <small>{n.timestamp ? new Date(n.timestamp).toLocaleString() : "Just now"}</small>
                                                <button onClick={() => handleDelete(n.id)} className="delete-btn-admin" title="Delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                )
            )}
          </div>

        </div>
      </div>
      
      {/* Conversation Panel Modal (Slides in from the right) */}
      {activeConversation && (
        <ConversationPanel 
            allConversations={allConversations} 
            conversation={activeConversation}
            onClose={() => setActiveConversation(null)}
            onReply={handleReply}
            onResolve={handleResolve}
            adminName={adminName}
        />
      )}

      {/* Required CSS for the UI (Conceptual) */}
      <style>
      {`
        .admin-page-container {
            padding: 0px;
            padding-left: 70px;
            width: 105%;
            background-color: #f0f2f5;
            min-height: 100vh;
        }
        .admin-notification-grid {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        .conversations-pane, .system-notifications-pane {
            background-color: white;
            margin: 20px;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            flex: 1; 
            overflow-y: auto;
        }
        .pane-title {
            font-size: 24px;
            font-weight: bold;
            color: #143447;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #eee;
        }
        .unread-summary-admin {
            font-size: 16px;
            margin-bottom: 15px;
            color: #333;
        }
        .unread-count-text-admin {
            color: red;
            font-weight: bold;
        }
        .convo-list-admin {
            /* Max height removed as pane handles overflow now */
        }
        .convo-item-admin {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .convo-item-admin:hover {
            background-color: #f9f9f9;
        }
        .unread-item-admin {
            border-left: 5px solid #143447;
            background-color: #e6f7ff;
            font-weight: bold;
        }
        .active-item-admin {
            border: 2px solid #007bff;
            background-color: #e6f7ff;
        }
        .convo-header-admin {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .convo-badge-admin {
            background-color: red;
            color: white;
            border-radius: 50%;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: bold;
        }
        .convo-meta-admin {
            display: block;
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
        .section-header-admin {
            font-size: 16px;
            font-weight: 600;
            color: #6c757d;
            margin-top: 15px;
            margin-bottom: 10px;
        }
        .system-card-admin {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .card-content-admin {
            display: flex;
            gap: 10px;
            flex: 1;
        }
        .card-text-admin {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        .card-actions-admin {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
        }
        .delete-btn-admin {
            background: none;
            border: none;
            cursor: pointer;
            color: #dc3545;
        }
        .empty-message-admin {
            color: #666;
            padding: 20px 0;
            text-align: center;
        }

        /* --- Conversation Panel Styles (Admin) --- */
        .conversation-panel-modal-admin {
            position: fixed;
            top: 0;
            right: 0;
            width: 400px; 
            height: 100vh;
            background-color: white;
            box-shadow: -5px 0 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease-out; /* Enable slide animation */
        }
        .panel-header-admin {
            padding: 15px;
            border-bottom: 1px solid #eee;
            display: flex;
            gap: 15px;
            justify-content: space-between;
            align-items: center;
            background-color: #143447;
        }
        .panel-header-admin h3 {
            margin: 0;
            font-size: 18px;
            color: white;
            flex: 1;
        }
        .panel-user-info-admin {
            padding: 10px 15px;
            background-color: #f4f7f9;
            font-size: 14px;
            border-bottom: 1px solid #eee;
        }
        .chat-area-admin {
            flex-grow: 1;
            padding: 15px;
            overflow-y: auto;
            background-color: #f8f8f8;
        }
        .chat-message-admin {
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
        }
        .message-user {
            align-items: flex-end;
        }
        .message-admin {
            align-items: flex-start;
        }
        .message-bubble-admin {
            max-width: 80%;
            padding: 10px;
            border-radius: 15px;
            line-height: 1.4;
            box-shadow: 0 1px 1px rgba(0,0,0,0.05);
            background-color: #e0f7fa; /* User message color */
            color: #000000;
        }
        .message-admin .message-bubble-admin {
            background-color: #ffffff; /* Admin message color */
            border: 1px solid #eee;
        }
        .message-timestamp-admin {
            font-size: 10px;
            margin-top: 2px;
            color: #999;
        }
        .panel-footer-admin {
            padding: 15px;
            border-top: 1px solid #eee;
        }
        .reply-input-admin {
            width: 100%;
            background-color: #f4f7f9;
            color: black;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            resize: none;
            margin-bottom: 10px;
        }
        .reply-actions-admin {
            display: flex;
            justify-content: space-between;
        }
        .reply-btn-admin {
            background-color: #143447;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .resolve-btn-admin {
            background-color: #dc3545;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        .status-badge {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
        }
        .status-open {
            background-color: #ffc107;
            color: #333;
        }
        .status-resolved {
            background-color: #28a745;
            color: white;
        }
            .confirm-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        }

        .confirm-modal {
        background: #fff;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        width: 350px;
        text-align: center;
        animation: fadeIn 0.3s ease;
        }

        .confirm-modal h4 {
        color: #143447;
        margin-bottom: 10px;
        }

        .confirm-modal p {
        color: #333;
        font-size: 14px;
        margin-bottom: 20px;
        }

        .confirm-actions {
        display: flex;
        justify-content: space-around;
        gap: 10px;
        }

        .confirm-btn {
        background-color: #28a745;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: 0.2s ease;
        }

        .confirm-btn:hover {
        background-color: #218838;
        }

        .cancel-btn {
        background-color: #dc3545;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: 0.2s ease;
        }

        .cancel-btn:hover {
        background-color: #c82333;
        }

        @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
        }

      `}
      </style>
    </>
  );
}

export default NotificationPage;