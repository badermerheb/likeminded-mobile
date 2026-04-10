import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../types/navigation';
import {WelcomeScreen} from '../screens/auth/WelcomeScreen';
import {LoginScreen} from '../screens/auth/LoginScreen';
import {RegisterScreen} from '../screens/auth/RegisterScreen';
import {ForgotPasswordScreen} from '../screens/auth/ForgotPasswordScreen';
import {EmailVerificationScreen} from '../screens/auth/EmailVerificationScreen';
import {useTheme} from '../theme/ThemeContext';
import {ThemeToggleHeader} from '../components/ui/ThemeToggle';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => {
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
        name="Welcome"
        component={WelcomeScreen}
        options={{headerLeft: () => null}}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
      />
    </Stack.Navigator>
  );
};
