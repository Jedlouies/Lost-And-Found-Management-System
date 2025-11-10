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
import { router } from 'expo-router';

// Define placeholder color
const PLACEHOLDER_COLOR = "#A9A9A9";

interface RatingModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => Promise<void>; // Make onSubmit async
  isSubmitting: boolean;
}

function RatingModal({ show, onClose, onSubmit, isSubmitting }: RatingModalProps) {
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
      await onSubmit(rating, feedback);
      // Reset state after successful submit (optional, depends on parent logic)
      setRating(0);
      setFeedback("");
      router.push('/ItemManagementScreen')
  };

  return (
    <Modal
      visible={show}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
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
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
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
    fontSize: 16
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#AECBFA',
  },
});

export default RatingModal;