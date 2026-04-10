import React, {useEffect} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RootNavigator} from '../navigation/RootNavigator';
import {ThemeProvider, useTheme} from '../theme/ThemeContext';
import {navigationRef} from '../services/navigationRef';
import {notificationService} from '../services/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 min — data stays fresh, avoids refetch spam
      gcTime: 10 * 60 * 1000, // 10 min — keep unused cache longer
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppInner: React.FC = () => {
  const {colors: c, isDark} = useTheme();

  // Set up Notifee foreground tap handler
  useEffect(() => {
    const unsub = notificationService.setupForegroundNotifeeHandler();
    return unsub;
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: isDark,
        colors: {
          primary: c.primary,
          background: c.background,
          card: c.background,
          text: c.textPrimary,
          border: c.border,
          notification: c.primary,
        },
        fonts: {
          regular: {fontFamily: 'System', fontWeight: '400'},
          medium: {fontFamily: 'System', fontWeight: '500'},
          bold: {fontFamily: 'System', fontWeight: '700'},
          heavy: {fontFamily: 'System', fontWeight: '800'},
        },
      }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.background}
        translucent
      />
      <RootNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => (
  <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
