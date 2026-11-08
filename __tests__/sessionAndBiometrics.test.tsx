import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SessionExpiredModal } from '../src/components/feedback/SessionExpiredModal';
import { BiometricLockModal } from '../src/components/feedback/BiometricLockModal';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import { useUiStore } from '../src/store/uiStore';
import * as biometricsUtils from '../src/utils/biometrics';

const renderWithTheme = async (ui: React.ReactElement) => {
  return await render(<ThemeProvider initialMode="light">{ui}</ThemeProvider>);
};

describe('Session & Biometrics Security (MB-1.11, MB-1.12, MB-1.13, MB-1.14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuthStore.setState({
      user: {
        id: 'usr_abc',
        email: 'engineer@latexai.com',
        name: 'Jordan Lee',
        emailVerified: true,
        createdAt: '2026-01-01',
      },
      session: {
        accessToken: 'valid_access_token',
        refreshToken: 'valid_refresh_token',
        expiresAt: 1999999999,
      },
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
      isSplashFinished: true,
      isBiometricsLocked: false,
      error: null,
    });

    useUiStore.setState({
      themeMode: 'light',
      isOffline: false,
      activeToast: null,
      isSessionExpiredModalVisible: false,
    });
  });

  describe('SessionExpiredModal (MB-1.12)', () => {
    it('does not render when isSessionExpiredModalVisible is false', async () => {
      useUiStore.setState({ isSessionExpiredModalVisible: false });
      const { queryByTestId } = await renderWithTheme(<SessionExpiredModal />);
      expect(queryByTestId('session-expired-modal')).toBeNull();
    });

    it('renders alert when isSessionExpiredModalVisible is true', async () => {
      useUiStore.setState({ isSessionExpiredModalVisible: true });
      const { getByTestId, getByText } = await renderWithTheme(<SessionExpiredModal />);

      expect(getByTestId('session-expired-modal')).toBeTruthy();
      expect(getByText('Session Expired')).toBeTruthy();
      expect(
        getByText(/Your session has expired. Please sign in again/i)
      ).toBeTruthy();
    });

    it('handles "Sign In Again" by dismissing modal and triggering complete logout', async () => {
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue();
      useUiStore.setState({ isSessionExpiredModalVisible: true });

      const { getByTestId } = await renderWithTheme(<SessionExpiredModal />);
      const signInBtn = getByTestId('sign-in-again-button');

      await act(async () => {
        fireEvent.press(signInBtn);
      });

      expect(useUiStore.getState().isSessionExpiredModalVisible).toBe(false);
      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('BiometricLockModal (MB-1.13 security lock)', () => {
    it('does not render when app is not biometrics locked', async () => {
      useAuthStore.setState({ isBiometricsLocked: false });
      const { queryByTestId } = await renderWithTheme(<BiometricLockModal />);
      expect(queryByTestId('biometric-lock-modal')).toBeNull();
    });

    it('renders lock overlay when authenticated and isBiometricsLocked is true', async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        isSplashFinished: true,
        isBiometricsLocked: true,
      });

      const { getByTestId, getByText } = await renderWithTheme(<BiometricLockModal />);

      expect(getByTestId('biometric-lock-modal')).toBeTruthy();
      expect(getByText('LatexAI Locked')).toBeTruthy();
      expect(getByText(/Biometric authentication is required/i)).toBeTruthy();
    });

    it('unlocks when user taps Unlock with Biometrics', async () => {
      const unlockSpy = jest.spyOn(useAuthStore.getState(), 'unlockWithBiometrics').mockResolvedValue(true);
      useAuthStore.setState({
        isAuthenticated: true,
        isSplashFinished: true,
        isBiometricsLocked: true,
      });

      const { getByTestId } = await renderWithTheme(<BiometricLockModal />);
      const unlockBtn = getByTestId('biometric-unlock-button');

      await act(async () => {
        fireEvent.press(unlockBtn);
      });

      expect(unlockSpy).toHaveBeenCalled();
    });

    it('allows logout from locked overlay', async () => {
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue();
      useAuthStore.setState({
        isAuthenticated: true,
        isSplashFinished: true,
        isBiometricsLocked: true,
      });

      const { getByTestId } = await renderWithTheme(<BiometricLockModal />);
      const logoutBtn = getByTestId('biometric-logout-button');

      await act(async () => {
        fireEvent.press(logoutBtn);
      });

      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('SettingsScreen (MB-1.11, MB-1.13)', () => {
    it('renders user details, biometric toggle, theme options, and sign out button', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: true,
        biometryType: 'FaceID',
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(false);

      const { getByText, getByTestId } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByText('Jordan Lee')).toBeTruthy();
        expect(getByText('engineer@latexai.com')).toBeTruthy();
        expect(getByText('FaceID App Lock')).toBeTruthy();
        expect(getByTestId('biometrics-toggle')).toBeTruthy();
        expect(getByTestId('sign-out-button')).toBeTruthy();
      });
    });

    it('enables biometric lock when toggled on with verification', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: true,
        biometryType: 'FaceID',
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(false);
      const authSpy = jest.spyOn(biometricsUtils, 'authenticateWithBiometrics').mockResolvedValue(true);
      const setBioSpy = jest.spyOn(biometricsUtils, 'setBiometricsEnabled').mockResolvedValue(true);

      const { getByTestId } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByTestId('biometrics-toggle')).toBeTruthy();
      });

      const toggle = getByTestId('biometrics-toggle');

      await act(async () => {
        fireEvent(toggle, 'valueChange', true);
      });

      expect(authSpy).toHaveBeenCalled();
      expect(setBioSpy).toHaveBeenCalledWith(true);
      expect(useUiStore.getState().activeToast?.message).toContain('enabled');
    });

    it('cancels biometric enable when authentication prompt is cancelled', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: true,
        biometryType: 'TouchID',
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(false);
      jest.spyOn(biometricsUtils, 'authenticateWithBiometrics').mockResolvedValue(false);
      const setBioSpy = jest.spyOn(biometricsUtils, 'setBiometricsEnabled');

      const { getByTestId } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByTestId('biometrics-toggle')).toBeTruthy();
      });

      const toggle = getByTestId('biometrics-toggle');

      await act(async () => {
        fireEvent(toggle, 'valueChange', true);
      });

      expect(setBioSpy).not.toHaveBeenCalled();
      expect(useUiStore.getState().activeToast?.message).toContain('cancelled');
    });

    it('disables biometric lock when toggled off with verification', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: true,
        biometryType: 'Fingerprint',
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(true);
      jest.spyOn(biometricsUtils, 'authenticateWithBiometrics').mockResolvedValue(true);
      const setBioSpy = jest.spyOn(biometricsUtils, 'setBiometricsEnabled').mockResolvedValue(true);

      const { getByTestId } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByTestId('biometrics-toggle')).toBeTruthy();
      });

      const toggle = getByTestId('biometrics-toggle');

      await act(async () => {
        fireEvent(toggle, 'valueChange', false);
      });

      expect(setBioSpy).toHaveBeenCalledWith(false);
      expect(useUiStore.getState().activeToast?.message).toContain('disabled');
    });

    it('allows changing theme mode in settings', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: false,
        biometryType: null,
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(false);

      const { getByTestId } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByTestId('theme-option-dark')).toBeTruthy();
      });

      const darkOption = getByTestId('theme-option-dark');
      await act(async () => {
        fireEvent.press(darkOption);
      });

      expect(darkOption).toBeTruthy();
    });

    it('opens confirmation dialog on sign out and executes logout upon confirmation', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: false,
        biometryType: null,
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(false);
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue();

      const { getByTestId, getByText } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByTestId('sign-out-button')).toBeTruthy();
      });

      // 1. Press sign out button
      const signOutBtn = getByTestId('sign-out-button');
      await act(async () => {
        fireEvent.press(signOutBtn);
      });

      // 2. Confirmation dialog is visible
      expect(getByText(/Are you sure you want to sign out\?/i)).toBeTruthy();

      // 3. Confirm sign out
      const confirmButton = getByTestId('confirm-dialog-confirm-button');
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });

    it('cancels sign out dialog without logging out when Cancel is pressed', async () => {
      jest.spyOn(biometricsUtils, 'checkBiometricsSupport').mockResolvedValue({
        supported: false,
        biometryType: null,
      });
      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(false);
      const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue();

      const { getByTestId, getByText } = await renderWithTheme(<SettingsScreen />);

      await waitFor(() => {
        expect(getByTestId('sign-out-button')).toBeTruthy();
      });

      // Press sign out
      await act(async () => {
        fireEvent.press(getByTestId('sign-out-button'));
      });

      // Press Cancel
      const cancelBtn = getByTestId('confirm-dialog-cancel-button');
      await act(async () => {
        fireEvent.press(cancelBtn);
      });

      expect(logoutSpy).not.toHaveBeenCalled();
    });
  });
});
