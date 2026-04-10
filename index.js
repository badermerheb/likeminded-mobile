/**
 * @format
 */

import 'react-native-url-polyfill/auto';
import {AppRegistry, LogBox} from 'react-native';

// Suppress Firebase namespaced API deprecation warnings (cosmetic only, everything works)
LogBox.ignoreLogs([
  'This method is deprecated',
  'migrating-to-v22',
]);

import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './src/app/App';
import {name as appName} from './app.json';

// Background message handler — called when a push arrives while app is killed/background
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM] Background message:', remoteMessage.messageId);
  // Android auto-displays the notification from the 'notification' payload.
  // No extra work needed here unless we want custom logic.
});

// Background event handler for Notifee (handles notification taps when app is backgrounded)
notifee.onBackgroundEvent(async ({type, detail}) => {
  // Navigation from background tap is handled via messaging().onNotificationOpenedApp
  // and messaging().getInitialNotification in the main app.
  console.log('[Notifee] Background event:', type, detail.notification?.data);
});

AppRegistry.registerComponent(appName, () => App);
