import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../components/OnBoarding';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [viewOnboarding, setViewOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('hasLaunched');
        if (value === null) {
          setViewOnboarding(true);
        } else {
          setViewOnboarding(false);
        }
      } catch (error) {
        console.error("Error checking local storage:", error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!viewOnboarding) {
    return <Redirect href="/create-account" />;
  }

  return <Onboarding />;
}