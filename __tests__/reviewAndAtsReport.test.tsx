import React from 'react';
import { act, cleanup, configure, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

configure({ asyncUtilTimeout: 4000 });

import { ThemeProvider } from '../src/theme';
import { api } from '../src/lib/api';
import {
  GENERATION_KEYS,
  useAtsScore,
  useGeneration,
  useRerenderGeneration,
  useResetTailoredContent,
} from '../src/features/generation';
import {
  AtsReportScreen,
  ChangesTab,
  InlinePdfViewer,
  ReviewScreen,
} from '../src/screens/generate';
import {
  mockAtsScore,
  mockChangeSummary,
  mockGenerations,
  mockOriginalTailoredContent,
  mockTailoredContent,
} from '../src/mocks/fixtures';
import { useUiStore } from '../src/store/uiStore';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
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

// Mock PdfViewer to avoid native blob download timers in UI tests
jest.mock('../src/components/pdf/PdfViewer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    PdfViewer: (props: any) =>
      React.createElement(View, { testID: props.testID || 'mock-pdf-viewer', ...props }),
  };
});

describe('Phase I: ATS Score & Review Screen Integration', () => {
  let queryClient: QueryClient;
  const testGenId = 'gen_01h8x9p3q7r0v2b4k5m6n7p8q1';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { generationId: testGenId };
    queryClient = createTestQueryClient();

    // Pre-populate query cache for fast deterministic tests
    queryClient.setQueryData(
      GENERATION_KEYS.detail(testGenId),
      JSON.parse(JSON.stringify(mockGenerations[0]))
    );
    queryClient.setQueryData(
      GENERATION_KEYS.atsScore(testGenId),
      JSON.parse(JSON.stringify(mockAtsScore))
    );

    jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/ats-score')) {
        return JSON.parse(JSON.stringify(mockAtsScore));
      }
      if (endpoint.includes(`/generate/${testGenId}`)) {
        return JSON.parse(JSON.stringify(mockGenerations[0]));
      }
      return null;
    });

    jest.spyOn(api, 'post').mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/rerender')) {
        return {
          id: testGenId,
          status: 'completed',
          pdfUrl: 'https://example.com/rerendered.pdf',
          pageCount: 1,
        };
      }
      if (endpoint.includes('/content/reset')) {
        return {
          id: testGenId,
          status: 'completed',
          pdfUrl: 'https://example.com/reset.pdf',
        };
      }
      if (endpoint.includes('/skills/bulk')) {
        return [{ category: 'Technical Skills', skills: ['Terraform'] }];
      }
      return {};
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = async (component: React.ReactElement) => {
    return await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode="light">{component}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  };

  describe('MB-5.01: S-30 Review Screen Shell, Header Menus, and Summary Strips', () => {
    it('renders the Review screen shell with job title, company, and summary strip', async () => {
      const { findByTestId, getByText, getByTestId } = await renderWithProviders(<ReviewScreen />);

      expect(await findByTestId('review-screen')).toBeTruthy();
      expect(getByTestId('review-summary-strip')).toBeTruthy();

      // Role and company titles
      expect(getByText('Staff Backend Infrastructure Engineer')).toBeTruthy();
      expect(getByText('Stripe')).toBeTruthy();

      // Summary strip elements
      expect(getByText('ATS: 88/100')).toBeTruthy();
      expect(getByText('1 of 1 Page')).toBeTruthy();
      expect(getByText('Compiled')).toBeTruthy();

      // Header buttons
      expect(getByTestId('btn-review-back')).toBeTruthy();
      expect(getByTestId('btn-header-ats-shortcut')).toBeTruthy();
      expect(getByTestId('btn-header-edit-content')).toBeTruthy();
      expect(getByTestId('btn-review-menu')).toBeTruthy();
    });

    it('navigates to AtsReport screen when tapping ATS shortcut badge or button', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders(<ReviewScreen />);

      await findByTestId('review-screen');

      // Tap header ATS pill
      await fireEvent.press(getByTestId('btn-header-ats-shortcut'));
      expect(mockNavigate).toHaveBeenCalledWith('AtsReport', { generationId: testGenId });

      // Tap summary strip ATS badge
      await fireEvent.press(getByTestId('btn-summary-ats-badge'));
      expect(mockNavigate).toHaveBeenCalledWith('AtsReport', { generationId: testGenId });

      // Tap quick action button
      await fireEvent.press(getByTestId('btn-quick-ats'));
      expect(mockNavigate).toHaveBeenCalledWith('AtsReport', { generationId: testGenId });
    });

    it('navigates to EditContent screen when tapping Edit Content button', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders(<ReviewScreen />);

      await findByTestId('review-screen');

      await fireEvent.press(getByTestId('btn-header-edit-content'));
      expect(mockNavigate).toHaveBeenCalledWith('EditContent', { generationId: testGenId });

      await fireEvent.press(getByTestId('btn-quick-edit'));
      expect(mockNavigate).toHaveBeenCalledWith('EditContent', { generationId: testGenId });
    });

    it('toggles tabs between PDF Preview, Changes, and Job Details', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(<ReviewScreen />);

      await findByTestId('review-screen');
      expect(getByTestId('tab-btn-preview')).toBeTruthy();
      expect(getByTestId('review-inline-pdf-viewer')).toBeTruthy();

      // Switch to Changes tab
      await fireEvent.press(getByTestId('tab-btn-changes'));
      expect(await findByTestId('review-changes-tab')).toBeTruthy();
      expect(getByText('AI Optimization Summary')).toBeTruthy();

      // Switch to Job Details tab
      await fireEvent.press(getByTestId('tab-btn-jd'));
      expect(await findByTestId('review-jd-tab')).toBeTruthy();
      expect(getByText('JOB POSTING TEXT')).toBeTruthy();

      // Switch back to Preview tab
      await fireEvent.press(getByTestId('tab-btn-preview'));
      expect(await findByTestId('review-inline-pdf-viewer')).toBeTruthy();
    });

    it('opens overflow actions bottom sheet when more button is pressed', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(<ReviewScreen />);

      await findByTestId('review-screen');
      await fireEvent.press(getByTestId('btn-review-menu'));

      expect(await findByTestId('menu-action-ats')).toBeTruthy();
      expect(getByText('Resume Actions')).toBeTruthy();
      expect(getByTestId('menu-action-edit')).toBeTruthy();
      expect(getByTestId('menu-action-fullscreen')).toBeTruthy();
      expect(getByTestId('menu-action-rerender')).toBeTruthy();
      expect(getByTestId('menu-action-reset')).toBeTruthy();
    });
  });

  describe('MB-5.02: Inline PdfViewer Panels and Out-of-Date Indicators', () => {
    it('renders inline PDF viewer when PDF url is present', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(
        <InlinePdfViewer
          pdfUrl="https://example.com/resume.pdf"
          isOutOfDate={false}
          isRerendering={false}
        />
      );

      expect(await findByTestId('inline-pdf-viewer')).toBeTruthy();
      expect(getByTestId('review-pdf-viewer')).toBeTruthy();
      expect(getByText('Page 1 of 1')).toBeTruthy();
    });

    it('shows out-of-date banner overlay when content is modified', async () => {
      const onRerender = jest.fn();
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(
        <InlinePdfViewer
          pdfUrl="https://example.com/resume.pdf"
          isOutOfDate={true}
          isRerendering={false}
          onRerender={onRerender}
        />
      );

      expect(await findByTestId('out-of-date-banner')).toBeTruthy();
      expect(getByText('Content Modified')).toBeTruthy();
      expect(getByText('PDF preview is out of date with your latest edits.')).toBeTruthy();

      const btnRerender = getByTestId('btn-rerender-pdf');
      await fireEvent.press(btnRerender);
      expect(onRerender).toHaveBeenCalledTimes(1);
    });

    it('displays compiling loading overlay when re-rendering', async () => {
      const { findByTestId, getByText } = await renderWithProviders(
        <InlinePdfViewer
          pdfUrl="https://example.com/resume.pdf"
          isOutOfDate={true}
          isRerendering={true}
        />
      );

      expect(await findByTestId('rerendering-overlay')).toBeTruthy();
      expect(getByText('Compiling XeLaTeX PDF...')).toBeTruthy();
    });

    it('calls onFullscreen callback when fullscreen button is tapped', async () => {
      const onFullscreen = jest.fn();
      const { findByTestId, getByTestId } = await renderWithProviders(
        <InlinePdfViewer
          pdfUrl="https://example.com/resume.pdf"
          onFullscreen={onFullscreen}
        />
      );

      expect(await findByTestId('btn-fullscreen-pdf')).toBeTruthy();
      await fireEvent.press(getByTestId('btn-fullscreen-pdf'));
      expect(onFullscreen).toHaveBeenCalledTimes(1);
    });
  });

  describe('MB-5.03: S-32 AtsReport Screen and Profile-Add Shortcuts', () => {
    it('renders ATS score gauge, tier text, and breakdown metrics', async () => {
      const { findByTestId, getByText, getByTestId } = await renderWithProviders(<AtsReportScreen />);

      expect(await findByTestId('ats-report-screen')).toBeTruthy();
      expect(getByTestId('ats-score-card')).toBeTruthy();

      // Score and Grade
      expect(getByText('88/100 Overall Score')).toBeTruthy();
      expect(getByText('Grade A')).toBeTruthy();
      expect(getByText('Strong Match')).toBeTruthy();

      // Breakdown card
      expect(getByTestId('ats-breakdown-card')).toBeTruthy();
      expect(getByText('Score Component Breakdown')).toBeTruthy();
      expect(getByText('Format & Layout Compliance')).toBeTruthy();
      expect(getByText('Standard Section Detection')).toBeTruthy();
    });

    it('renders matched keywords and filters by search text', async () => {
      const { findByTestId, getByTestId, queryByTestId } = await renderWithProviders(<AtsReportScreen />);

      expect(await findByTestId('ats-report-screen')).toBeTruthy();
      expect(getByTestId('matched-keywords-block')).toBeTruthy();
      expect(getByTestId('chip-matched-Go')).toBeTruthy();
      expect(getByTestId('chip-matched-Kubernetes')).toBeTruthy();

      // Switch to matched tab
      await fireEvent.press(getByTestId('tab-filter-matched'));
      expect(getByTestId('matched-keywords-block')).toBeTruthy();
      expect(queryByTestId('missing-keywords-block')).toBeNull();
    });

    it('renders missing keywords and allows adding directly to profile with Toast feedback', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(<AtsReportScreen />);

      expect(await findByTestId('ats-report-screen')).toBeTruthy();
      expect(getByTestId('missing-keywords-block')).toBeTruthy();

      // Missing keywords
      expect(getByTestId('missing-row-Terraform')).toBeTruthy();
      expect(getByTestId('missing-row-Prometheus')).toBeTruthy();
      expect(getByTestId('missing-row-FinTech')).toBeTruthy();

      const btnAddTerraform = getByTestId('btn-add-profile-Terraform');
      expect(btnAddTerraform).toBeTruthy();

      // Click add to profile
      await act(async () => {
        fireEvent.press(btnAddTerraform);
      });

      await waitFor(() => {
        expect(getByText('Added ✓')).toBeTruthy();
      });

      // UI Store Toast verification
      const activeToast = useUiStore.getState().activeToast;
      expect(activeToast?.type).toBe('success');
      expect(activeToast?.message).toContain('Terraform');
    });

    it('renders format checks checklist and recommendations', async () => {
      const { findByTestId, getByText, getByTestId } = await renderWithProviders(<AtsReportScreen />);

      expect(await findByTestId('ats-report-screen')).toBeTruthy();
      expect(getByTestId('format-checks-card')).toBeTruthy();
      expect(getByTestId('suggestions-card')).toBeTruthy();

      expect(getByText('Single-column linear parsing structure')).toBeTruthy();
      expect(getByText('Machine-readable UTF-8 PDF text extraction')).toBeTruthy();
      expect(getByText(/Add "Terraform" to your profile skills/i)).toBeTruthy();
    });
  });

  describe('MB-5.04: Changes Tab Component with AI Note Summaries and Diffs', () => {
    it('renders AI optimization metrics and notes summary', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(
        <ChangesTab
          changeSummary={mockChangeSummary}
          tailoredContent={mockTailoredContent}
          originalTailoredContent={mockOriginalTailoredContent}
        />
      );

      expect(await findByTestId('changes-tab')).toBeTruthy();
      expect(getByTestId('metric-bullets-modified')).toBeTruthy();
      expect(getByTestId('metric-keywords-aligned')).toBeTruthy();
      expect(getByTestId('metric-tailoring-score')).toBeTruthy();

      expect(getByText('AI Optimization Summary')).toBeTruthy();
      expect(getByText(/Tailored professional summary to emphasize high-throughput/i)).toBeTruthy();
    });

    it('renders role-based before/after diffs with original and tailored comparisons', async () => {
      const { findByTestId, getByTestId, getByText, getAllByText } = await renderWithProviders(
        <ChangesTab
          changeSummary={mockChangeSummary}
          tailoredContent={mockTailoredContent}
          originalTailoredContent={mockOriginalTailoredContent}
        />
      );

      expect(await findByTestId('changes-tab')).toBeTruthy();
      expect(getByTestId('role-diff-exp_1')).toBeTruthy();
      expect(getByTestId('role-diff-exp_2')).toBeTruthy();

      expect(getByText('TechCorp Cloud Systems')).toBeTruthy();
      expect(getByText('DataFlow Inc.')).toBeTruthy();

      // Badges
      expect(getAllByText('Original').length).toBeGreaterThan(0);
      expect(getAllByText('Tailored').length).toBeGreaterThan(0);
    });

    it('renders summary diff when summary has changed', async () => {
      const { findByTestId, getByTestId, getByText } = await renderWithProviders(
        <ChangesTab
          changeSummary={mockChangeSummary}
          tailoredContent={mockTailoredContent}
          originalTailoredContent={mockOriginalTailoredContent}
        />
      );

      expect(await findByTestId('changes-tab')).toBeTruthy();
      expect(getByTestId('summary-diff-card')).toBeTruthy();
      expect(getByText('Professional Summary Diff')).toBeTruthy();
      expect(getByText('Original Summary')).toBeTruthy();
      expect(getByText('Tailored Summary')).toBeTruthy();
    });

    it('calls onResetToAi and onEditContent callbacks', async () => {
      const onReset = jest.fn();
      const onEdit = jest.fn();

      const { findByTestId, getByTestId } = await renderWithProviders(
        <ChangesTab
          changeSummary={mockChangeSummary}
          tailoredContent={mockTailoredContent}
          originalTailoredContent={mockOriginalTailoredContent}
          onResetToAi={onReset}
          onEditContent={onEdit}
        />
      );

      expect(await findByTestId('changes-tab')).toBeTruthy();
      expect(getByTestId('btn-reset-to-ai')).toBeTruthy();
      await fireEvent.press(getByTestId('btn-reset-to-ai'));
      expect(onReset).toHaveBeenCalledTimes(1);

      await fireEvent.press(getByTestId('btn-edit-content-from-changes'));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });
});
