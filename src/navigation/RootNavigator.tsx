import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import { profileService } from '../services/profile';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { MainTabs } from './MainTabs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { eventsService } from '../services/events';
import { notificationService } from '../services/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, needsOnboarding, setAuthenticated, setLoading, setProfile, setNeedsOnboarding } =
    useAuthStore();
  const initialCheckDone = useRef(false);

  useEffect(() => {
    checkAuth();
    // Hard safety: if still loading after 10s, force stop
    const safetyTimer = setTimeout(() => {
      if (!initialCheckDone.current) {
        initialCheckDone.current = true;
        setLoading(false);
        setAuthenticated(false);
      }
    }, 10000);
    const { data: listener } = authService.onAuthStateChange(async (event: string) => {
      if (event === 'SIGNED_IN') {
        // Only handle if initial check is already done (avoid double-firing)
        if (initialCheckDone.current) {
          try {
            await loadProfile();
          } catch {
            // Profile load failed, but user is still authenticated
          }
          setAuthenticated(true);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthenticated(false);
        setProfile(null);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms),
      ),
    ]);

  const checkAuth = async () => {
    try {
      const session = await withTimeout(authService.getSession(), 5000);
      if (session) {
        // Try to load profile, but don't block on it
        try {
          await withTimeout(loadProfile(), 6000);
        } catch {
          // Profile load failed/timed out — still show app, profile loads in background
          setNeedsOnboarding(false);
        }
        setAuthenticated(true);
        eventsService.track('app_opened', {properties: {source: 'session_restore'}});
      } else {
        setAuthenticated(false);
      }
    } catch {
      // Session check timed out — try once more with a shorter timeout
      try {
        const session = await withTimeout(authService.getSession(), 3000);
        if (session) {
          setAuthenticated(true);
          // Load profile in background
          loadProfile().catch(() => {});
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      }
    } finally {
      initialCheckDone.current = true;
      setLoading(false);
    }
  };

  // Initialize push notifications once user is authenticated
  useEffect(() => {
    if (isAuthenticated && !needsOnboarding && !isLoading) {
      notificationService.initialize().catch(err => {
        console.error('[RootNavigator] Notification init failed:', err);
      });
    }
  }, [isAuthenticated, needsOnboarding, isLoading]);

  const loadProfile = async () => {
    const profile = await profileService.getMe();
    setProfile(profile);
    // If user has no age or gender set, they need onboarding
    const needsOnboard = !profile.age || !profile.gender;
    setNeedsOnboarding(needsOnboard);
    // Ping the server to update last_login_at
    profileService.ping().catch(() => {});
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};
