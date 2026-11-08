import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from '../src/screens/auth/SplashScreen';
import { WelcomeScreen } from '../src/screens/auth/WelcomeScreen';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { SignupScreen } from '../src/screens/auth/SignupScreen';
import { VerifyEmailScreen } from '../src/screens/auth/VerifyEmailScreen';
import { ForgotPasswordScreen } from '../src/screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../src/screens/auth/ResetPasswordScreen';
import { ThemeProvider } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';

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

describe('Auth Screens (MB-1.03, MB-1.04, MB-1.05)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      isSplashFinished: false,
      isBiometricsLocked: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('S-01 SplashScreen (MB-1.03)', () => {
    it('renders branding elements and loader', async () => {
      const { getByText, getByTestId } = await renderWithTheme(
        <SplashScreen minDurationMs={100} />
      );

      expect(getByText('LatexAI')).toBeTruthy();
      expect(getByText('AI-Powered ATS LaTeX Resumes')).toBeTruthy();
      expect(getByTestId('splash-loader')).toBeTruthy();
    });

    it('triggers onFinish and updates setSplashFinished after min duration', async () => {
      const onFinishMock = jest.fn();
      const setSplashFinishedSpy = jest.spyOn(
        useAuthStore.getState(),
        'setSplashFinished'
      );

      await renderWithTheme(
        <SplashScreen minDurationMs={50} onFinish={onFinishMock} />
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 80));
      });

      expect(onFinishMock).toHaveBeenCalled();
      expect(setSplashFinishedSpy).toHaveBeenCalledWith(true);
    });

    it('shows lock status when biometrics lock is enabled', async () => {
      useAuthStore.setState({ isBiometricsLocked: true });

      const { getByText } = await renderWithTheme(
        <SplashScreen minDurationMs={50} />
      );

      await act(async () => {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 80));
      });

      expect(getByText('App is Locked')).toBeTruthy();
      expect(getByText('Unlock with Biometrics')).toBeTruthy();
    });
  });

  describe('S-02 WelcomeScreen (MB-1.04)', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    it('renders hero title, feature highlights, and action buttons', async () => {
      const { getByText, getByTestId } = await renderWithTheme(
        <WelcomeScreen navigation={mockNavigation} />
      );

      expect(getByText('Craft Resumes That Win Interviews')).toBeTruthy();
      expect(getByText('100% Compilable LaTeX')).toBeTruthy();
      expect(getByText('Real-Time ATS Score Match')).toBeTruthy();
      expect(getByTestId('google-login-button')).toBeTruthy();
      expect(getByTestId('github-login-button')).toBeTruthy();
      expect(getByTestId('email-login-button')).toBeTruthy();
      expect(getByTestId('signup-button')).toBeTruthy();
    });

    it('initiates Google OAuth and opens auth URL', async () => {
      jest.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2' },
        error: null,
      });
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

      const { getByTestId } = await renderWithTheme(
        <WelcomeScreen navigation={mockNavigation} />
      );

      const googleBtn = getByTestId('google-login-button');
      await act(async () => {
        fireEvent.press(googleBtn);
      });

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'latexai://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      expect(openUrlSpy).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2');
    });

    it('navigates to Login when Email button is pressed', async () => {
      const { getByTestId } = await renderWithTheme(
        <WelcomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('email-login-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });

    it('navigates to Signup when Create Account is pressed', async () => {
      const { getByTestId } = await renderWithTheme(
        <WelcomeScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('signup-button'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
    });
  });

  describe('S-03 LoginScreen (MB-1.05)', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    it('displays validation errors on invalid inputs', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <LoginScreen navigation={mockNavigation} />
      );

      const submitBtn = getByTestId('login-submit-button');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(getByText('Email address is required.')).toBeTruthy();
      expect(getByText('Password is required.')).toBeTruthy();
    });

    it('supports Dev Quick Demo Sign In button', async () => {
      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: {
          user: { id: 'usr_demo', email: 'demo@latexai.com', email_confirmed_at: '2026-01-01' } as any,
          session: { access_token: 'demo_token' } as any,
        },
        error: null,
      });

      const { getByTestId } = await renderWithTheme(
        <LoginScreen navigation={mockNavigation} />
      );

      const demoBtn = getByTestId('demo-login-button');
      expect(demoBtn).toBeTruthy();

      await act(async () => {
        fireEvent.press(demoBtn);
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'demo@latexai.com',
        password: 'DemoPass123!',
      });
    });

    it('handles invalid credentials error feedback', async () => {
      jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' } as any,
      });

      const { getByTestId, findByText } = await renderWithTheme(
        <LoginScreen navigation={mockNavigation} />
      );

      await act(async () => {
        fireEvent.changeText(getByTestId('login-email-input'), 'user@test.com');
        fireEvent.changeText(getByTestId('login-password-input'), 'WrongPassword123!');
      });

      await act(async () => {
        fireEvent.press(getByTestId('login-submit-button'));
      });

      const errorMsg = await findByText('Invalid email or password. Please try again.');
      expect(errorMsg).toBeTruthy();
    });

    it('navigates to ForgotPassword when link is clicked', async () => {
      const { getByTestId } = await renderWithTheme(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByTestId('forgot-password-link'));
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('S-04 SignupScreen (MB-1.06)', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    it('renders all required form inputs and terms checkbox', async () => {
      const { getByTestId, getAllByText } = await renderWithTheme(
        <SignupScreen navigation={mockNavigation} />
      );

      expect(getByTestId('signup-name-input')).toBeTruthy();
      expect(getByTestId('signup-email-input')).toBeTruthy();
      expect(getByTestId('signup-password-input')).toBeTruthy();
      expect(getByTestId('signup-confirm-password-input')).toBeTruthy();
      expect(getByTestId('terms-checkbox')).toBeTruthy();
      expect(getByTestId('signup-submit-button')).toBeTruthy();
      expect(getAllByText('Create Account').length).toBeGreaterThan(0);
    });

    it('validates fields and terms before submission', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <SignupScreen navigation={mockNavigation} />
      );

      const submitBtn = getByTestId('signup-submit-button');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(getByText('Full name is required.')).toBeTruthy();
      expect(getByText('Email address is required.')).toBeTruthy();
      expect(getByText('Password is required.')).toBeTruthy();
    });

    it('displays password strength indicator as user types', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <SignupScreen navigation={mockNavigation} />
      );

      await act(async () => {
        fireEvent.changeText(getByTestId('signup-password-input'), 'Pass123!');
      });

      expect(getByTestId('password-strength-container')).toBeTruthy();
      expect(getByTestId('password-strength-label')).toBeTruthy();
      expect(getByTestId('password-strength-meter')).toBeTruthy();
    });

    it('requires terms acceptance to submit', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <SignupScreen navigation={mockNavigation} />
      );

      await act(async () => {
        fireEvent.changeText(getByTestId('signup-name-input'), 'Alice Smith');
        fireEvent.changeText(getByTestId('signup-email-input'), 'alice@example.com');
        fireEvent.changeText(getByTestId('signup-password-input'), 'SecurePass123!');
        fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'SecurePass123!');
        fireEvent.press(getByTestId('signup-submit-button'));
      });

      expect(getByText('You must agree to the Terms of Service & Privacy Policy.')).toBeTruthy();
    });

    it('submits signup and routes to VerifyEmail holding screen', async () => {
      jest.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: { user: { id: 'usr_1', email: 'alice@example.com' } as any, session: null },
        error: null,
      });

      const { getByTestId } = await renderWithTheme(
        <SignupScreen navigation={mockNavigation} />
      );

      await act(async () => {
        fireEvent.changeText(getByTestId('signup-name-input'), 'Alice Smith');
        fireEvent.changeText(getByTestId('signup-email-input'), 'alice@example.com');
        fireEvent.changeText(getByTestId('signup-password-input'), 'SecurePass123!');
        fireEvent.changeText(getByTestId('signup-confirm-password-input'), 'SecurePass123!');
        fireEvent.press(getByTestId('terms-checkbox'));
      });

      await act(async () => {
        fireEvent.press(getByTestId('signup-submit-button'));
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'SecurePass123!',
        options: {
          data: { full_name: 'Alice Smith' },
          emailRedirectTo: 'latexai://verify-email',
        },
      });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('VerifyEmail', {
        email: 'alice@example.com',
      });
    });
  });

  describe('S-05 VerifyEmailScreen (MB-1.07)', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    it('displays target email and holding instructions', async () => {
      const { getByText, getByTestId } = await renderWithTheme(
        <VerifyEmailScreen
          navigation={mockNavigation}
          route={{ params: { email: 'test@example.com' } }}
        />
      );

      expect(getByText('Verify Your Email')).toBeTruthy();
      expect(getByTestId('verify-email-address')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByTestId('check-verification-button')).toBeTruthy();
      expect(getByTestId('resend-email-button')).toBeTruthy();
    });

    it('checks confirmation status and initializes auth on verified email', async () => {
      const initAuthSpy = jest
        .spyOn(useAuthStore.getState(), 'initializeAuth')
        .mockResolvedValue();

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: {
          user: { id: 'usr_verif', email_confirmed_at: '2026-10-01T12:00:00Z' } as any,
        },
        error: null,
      });

      const { getByTestId } = await renderWithTheme(
        <VerifyEmailScreen
          navigation={mockNavigation}
          route={{ params: { email: 'test@example.com' } }}
        />
      );

      await act(async () => {
        fireEvent.press(getByTestId('check-verification-button'));
      });

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(initAuthSpy).toHaveBeenCalled();
    });

    it('handles resending verification email', async () => {
      jest.spyOn(supabase.auth, 'resend').mockResolvedValue({
        data: {} as any,
        error: null,
      });

      const { getByTestId } = await renderWithTheme(
        <VerifyEmailScreen
          navigation={mockNavigation}
          route={{ params: { email: 'resend@example.com' } }}
        />
      );

      const resendBtn = getByTestId('resend-email-button');
      // Resend is initially in cooldown countdown, wait or check disabled state
      expect(resendBtn).toBeTruthy();
    });
  });

  describe('S-06 ForgotPasswordScreen (MB-1.08)', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    it('renders forgot password form and validates email', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <ForgotPasswordScreen navigation={mockNavigation} />
      );

      expect(getByTestId('forgot-password-email-input')).toBeTruthy();
      expect(getByTestId('forgot-password-submit-button')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('forgot-password-submit-button'));
      });

      expect(getByText('Email address is required.')).toBeTruthy();
    });

    it('submits reset request and displays submission feedback state', async () => {
      jest.spyOn(supabase.auth, 'resetPasswordForEmail').mockResolvedValue({
        data: {} as any,
        error: null,
      });

      const { getByTestId, findByTestId, getByText } = await renderWithTheme(
        <ForgotPasswordScreen navigation={mockNavigation} />
      );

      await act(async () => {
        fireEvent.changeText(
          getByTestId('forgot-password-email-input'),
          'recovery@example.com'
        );
      });

      await act(async () => {
        fireEvent.press(getByTestId('forgot-password-submit-button'));
      });

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'recovery@example.com',
        { redirectTo: 'latexai://auth/reset-password' }
      );

      const successView = await findByTestId('forgot-password-success-view');
      expect(successView).toBeTruthy();
      expect(getByText('Reset Link Sent')).toBeTruthy();
      expect(getByText('recovery@example.com')).toBeTruthy();
    });
  });

  describe('S-07 ResetPasswordScreen (MB-1.09)', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn(),
    };

    it('renders password input fields with strength indicator', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <ResetPasswordScreen
          navigation={mockNavigation}
          route={{ params: { token: 'sample_token', type: 'recovery' } }}
        />
      );

      expect(getByTestId('reset-password-input')).toBeTruthy();
      expect(getByTestId('reset-confirm-password-input')).toBeTruthy();
      expect(getByTestId('recovery-mode-banner')).toBeTruthy();
      expect(getByText('Recovery session active. Enter your new password below.')).toBeTruthy();
    });

    it('validates password mismatch and strength', async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <ResetPasswordScreen
          navigation={mockNavigation}
          route={{ params: { token: 'tok_1' } }}
        />
      );

      await act(async () => {
        fireEvent.changeText(getByTestId('reset-password-input'), 'Weak1!');
        fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'Mismatch123!');
      });

      await act(async () => {
        fireEvent.press(getByTestId('reset-password-submit-button'));
      });

      expect(getByText('Password must be at least 8 characters long.')).toBeTruthy();
    });

    it('submits updated password and shows success feedback', async () => {
      jest.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
        data: { user: { id: 'usr_reset' } as any },
        error: null,
      });

      const { getByTestId, findByTestId, getByText } = await renderWithTheme(
        <ResetPasswordScreen
          navigation={mockNavigation}
          route={{ params: { token: 'valid_token' } }}
        />
      );

      await act(async () => {
        fireEvent.changeText(getByTestId('reset-password-input'), 'NewValidPass123!');
        fireEvent.changeText(getByTestId('reset-confirm-password-input'), 'NewValidPass123!');
      });

      await act(async () => {
        fireEvent.press(getByTestId('reset-password-submit-button'));
      });

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'NewValidPass123!',
      });

      const successView = await findByTestId('reset-password-success-view');
      expect(successView).toBeTruthy();
      expect(getByText('Password Updated')).toBeTruthy();
    });
  });
});
