import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// 1. Import useRouter
import { useRouter } from 'expo-router';

// Define placeholder color
const PLACEHOLDER_COLOR = "#A9A9A9";

// Define component props interface
interface GuestRatingModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>; // Make onSubmit async
  isSubmitting: boolean;
}

function GuestRatingModal({ show, onClose, onSubmit, isSubmitting }: GuestRatingModalProps) {
  // 2. Initialize router
  const router = useRouter(); 
  const [rating, setRating] = useState<number>(0); // 0 = not rated
  const [feedback, setFeedback] = useState<string>("");

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }
    
    // Await the parent's submit logic
    await onSubmit(rating, feedback); 
    
    // Reset state after successful submit
    setRating(0);
    setFeedback("");
    
    // 3. Add router.replace to navigate
    router.replace('/GuestReportScreen'); // Navigate to GuestReportScreen
  };

  return (
    <Modal
      visible={show}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose} // Allow closing modal with back button on Android
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose} // Close when tapping overlay
      >
        {/* Prevent taps inside the modal from closing it */}
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>Rate Match Accuracy</Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, index) => (
              <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                <MaterialCommunityIcons
                  name={index < rating ? "star" : "star-outline"}
                  size={40}
                  color={index < rating ? "#FFD700" : "#ccc"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Feedback Input */}
          <TextInput
            style={styles.feedbackInput}
            placeholder="Optional: Provide feedback on the matches..."
            placeholderTextColor={PLACEHOLDER_COLOR} // Apply color
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            editable={!isSubmitting} // Disable while submitting
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton, 
                isSubmitting && styles.buttonDisabled,
                rating === 0 && styles.buttonDisabled // Also disable if no rating
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0} // Disable if no rating selected
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    width: '90%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333', // Darker text
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10, // Add space between stars
  },
  feedbackInput: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top', // For multiline input
    marginBottom: 20,
    fontSize: 16,
    color: '#333', // Text color
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between', // Ensure full width spread
  },
  closeButton: {
    backgroundColor: '#6c757d', // Gray color
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1, // Take half width
    marginRight: 5, // Space between buttons
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF', // Blue color
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1, // Take half width
    marginLeft: 5, // Space between buttons
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#AECBFA', // Lighter blue for disabled
    opacity: 0.7,
  },
});

export default GuestRatingModal;