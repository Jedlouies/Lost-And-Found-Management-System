import React, { useEffect, useState } from "react";
import NavigationBar from "../components/NavigationBar";
import BlankHeader from "../components/BlankHeader";
import "./styles/NotificationPage.css";

import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import FloatingAlert from "../components/FloatingAlert";

function NotificationPage() {
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

        // Sort newest first
        parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Limit to 20
        const limited = parsed.slice(0, 20);

        // Group notifications
        const grouped = groupByDate(limited);
        setGroupedNotifications(grouped);

        // 🔹 Mark all as read once user opens NotificationPage
        const updates = {};
        Object.keys(data).forEach((key) => {
          if (!data[key].read) {
            updates[`${key}/read`] = true;
          }
        });
        if (Object.keys(updates).length > 0) {
          update(notificationsRef, updates);
        }
      } else {
        setGroupedNotifications({});
      }
    });

    return () => unsubscribe();
  }, []);

  // Group notifications by Today, Yesterday, Last Week, Last Month
  const groupByDate = (notifications) => {
    const groups = {
      Today: [],
      Yesterday: [],
      "Last Week": [],
      "Last Month": [],
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
      <NavigationBar />
      <div className="notification-body">
        {alert && (
          <FloatingAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}
        <BlankHeader />
        <div className="notification-container">
          <h2 style={{ fontSize: "40px", fontWeight: "bold" }}>
            Notifications
          </h2>

          {Object.keys(groupedNotifications).every(
            (key) => groupedNotifications[key].length === 0
          ) ? (
            <p>No notifications yet</p>
          ) : (
            Object.entries(groupedNotifications).map(
              ([section, items]) =>
                items.length > 0 && (
                  <div key={section}>
                    <h3
                      style={{
                        fontSize: "18px",
                        marginTop: "20px",
                        marginLeft: "600px",
                      }}
                    >
                      {section}
                    </h3>
                    {items.map((n) => (
                      <div className="notification-card" key={n.id}>
                        <p dangerouslySetInnerHTML={{ __html: n.message }} />
                        <small>
                          {n.timestamp
                            ? new Date(n.timestamp).toLocaleString()
                            : "Just now"}
                        </small>

                        <button
                          onClick={() => handleDelete(n.id)}
                          className="delete-btn"
                          title="Delete notification"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            className="bi bi-trash3"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )
            )
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationPage;
