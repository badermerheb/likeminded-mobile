import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AssessmentStackParamList} from '../types/navigation';
import {AssessmentHomeScreen} from '../screens/assessment/AssessmentHomeScreen';
import {ChatbotScreen} from '../screens/assessment/ChatbotScreen';
import {typography} from '../theme';
import {useTheme} from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<AssessmentStackParamList>();

export const AssessmentStack = () => {
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
        name="AssessmentHome"
        component={AssessmentHomeScreen}
        options={{
          title: 'Assessment',
          headerLargeTitle: true,
          headerLargeStyle: {backgroundColor: colors.background},
          headerStyle: {backgroundColor: colors.background},
        }}
      />
      <Stack.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{title: 'Personality Assessment'}}
      />
    </Stack.Navigator>
  );
};
