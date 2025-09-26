// context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, get } from "firebase/database";
import { getAuth } from "firebase/auth";

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const db = getDatabase();
    const notificationsRef = ref(db, `notifications/${user.uid}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        let count = 0;
        snapshot.forEach((child) => {
          if (!child.val().read) count++;
        });
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const clearNotifications = async () => {
  if (!user) return;
  const db = getDatabase();
  const notificationsRef = ref(db, `notifications/${user.uid}`);

  const snapshot = await get(notificationsRef);
  if (snapshot.exists()) {
    const updates = {};
    snapshot.forEach((child) => {
      updates[`${child.key}/read`] = true;
    });
    await update(notificationsRef, updates);
  }

  setUnreadCount(0); 
};

  return (
    <NotificationContext.Provider value={{ unreadCount, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
