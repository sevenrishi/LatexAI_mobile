import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme';
import { OnboardingWelcomeScreen } from '../src/screens/onboarding/OnboardingWelcomeScreen';
import { OnboardingRoleScreen } from '../src/screens/onboarding/OnboardingRoleScreen';
import { OnboardingGoalsScreen } from '../src/screens/onboarding/OnboardingGoalsScreen';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';
import { api } from '../src/lib/api';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const renderWithTheme = async (ui: React.ReactElement) => {
  return await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider initialMode="light">{ui}</ThemeProvider>
    </SafeAreaProvider>
  );
};

describe('Onboarding Wizard Screens (MB-1.10)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'usr_test', email: 'test@example.com' } as any,
      session: { access_token: 'test_token' } as any,
      isAuthenticated: true,
      isOnboarded: false,
      isLoading: false,
      isSplashFinished: true,
      isBiometricsLocked: false,
      error: null,
    });
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('S-08 OnboardingWelcomeScreen', () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    it('renders hero title, highlights, and buttons', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <OnboardingWelcomeScreen navigation={mockNavigation} route={{} as any} />
      );

      expect(getByTestId('onboarding-welcome-screen')).toBeTruthy();
      expect(getByText("Let's Personalize Your Resume")).toBeTruthy();
      expect(getByText('Tailored ATS Keyword Matching')).toBeTruthy();
      expect(getByText('Standardized LaTeX Blueprints')).toBeTruthy();
      expect(getByTestId('onboarding-get-started-button')).toBeTruthy();
      expect(getByTestId('onboarding-skip-button')).toBeTruthy();
    });

    it('navigates to OnboardingRole when Get Started is pressed', async () => {
      const { getByTestId } = await renderWithTheme(
        <OnboardingWelcomeScreen navigation={mockNavigation} route={{} as any} />
      );

      fireEvent.press(getByTestId('onboarding-get-started-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('OnboardingRole');
    });

    it('allows skipping onboarding directly', async () => {
      const completeSpy = jest
        .spyOn(useAuthStore.getState(), 'completeOnboarding')
        .mockResolvedValue();

      const { getByTestId } = await renderWithTheme(
        <OnboardingWelcomeScreen navigation={mockNavigation} route={{} as any} />
      );

      await act(async () => {
        fireEvent.press(getByTestId('onboarding-skip-button'));
      });

      expect(completeSpy).toHaveBeenCalledWith({});
      completeSpy.mockRestore();
    });
  });

  describe('S-09 OnboardingRoleScreen', () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    it('renders role and experience options and forwards selected values', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <OnboardingRoleScreen navigation={mockNavigation} route={{} as any} />
      );

      expect(getByTestId('onboarding-role-screen')).toBeTruthy();
      expect(getByText('Target Role & Experience')).toBeTruthy();
      expect(getByTestId('onboarding-role-input')).toBeTruthy();
      expect(getByTestId('onboarding-industry-input')).toBeTruthy();
      expect(getByTestId('onboarding-role-continue-button')).toBeTruthy();

      // Change role title and industry
      await act(async () => {
        fireEvent.changeText(getByTestId('onboarding-role-input'), 'Senior Backend Engineer');
        fireEvent.changeText(getByTestId('onboarding-industry-input'), 'Fintech');
      });

      // Select popular role chip
      await act(async () => {
        fireEvent.press(getByText('Software Engineer'));
      });

      // Press continue
      await act(async () => {
        fireEvent.press(getByTestId('onboarding-role-continue-button'));
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('OnboardingGoals', {
        targetRole: 'Software Engineer',
        experienceLevel: 'mid',
        industry: 'Fintech',
      });
    });
  });

  describe('S-10 OnboardingGoalsScreen & Backend Complete Wire', () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const mockRoute: any = {
      params: {
        targetRole: 'Full Stack Developer',
        experienceLevel: 'senior',
        industry: 'Technology',
      },
    };

    it('renders goals and template choices and completes onboarding', async () => {
      jest.spyOn(api, 'post').mockResolvedValue({ success: true } as any);
      jest.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
        data: { user: { id: 'usr_test' } as any },
        error: null,
      });

      const { getByTestId, getByText } = await renderWithTheme(
        <OnboardingGoalsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('onboarding-goals-screen')).toBeTruthy();
      expect(getByText('Goals & Preferred Style')).toBeTruthy();
      expect(getByTestId('onboarding-complete-button')).toBeTruthy();

      // Toggle a goal chip
      await act(async () => {
        fireEvent.press(getByText('Quantify experience bullets with metrics'));
      });

      // Select minimal template
      await act(async () => {
        fireEvent.press(getByText('Tech Minimalist'));
      });

      // Complete setup
      await act(async () => {
        fireEvent.press(getByTestId('onboarding-complete-button'));
      });

      // Verifies backend POST /auth/onboarding/complete was invoked
      expect(api.post).toHaveBeenCalledWith(
        '/auth/onboarding/complete',
        expect.objectContaining({
          targetRole: 'Full Stack Developer',
          experienceLevel: 'senior',
          industry: 'Technology',
          preferredTemplate: 'minimal',
          goals: expect.arrayContaining([
            'Beat ATS screening filters',
            'Tailor resumes to specific job posts',
            'Quantify experience bullets with metrics',
          ]),
        })
      );

      // Verifies Supabase user metadata update
      expect(supabase.auth.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            onboarded: true,
          }),
        })
      );

      // Zustand store updated
      expect(useAuthStore.getState().isOnboarded).toBe(true);
    });
  });
});
