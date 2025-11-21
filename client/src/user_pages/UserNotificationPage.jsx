import React, { useEffect, useState } from "react";
import UserNavigationBar from "../user_components/UserNavigationBar";
import UserBlankHeader from "../user_components/UserBlankHeader";
// import "./styles/UserNotificationPage.css"; // Using inline styles
import FloatingAlert from "../components/FloatingAlert";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { getAuth } from "firebase/auth";

// Define notification type icons (TypeConfig from Admin Page)
const typeConfig = {
  "transaction": {
      title: "Claim Status", // Adjusted title for user context
      icon: "bi-cash-stack",
      color: "#28a745", // Green
    },
    "system": {
      title: "System Update",
      icon: "bi-gear-fill",
      color: "#007bff", // Blue
    },
    "reminder": {
      title: "Action Reminder",
      icon: "bi-bell-fill",
      color: "orange",
    },
    "item": {
      title: "Match Alert",
      icon: "bi-info-circle",
      color: "#143447", // Dark Navy
    },
    "user-message": { // Keeping in case user sees their own message notification
      title: "Admin Reply",
      icon: "bi-chat-dots",
      color: "#007bff",
    }
};

// 🎨 MODERN UI STYLES DEFINITION (Adapted from NotificationPage.jsx)
const styles = {
    notificationBody: {
        backgroundColor: '#f0f2f5',
        minHeight: '100vh',
        padding: '20px 0',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    notificationContainer: {
        maxWidth: '800px', // Single column width
        width: '95%',
        margin: '20px auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minHeight: '70vh',
    },
    mainTitle: {
        fontSize: '26px',
        fontWeight: '700',
        color: '#143447',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #007bff',
    },
    sectionHeader: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#6c757d',
        marginTop: '20px',
        marginBottom: '10px',
        borderBottom: '1px solid #eee',
        paddingBottom: '5px',
        marginLeft: '15px',
    },
    systemCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '15px 0',
        borderBottom: '1px solid #eee',
        transition: 'background-color 0.2s',
    },
    cardContent: {
        display: 'flex',
        gap: '15px',
        flex: 1,
        alignItems: 'center',
    },
    cardText: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        fontSize: '14px',
        color: '#333',
        lineHeight: '1.4',
    },
    iconStyle: {
        fontSize: "20px",
        minWidth: '20px',
        flexShrink: 0,
    },
    deleteBtn: {
        background: 'none',
        border: '1px solid #dc3545', 
        borderRadius: '4px',
        padding: '4px',
        cursor: 'pointer',
        color: '#dc3545',
        transition: 'background-color 0.2s',
        marginLeft: '15px', // Push delete button slightly away
    },
    timestamp: {
        fontSize: '11px',
        color: '#999',
        marginTop: '5px',
    },
    emptyMessage: {
        color: '#666',
        padding: '30px 0',
        textAlign: 'center',
        fontStyle: 'italic',
    }
};

function UserNotificationPage() {
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const db = getDatabase();
    const notificationsRef = ref(db, `notifications/${user.uid}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const limited = parsed.slice(0, 20);

        const grouped = groupByDate(limited);
        setGroupedNotifications(grouped);
      } else {
        setGroupedNotifications({});
      }
    });

    return () => unsubscribe();
  }, []);

  const groupByDate = (notifications) => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Last Week": [],
      "Last Month": [],
      "Older": [] // Ensure older items are grouped if logic changes
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    notifications.forEach((n) => {
      const ts = n.timestamp ? new Date(n.timestamp) : new Date();
      if (ts >= today) {
        groups.Today.push(n);
      } else if (ts >= yesterday) {
        groups.Yesterday.push(n);
      } else if (ts >= oneWeekAgo) {
        groups["Last Week"].push(n);
      } else if (ts >= oneMonthAgo) {
        groups["Last Month"].push(n);
      } else {
        groups["Older"].push(n);
      }
    });

    return groups;
  };

  // Delete notification
  const handleDelete = (notifId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const notifRef = ref(db, `notifications/${user.uid}/${notifId}`);
    remove(notifRef)
      .then(() => {
        setAlert({ message: "Notification Deleted", type: "success" });
      })
      .catch((err) => console.error("Error deleting notification:", err));
  };

  return (
    <>
      {alert && (
        <FloatingAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <UserNavigationBar />
        <UserBlankHeader />
      <div style={styles.notificationBody}>
        <div style={styles.notificationContainer}>
          <h2 style={styles.mainTitle}>
            Notifications
          </h2>

          {Object.keys(groupedNotifications).every(
            (key) => groupedNotifications[key].length === 0
          ) ? (
            <p style={styles.emptyMessage}>No notifications yet.</p>
          ) : (
            Object.entries(groupedNotifications).map(
              ([section, items]) =>
                items.length > 0 && (
                  <div key={section}>
                    <h3 style={styles.sectionHeader}>
                      {section}
                    </h3>
                      {items.map((n) => {
                        const config = typeConfig[n.type] || { title: "Notification", icon: "bi-info-circle", color: "#062949ff" };

                        return (
                          <div style={styles.systemCard} key={n.id}>
                            <div style={styles.cardContent}>
                                <i className={`bi ${config.icon}`} style={{ color: config.color, ...styles.iconStyle }}></i>
                                
                                <div style={styles.cardText}>
                                    <strong style={{ color: config.color }}>{config.title}</strong>
                                    <span dangerouslySetInnerHTML={{ __html: n.message }} />
                                    <small style={styles.timestamp}>
                                        {n.timestamp ? new Date(n.timestamp).toLocaleString() : "Just now"}
                                    </small>
                                </div>
                            </div>

                            <button
                              onClick={() => handleDelete(n.id)}
                              style={styles.deleteBtn}
                              title="Delete notification"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="bi bi-trash3"
                                viewBox="0 0 16 16"
                              >
                                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                              </svg>
                            </button>
                            
                          </div>
                        );
                      })}
                  </div>
                )
            )
          )}
        </div>
      </div>
    </>
  );
}

export default UserNotificationPage;