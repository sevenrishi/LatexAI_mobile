import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '../src/app/navigation/RootNavigator';
import { ThemeProvider } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const renderNavigator = async () => {
  return await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider initialMode="light">
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

describe('RootNavigator Core Auth Gate (MB-1.01)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      isSplashFinished: true,
      isBiometricsLocked: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('renders Splash screen when splash is active (isSplashFinished = false)', async () => {
    useAuthStore.setState({ isSplashFinished: false });

    const { getByTestId } = await renderNavigator();
    expect(getByTestId('splash-screen')).toBeTruthy();
  });

  it('renders AuthStack (WelcomeScreen) when unauthenticated', async () => {
    useAuthStore.setState({
      isSplashFinished: true,
      isAuthenticated: false,
    });

    const { getByTestId } = await renderNavigator();
    expect(getByTestId('welcome-screen')).toBeTruthy();
  });

  it('gates unverified user into VerifyEmailScreen', async () => {
    useAuthStore.setState({
      isSplashFinished: true,
      isAuthenticated: true,
      user: {
        id: 'usr_unverified',
        email: 'unverified@example.com',
        emailVerified: false,
        name: 'Unverified Candidate',
        createdAt: '2026-01-01',
      },
      isOnboarded: false,
    });

    const { getByTestId, getByText } = await renderNavigator();
    expect(getByTestId('verify-email-screen')).toBeTruthy();
    expect(getByText('unverified@example.com')).toBeTruthy();
  });

  it('gates verified but not onboarded user into OnboardingStack', async () => {
    useAuthStore.setState({
      isSplashFinished: true,
      isAuthenticated: true,
      user: {
        id: 'usr_onboarding',
        email: 'newuser@example.com',
        emailVerified: true,
        name: 'New User',
        createdAt: '2026-01-01',
      },
      isOnboarded: false,
    });

    const { getByTestId, getByText } = await renderNavigator();
    expect(getByTestId('onboarding-welcome-screen')).toBeTruthy();
    expect(getByText("Let's Personalize Your Resume")).toBeTruthy();
  });

  it('renders AppTabs (Dashboard) when authenticated, verified, and onboarded', async () => {
    useAuthStore.setState({
      isSplashFinished: true,
      isAuthenticated: true,
      user: {
        id: 'usr_active',
        email: 'active@example.com',
        emailVerified: true,
        name: 'Active User',
        createdAt: '2026-01-01',
      },
      isOnboarded: true,
    });

    const { getByText } = await renderNavigator();
    expect(getByText('Resume Dashboard')).toBeTruthy();
  });
});
