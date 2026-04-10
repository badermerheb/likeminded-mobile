import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {MainTabParamList} from '../types/navigation';
import {MatchesStack} from './MatchesStack';
import {AssessmentStack} from './AssessmentStack';
import {ProfileStack} from './ProfileStack';
import {typography} from '../theme';
import {useTheme} from '../theme/ThemeContext';
import {Platform} from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, {active: string; inactive: string}> = {
  MatchesTab: {active: 'heart', inactive: 'heart-outline'},
  AssessmentTab: {active: 'sparkles', inactive: 'sparkles-outline'},
  ProfileTab: {active: 'person-circle', inactive: 'person-circle-outline'},
};

export const MainTabs = () => {
  const {colors} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        lazy: true, // Only render tab when first visited
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          ...typography.caption2,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.borderGlass,
          borderTopWidth: 0.5,
          paddingTop: 4,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarIcon: ({focused, color}) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Icon
              name={focused ? icons.active : icons.inactive}
              size={24}
              color={color}
            />
          );
        },
      })}>
      <Tab.Screen
        name="MatchesTab"
        component={MatchesStack}
        options={{
          title: 'Matches',
          tabBarAccessibilityLabel: 'Matches tab',
        }}
      />
      <Tab.Screen
        name="AssessmentTab"
        component={AssessmentStack}
        options={{
          title: 'Assessment',
          tabBarAccessibilityLabel: 'Assessment tab',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tab.Navigator>
  );
};
