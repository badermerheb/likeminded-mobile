import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OnboardingStackParamList} from '../types/navigation';
import {OnboardingAgeGender as OnboardingAgeGenderScreen} from '../screens/onboarding/OnboardingAgeGender';
import {OnboardingLocation as OnboardingLocationScreen} from '../screens/onboarding/OnboardingLocation';
import {OnboardingPreferences as OnboardingPreferencesScreen} from '../screens/onboarding/OnboardingPreferences';
import {useTheme} from '../theme/ThemeContext';
import {ThemeToggleHeader} from '../components/ui/ThemeToggle';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingStack = () => {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: '',
        headerBackTitleVisible: false,
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerRight: () => <ThemeToggleHeader />,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="OnboardingAgeGender"
        component={OnboardingAgeGenderScreen}
        options={{headerLeft: () => null}}
      />
      <Stack.Screen
        name="OnboardingLocation"
        component={OnboardingLocationScreen}
      />
      <Stack.Screen
        name="OnboardingPreferences"
        component={OnboardingPreferencesScreen}
      />
    </Stack.Navigator>
  );
};
