import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter } from 'expo-router';
// 1. Import AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Onboarding() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const pages = [0, 1, 2, 3];

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 10, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [floatAnim]);

  // 2. Updated Handler: Save state locally before navigating
  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      router.replace('/create-account'); // Or '/sign-in' depending on your flow
    } catch (error) {
      console.log('Error saving data', error);
      router.replace('/create-account');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Update the onPress to call the local function inside the component */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleFinishOnboarding}
      >
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <PagerView
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {/* ... (Your existing pages 1, 2, 3 remain exactly the same) ... */}
        
        {/* Page 1 */}
        <View key="1" style={styles.page}>
          <View style={styles.circle}>
            <Text style={styles.bigTitle}>SpotSync</Text>
            <Animated.Image
              source={require('../assets/images/Onboarding-1.png')}
              style={[styles.imageInCircle, { transform: [{ translateY: floatAnim }] }]}
            />
          </View>
          <Text style={styles.title}>Your Smart Lost & Found Companion</Text>
          <Text style={styles.subtitle}>
            Welcome to SpotSync, the intelligent lost and found system built to help you recover or return items with ease.
          </Text>
        </View>

        {/* Page 2 */}
        <View key="2" style={styles.page}>
          <View style={styles.circle}>
            <Text style={styles.bigTitle}>SpotSync</Text>
            <Animated.Image
              source={require('../assets/images/Onboarding-2.png')}
              style={[styles.imageInCircle, { transform: [{ translateY: floatAnim }] }]}
            />
          </View>
          <Text style={styles.title}>Lost or Found? Start Here</Text>
          <Text style={styles.subtitle}>
            Submit a report for any lost or found item. SpotSync helps categorize your report and begins scanning for matches instantly.
          </Text>
        </View>

        {/* Page 3 */}
        <View key="3" style={styles.page}>
          <View style={styles.circle}>
            <Text style={styles.bigTitle}>SpotSync</Text>
            <Animated.Image
              source={require('../assets/images/Onboarding-3.png')}
              style={[styles.imageInCircle, { transform: [{ translateY: floatAnim }] }]}
            />
          </View>
          <Text style={styles.title}>Fast, Accurate, AI-Powered Matching</Text>
          <Text style={styles.subtitle}>
            Our system uses machine learning to compare item photos and descriptions, notifying you of potential matches.
          </Text>
        </View>

        {/* Page 4 */}
        <View key="4" style={styles.page}>
          <View style={styles.circle}>
            <Text style={styles.bigTitle}>SpotSync</Text>
            <Animated.Image
              source={require('../assets/images/Onboarding-4.png')}
              style={[styles.imageInCircle, { transform: [{ translateY: floatAnim }] }]}
            />
          </View>
          <Text style={styles.title}>Real-Time Notifications, Transparent Process</Text>
          <Text style={styles.subtitle}>
            Stay updated every step of the way with instant alerts when a potential match is detected.
          </Text>
          {/* Update the onPress here as well */}
          <TouchableOpacity style={styles.button} onPress={handleFinishOnboarding}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </PagerView>

      <View style={styles.indicatorContainer}>
        {pages.map((index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentPage === index ? styles.activeIndicator : styles.inactiveIndicator,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  pagerView: { flex: 1 },
  page: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 0 },
  circle: { width: '120%', aspectRatio: 1, maxHeight: 400, borderBottomLeftRadius: 300, borderBottomRightRadius: 300, marginBottom: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#143447', overflow: 'hidden' },
  imageInCircle: { width: '100%', height: '90%', marginTop: 140, position: 'absolute' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#333', paddingHorizontal: 30 },
  bigTitle: { zIndex: 1, fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2, marginBottom: 260 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#666', paddingHorizontal: 35, lineHeight: 24 },
  button: { marginTop: 'auto', marginBottom: 120, backgroundColor: '#007BFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  indicatorContainer: { position: 'absolute', bottom: 50, flexDirection: 'row', alignSelf: 'center' },
  indicator: { height: 10, width: 10, borderRadius: 5, marginHorizontal: 5 },
  activeIndicator: { backgroundColor: '#143447' },
  inactiveIndicator: { backgroundColor: '#ccc' },
  skipButton: { position: 'absolute', top: 60, right: 20, zIndex: 1 },
  skipButtonText: { fontSize: 16, color: '#143447', fontWeight: 'bold' },
});