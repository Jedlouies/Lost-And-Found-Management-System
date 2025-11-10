import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  // 1. --- Import SafeAreaView and KeyboardAvoidingView ---
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
// Firestore imports remain for fetching admin list
import { db } from "../firebase";
import { getDocs, collection, query, where } from "firebase/firestore";

// CRITICAL FIX: Add import for getAuth
import { getAuth } from "firebase/auth";

// Realtime DB imports for conversation and notifications
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
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Get screen width for responsive centering
const { width: screenWidth } = Dimensions.get("window");

// Initialize Realtime DB
const dbRealtime = getDatabase();

const MAX_OPEN_CONVERSATIONS = 5;

// Define Conversation Message Interface
interface Message {
  id: string;
  from: "user" | "admin";
  text: string;
  timestamp: number;
  read: boolean;
}

// Define Conversation Thread Interface (Extended with non-DB property for tracking)
interface Conversation {
  id: string;
  subject: string;
  status: "open" | "resolved";
  lastMessageAt: number;
  messages: { [key: string]: Message }; // Messages are stored as map, not array
  unreadCount?: number; // Calculated, not from DB
  // Other properties from DB: startedAt, user
}

interface MessageAdminButtonProps {
  onSendSuccess: (message: string) => void;
  onSendError: (message: string) => void;
}

// --- Conversation View Component ---
function ConversationView({ conversation, onClose, onReply }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null); // Ref for scrolling

  if (!conversation) return null;

  const messages: Message[] = Object.entries(conversation.messages || {})
    .map(([id, msg]) => ({ id, ...(msg as Omit<Message, 'id'>) } as Message))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // Mark admin messages as read
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !conversation.id) return;

    const db = getDatabase();
    const convoMessagesRef = ref(
      db,
      `userConversations/${user.uid}/conversations/${conversation.id}/messages`
    );

    get(convoMessagesRef).then((snapshot) => {
      if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((childSnapshot) => {
          const msg = childSnapshot.val();
          if (msg.from === "admin" && msg.read === false) {
            updates[`${childSnapshot.key}/read`] = true;
          }
        });
        if (Object.keys(updates).length > 0) {
          update(convoMessagesRef, updates).catch((err) =>
            console.error("Failed to mark messages as read:", err)
          );
        }
      }
    });
  }, [conversation.id, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);


  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await onReply(conversation.id, replyText);
      setReplyText("");
    } catch (error) {
      // Error handled by parent
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={conversationViewStyles.safeArea}>
      <KeyboardAvoidingView
        style={conversationViewStyles.kavContainer} // Must have flex: 1
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0} 
      >
        <View style={conversationViewStyles.header}>
          <Text style={conversationViewStyles.subject}>{conversation.subject}</Text>
          <TouchableOpacity onPress={onClose} style={conversationViewStyles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={conversationViewStyles.statusContainer}>
          <Text style={conversationViewStyles.statusLabel}>
            Status:{" "}
            <Text style={{ color: conversation.status === "open" ? "orange" : "green" }}>
              {" "}
              {conversation.status.toUpperCase()}
            </Text>
          </Text>
          <Text style={conversationViewStyles.lastActivity}>
            Last Activity: {new Date(conversation.lastMessageAt).toLocaleTimeString()}
          </Text>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={conversationViewStyles.chatArea}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <Text style={conversationViewStyles.emptyChat}>
              No messages yet. Waiting for admin reply...
            </Text>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  conversationViewStyles.messageRow,
                  msg.from === "user"
                    ? conversationViewStyles.messageRowUser
                    : conversationViewStyles.messageRowAdmin,
                ]}
              >
                <View
                  style={[
                    conversationViewStyles.messageBubble,
                    msg.from === "user"
                      ? conversationViewStyles.messageBubbleUser
                      : conversationViewStyles.messageBubbleAdmin,
                  ]}
                >
                  <Text style={conversationViewStyles.messageText}>
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: msg.from === "user" ? "#143447" : "#007AFF",
                      }}
                    >
                      {msg.from === "user" ? "You" : "Admin"}:{" "}
                    </Text>
                    {msg.text}
                  </Text>
                  <Text style={conversationViewStyles.messageTimestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={conversationViewStyles.footer}>
          {conversation.status === "open" ? (
            <View style={conversationViewStyles.replyInputContainer}>
              <TextInput
                style={conversationViewStyles.replyInput}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Type your reply..."
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity
                onPress={handleSendReply}
                disabled={!replyText.trim() || sending}
                style={[
                  conversationViewStyles.sendButton,
                  (!replyText.trim() || sending) &&
                    conversationViewStyles.disabledButton,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialCommunityIcons name="send" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[conversationViewStyles.replyText, { color: "green" }]}>
              This conversation has been marked as RESOLVED.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
// --- End Conversation View Component ---

export default function MessageAdminButton({
  onSendSuccess,
  onSendError,
}: MessageAdminButtonProps) {
  // ... (All parent component logic, state, useEffect, and handlers remain exactly the same) ...
  const { currentUser } = useAuth();

  const userName =
    currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser?.email || "Unknown User";

  const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
  const [isViewConvoModalOpen, setIsViewConvoModalOpen] = useState(false);
  const [conversationSubject, setConversationSubject] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openConversationCount, setOpenConversationCount] = useState(0);
  const [activeConversations, setActiveConversations] = useState<Conversation[]>(
    []
  );
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  // --- Conversation List and Count Listener ---
  useEffect(() => {
    if (!currentUser?.uid) return;

    const convosRootRef = ref(
      dbRealtime,
      `userConversations/${currentUser.uid}/conversations`
    );

    const unsubscribe = onValue(
      convosRootRef,
      (snapshot) => {
        if (snapshot.exists()) {
          let count = 0;
          const convoList: Conversation[] = [];

          Object.entries(snapshot.val()).forEach(([id, data]) => {
            const convo = { id, ...(data as Omit<Conversation, 'id'>) } as Conversation; 

            let unreadCount = 0;
            if (convo.messages) {
              unreadCount = Object.values(convo.messages).filter(
                (msg) => msg.from === "admin" && msg.read === false
              ).length;
            }

            convo.unreadCount = unreadCount;

            if (convo.status === "open") {
              count++;
            }

            convoList.push(convo);
          });

          convoList.sort((a, b) => {
            if (a.status === "open" && b.status !== "open") return -1;
            if (a.status !== "open" && b.status === "open") return 1;
            return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
          });

          setOpenConversationCount(count);
          setActiveConversations(convoList);
          
          setSelectedConversation((prev) => {
            if (!prev) return null; 
            const updatedConvo = convoList.find((c) => c.id === prev.id);
            return updatedConvo || null;
          });
        } else {
          setOpenConversationCount(0);
          setActiveConversations([]);
          setSelectedConversation(null); 
        }
      },
      (error) => {
        console.error("Error listening to conversations:", error);
      }
    );
    
    return () => unsubscribe();
  }, [currentUser?.uid]); 

  // --- Logic to Start New Conversation ---
  const startNewConversation = async () => {
    if (!currentUser || !currentUser.uid) {
      onSendError("User not logged in.");
      return;
    }
    if (!conversationSubject.trim() || !initialMessage.trim()) {
      onSendError("Please provide a subject and an initial message.");
      return;
    }
    if (openConversationCount >= MAX_OPEN_CONVERSATIONS) {
      Alert.alert(
        "Limit Reached",
        `You have ${MAX_OPEN_CONVERSATIONS} active conversations. Please wait for an admin to resolve one.`
      );
      setIsNewConvoModalOpen(false); 
      return;
    }

    setLoading(true);

    try {
      const userConvoRef = ref(
        dbRealtime,
        `userConversations/${currentUser.uid}/conversations`
      );
      const newConvoRef = push(userConvoRef);
      const newConvoId = newConvoRef.key;

      if (!newConvoId) {
        throw new Error("Failed to generate conversation ID.");
      }
      
      const messagesRef = child(newConvoRef, "messages");
      const initialMessageRef = push(messagesRef);
      const initialMessageId = initialMessageRef.key;

      if (!initialMessageId) {
        throw new Error("Failed to generate initial message ID.");
      }

      const conversationData = {
        status: "open",
        subject: conversationSubject.trim(),
        startedAt: rtdbServerTimestamp(), 
        lastMessageAt: rtdbServerTimestamp(),
        user: { uid: currentUser.uid, name: userName },
        messages: {
          [initialMessageId]: {
            from: "user",
            text: initialMessage.trim(),
            timestamp: rtdbServerTimestamp(),
            read: false,
          },
        },
      };

      const openCountRef = ref(
        dbRealtime,
        `userConversations/${currentUser.uid}/metadata/openCount`
      );
      await runTransaction(openCountRef, (currentCount) => {
        const currentVal = currentCount || 0;
        if (currentVal >= MAX_OPEN_CONVERSATIONS) {
          return; 
        }
        return currentVal + 1;
      });

      const countSnapshot = await get(openCountRef);
      if ((countSnapshot.val() || 0) > MAX_OPEN_CONVERSATIONS && (countSnapshot.val() || 0) > openConversationCount + 1) {
        await runTransaction(openCountRef, (currentCount) => (currentCount || 1) - 1);
        throw new Error("Conversation limit reached concurrently.");
      }

      await set(newConvoRef, conversationData);

      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        const notificationsPromises = adminSnap.docs.map(adminDoc => {
            const adminId = adminDoc.id;
            const notifRef = ref(dbRealtime, `notifications/${adminId}`);
            const newNotif = push(notifRef);
            return set(newNotif, {
                from: { uid: currentUser.uid, name: userName },
                message: `<b>NEW CONVERSATION:</b> ${conversationSubject.trim()}`,
                timestamp: rtdbServerTimestamp(),
                type: "user-message",
                read: false,
                convoId: newConvoId,
                userUid: currentUser.uid,
            });
        });
        await Promise.all(notificationsPromises);
      }
      
      setConversationSubject("");
      setInitialMessage("");
      setIsNewConvoModalOpen(false);
      onSendSuccess(`New conversation started: "${conversationSubject.trim()}"`);
      
       const localNewConvo: Conversation = {
           id: newConvoId,
           subject: conversationData.subject,
           status: 'open',
           lastMessageAt: Date.now(),
           messages: {
               [initialMessageId]: {
                   id: initialMessageId,
                   from: 'user',
                   text: conversationData.messages[initialMessageId].text,
                   timestamp: Date.now(),
                   read: false
               }
           },
           unreadCount: 0,
           user: conversationData.user
       };
       setSelectedConversation(localNewConvo);
       setIsViewConvoModalOpen(true);

    } catch (error: any) {
      console.error("Error starting new conversation:", error);
      onSendError(error.message || "Failed to start conversation due to a server error.");
    } finally {
      setLoading(false);
    }
  };


  const handleUserReply = async (convoId: string, text: string) => {
    if (!currentUser?.uid) {
        onSendError("User not authenticated.");
        throw new Error("User not authenticated.");
    }
    if (!text.trim()) {
        return;
    }

    const userUid = currentUser.uid;
    const messagesRef = ref(
      dbRealtime,
      `userConversations/${userUid}/conversations/${convoId}/messages`
    );
    const convoRef = ref(
      dbRealtime,
      `userConversations/${userUid}/conversations/${convoId}`
    );

    try {
      const newReplyRef = push(messagesRef);
      await set(newReplyRef, {
        from: "user",
        text: text.trim(),
        timestamp: rtdbServerTimestamp(),
        read: false,
      });

      await update(convoRef, {
        lastMessageAt: rtdbServerTimestamp(),
      });

      const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        const notificationsPromises = adminSnap.docs.map(adminDoc => {
            const adminId = adminDoc.id;
            const notifRef = ref(dbRealtime, `notifications/${adminId}`);
            const newNotif = push(notifRef);
            return set(newNotif, {
                from: { uid: userUid, name: userName },
                message: `User ${userName} replied to conversation: ${selectedConversation?.subject || 'N/A' }`,
                timestamp: rtdbServerTimestamp(),
                type: "user-message",
                read: false,
                convoId: convoId,
                userUid: userUid,
            });
        });
        await Promise.all(notificationsPromises);
      }
      
      onSendSuccess("Reply sent to admin.");

    } catch (error) {
      console.error("Error sending user reply:", error);
      onSendError("Failed to send reply.");
      throw error;
    }
  };


  const handleOpenNewConvoModal = () => {
    if (openConversationCount >= MAX_OPEN_CONVERSATIONS) {
      Alert.alert(
        "Limit Reached",
        `You have ${MAX_OPEN_CONVERSATIONS} active conversations. Please wait for an admin to resolve one before starting a new one.`
      );
      return;
    }
    setIsNewConvoModalOpen(true);
  };

  const handleViewConvoList = () => {
    setSelectedConversation(null); 
    setIsViewConvoModalOpen(true);
  };

  const handleOpenSpecificConvo = (convo: Conversation) => {
    setSelectedConversation(convo);
  };

  return (
    <>
]      <TouchableOpacity
        onPress={handleViewConvoList}
        style={styles.fab}
        disabled={loading}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="comment-text-outline" size={28} color="white" />
        {activeConversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0) > 0 && (
          <View style={styles.convoBadge}>
            <Text style={styles.convoBadgeText}>
              {activeConversations.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isNewConvoModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNewConvoModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayCentered}
          activeOpacity={1}
          onPress={() => setIsNewConvoModalOpen(false)}
        >
          <View style={styles.modalContentCentered} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              Start New Conversation ({openConversationCount}/{MAX_OPEN_CONVERSATIONS})
            </Text>
            {/* ... (rest of New Convo Modal JSX) ... */}
            <Text style={styles.label}>Subject (Max 50 chars)</Text>
            <TextInput
              value={conversationSubject}
              onChangeText={setConversationSubject}
              placeholder="e.g., Report Bug, Question on Claim Process"
              placeholderTextColor="#999"
              style={styles.textInputSubject}
              maxLength={50}
            />
            <Text style={styles.label}>Initial Message</Text>
            <TextInput
              value={initialMessage}
              onChangeText={setInitialMessage}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor="#999"
              style={[styles.textInput, styles.textArea]}
              multiline={true}
              numberOfLines={4}
              maxLength={500}
              onStartShouldSetResponder={() => true}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => setIsNewConvoModalOpen(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startNewConversation}
                disabled={
                  loading ||
                  !conversationSubject.trim() ||
                  !initialMessage.trim()
                }
                style={[
                  styles.modalButton,
                  styles.sendButton,
                  (loading ||
                    !conversationSubject.trim() ||
                    !initialMessage.trim()) &&
                    styles.disabledButton,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.sendButtonText}>Start Conversation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isViewConvoModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsViewConvoModalOpen(false)}
      >
        {selectedConversation ? (
          <View style={styles.fullScreenOverlay}>
            <ConversationView
              conversation={selectedConversation} 
              onClose={() => setIsViewConvoModalOpen(false)} 
              onReply={handleUserReply} 
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.modalOverlayCentered}
            activeOpacity={1}
            onPress={() => setIsViewConvoModalOpen(false)}
          >
            <View
              style={[styles.modalContentCentered, styles.listModalContent]}
              onStartShouldSetResponder={() => true}
            >
              {/* ... (rest of List View Modal JSX) ... */}
              <View style={styles.listHeader}>
                <Text style={styles.modalTitle}>
                  Your Conversations ({openConversationCount} Open)
                </Text>
                <TouchableOpacity onPress={() => setIsViewConvoModalOpen(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.convoListContainer}>
                {activeConversations.map((convo) => {
                  const unreadCount = convo.unreadCount || 0;
                  return (
                    <TouchableOpacity
                      key={convo.id}
                      style={[
                        styles.convoListItem,
                        unreadCount > 0 && styles.unreadConvo,
                        convo.status === "resolved" && styles.resolvedConvo,
                      ]}
                      onPress={() => handleOpenSpecificConvo(convo)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <MaterialCommunityIcons
                          name={ convo.status === "open" ? "chat-alert-outline" : "chat-check-outline" }
                          size={20}
                          color={convo.status === "open" ? "#143447" : "green"}
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.convoSubjectText,
                              unreadCount > 0 && { fontWeight: "bold" },
                            ]}
                            numberOfLines={1}
                          >
                            {convo.subject}
                          </Text>
                          <Text style={styles.convoMetaText}>
                            {convo.status.toUpperCase()} |{" "}
                            {new Date(convo.lastMessageAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      {unreadCount > 0 && (
                        <View style={styles.convoBadge}>
                          <Text style={styles.convoBadgeText}>{unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {openConversationCount < MAX_OPEN_CONVERSATIONS && (
                  <TouchableOpacity
                    style={styles.startNewButton}
                    onPress={() => {
                        setIsViewConvoModalOpen(false);
                        setTimeout(handleOpenNewConvoModal, Platform.OS === 'ios' ? 300 : 100);
                    }}
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={20} color="white" />
                    <Text style={styles.startNewButtonText}>
                      Raise a concern ({openConversationCount}/{MAX_OPEN_CONVERSATIONS})
                    </Text>
                  </TouchableOpacity>
                )}
                {activeConversations.length === 0 && (
                  <Text style={styles.emptyListText}>No conversations yet.</Text>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        )}
      </Modal>
    </>
  );
}


const conversationViewStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f2f5', 
    },
    kavContainer: {
        flex: 1, 
    },

    replyInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end', 
        paddingVertical: 5,
        paddingHorizontal: 5, 
        paddingBottom: 50,
    },
    replyInput: {
        flex: 1,
        maxHeight: 100, 
        minHeight: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 10 : 8,
        paddingBottom: Platform.OS === 'ios' ? 10 : 8,
        marginRight: 10,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#ccc',
        color: '#333',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#143447',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'ios' ? 0 : 4,
    },
    disabledButton: {
        backgroundColor: '#AECBFA', 
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        paddingTop: 30,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    subject: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#143447',
        maxWidth: '80%', 
    },
    closeButton: {
        padding: 5,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#f9f9f9',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        // This view does NOT shrink
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    lastActivity: {
        fontSize: 12,
        color: '#666',
    },
    chatArea: {
        // --- 7. CRITICAL: Add flex: 1 ---
        flex: 1, // This makes the ScrollView take up all available space
        padding: 10,
        backgroundColor: '#e5ddd5', 
    },
    emptyChat: {
        textAlign: 'center',
        color: '#999',
        paddingVertical: 20,
    },
    messageRow: {
        marginVertical: 5,
        flexDirection: 'row', 
    },
    messageRowUser: {
        justifyContent: 'flex-end', 
    },
    messageRowAdmin: {
        justifyContent: 'flex-start', 
    },
    messageBubble: {
        maxWidth: '80%',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    messageBubbleUser: {
        backgroundColor: '#dcf8c6', 
        borderTopRightRadius: 2, 
    },
    messageBubbleAdmin: {
        backgroundColor: 'white', 
        borderTopLeftRadius: 2, 
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20, 
        color: '#333',
    },
    messageTimestamp: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
        textAlign: 'right',
    },
    footer: {
        // --- 6. REMOVE manual paddingBottom ---
        // paddingBottom: Platform.OS === 'ios' ? 20 : 10, // <-- REMOVE
        paddingHorizontal: 5, 
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        backgroundColor: '#f0f0f0', 
        // This view does NOT shrink
    },
    replyText: { 
        textAlign: 'center',
        color: '#333',
        fontSize: 14,
        paddingVertical: 15, 
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 15, // Adjust for safe area
        left: 10,
        zIndex: 100, 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 52, 71, 0.7)', 
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    backButtonText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: '600',
    },
});

// --- Main FAB and Modal Styles ---
const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: Platform.OS === 'ios' ? 140 : 120, 
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#143447",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 10, 
  },
  convoBadge: {
    position: 'absolute',
    top: -2,  
    right: -2, 
    backgroundColor: '#FF3B30', 
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5, 
    borderWidth: 1, 
    borderColor: 'white', 
  },
  convoBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { 
    width: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    elevation: 10,
  },
  modalContentCentered: {
    width: screenWidth * 0.9,
    maxHeight: '85%', 
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden', 
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#143447',
    flex: 1, 
    marginRight: 10, 
    // These styles were moved to listHeader
    // marginBottom: 15,
    // paddingBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    paddingHorizontal: 15, 
  },
  textInputSubject: {
    backgroundColor: '#f0f0f0', 
    height: 44, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 15,
    color: 'black',
    marginHorizontal: 15, 
  },
  textInput: { 
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10, 
    fontSize: 14,
    textAlignVertical: 'top',
    color: 'black',
    marginHorizontal: 15, 
  },
  textArea: {
    minHeight: 100, 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20, 
    paddingHorizontal: 15, 
    paddingBottom: 10, 
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20, 
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80, 
  },
  cancelButton: {
    backgroundColor: '#e5e5ea', 
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#007AFF', 
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: "#007AFF", 
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#AECBFA', 
    opacity: 0.7,
  },
  listModalContent: {
    padding: 0, 
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9', 
  },
  convoListContainer: {
      paddingBottom: 10, 
  },
  convoListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15, 
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white', 
  },
  unreadConvo: {
    backgroundColor: '#eef7ff', 
    borderLeftWidth: 0, 
  },
  resolvedConvo: {
    opacity: 0.6, 
  },
  convoSubjectText: {
    fontSize: 15, 
    color: '#333',
    marginBottom: 2, 
  },
  convoMetaText: {
    fontSize: 12,
    color: '#666',
  },
  convoListBadge: { 
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 10, 
  },
  convoListBadgeText: { 
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 30, 
  },
  startNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 15, 
    marginTop: 15,
    marginBottom: 5,
  },
  startNewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: '#f0f2f5', 
  }
});