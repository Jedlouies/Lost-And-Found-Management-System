import React, { useState, useRef, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * A custom hook to display an "Offline" notification panel.
 * It provides a component to render and a function to call when a network error occurs.
 *
 * @returns {object} An object containing:
 * - `notifyOffline`: (Function) Call this in your 'catch' block. It takes the function to retry as an argument.
 * - `OfflinePanelComponent`: (Component) The modal component to render in your screen's JSX.
 */
export const useOfflineNotifier = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use a ref to store the function. This avoids state-related re-render issues.
  const reloadActionRef = useRef(null);

  /**
   * Call this function from your 'catch' block when a network error occurs.
   * @param {Function} onReload - The function to execute when the "Reload" button is pressed (e.g., your fetchData function).
   */
  const notifyOffline = useCallback((onReload) => {
    reloadActionRef.current = onReload;
    setIsVisible(true);
  }, []);

  // Closes the panel and resets its state
  const closePanel = () => {
    setIsVisible(false);
    setIsRetrying(false);
    reloadActionRef.current = null;
  };

  // Asynchronously runs the stored reload action
  const handleReload = async () => {
    if (reloadActionRef.current) {
      setIsRetrying(true);
      try {
        // Run the stored function (e.g., fetchData)
        await reloadActionRef.current();
        // If it succeeds, close the panel
        closePanel();
      } catch (error) {
        // If it fails again, stop the spinner but keep the panel open
        console.error("Retry failed:", error);
        setIsRetrying(false);
        // You could add a small "Try Again" message here
      }
    }
  };

  // This is the actual component you will render in your screen
  const OfflinePanelComponent = () => (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={closePanel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <MaterialCommunityIcons name="wifi-off" size={60} color="#D8000C" />
          <Text style={styles.modalTitle}>No Internet Connection</Text>
          <Text style={styles.modalText}>
            We couldn't connect to the server. Please check your internet connection.
          </Text>

          <View style={styles.modalButtonRow}>
            <TouchableOpacity 
              style={styles.modalButtonSecondary} 
              onPress={closePanel}
              disabled={isRetrying} // Disable if a retry is in progress
            >
              <Text style={styles.modalButtonTextSecondary}>Close</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButtonPrimary} 
              onPress={handleReload}
              disabled={isRetrying} // Disable if a retry is in progress
            >
              {isRetrying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>Reload</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Expose the function to show the panel and the panel component itself
  return { notifyOffline, OfflinePanelComponent };
};

// --- STYLES ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonPrimary: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
    minHeight: 45, // for ActivityIndicator
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonTextSecondary: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});