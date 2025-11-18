import React, { useEffect, useState } from "react";
import "./styles/HeaderNotifyDropdown.css";
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { getAuth } from "firebase/auth";
import FloatingAlert from "../components/FloatingAlert";
import { useNavigate } from "react-router-dom";

  const typeConfig = {
  transaction: {
    title: "Transaction Processed",
    icon: "bi-cash-stack",
    color: "green",
  },
  system: {
    title: "System Update",
    icon: "bi-gear-fill",
    color: "#007bff",
  },
  reminder: {
    title: "Reminder",
    icon: "bi-bell-fill",
    color: "orange",
  },
  item: {
    title: "Item Update",
    icon: "bi-info-circle",
    color: "#062949ff",
  },
};

function HeaderNotifyDropdown() {
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [alert, setAlert] = useState(null);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    setUserId(user.uid);

    const db = getDatabase();
    const notificationsRef = ref(db, `notifications/${user.uid}`)

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const limited = parsed.slice(0, 10);

        const grouped = groupByDate(limited);
        setGroupedNotifications(grouped);
      } else {
        setGroupedNotifications({});
      }
    });

    return () => unsubscribe();
  }, []);

  const groupByDate = (notifications) => {
    const groups = { Today: [], Yesterday: [], "Last Week": [], "Last Month": [] };

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
      if (ts >= today) groups.Today.push(n);
      else if (ts >= yesterday) groups.Yesterday.push(n);
      else if (ts >= oneWeekAgo) groups["Last Week"].push(n);
      else if (ts >= oneMonthAgo) groups["Last Month"].push(n);
    });

    return groups;
  };

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

  const handleNavigate = () => {
    navigate(`/admin/notifications/${userId}`);
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
      <div className="notify-body">
        <h4 className="notify-title" style={{ marginTop: "-5px" }}>
          Notifications
        </h4>

        <div className="notify-list">
          {Object.keys(groupedNotifications).every(
            (key) => groupedNotifications[key].length === 0
          ) ? (
            <p className="notify-empty">No recent notifications</p>
          ) : (
            Object.entries(groupedNotifications).map(
              ([section, items]) =>
                items.length > 0 && (
                  <div key={section}>
                    <h5 className="notify-section">{section}</h5>
                    {items.map((n) => {
                      const config =
                        typeConfig[n.type] || {
                          title: "Notification",
                          icon: "bi-info-circle",
                          color: "#062949ff",
                        };

                      return (
                        <div key={n.id} className="notify-item">
                          <div className="notify-text">
                            <p
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <i
                                className={`bi ${config.icon}`}
                                style={{ color: config.color, fontSize: "18px" }}
                              ></i>
                              <span style={{ display: "flex", flexDirection: "column" }}>
                                <strong style={{ color: config.color, fontSize: '15px', marginBottom: '5px' }}>
                                  {config.title}
                                </strong>
                                <span
                                  dangerouslySetInnerHTML={{ __html: n.message }}
                                  style={{ marginLeft: "2px", color: "black" }}
                                />
                              </span>
                            </p>
                            <small>
                              {n.timestamp
                                ? new Date(n.timestamp).toLocaleString()
                                : "Just now"}
                            </small>
                          </div>

                          <button
                            onClick={() => handleDelete(n.id)}
                            className="notify-delete"
                            title="Delete notification"
                          >
                            🗑
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
            )
          )}
        </div>

        <div className="notify-footer">
          <button
            onClick={handleNavigate}
            style={{
              backgroundColor: "#475C6F",
              border: "none",
      
              cursor: "pointer",
              padding: "5px 10px",
              borderRadius: "5px",
              color: "white",
              position: 'relative'
            }}
          >
            View all
          </button>
        </div>
      </div>
    </>
  );
}

export default HeaderNotifyDropdown;
