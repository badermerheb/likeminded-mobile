import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MatchesStackParamList} from '../types/navigation';
import {MatchesHomeScreen} from '../screens/matches/MatchesHomeScreen';
import {ConversationScreen} from '../screens/matches/ConversationScreen';
import {MatchPhotosScreen} from '../screens/matches/MatchPhotosScreen';
import {typography} from '../theme';
import {useTheme} from '../theme/ThemeContext';

const Stack = createNativeStackNavigator<MatchesStackParamList>();

export const MatchesStack = () => {
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
        name="MatchesHome"
        component={MatchesHomeScreen}
        options={{
          title: 'Matches',
          headerLargeTitle: true,
          headerLargeStyle: {backgroundColor: colors.background},
          headerStyle: {backgroundColor: colors.background},
        }}
      />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={({route}) => ({title: route.params.partnerName})}
      />
      <Stack.Screen
        name="MatchPhotos"
        component={MatchPhotosScreen}
        options={({route}) => ({
          title: `${route.params.partnerName}'s Photos`,
        })}
      />
    </Stack.Navigator>
  );
};
