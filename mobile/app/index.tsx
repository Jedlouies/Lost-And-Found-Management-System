import React from "react";
import Onboarding from '../components/OnBoarding';

export default function Index() {
  // This screen's only job is to show the onboarding flow.
  // In a real app, you would add logic here to check if the user
  // has already completed onboarding and redirect them if they have.
  return <Onboarding />;
}