import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ProfileStackParamList} from '../types/navigation';
import {ProfileHomeScreen} from '../screens/profile/ProfileHomeScreen';
import {InterestsScreen} from '../screens/profile/InterestsScreen';
import {GalleryScreen} from '../screens/profile/GalleryScreen';
import {PreferencesScreen} from '../screens/profile/PreferencesScreen';
import {VerificationScreen} from '../screens/profile/VerificationScreen';
import {DeleteAccountScreen} from '../screens/profile/DeleteAccountScreen';
import {typography} from '../theme';
import {useTheme} from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = () => {
  const {colors} = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          ...typography.headline,
          color: colors.textPrimary,
          fontWeight: '600',
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileHomeScreen}
        options={{
          title: 'Profile',
          headerLargeTitle: true,
          headerLargeStyle: {backgroundColor: colors.background},
          headerStyle: {backgroundColor: colors.background},
        }}
      />
      <Stack.Screen
        name="Interests"
        component={InterestsScreen}
        options={{title: 'My Interests'}}
      />
      <Stack.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{title: 'My Photos'}}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{title: 'Match Preferences'}}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{title: 'Verification'}}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{title: 'Delete Account'}}
      />
    </Stack.Navigator>
  );
};
