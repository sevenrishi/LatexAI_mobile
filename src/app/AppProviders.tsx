import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { queryClient } from '../lib/queryClient';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AppStatusBar } from '../theme/AppStatusBar';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary';
import { Toast } from '../components/feedback/Toast';
import { SessionExpiredModal } from '../components/feedback/SessionExpiredModal';
import { BiometricLockModal } from '../components/feedback/BiometricLockModal';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { initSupabaseAppStateListener } from '../lib/supabase';
import { registerDeepLinkListener } from '../utils/deepLinks';
import { navigationRef } from './navigation/navigationRef';
import { RootNavigator } from './navigation/RootNavigator';
import { linking } from './navigation/linking';

const AuthBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  useEffect(() => {
    // 1. Initialize Supabase authentication state
    initializeAuth();

    // 2. Attach Supabase AppState listener for token refresh
    const unsubscribeAppState = initSupabaseAppStateListener();

    // 3. Register deep linking listener
    const unsubscribeDeepLinks = registerDeepLinkListener();

    return () => {
      unsubscribeAppState();
      unsubscribeDeepLinks();
    };
  }, [initializeAuth]);

  return <>{children}</>;
};

const NavigationWrapper: React.FC = () => {
  const { isDark, theme } = useTheme();
  const activeToast = useUiStore(state => state.activeToast);
  const hideToast = useUiStore(state => state.hideToast);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surfaceElevated,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };

  return (
    <>
      <AppStatusBar />
      <NavigationContainer ref={navigationRef} linking={linking} theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
      <Toast toast={activeToast} onDismiss={hideToast} />
      <SessionExpiredModal />
      <BiometricLockModal />
    </>
  );
};

export const AppProviders: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <AuthBootstrap>
                <NavigationWrapper />
              </AuthBootstrap>
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
