// CropperModal.tsx (Mobile Version)
import React from 'react';
import { ImageManipulator } from '@oguzhnatly/react-native-image-manipulator';
import { Platform } from 'react-native';

interface CropperModalProps {
  show: boolean;
  imageSrc: string | null;
  aspect: number;
  onClose: () => void;
  onCropComplete: (base64Image: string) => void;
}

function CropperModal({
  show,
  imageSrc,
  aspect,
  onClose,
  onCropComplete,
}: CropperModalProps) {
  
  // This component won't render anything if there's no image source.
  if (!imageSrc) {
    return null;
  }

  // The callback from the library provides the cropped image URI and base64 string.
  const handlePictureChoosed = ({ uri, base64 }: { uri: string; base64: string }) => {
    // We format the base64 string to match the original web component's output.
    const formattedBase64 = `data:image/jpeg;base64,${base64}`;
    onCropComplete(formattedBase64);
    // Automatically close the modal after a successful crop.
    onClose();
  };

  // Determine if a square crop should be enforced based on the aspect ratio prop.
  const isSquareCrop = aspect === 1;

  return (
    <ImageManipulator
      // The photo prop requires an object with a URI.
      photo={{ uri: imageSrc }}
      
      // Control the visibility of the cropper modal with the `show` prop.
      isVisible={show}
      
      // The onPictureChoosed callback is triggered when the user saves the crop.
      onPictureChoosed={handlePictureChoosed}

      // The onToggleModal callback is triggered when the user closes the modal (e.g., by pressing cancel).
      onToggleModal={onClose}
      
      // Use the library's feature for a fixed square crop if the aspect ratio is 1.
      // Note: This library excels at square crops but may not enforce other aspect ratios like 16:9.
      // The user will still be able to crop freely for non-square images.
      fixedSquareCrop={isSquareCrop}

      // Optional: Customize the text for buttons
      btnTexts={{
        done: 'Save Crop',
        crop: 'Crop',
        processing: 'Processing...',
      }}

      // Optional: Set a custom theme color for the UI elements
      themeColor="#007AFF"
    />
  );
}

export default CropperModal;