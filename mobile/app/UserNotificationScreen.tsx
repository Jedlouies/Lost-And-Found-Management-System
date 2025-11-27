import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal, 
  BackHandler, 
} from "react-native";
import { useRouter, useFocusEffect } from 'expo-router'; 
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { getAuth, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BlankHeader from "../components/BlankHeader";
import BottomNavBar from "../components/BottomNavBar";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  timestamp?: number;
}
interface TypeConfig {
  [key: string]: {
    title: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
  };
}
interface UserData {
  displayName?: string;
  email?: string;
  photoURL?: string;
  [key: string]: any;
}
const typeConfig: TypeConfig = {
  transaction: { title: "Transaction Processed", icon: "cash", color: "green" },
  system: { title: "System Update", icon: "cog-outline", color: "#007bff" },
  reminder: { title: "Reminder", icon: "bell-outline", color: "orange" },
  item: {
    title: "Item Update",
    icon: "information-outline",
    color: "#062949ff",
  },
};

const FloatingAlert: React.FC<{ message: string; type: string }> = ({
  message,
  type,
}) => (
  <View
    style={[
      styles.alertContainer,
      { backgroundColor: type === "success" ? "#28a745" : "#dc3545" },
    ]}
  >
    <Text style={styles.alertText}>{message}</Text>
  </View>
);

const FormattedMessage: React.FC<{ text: string; style: any }> = ({ text, style }) => {
  if (!text) return null;
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith("<b>") && part.endsWith("</b>")) {
          return (
            <Text key={index} style={{ fontWeight: "bold" }}>
              {part.substring(3, part.length - 4)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

const UserNotificationScreen: React.FC = () => {
  const router = useRouter(); 
  const [sections, setSections] = useState<
    { title: string; data: NotificationItem[] }[]
  >([]);

  // --- FIX: Correct Way to Remove Listener ---
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/home-screen');
        return true; 
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove(); 
    }, [router])
  );
  // -------------------------------------------

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ message: string; type: string } | null>(
    null
  );
  const [userData, setUserData] = useState<UserData | null>(null);

  const auth = getAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      const user: User | null = auth.currentUser;
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setUserData({
            displayName: user.displayName || "User",
            email: user.email || "",
            photoURL: user.photoURL || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  const groupByDate = (notifications: NotificationItem[]) => {
    const groups: Record<string, NotificationItem[]> = {
      Today: [], Yesterday: [], "Last Week": [], "Last Month": [],
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
      if (ts >= today) groups.Today.push(n);
      else if (ts >= yesterday) groups.Yesterday.push(n);
      else if (ts >= oneWeekAgo) groups["Last Week"].push(n);
      else if (ts >= oneMonthAgo) groups["Last Month"].push(n);
    });
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([title, data]) => ({ title, data }));
  };

  useEffect(() => {
    const user: User | null = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const dbRT = getDatabase();
    const notificationsRef = ref(dbRT, `notifications/${user.uid}`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed: NotificationItem[] = Object.keys(data).map((key) => ({
          id: key, ...data[key],
        }));
        parsed.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const groupedSections = groupByDate(parsed.slice(0, 20));
        setSections(groupedSections);
      } else {
        setSections([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleDelete = (notifId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const dbRT = getDatabase();
    const notifRef = ref(dbRT, `notifications/${user.uid}/${notifId}`);
    remove(notifRef)
      .then(() => {
        setAlert({ message: "Notification Deleted", type: "success" });
        setTimeout(() => setAlert(null), 2000);
      })
      .catch((err) => {
        console.error("Error deleting notification:", err);
        setAlert({ message: "Failed to delete", type: "error" });
        setTimeout(() => setAlert(null), 2000);
      });
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const config = typeConfig[item.type] || {
      title: "Notification",
      icon: "information-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
      color: "#062949ff",
    };

    return (
      <View style={styles.notificationCard}>
        <View style={styles.notificationHeader}>
          <MaterialCommunityIcons name={config.icon} size={24} color={config.color} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.notificationTitle, { color: config.color }]}>
              {config.title}
            </Text>
            <FormattedMessage
              text={item.message}
              style={styles.notificationMessage}
            />
            <Text style={styles.notificationTime}>
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Just now"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {alert && <FloatingAlert message={alert.message} type={alert.type} />}
      <BlankHeader userData={userData} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionTitle}>{title}</Text>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
        />
      )}

      <BottomNavBar activeScreen="Notifs" />
    </SafeAreaView>
  );
};

export default UserNotificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f9ff", paddingBottom: 100 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#062949ff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: '#333'
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: { flexDirection: "row", alignItems: "center" },
  notificationTitle: { fontSize: 16, fontWeight: "bold" },
  notificationMessage: { fontSize: 14, color: "#555", marginTop: 4, lineHeight: 20 },
  notificationTime: { fontSize: 12, color: "#888", marginTop: 5 },
  deleteButton: { padding: 5 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#777", fontSize: 16 },
  alertContainer: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  alertText: { color: "white", fontWeight: "bold" },
});