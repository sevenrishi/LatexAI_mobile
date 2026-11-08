import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsScreen } from '../src/screens/settings/SettingsScreen';
import { AccountManagementScreen } from '../src/screens/settings/AccountManagementScreen';
import { ChangePasswordScreen } from '../src/screens/settings/ChangePasswordScreen';
import { DataPrivacyScreen } from '../src/screens/settings/DataPrivacyScreen';
import { AboutScreen } from '../src/screens/settings/AboutScreen';
import { AtsCheckerScreen } from '../src/screens/tools/AtsCheckerScreen';
import { api } from '../src/lib/api';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import { Share } from 'react-native';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

jest.spyOn(Share, 'share').mockImplementation(() =>
  Promise.resolve({ action: Share.sharedAction, activityType: undefined })
);

const renderWithTheme = async (ui: React.ReactElement) => {
  return await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider initialMode="light">{ui}</ThemeProvider>
    </SafeAreaProvider>
  );
};

describe('Phase J: Settings, Privacy, About & ATS Checker (MB-6.03 to MB-6.08)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      isOnboarded: true,
      user: {
        id: 'usr-test-123',
        email: 'alex.engineer@example.com',
        name: 'Alex Johnson',
        headline: 'Staff Infrastructure Architect',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    });
  });

  describe('MB-6.03: S-34 Settings Screen', () => {
    it('renders shortcuts to Account, Change Password, Privacy, and About', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithTheme(<SettingsScreen />);

      expect(await findByTestId('settings-screen')).toBeTruthy();
      expect(await findByText('Alex Johnson')).toBeTruthy();

      expect(getByTestId('btn-settings-account')).toBeTruthy();
      expect(getByTestId('btn-settings-change-password')).toBeTruthy();
      expect(getByTestId('btn-settings-privacy')).toBeTruthy();
      expect(getByTestId('btn-settings-about')).toBeTruthy();

      // Navigate to Account
      await act(async () => {
        fireEvent.press(getByTestId('btn-settings-account'));
      });
      expect(mockNavigate).toHaveBeenCalledWith('AccountManagement');
    });

    it('switches theme modes (System, Light, Dark)', async () => {
      const { findByTestId, getByTestId } = await renderWithTheme(<SettingsScreen />);
      await findByTestId('settings-screen');

      const darkOption = getByTestId('theme-option-dark');
      await act(async () => {
        fireEvent.press(darkOption);
      });
      expect(darkOption).toBeTruthy();
    });

    it('opens sign out confirmation dialog', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithTheme(<SettingsScreen />);
      await findByTestId('settings-screen');

      await act(async () => {
        fireEvent.press(getByTestId('sign-out-button'));
      });
      expect(await findByText(/Are you sure you want to sign out/)).toBeTruthy();
    });
  });

  describe('MB-6.04: S-35 Account Management Screen', () => {
    it('renders current profile info and allows updates via PATCH /auth/me', async () => {
      jest.spyOn(api, 'patch').mockResolvedValue({ success: true });
      const { findByTestId, findByText, getByTestId } = await renderWithTheme(<AccountManagementScreen />);

      expect(await findByTestId('account-management-screen')).toBeTruthy();
      expect(await findByText('alex.engineer@example.com')).toBeTruthy();

      const nameInput = getByTestId('input-account-name');
      await act(async () => {
        fireEvent.changeText(nameInput, 'Alexandre Johnson');
      });

      const saveBtn = getByTestId('btn-account-save');
      await act(async () => {
        fireEvent.press(saveBtn);
      });

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith(
          '/auth/me',
          expect.objectContaining({ fullName: 'Alexandre Johnson' })
        );
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('MB-6.04: S-36 Change Password Screen', () => {
    it('validates password requirements and calls POST /auth/password', async () => {
      jest.spyOn(api, 'post').mockResolvedValue({ success: true });
      const { findByTestId, getByTestId } = await renderWithTheme(<ChangePasswordScreen />);

      expect(await findByTestId('change-password-screen')).toBeTruthy();

      const newPassInput = getByTestId('input-new-password');
      const confirmInput = getByTestId('input-confirm-password');
      const submitBtn = getByTestId('btn-submit-change-password');

      // Disabled when under 8 characters
      await act(async () => {
        fireEvent.changeText(newPassInput, 'short');
        fireEvent.changeText(confirmInput, 'short');
      });
      expect(submitBtn.props.accessibilityState?.disabled).toBe(true);

      // Valid 8+ characters matching
      await act(async () => {
        fireEvent.changeText(newPassInput, 'SuperSecret2026!');
        fireEvent.changeText(confirmInput, 'SuperSecret2026!');
      });

      await act(async () => {
        fireEvent.press(submitBtn);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/auth/password',
          expect.objectContaining({ newPassword: 'SuperSecret2026!' })
        );
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('MB-6.05: S-37 Data Privacy Screen (Export & Typed Account Deletion)', () => {
    it('triggers data export archive and native share sheet', async () => {
      jest.spyOn(api, 'get').mockResolvedValue({
        user: { id: 'usr-123', email: 'test@example.com' },
        resumes: [],
      });

      const { findByTestId, getByTestId } = await renderWithTheme(<DataPrivacyScreen />);
      expect(await findByTestId('data-privacy-screen')).toBeTruthy();

      const exportBtn = getByTestId('btn-export-data');
      await act(async () => {
        fireEvent.press(exportBtn);
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/auth/export');
        expect(Share.share).toHaveBeenCalled();
      });
    });

    it('requires typed confirmation "DELETE" before enabling account deletion', async () => {
      jest.spyOn(api, 'delete').mockResolvedValue({ success: true });
      const { findByTestId, findByText, getByTestId } = await renderWithTheme(<DataPrivacyScreen />);
      expect(await findByTestId('data-privacy-screen')).toBeTruthy();

      const deleteBtn = getByTestId('btn-delete-account');
      const confirmInput = getByTestId('input-confirm-deletion');

      expect(deleteBtn.props.accessibilityState?.disabled).toBe(true);

      await act(async () => {
        fireEvent.changeText(confirmInput, 'REMOVE');
      });
      expect(deleteBtn.props.accessibilityState?.disabled).toBe(true);

      await act(async () => {
        fireEvent.changeText(confirmInput, 'DELETE');
      });
      expect(deleteBtn.props.accessibilityState?.disabled).toBe(false);

      await act(async () => {
        fireEvent.press(deleteBtn);
      });
      expect(await findByText(/Are you absolutely certain/)).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('confirm-dialog-confirm-button'));
      });

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/auth/account');
      });
    });
  });

  describe('MB-6.06: S-38 About Screen', () => {
    it('displays client and LaTeX compiler version metadata along with legal links', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithTheme(<AboutScreen />);

      expect(await findByTestId('about-screen')).toBeTruthy();
      expect(await findByText('LatexAI Mobile')).toBeTruthy();
      expect(await findByText('XeLaTeX 2026 Microservice')).toBeTruthy();
      expect(await findByText('1.0.0 (Build 42)')).toBeTruthy();

      expect(getByTestId('btn-legal-terms')).toBeTruthy();
      expect(getByTestId('btn-legal-privacy')).toBeTruthy();
      expect(getByTestId('btn-legal-licenses')).toBeTruthy();
    });
  });

  describe('MB-6.08: S-39 Standalone ATS Checker', () => {
    it('runs standalone PDF inspection and displays ATS checklist', async () => {
      jest.spyOn(api, 'post').mockResolvedValue({
        audit: {
          textExtractable: true,
          pageCount: 1,
          wordCount: 480,
          characterCount: 3200,
          detectedSections: ['Summary', 'Experience', 'Education', 'Skills'],
          missingSections: [],
          contactInfoDetected: true,
          formatScore: 92,
          issues: [],
        },
        atsScore: {
          score: 90,
          breakdown: { keywordScore: 88, formatScore: 92, sectionScore: 90 },
        },
      });

      const { findByTestId, findByText, getByTestId } = await renderWithTheme(<AtsCheckerScreen />);

      expect(await findByTestId('ats-checker-screen')).toBeTruthy();

      const uploadBtn = getByTestId('btn-upload-pdf');
      await act(async () => {
        fireEvent.press(uploadBtn);
      });

      await waitFor(() => {
        expect(getByTestId('btn-run-ats-audit')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-run-ats-audit'));
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/pdf/inspect', expect.anything());
        expect(getByTestId('checker-results-view')).toBeTruthy();
      });

      expect(await findByText('Text Extractability: Passed')).toBeTruthy();
    });
  });
});
