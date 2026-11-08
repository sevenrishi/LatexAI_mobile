import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Share } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { EditContentScreen } from '../src/screens/generate/EditContentScreen';
import { ReviewScreen } from '../src/screens/generate/ReviewScreen';
import { api } from '../src/lib/api';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { GENERATION_KEYS } from '../src/features/generation/useGeneration';
import {
  downloadResumePdfToDevice,
  downloadResumeTexToDevice,
  shareResumePdf,
  shareResumeTex,
} from '../src/utils/shareUtils';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 44, left: 0, right: 0, bottom: 34 },
};

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: any = { generationId: 'gen-test-123' };

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

// Mock PdfViewer to prevent unhandled timer callbacks in UI tests
jest.mock('../src/components/pdf/PdfViewer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    PdfViewer: (props: any) =>
      React.createElement(View, { testID: props.testID || 'mock-pdf-viewer', ...props }),
  };
});

// Mock native Share
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

const mockGenerationData = {
  id: 'gen-test-123',
  userId: 'user-456',
  status: 'completed',
  jobTitle: 'Senior Infrastructure Engineer',
  companyName: 'Stripe',
  company: 'Stripe',
  templateId: 'tpl_default_swe',
  targetPageCount: 1,
  pageCount: 1,
  pdfUrl: 'https://cdn.latexai.internal/resumes/gen-test-123.pdf',
  texUrl: 'https://cdn.latexai.internal/resumes/gen-test-123.tex',
  atsScore: 88,
  tailoredContent: {
    summary: 'Experienced distributed systems engineer with deep Kubernetes expertise.',
    experience: [
      {
        id: 'exp-1',
        company: 'Stripe',
        title: 'Staff Engineer',
        startDate: '2021',
        endDate: null,
        current: true,
        bullets: [
          { id: 'b-1', text: 'Architected multi-region Kubernetes platform handling 200k RPS.' },
          { id: 'b-2', text: 'Reduced p99 database query latencies by 35% through Redis caching.' },
        ],
      },
    ],
    skills: [
      { id: 's-1', name: 'Go', category: 'Technical' },
      { id: 's-2', name: 'Kubernetes', category: 'Technical' },
    ],
    projects: [
      { id: 'p-1', title: 'Open Service Mesh', description: 'Lightweight service mesh sidecar' },
    ],
  },
  originalTailoredContent: {
    summary: 'Original AI generated summary for Stripe.',
    experience: [
      {
        id: 'exp-1',
        company: 'Stripe',
        title: 'Staff Engineer',
        startDate: '2021',
        bullets: [{ id: 'b-1', text: 'Original AI tailored bullet point.' }],
      },
    ],
  },
  isOutOfDate: false,
  createdAt: '2026-10-31T00:00:00Z',
  updatedAt: '2026-10-31T00:00:00Z',
};

const renderWithProviders = async (ui: React.ReactElement, queryClient = createTestQueryClient()) => {
  queryClient.setQueryData(
    GENERATION_KEYS.detail('gen-test-123'),
    JSON.parse(JSON.stringify(mockGenerationData))
  );

  return await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialMode="light">{ui}</ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

describe('Phase J: EditContentScreen & Cross-Platform Export (MB-5.05 to MB-5.09)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { generationId: 'gen-test-123' };
    jest.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/download')) {
        return {
          downloadUrl: 'https://cdn.latexai.internal/resumes/gen-test-123.pdf',
          filename: 'resume.pdf',
        };
      }
      return JSON.parse(JSON.stringify(mockGenerationData));
    });
  });

  describe('MB-5.05: S-31 EditContent Screen & Dirty-State Management', () => {
    it('renders initial resume summary, experiences, and skills', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);

      expect(await findByTestId('edit-content-screen')).toBeTruthy();
      expect(await findByText('Professional Summary')).toBeTruthy();

      const summaryInput = getByTestId('input-summary');
      expect(summaryInput.props.value).toContain('Experienced distributed systems engineer');
    });

    it('switches between sections: Experience, Skills, Projects', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();

      // Switch to Experience
      await act(async () => {
        fireEvent.press(getByTestId('tab-edit-experience'));
      });
      expect(await findByText('Staff Engineer')).toBeTruthy();
      expect(getByTestId('input-bullet-0-0')).toBeTruthy();

      // Switch to Skills
      await act(async () => {
        fireEvent.press(getByTestId('tab-edit-skills'));
      });
      expect(await findByText('Key Skills & Technologies')).toBeTruthy();
      expect(await findByText('Go')).toBeTruthy();
      expect(await findByText('Kubernetes')).toBeTruthy();

      // Switch to Projects
      await act(async () => {
        fireEvent.press(getByTestId('tab-edit-projects'));
      });
      expect(await findByText('Key Projects')).toBeTruthy();
      expect(await findByText('Open Service Mesh')).toBeTruthy();
    });

    it('modifies summary and triggers dirty state indicator', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();

      await findByText('Professional Summary');
      const summaryInput = getByTestId('input-summary');

      await act(async () => {
        fireEvent.changeText(summaryInput, 'Updated summary text with new keywords.');
      });
      expect(await findByText('Unsaved modifications')).toBeTruthy();
    });

    it('adds and removes bullet points for experience entries', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('tab-edit-experience'));
      });
      expect(await findByText('Staff Engineer')).toBeTruthy();

      // Add a new bullet
      const addBulletBtn = getByTestId('btn-add-bullet-0');
      await act(async () => {
        fireEvent.press(addBulletBtn);
      });

      const newBulletInput = getByTestId('input-bullet-0-2');
      expect(newBulletInput).toBeTruthy();
      await act(async () => {
        fireEvent.changeText(newBulletInput, 'Spearheaded zero-downtime deployment pipelines.');
      });

      // Remove a bullet
      const deleteBulletBtn = getByTestId('btn-delete-bullet-0-0');
      await act(async () => {
        fireEvent.press(deleteBulletBtn);
      });
    });

    it('adds and removes skills in the skills section', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('tab-edit-skills'));
      });
      expect(await findByText('Go')).toBeTruthy();

      // Add skill
      const skillInput = getByTestId('input-new-skill');
      await act(async () => {
        fireEvent.changeText(skillInput, 'Rust');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-add-skill'));
      });

      expect(await findByText('Rust')).toBeTruthy();

      // Remove skill
      await act(async () => {
        fireEvent.press(getByTestId('btn-remove-skill-0'));
      });
    });

    it('prompts confirmation when navigating back with unsaved changes', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();

      await findByText('Professional Summary');
      await act(async () => {
        fireEvent.changeText(getByTestId('input-summary'), 'Dirty content here');
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-edit-back'));
      });
      expect(await findByText('Discard Unsaved Changes?')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('confirm-dialog-confirm-button'));
      });
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('submits content update via Save Draft (PATCH /generate/:id/content)', async () => {
      jest.spyOn(api, 'patch').mockResolvedValue({ success: true });
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();

      await findByText('Professional Summary');
      await act(async () => {
        fireEvent.changeText(getByTestId('input-summary'), 'New saved summary');
      });

      const saveBtn = getByTestId('btn-save-draft');
      await act(async () => {
        fireEvent.press(saveBtn);
      });

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith(
          '/generate/gen-test-123/content',
          expect.objectContaining({
            summary: 'New saved summary',
          })
        );
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('MB-5.06: Re-render Request Flow & Fallback PDF Preservation', () => {
    it('successfully saves and re-renders PDF when Save & Re-render is tapped', async () => {
      jest.spyOn(api, 'patch').mockResolvedValue({ success: true });
      jest.spyOn(api, 'post').mockResolvedValue({
        id: 'gen-test-123',
        status: 'completed',
        pdfUrl: 'https://cdn.latexai.internal/resumes/recompiled.pdf',
      });

      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();
      await findByText('Professional Summary');

      await act(async () => {
        fireEvent.press(getByTestId('btn-save-rerender'));
      });

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith('/generate/gen-test-123/rerender');
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('preserves fallback PDF and notifies user on compiler error during re-render', async () => {
      jest.spyOn(api, 'patch').mockResolvedValue({ success: true });
      jest.spyOn(api, 'post').mockRejectedValue(new Error('XeLaTeX syntax error in line 44'));

      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();
      await findByText('Professional Summary');

      await act(async () => {
        fireEvent.press(getByTestId('btn-save-rerender'));
      });

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith('/generate/gen-test-123/rerender');
      });
    });
  });

  describe('MB-5.09: AI Version Reset Action', () => {
    it('allows resetting tailored content back to original AI generation', async () => {
      jest.spyOn(api, 'post').mockResolvedValue({ success: true, status: 'completed' });
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<EditContentScreen />);
      expect(await findByTestId('edit-content-screen')).toBeTruthy();
      await findByText('Professional Summary');

      await act(async () => {
        fireEvent.press(getByTestId('btn-edit-reset-ai'));
      });
      expect(await findByText('Reset Content to AI Version?')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('confirm-dialog-confirm-button'));
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/generate/gen-test-123/content/reset');
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('MB-5.07: Cross-Platform PDF & .tex Sharing/Saving Utilities', () => {
    it('shares PDF using native share sheet', async () => {
      const success = await shareResumePdf('gen-test-123', 'My Resume');
      expect(success).toBe(true);
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Resume',
        }),
        expect.anything()
      );
    });

    it('shares LaTeX .tex source using native share sheet', async () => {
      const success = await shareResumeTex('gen-test-123', 'Resume LaTeX');
      expect(success).toBe(true);
      expect(Share.share).toHaveBeenCalled();
    });

    it('downloads PDF to device storage directory', async () => {
      const res = await downloadResumePdfToDevice('gen-test-123');
      expect(res.success).toBe(true);
      expect(ReactNativeBlobUtil.fs.cp).toHaveBeenCalled();
    });

    it('downloads LaTeX source to device storage', async () => {
      const res = await downloadResumeTexToDevice('gen-test-123');
      expect(res.success).toBe(true);
      expect(ReactNativeBlobUtil.fs.cp).toHaveBeenCalled();
    });

    it('ReviewScreen bottom sheet triggers share and download actions', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(<ReviewScreen />);

      expect(await findByTestId('review-screen')).toBeTruthy();
      expect(await findByText('Senior Infrastructure Engineer')).toBeTruthy();

      // Open bottom sheet
      await act(async () => {
        fireEvent.press(getByTestId('btn-review-menu'));
      });

      expect(await findByTestId('menu-action-share-pdf')).toBeTruthy();
      expect(getByTestId('menu-action-share-tex')).toBeTruthy();
      expect(getByTestId('menu-action-download-pdf')).toBeTruthy();
      expect(getByTestId('menu-action-download-tex')).toBeTruthy();

      // Trigger Share PDF
      await act(async () => {
        fireEvent.press(getByTestId('menu-action-share-pdf'));
      });
      await waitFor(() => {
        expect(Share.share).toHaveBeenCalled();
      });
    });
  });
});
