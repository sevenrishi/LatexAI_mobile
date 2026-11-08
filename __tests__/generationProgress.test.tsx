import React from 'react';
import { AppState, BackHandler } from 'react-native';
import { act, configure, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

configure({ asyncUtilTimeout: 4000 });

import { ThemeProvider } from '../src/theme';
import { api } from '../src/lib/api';
import {
  computeGenerationStages,
  GENERATION_KEYS,
  useCancelGeneration,
  useGenerationStatus,
  useRetryGeneration,
} from '../src/features/generation';
import { GenerationProgressScreen } from '../src/screens/generate/GenerationProgressScreen';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
  };
});

describe('Phase E/F: JD Analysis & Tailoring (Client Integration)', () => {
  let queryClient: QueryClient;
  let currentScreen: any = null;
  const testGenId = 'gen_test_progress_123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { generationId: testGenId };
    queryClient = createTestQueryClient();

    // Default mock API responses (in-progress tailoring)
    jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
      if (endpoint === `/generate/${testGenId}/status`) {
        return {
          id: testGenId,
          status: 'tailoring',
          progress: 55,
          currentStage: 'tailoring',
          estimatedRemaining: 20,
        };
      }
      if (endpoint === `/generate/${testGenId}`) {
        return {
          id: testGenId,
          userId: 'user_123',
          jobTitle: 'Senior Systems Architect',
          companyName: 'OpenAI',
          company: 'OpenAI',
          status: 'tailoring',
        };
      }
      return {};
    });

    jest.spyOn(api, 'post').mockImplementation(async (endpoint: string) => {
      if (endpoint === `/generate/${testGenId}/cancel`) {
        return { success: true, id: testGenId, status: 'cancelled' };
      }
      if (endpoint === `/generate/${testGenId}/retry`) {
        return { id: testGenId, status: 'queued' };
      }
      return {};
    });
  });

  afterEach(() => {
    if (currentScreen) {
      currentScreen.unmount();
      currentScreen = null;
    }
    queryClient.clear();
  });

  const renderScreen = async () => {
    currentScreen = await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode="light">
            <GenerationProgressScreen />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
    return currentScreen;
  };

  describe('MB-4.05: Polling Hook & Background/Foreground Transitions', () => {
    it('computes 5-stage stepper states accurately across different generation milestones', () => {
      // 1. Initial queued
      const queuedStages = computeGenerationStages('queued', 10);
      expect(queuedStages).toHaveLength(5);
      expect(queuedStages[0]!.state).toBe('in_progress');
      expect(queuedStages[1]!.state).toBe('pending');

      // 2. Tailoring stage
      const tailoringStages = computeGenerationStages('tailoring', 55);
      expect(tailoringStages[0]!.state).toBe('completed');
      expect(tailoringStages[1]!.state).toBe('completed');
      expect(tailoringStages[2]!.state).toBe('in_progress');
      expect(tailoringStages[3]!.state).toBe('pending');

      // 3. Compiling stage
      const compilingStages = computeGenerationStages('compiling', 80);
      expect(compilingStages[2]!.state).toBe('completed');
      expect(compilingStages[3]!.state).toBe('in_progress');

      // 4. Completed stage
      const completedStages = computeGenerationStages('completed', 100);
      expect(completedStages.every((s) => s.state === 'completed')).toBe(true);

      // 5. Failed stage
      const failedStages = computeGenerationStages('failed', 50);
      expect(failedStages.some((s) => s.state === 'failed')).toBe(true);
    });

    it('useGenerationStatus polls and fetches status, stopping when completed', async () => {
      let callCount = 0;
      jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
        if (endpoint === `/generate/${testGenId}/status`) {
          callCount++;
          if (callCount === 1) {
            return { id: testGenId, status: 'tailoring', progress: 50 };
          }
          return { id: testGenId, status: 'completed', progress: 100 };
        }
        return {};
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const onCompleteMock = jest.fn();
      const hook = await renderHook(
        () =>
          useGenerationStatus(testGenId, {
            pollInterval: 1000,
            onComplete: onCompleteMock,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(hook.result.current.data?.status).toBe('tailoring');
      });

      // Refetch to advance to completed
      await act(async () => {
        await hook.result.current.refetch();
      });

      await waitFor(() => {
        expect(hook.result.current.data?.status).toBe('completed');
      });
      expect(onCompleteMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('useCancelGeneration calls cancel endpoint and updates query cache', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const hook = await renderHook(() => useCancelGeneration(), { wrapper });

      await act(async () => {
        await hook.result.current.mutateAsync(testGenId);
      });

      expect(api.post).toHaveBeenCalledWith(`/generate/${testGenId}/cancel`);
      const cached = queryClient.getQueryData<any>(GENERATION_KEYS.status(testGenId));
      expect(cached.status).toBe('cancelled');
    });

    it('useRetryGeneration triggers retry API and invalidates cache', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const hook = await renderHook(() => useRetryGeneration(), { wrapper });

      await act(async () => {
        await hook.result.current.mutateAsync(testGenId);
      });

      expect(api.post).toHaveBeenCalledWith(`/generate/${testGenId}/retry`);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: GENERATION_KEYS.status(testGenId),
      });
    });
  });

  describe('MB-4.06: S-29 GenerationProgress Screen UI & Stepper', () => {
    it('renders hero card, elapsed timer, progress percentage, and vertical stepper', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      expect(await findByTestId('generation-progress-screen')).toBeTruthy();
      expect(getByTestId('elapsed-timer')).toBeTruthy();
      expect(getByTestId('progress-bar-fill')).toBeTruthy();
      expect(getByTestId('vertical-status-stepper')).toBeTruthy();

      // Check stepper rows
      expect(getByTestId('step-row-extract')).toBeTruthy();
      expect(getByTestId('step-row-analyze')).toBeTruthy();
      expect(getByTestId('step-row-tailor')).toBeTruthy();
      expect(getByTestId('step-row-compile')).toBeTruthy();
      expect(getByTestId('step-row-score')).toBeTruthy();

      // Rotating tip card visible
      expect(getByTestId('rotating-tip-card')).toBeTruthy();
      expect(getByTestId('tip-text')).toBeTruthy();
    });

    it('shows elapsed timer starting at 00:00', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      expect(await findByTestId('elapsed-timer')).toBeTruthy();
      expect(getByTestId('elapsed-timer').props.children).toBe('00:00');
    });

    it('displays rotating user tips', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      expect(await findByTestId('tip-text')).toBeTruthy();
      expect(getByTestId('tip-text').props.children).toBeTruthy();
    });

    it('auto-advances or navigates to Review screen when completed', async () => {
      jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
        if (endpoint === `/generate/${testGenId}/status`) {
          return {
            id: testGenId,
            status: 'completed',
            progress: 100,
            currentStage: 'completed',
          };
        }
        if (endpoint === `/generate/${testGenId}`) {
          return {
            id: testGenId,
            jobTitle: 'Senior Systems Architect',
            companyName: 'OpenAI',
            status: 'completed',
          };
        }
        return {};
      });

      const { findByTestId, getByTestId } = await renderScreen();

      expect(await findByTestId('completed-actions')).toBeTruthy();

      // Press view resume button
      fireEvent.press(getByTestId('btn-view-resume'));

      expect(mockReplace).toHaveBeenCalledWith('Review', {
        generationId: testGenId,
      });
    });

    it('displays Failure Recovery Card and supports retry and edit actions on failure', async () => {
      jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
        if (endpoint === `/generate/${testGenId}/status`) {
          return {
            id: testGenId,
            status: 'failed',
            progress: 40,
            errorMessage: 'XeLaTeX compilation timed out during draft generation.',
            errorCode: 'COMPILER_TIMEOUT',
          };
        }
        if (endpoint === `/generate/${testGenId}`) {
          return {
            id: testGenId,
            jobTitle: 'Senior Systems Architect',
            companyName: 'OpenAI',
            status: 'failed',
          };
        }
        return {};
      });

      const { findByTestId, getByTestId, getByText } = await renderScreen();

      expect(await findByTestId('failure-recovery-card')).toBeTruthy();
      expect(
        getByText('XeLaTeX compilation timed out during draft generation.')
      ).toBeTruthy();

      // Test Retry button
      const retryBtn = getByTestId('btn-retry-generation');
      await act(async () => {
        fireEvent.press(retryBtn);
      });
      expect(api.post).toHaveBeenCalledWith(`/generate/${testGenId}/retry`);

      // Test Edit Job Description button
      const editBtn = getByTestId('btn-edit-job-desc');
      fireEvent.press(editBtn);
      expect(mockNavigate).toHaveBeenCalledWith('NewGeneration', {
        fromGenerationId: testGenId,
      });
    });
  });

  describe('MB-4.07: Back-Press Confirmation Sheets & Cancellation Controls', () => {
    it('opens confirmation sheet when close header button is pressed while generation is active', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      expect(await findByTestId('btn-close-progress')).toBeTruthy();

      fireEvent.press(getByTestId('btn-close-progress'));

      expect(await findByTestId('back-confirmation-sheet')).toBeTruthy();
      expect(getByTestId('btn-keep-in-background')).toBeTruthy();
      expect(getByTestId('btn-confirm-cancel-generation')).toBeTruthy();
      expect(getByTestId('btn-stay-on-screen')).toBeTruthy();
    });

    it('opens confirmation sheet when header Cancel text button is tapped', async () => {
      const { findByTestId } = await renderScreen();

      const cancelHeaderBtn = await findByTestId('btn-header-cancel');
      expect(cancelHeaderBtn).toBeTruthy();

      fireEvent.press(cancelHeaderBtn);
      expect(await findByTestId('back-confirmation-sheet')).toBeTruthy();
    });

    it('"Keep Running in Background" navigates to Dashboard without cancelling', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      const closeBtn = await findByTestId('btn-close-progress');
      fireEvent.press(closeBtn);

      const keepBtn = await findByTestId('btn-keep-in-background');
      fireEvent.press(keepBtn);

      expect(mockNavigate).toHaveBeenCalledWith('AppTabs', {
        screen: 'DashboardTab',
      });
      expect(api.post).not.toHaveBeenCalledWith(`/generate/${testGenId}/cancel`);
    });

    it('"Cancel Generation" calls cancel API and stops generation', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      const closeBtn = await findByTestId('btn-close-progress');
      fireEvent.press(closeBtn);

      const cancelBtn = await findByTestId('btn-confirm-cancel-generation');
      await act(async () => {
        fireEvent.press(cancelBtn);
      });

      expect(api.post).toHaveBeenCalledWith(`/generate/${testGenId}/cancel`);
    });

    it('"Stay on Screen" closes the sheet and keeps generation active', async () => {
      const { findByTestId, getByTestId } = await renderScreen();

      const closeBtn = await findByTestId('btn-close-progress');
      fireEvent.press(closeBtn);

      const stayBtn = await findByTestId('btn-stay-on-screen');
      fireEvent.press(stayBtn);

      expect(mockGoBack).not.toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('navigates back directly without confirmation dialog if generation is already completed', async () => {
      jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
        if (endpoint === `/generate/${testGenId}/status`) {
          return { id: testGenId, status: 'completed', progress: 100 };
        }
        if (endpoint === `/generate/${testGenId}`) {
          return { id: testGenId, status: 'completed' };
        }
        return {};
      });

      const { findByTestId } = await renderScreen();

      const closeBtn = await findByTestId('btn-close-progress');
      fireEvent.press(closeBtn);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
