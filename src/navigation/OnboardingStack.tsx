import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../types/navigation';
import { OnboardingAgeGender as OnboardingAgeGenderScreen } from '../screens/onboarding/OnboardingAgeGender';
import { OnboardingLocation as OnboardingLocationScreen } from '../screens/onboarding/OnboardingLocation';
import { OnboardingPreferences as OnboardingPreferencesScreen } from '../screens/onboarding/OnboardingPreferences';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="OnboardingAgeGender" component={OnboardingAgeGenderScreen} />
    <Stack.Screen name="OnboardingLocation" component={OnboardingLocationScreen} />
    <Stack.Screen name="OnboardingPreferences" component={OnboardingPreferencesScreen} />
  </Stack.Navigator>
);
