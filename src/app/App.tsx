import React from 'react';
import {StatusBar, StyleSheet, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RootNavigator} from '../navigation/RootNavigator';
import {ThemeProvider} from '../theme/ThemeContext';
import {darkColors, lightColors} from '../theme/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppInner: React.FC = () => {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const c = isDark ? darkColors : lightColors;

  return (
    <NavigationContainer
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
