import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { realtimeDB } from '../firebase';
// ✨ 1. Import 'get' and 'update' for marking as read
import {
  ref,
  onValue,
  query,
  orderByChild,
  equalTo,
  get,
  update,
} from 'firebase/database';

export default function BottomNavBar({ activeScreen }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  const navItems = [
    { name: 'Home', icon: 'home-variant', route: `/home-screen` },
    { name: 'Lost', icon: 'magnify-minus', route: `/LostItemScreen` },
    { name: 'Found', icon: 'magnify-plus', route: `/FoundItemScreen` },
    { name: 'Items', icon: 'view-dashboard', route: `/ItemManagementScreen` },
    { name: 'Notifs', icon: 'bell', route: `/UserNotificationScreen` },
    { name: 'Settings', icon: 'cog', route: `/UserSettingsScreen` },
  ];

  useEffect(() => {
    if (!currentUser) return;

    const notifRef = ref(realtimeDB, `notifications/${currentUser.uid}`);
    const unreadQuery = query(
      notifRef,
      orderByChild('read'),
      equalTo(false)
    );

    const unsubscribe = onValue(
      unreadQuery,
      (snapshot) => {
        setNotificationCount(snapshot.size);
      },
      (error) => {
        console.error('Error fetching notification count: ', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // ✨ 2. New function to update all notifications in the database
  const markAllAsRead = async () => {
    if (!currentUser) return;

    // Find all notifications for this user that are unread
    const notifRef = ref(realtimeDB, `notifications/${currentUser.uid}`);
    const unreadQuery = query(
      notifRef,
      orderByChild('read'),
      equalTo(false)
    );

    try {
      const snapshot = await get(unreadQuery);

      if (snapshot.exists()) {
        const updates = {};
        // Prepare a single "multi-path" update for efficiency
        snapshot.forEach((childSnapshot) => {
          const key = childSnapshot.key;
          updates[`notifications/${currentUser.uid}/${key}/read`] = true;
        });

        // Send the update to the database
        await update(ref(realtimeDB), updates);
        // The 'onValue' listener will now automatically update the count to 0
      }
    } catch (error) {
      console.error('Error marking notifications as read: ', error);
    }
  };

  // ✨ 3. Update handlePress to call markAllAsRead
  const handlePress = (item) => {
    router.replace(item.route);

    // If the user clicks 'Notifs' and there are unread items...
    if (item.name === 'Notifs' && notificationCount > 0) {
      markAllAsRead(); // Mark them as read
    }
  };

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.navButton}
          // ✨ 4. Pass the whole 'item' object to handlePress
          onPress={() => handlePress(item)}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={item.icon}
              size={28}
              color={activeScreen === item.name ? '#143447' : '#888'}
            />

            {item.name === 'Notifs' && notificationCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.navButtonText,
              { color: activeScreen === item.name ? '#143447' : '#888' },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    height: 110,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});