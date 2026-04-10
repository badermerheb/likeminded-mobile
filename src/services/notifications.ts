// src/services/notifications.ts
// Push notification service using Firebase Cloud Messaging + Notifee

import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {Platform, PermissionsAndroid} from 'react-native';
import {api} from './api';
import {navigateFromNotification} from './navigationRef';

// ---------- Channel IDs (match backend data.channel_id) ----------
const CHANNELS = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'New chat messages from your matches',
    importance: AndroidImportance.HIGH,
  },
  {
    id: 'matches',
    name: 'Matches',
    description: 'New match notifications',
    importance: AndroidImportance.HIGH,
  },
  {
    id: 'photos',
    name: 'Photo Unlocks',
    description: 'When photos are unlocked in a conversation',
    importance: AndroidImportance.DEFAULT,
  },
  {
    id: 'verification',
    name: 'Verification',
    description: 'KYC verification status updates',
    importance: AndroidImportance.DEFAULT,
  },
  {
    id: 'feedback',
    name: 'Match Feedback',
    description: 'Match feedback and satisfaction updates',
    importance: AndroidImportance.DEFAULT,
  },
  {
    id: 'reminders',
    name: 'Reminders',
    description: 'App reminders and updates',
    importance: AndroidImportance.LOW,
  },
];

// ---------- Create Android notification channels ----------
async function createChannels(): Promise<void> {
  for (const ch of CHANNELS) {
    await notifee.createChannel({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      importance: ch.importance,
    });
  }
}

// ---------- Request notification permission ----------
async function requestPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[Notifications] Android permission denied');
        return false;
      }
    }

    // Firebase messaging permission (mainly for iOS but good practice)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log('[Notifications] Permission:', enabled ? 'granted' : 'denied');
    return enabled;
  } catch (err) {
    console.error('[Notifications] Permission request failed:', err);
    return false;
  }
}

// ---------- Get and register FCM token ----------
async function registerToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    if (!token) {
      console.warn('[Notifications] No FCM token available');
      return null;
    }

    console.log('[Notifications] FCM token:', token.substring(0, 20) + '...');

    // Register with backend
    await api.post('/me/device-token', {
      token,
      platform: Platform.OS, // 'android' | 'ios'
    });

    console.log('[Notifications] Token registered with backend');
    return token;
  } catch (err) {
    console.error('[Notifications] Token registration failed:', err);
    return null;
  }
}

// ---------- Unregister FCM token (on sign-out) ----------
async function unregisterToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (token) {
      await api.request('DELETE', '/me/device-token', {
        body: {token, platform: Platform.OS},
      });
      console.log('[Notifications] Token unregistered');
    }
  } catch (err) {
    console.error('[Notifications] Token unregister failed:', err);
  }
}

// ---------- Display foreground notification via Notifee ----------
async function displayNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const {notification, data} = remoteMessage;
  if (!notification) return;

  const channelId = (data?.channel_id as string) || 'messages';

  await notifee.displayNotification({
    title: notification.title || 'LikeMinded',
    body: notification.body || '',
    data: (data as Record<string, string>) || {},
    android: {
      channelId,
      smallIcon: 'ic_launcher', // app's default launcher icon
      pressAction: {id: 'default'},
    },
  });
}

// ---------- Handle notification tap (foreground event) ----------
function setupForegroundNotifeeHandler(): () => void {
  return notifee.onForegroundEvent(({type, detail}) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      navigateFromNotification(detail.notification.data as Record<string, string>);
    }
  });
}

// ---------- Main initialization (call after auth) ----------
async function initialize(): Promise<void> {
  try {
    // 1. Create channels
    await createChannels();

    // 2. Request permission
    const granted = await requestPermission();
    if (!granted) return;

    // 3. Register token
    await registerToken();

    // 4. Listen for token refresh
    messaging().onTokenRefresh(async newToken => {
      try {
        await api.post('/me/device-token', {
          token: newToken,
          platform: Platform.OS,
        });
        console.log('[Notifications] Refreshed token registered');
      } catch (err) {
        console.error('[Notifications] Token refresh registration failed:', err);
      }
    });

    // 5. Foreground message handler — display via Notifee
    messaging().onMessage(async remoteMessage => {
      console.log('[Notifications] Foreground message:', remoteMessage.messageId);
      await displayNotification(remoteMessage);
    });

    // 6. Handle notification taps when app was in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[Notifications] Opened from background:', remoteMessage.data);
      if (remoteMessage.data) {
        navigateFromNotification(remoteMessage.data as Record<string, string>);
      }
    });

    // 7. Check if app was opened from a killed state notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification?.data) {
      console.log('[Notifications] Opened from quit:', initialNotification.data);
      // Small delay to let navigation mount
      setTimeout(() => {
        navigateFromNotification(
          initialNotification.data as Record<string, string>,
        );
      }, 1500);
    }

    console.log('[Notifications] Initialized successfully');
  } catch (err) {
    console.error('[Notifications] Initialization failed:', err);
  }
}

// ---------- Export ----------
export const notificationService = {
  initialize,
  requestPermission,
  registerToken,
  unregisterToken,
  createChannels,
  setupForegroundNotifeeHandler,
};
