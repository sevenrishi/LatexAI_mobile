import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from '../src/screens/dashboard/DashboardScreen';
import { HistoryScreen } from '../src/screens/history/HistoryScreen';
import { api } from '../src/lib/api';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import NetInfo from '@react-native-community/netinfo';
import { Share } from 'react-native';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

jest.spyOn(Share, 'share').mockImplementation(() =>
  Promise.resolve({ action: Share.sharedAction, activityType: undefined })
);

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });

const mockDashboardData = {
  metrics: {
    totalResumes: 12,
    completedResumes: 10,
    failedResumes: 1,
    inProgressResumes: 1,
    averageAtsScore: 89,
  },
  quotas: {
    dailyLimit: 15,
    dailyUsed: 4,
    dailyRemaining: 11,
  },
  topKeywords: [
    { keyword: 'Kubernetes', count: 9 },
    { keyword: 'TypeScript', count: 8 },
    { keyword: 'Go', count: 7 },
  ],
  recentGenerations: [
    {
      id: 'gen-stripe-01',
      jobTitle: 'Principal Systems Architect',
      company: 'Stripe',
      status: 'completed',
      atsScore: 92,
      createdAt: '2026-10-31T01:00:00Z',
    },
    {
      id: 'gen-datadog-02',
      jobTitle: 'Staff Backend Engineer',
      company: 'Datadog',
      status: 'completed',
      atsScore: 86,
      createdAt: '2026-10-30T22:00:00Z',
    },
  ],
};

const mockHistoryData = {
  items: [
    {
      id: 'gen-hist-1',
      jobTitle: 'Senior Infrastructure Engineer',
      company: 'Stripe',
      status: 'completed',
      atsScore: 91,
      createdAt: '2026-10-30T10:00:00Z',
    },
    {
      id: 'gen-hist-2',
      jobTitle: 'Platform Engineer',
      company: 'Airbnb',
      status: 'tailoring',
      atsScore: null,
      createdAt: '2026-10-29T10:00:00Z',
    },
    {
      id: 'gen-hist-3',
      jobTitle: 'Site Reliability Engineer',
      company: 'Netflix',
      status: 'failed',
      atsScore: 45,
      createdAt: '2026-10-28T10:00:00Z',
    },
  ],
  nextCursor: 'cursor-page-2',
  hasMore: true,
  total: 25,
};

const renderWithProviders = async (ui: React.ReactElement, queryClient = createTestQueryClient()) => {
  return await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialMode="light">{ui}</ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

describe('Phase J: Dashboard & History Screens (MB-6.01, MB-6.02, MB-5.08)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      isOnboarded: true,
      user: {
        id: 'user-test-1',
        name: 'Alex Johnson',
        email: 'alex@example.com',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    });
  });

  describe('MB-6.01: S-11 Dashboard Screen', () => {
    beforeEach(() => {
      jest.spyOn(api, 'get').mockResolvedValue(JSON.parse(JSON.stringify(mockDashboardData)));
    });

    it('renders aggregate ATS score gauge, daily quotas, and metrics cards', async () => {
      const { findByTestId, findByText } = await renderWithProviders(<DashboardScreen />);

      expect(await findByTestId('dashboard-screen')).toBeTruthy();
      expect(await findByText('AVG ATS PERFORMANCE')).toBeTruthy();
      expect(await findByText('89')).toBeTruthy();

      // Quotas
      expect(await findByText('11 remaining (4/15)')).toBeTruthy();

      // Metrics cards
      expect(await findByText('Total Tailored')).toBeTruthy();
      expect(await findByText('12')).toBeTruthy();
      expect(await findByText('Compiled Ready')).toBeTruthy();
      expect(await findByText('In Pipeline')).toBeTruthy();
    });

    it('renders recent tailored resumes and navigates to Review upon selection', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<DashboardScreen />);

      expect(await findByTestId('dashboard-screen')).toBeTruthy();
      expect(await findByText('Principal Systems Architect')).toBeTruthy();
      expect(await findByText('Stripe')).toBeTruthy();

      // Click recent item
      fireEvent.press(getByTestId('dashboard-recent-gen-stripe-01'));
      expect(mockNavigate).toHaveBeenCalledWith('Review', { generationId: 'gen-stripe-01' });
    });

    it('navigates to standalone AtsChecker from quick tool shortcut', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<DashboardScreen />);

      expect(await findByTestId('dashboard-screen')).toBeTruthy();
      await findByText('Standalone ATS Checker');
      fireEvent.press(getByTestId('btn-dashboard-ats-checker'));

      expect(mockNavigate).toHaveBeenCalledWith('AtsChecker');
    });

    it('navigates to NewGeneration when CTA button is tapped', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders(<DashboardScreen />);

      expect(await findByTestId('dashboard-screen')).toBeTruthy();
      fireEvent.press(getByTestId('btn-dashboard-new-generation'));
      expect(mockNavigate).toHaveBeenCalledWith('NewGeneration', {});
    });
  });

  describe('MB-6.02 & MB-5.08: S-33 History Screen with Filters, Pagination & Overflow Sheet', () => {
    beforeEach(() => {
      jest.spyOn(api, 'get').mockResolvedValue(JSON.parse(JSON.stringify(mockHistoryData)));
    });

    it('renders history search bar, filter chips, and resume cards', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<HistoryScreen />);

      expect(await findByTestId('history-screen')).toBeTruthy();
      expect(getByTestId('input-history-search')).toBeTruthy();
      expect(getByTestId('filter-chip-all')).toBeTruthy();
      expect(getByTestId('filter-chip-completed')).toBeTruthy();

      expect(await findByText('Senior Infrastructure Engineer')).toBeTruthy();
      expect(await findByText('Platform Engineer')).toBeTruthy();
      expect(await findByText('Site Reliability Engineer')).toBeTruthy();
    });

    it('filters resume list by query and status chip', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<HistoryScreen />);

      expect(await findByTestId('history-screen')).toBeTruthy();
      await findByText('Senior Infrastructure Engineer');

      // Filter by "Completed"
      fireEvent.press(getByTestId('filter-chip-completed'));

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/resumes',
          expect.objectContaining({
            params: expect.objectContaining({ status: 'completed' }),
          })
        );
      });

      // Search text filter
      const searchInput = getByTestId('input-history-search');
      fireEvent.changeText(searchInput, 'Netflix');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/resumes',
          expect.objectContaining({
            params: expect.objectContaining({ search: 'Netflix' }),
          })
        );
      });
    });

    it('opens overflow action sheet and supports Review, ATS Audit, and Reuse', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<HistoryScreen />);

      expect(await findByTestId('history-screen')).toBeTruthy();
      await findByText('Senior Infrastructure Engineer');

      // Open overflow menu for first item
      fireEvent.press(getByTestId('btn-history-overflow-gen-hist-1'));

      expect(await findByTestId('sheet-action-review')).toBeTruthy();
      expect(getByTestId('sheet-action-ats')).toBeTruthy();
      expect(getByTestId('sheet-action-reuse')).toBeTruthy();

      // Tap Reuse
      fireEvent.press(getByTestId('sheet-action-reuse'));
      expect(mockNavigate).toHaveBeenCalledWith('NewGeneration', { fromGenerationId: 'gen-hist-1' });
    });

    it('deletes resume record after confirmation dialog', async () => {
      jest.spyOn(api, 'delete').mockResolvedValue({ success: true });
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<HistoryScreen />);

      expect(await findByTestId('history-screen')).toBeTruthy();
      await findByText('Senior Infrastructure Engineer');

      // Open overflow menu
      fireEvent.press(getByTestId('btn-history-overflow-gen-hist-1'));

      // Tap Delete action
      const deleteAction = await findByTestId('sheet-action-delete');
      fireEvent.press(deleteAction);

      expect(await findByText('Delete Tailored Resume?')).toBeTruthy();

      // Confirm deletion
      await act(async () => {
        fireEvent.press(getByTestId('confirm-dialog-confirm-button'));
      });

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/resumes/gen-hist-1');
      });
    });
  });

  describe('MB-6.07: Offline Caching & Fallback Banner', () => {
    it('renders offline banner when network is disconnected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

      const { findByTestId } = await renderWithProviders(<HistoryScreen />);
      expect(await findByTestId('offline-banner')).toBeTruthy();
    });
  });
});
