import React from 'react';
import { Alert } from 'react-native';
import { configure, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

configure({ asyncUtilTimeout: 4000 });

import { ThemeProvider } from '../src/theme';
import { api } from '../src/lib/api';
import { ApiError } from '../src/lib/errors';
import { mockGenerations, mockProfile, mockTemplates } from '../src/mocks/fixtures';
import { TEMPLATES_QUERY_KEY } from '../src/features/templates';
import { PROFILE_KEYS } from '../src/features/profile/useProfile';
import { GENERATION_KEYS } from '../src/features/generation';
import { NewGenerationScreen } from '../src/screens/generate/NewGenerationScreen';

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
const mockGoBack = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
  };
});

describe('Phase D: Job Input (NewGenerationScreen)', () => {
  let queryClient: QueryClient;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
    queryClient = createTestQueryClient();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    // Pre-populate query cache
    queryClient.setQueryData(TEMPLATES_QUERY_KEY, JSON.parse(JSON.stringify(mockTemplates)));
    queryClient.setQueryData(PROFILE_KEYS.detail(), JSON.parse(JSON.stringify(mockProfile)));
    queryClient.setQueryData(
      GENERATION_KEYS.detail('gen_01h8x9p3q7r0v2b4k5m6n7p8q1'),
      JSON.parse(JSON.stringify(mockGenerations[0]))
    );

    jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/templates') {
        return JSON.parse(JSON.stringify(mockTemplates));
      }
      if (endpoint === '/profile') {
        return JSON.parse(JSON.stringify(mockProfile));
      }
      if (endpoint.startsWith('/generate/')) {
        const id = endpoint.replace('/generate/', '');
        const found = mockGenerations.find((g) => g.id === id);
        return found || mockGenerations[0];
      }
      return null;
    });

    jest.spyOn(api, 'post').mockImplementation(async (endpoint: string, body?: any) => {
      if (endpoint === '/jobs/fetch' || endpoint === '/generate/parse-url') {
        if (body?.url?.includes('blocked')) {
          throw new ApiError('Site protected by anti-bot verification', 'URL_BLOCKED', 400);
        }
        if (body?.url?.includes('failed')) {
          throw new ApiError('Could not fetch posting', 'URL_FETCH_FAILED', 400);
        }
        return {
          jobTitle: 'Senior Distributed Systems Engineer',
          companyName: 'CloudScale Technologies',
          company: 'CloudScale Technologies',
          rawText:
            'We are seeking a Senior Distributed Systems Engineer to scale our global edge compute network. Requirements: 5+ years with Go, Kubernetes, TypeScript, high-throughput distributed architectures, and observability.',
          jobDescriptionText:
            'We are seeking a Senior Distributed Systems Engineer to scale our global edge compute network. Requirements: 5+ years with Go, Kubernetes, TypeScript, high-throughput distributed architectures, and observability.',
          success: true,
          warning: null,
          extractedVia: 'jsonld',
        };
      }

      if (endpoint === '/generate') {
        if (body?.jobDescription?.includes('FORCE_QUOTA_EXCEEDED')) {
          throw new ApiError('Monthly generation quota exceeded', 'QUOTA_EXCEEDED', 429);
        }
        if (body?.jobDescription?.includes('FORCE_PROFILE_INCOMPLETE')) {
          throw new ApiError('Profile incomplete', 'PROFILE_INCOMPLETE', 400);
        }
        return {
          id: 'gen_test_created_123',
          status: 'queued',
        };
      }

      return {};
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = async (params?: any) => {
    if (params) {
      mockRouteParams = params;
    }
    return await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode="light">
            <NewGenerationScreen />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  };

  describe('MB-4.01: S-28 NewGeneration Shell & Segmented Control', () => {
    it('renders header, segmented control, text input, and template selector', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders();

      expect(await findByTestId('new-generation-screen')).toBeTruthy();
      expect(getByText('New Generation')).toBeTruthy();
      expect(getByTestId('input-mode-segmented-control')).toBeTruthy();
      expect(getByTestId('segment-text')).toBeTruthy();
      expect(getByTestId('segment-url')).toBeTruthy();
      expect(getByTestId('text-input-section')).toBeTruthy();
      expect(getByTestId('jd-text-input')).toBeTruthy();
      expect(getByTestId('template-selector-section')).toBeTruthy();
      expect(getByTestId('submit-generation-button')).toBeTruthy();
    });

    it('switches between text and URL input modes via segmented control', async () => {
      const { findByTestId, getByTestId, queryByTestId } = await renderWithProviders();

      await findByTestId('new-generation-screen');

      // Initially in text mode
      expect(getByTestId('text-input-section')).toBeTruthy();
      expect(queryByTestId('url-input-section')).toBeNull();

      // Switch to URL mode
      await fireEvent.press(getByTestId('segment-url'));
      expect(getByTestId('url-input-section')).toBeTruthy();
      expect(queryByTestId('text-input-section')).toBeNull();

      // Switch back to text mode
      await fireEvent.press(getByTestId('segment-text'));
      expect(getByTestId('text-input-section')).toBeTruthy();
      expect(queryByTestId('url-input-section')).toBeNull();
    });
  });

  describe('MB-4.02: Job URL Fetch, Loading States & Fallback Warnings', () => {
    it('validates URL format before attempting fetch', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      await fireEvent.press(getByTestId('segment-url'));
      const urlInput = getByTestId('jd-url-input');

      await fireEvent.changeText(urlInput, 'not-a-valid-url');
      const fetchButton = getByTestId('fetch-url-button');
      await fireEvent.press(fetchButton);

      expect(alertSpy).toHaveBeenCalledWith(
        'Invalid URL',
        expect.stringContaining('Please enter a valid HTTP or HTTPS URL')
      );
    });

    it('successfully fetches job URL, extracts description, and switches to text mode', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      await fireEvent.press(getByTestId('segment-url'));
      const urlInput = getByTestId('jd-url-input');

      await fireEvent.changeText(urlInput, 'https://careers.google.com/jobs/results/12345');
      const fetchButton = getByTestId('fetch-url-button');
      await fireEvent.press(fetchButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          expect.stringMatching(/\/jobs\/fetch|\/generate\/parse-url/),
          { url: 'https://careers.google.com/jobs/results/12345' }
        );
      });

      // Auto-switched to text mode with populated description
      await waitFor(() => {
        expect(getByTestId('text-input-section')).toBeTruthy();
        expect(getByTestId('jd-text-input').props.value).toContain('Senior Distributed Systems Engineer');
      });
    });

    it('handles blocked site (URL_BLOCKED) with warning card and switch-to-text option', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      await fireEvent.press(getByTestId('segment-url'));
      const urlInput = getByTestId('jd-url-input');

      await fireEvent.changeText(urlInput, 'https://linkedin.com/jobs/blocked-posting');
      await fireEvent.press(getByTestId('fetch-url-button'));

      const errorCard = await findByTestId('url-parse-error');
      expect(errorCard).toBeTruthy();
      expect(alertSpy).toHaveBeenCalledWith(
        'Site Protected',
        expect.stringContaining('blocks automated access'),
        expect.any(Array)
      );

      // Tap switch to text button
      const switchBtn = getByTestId('switch-to-text-button');
      await fireEvent.press(switchBtn);

      expect(getByTestId('text-input-section')).toBeTruthy();
    });

    it('handles fetch failure (URL_FETCH_FAILED) with fallback alert', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      await fireEvent.press(getByTestId('segment-url'));
      const urlInput = getByTestId('jd-url-input');

      await fireEvent.changeText(urlInput, 'https://company.com/job/failed-fetch');
      await fireEvent.press(getByTestId('fetch-url-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to Fetch',
          expect.stringContaining('Could not retrieve the job posting'),
          expect.any(Array)
        );
      });
    });
  });

  describe('MB-4.03: Job Submission & Error Handling', () => {
    it('shows validation error when job description is under 50 characters', async () => {
      const { findByTestId, getByTestId, findByText } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      const textInput = getByTestId('jd-text-input');
      await fireEvent.changeText(textInput, 'Short JD');

      const submitBtn = getByTestId('submit-generation-button');
      await fireEvent.press(submitBtn);

      expect(await findByText(/Job description must be at least 50 characters/i)).toBeTruthy();
      expect(api.post).not.toHaveBeenCalledWith('/generate', expect.anything());
    });

    it('successfully submits generation and navigates to GenerationProgress', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      const fullJobText =
        'We are seeking a Senior Distributed Systems Engineer to scale our global infrastructure with Go, Kubernetes, TypeScript, and AWS cloud architecture.';
      await fireEvent.changeText(getByTestId('jd-text-input'), fullJobText);

      const submitBtn = getByTestId('submit-generation-button');
      await fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/generate', expect.objectContaining({
          templateId: 'tmpl_classic_ats',
        }));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('GenerationProgress', {
          generationId: 'gen_test_created_123',
        });
      });
    });

    it('handles quota exceeded (QUOTA_EXCEEDED) with informative alert', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      const quotaExceededText =
        'FORCE_QUOTA_EXCEEDED: Senior Distributed Systems Engineer position with Go, Kubernetes, and AWS architecture.';
      await fireEvent.changeText(getByTestId('jd-text-input'), quotaExceededText);

      await fireEvent.press(getByTestId('submit-generation-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Quota Exceeded',
          expect.stringContaining('daily generation limit')
        );
      });
    });

    it('handles profile incomplete error with profile navigation prompt', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      const incompleteText =
        'FORCE_PROFILE_INCOMPLETE: Seeking Senior Systems Architect with comprehensive experience in Kubernetes.';
      await fireEvent.changeText(getByTestId('jd-text-input'), incompleteText);

      await fireEvent.press(getByTestId('submit-generation-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Profile Incomplete',
          expect.stringContaining('profile needs more details'),
          expect.any(Array)
        );
      });
    });

    it('allows opening the template picker sheet to change active resume template', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders();
      await findByTestId('new-generation-screen');

      // Open picker
      await fireEvent.press(getByTestId('template-selector-button'));

      // Template picker bottom sheet appears
      expect(await findByTestId('generation-template-picker')).toBeTruthy();

      // Select executive template
      const execOption = await findByTestId('template-picker-item-tmpl_executive');
      await fireEvent.press(execOption);

      // Confirm
      await fireEvent.press(getByTestId('template-picker-confirm-button'));

      // Verify selected template label updated on screen
      expect(getByText('Executive Minimalist')).toBeTruthy();
    });
  });

  describe('MB-4.04: Parameter Pre-filling via fromGenerationId', () => {
    it('pre-fills job description and template when fromGenerationId route param is provided', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders({
        fromGenerationId: 'gen_01h8x9p3q7r0v2b4k5m6n7p8q1',
      });

      // Verify reuse banner is visible
      const reuseBanner = await findByTestId('reuse-generation-banner');
      expect(reuseBanner).toBeTruthy();

      // Verify pre-filled job description text
      await waitFor(() => {
        const textInput = getByTestId('jd-text-input');
        expect(textInput.props.value).toContain('Staff Backend Infrastructure Engineer');
      });

      // Submit and verify sourceGenerationId / fromGenerationId is passed in payload
      const submitBtn = getByTestId('submit-generation-button');
      await fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/generate',
          expect.objectContaining({
            sourceGenerationId: 'gen_01h8x9p3q7r0v2b4k5m6n7p8q1',
            fromGenerationId: 'gen_01h8x9p3q7r0v2b4k5m6n7p8q1',
          })
        );
      });
    });
  });
});
