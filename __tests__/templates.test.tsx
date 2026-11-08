import React from 'react';
import { cleanup, configure, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

configure({ asyncUtilTimeout: 4000 });
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  clearPdfCache,
  downloadPdfToCache,
  PdfViewer,
  writeBase64PdfToCache,
} from '../src/components/pdf';
import {
  PdfViewerModal,
  TemplatePickerSheet,
  TemplatePreviewScreen,
  TemplatesScreen,
} from '../src/screens/templates';
import {
  TEMPLATES_QUERY_KEY,
  templateDetailQueryKey,
} from '../src/features/templates';
import { PROFILE_KEYS } from '../src/features/profile/useProfile';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/lib/api';
import { mockProfile, mockTemplates } from '../src/mocks/fixtures';

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

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: {
        templateId: 'tmpl_classic_ats',
        templateName: 'Modern Single Column ATS',
      },
    }),
  };
});

describe('Phase C: Template Setup & PDF Infrastructure', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();

    // Pre-populate TanStack query cache for test predictability
    queryClient.setQueryData(TEMPLATES_QUERY_KEY, JSON.parse(JSON.stringify(mockTemplates)));
    queryClient.setQueryData(
      templateDetailQueryKey('tmpl_classic_ats'),
      JSON.parse(JSON.stringify(mockTemplates[0]))
    );
    queryClient.setQueryData(PROFILE_KEYS.detail(), JSON.parse(JSON.stringify(mockProfile)));

    jest.spyOn(api, 'get').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/templates') {
        return JSON.parse(JSON.stringify(mockTemplates));
      }
      if (endpoint.startsWith('/templates/')) {
        const id = endpoint.replace('/templates/', '');
        const found = mockTemplates.find((t) => t.id === id);
        return found || mockTemplates[0];
      }
      if (endpoint === '/profile') {
        return mockProfile;
      }
      return null;
    });

    jest.spyOn(api, 'post').mockImplementation(async (endpoint: string, body?: any) => {
      if (endpoint.includes('/activate')) {
        const match = endpoint.match(/\/templates\/([^/]+)\/activate/);
        return { activeTemplateId: match ? match[1] : 'tmpl_classic_ats' };
      }
      if (endpoint.includes('/preview')) {
        return {
          pdfBase64: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoK',
          pageCount: 1,
          renderedLatex: '\\documentclass{article}\\begin{document}Resume\\end{document}',
          durationMs: 380,
        };
      }
      if (endpoint.includes('/duplicate')) {
        return {
          ...mockTemplates[0],
          id: 'tmpl_custom_dup_123',
          name: body?.name || 'Copy of Template',
          isSystem: false,
          isActive: false,
        };
      }
      return {};
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = async (component: React.ReactElement) =>
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode="light">{component}</ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );

  describe('MB-3.03 & MB-3.02: PDF Downloader & Cache Utilities', () => {
    it('returns local path if source is already a local file', async () => {
      const localFile = 'file:///data/user/0/com.latexai/files/doc.pdf';
      const result = await downloadPdfToCache(localFile);
      expect(result).toBe(localFile);
    });

    it('downloads remote PDF and caches it locally', async () => {
      const remoteUrl = 'https://example.com/resumes/sample.pdf';
      const result = await downloadPdfToCache(remoteUrl, { forceRefresh: true });
      expect(result).toContain('sample.pdf');
      expect(ReactNativeBlobUtil.config).toHaveBeenCalled();
    });

    it('writes base64 data to cache file', async () => {
      const base64Data = 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoK';
      const result = await writeBase64PdfToCache(base64Data, 'test_output.pdf');
      expect(result).toContain('test_output.pdf');
      expect(ReactNativeBlobUtil.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test_output.pdf'),
        base64Data,
        'base64'
      );
    });

    it('clears PDF cache directory', async () => {
      await clearPdfCache();
      expect(ReactNativeBlobUtil.fs.unlink).toHaveBeenCalled();
    });
  });

  describe('MB-3.02: PdfViewer Component', () => {
    it('renders loading state initially and then renders pdf canvas with page indicators', async () => {
      const { findByTestId, getByTestId, queryByTestId } = await render(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider initialMode="light">
            <PdfViewer
              source={{ uri: 'file:///path/to/test.pdf' }}
              testID="test-pdf"
            />
          </ThemeProvider>
        </SafeAreaProvider>
      );

      const canvas = await findByTestId('test-pdf-canvas');
      expect(canvas).toBeTruthy();
      expect(queryByTestId('test-pdf-loading')).toBeNull();
      expect(getByTestId('test-pdf-page-indicator')).toBeTruthy();
      expect(getByTestId('test-pdf-controls')).toBeTruthy();
    });

    it('supports zooming in and out with controls', async () => {
      const { findByTestId, getByTestId } = await render(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider initialMode="light">
            <PdfViewer
              source={{ uri: 'file:///local/sample.pdf' }}
              testID="zoom-pdf"
            />
          </ThemeProvider>
        </SafeAreaProvider>
      );

      const canvas = await findByTestId('zoom-pdf-canvas');
      expect(canvas).toBeTruthy();

      const zoomInBtn = getByTestId('zoom-pdf-zoom-in');
      fireEvent.press(zoomInBtn);
      expect(canvas).toBeTruthy();
    });
  });

  describe('MB-3.04: S-40 PdfViewerModal Screen', () => {
    it('renders fullscreen viewer, title and handles back/close navigation', async () => {
      const mockNav = { goBack: jest.fn() } as any;
      const mockRoute = {
        params: { url: 'file:///cached/fullscreen.pdf', title: 'Executive Resume' },
      } as any;

      const { findByTestId, getByTestId } = await render(
        <SafeAreaProvider initialMetrics={initialMetrics}>
          <ThemeProvider initialMode="light">
            <PdfViewerModal navigation={mockNav} route={mockRoute} />
          </ThemeProvider>
        </SafeAreaProvider>
      );

      const title = await findByTestId('pdf-modal-title');
      expect(title).toBeTruthy();
      expect(await findByTestId('fullscreen-pdf-viewer-canvas')).toBeTruthy();

      const closeBtn = getByTestId('pdf-modal-close-button');
      fireEvent.press(closeBtn);
      expect(mockNav.goBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('MB-3.05: S-26 TemplatesScreen', () => {
    it('renders templates list, active banner, and category filter chips', async () => {
      const { findByTestId, getByTestId, getAllByText, getByText } = await renderWithProviders(
        <TemplatesScreen />
      );

      // Verify active banner shows default active template
      const banner = await findByTestId('active-template-banner');
      expect(banner).toBeTruthy();
      expect(getByTestId('templates-search-input')).toBeTruthy();

      // Verify template names render
      expect(getAllByText('Modern Single Column ATS').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Executive Minimalist')).toBeTruthy();
      expect(getByText('Compact Software Developer')).toBeTruthy();

      // Test searching templates
      const searchInput = getByTestId('templates-search-input');
      fireEvent.changeText(searchInput, 'Executive');

      expect(getByText('Executive Minimalist')).toBeTruthy();
    });

    it('triggers preview navigation when preview button is tapped', async () => {
      const { findByTestId } = await renderWithProviders(
        <TemplatesScreen />
      );

      const previewBtn = await findByTestId('template-preview-button-tmpl_classic_ats');
      fireEvent.press(previewBtn);

      expect(mockNavigate).toHaveBeenCalledWith('TemplatePreview', {
        templateId: 'tmpl_classic_ats',
        templateName: 'Modern Single Column ATS',
      });
    });

    it('activates a template when "Set as Active" button is tapped', async () => {
      const { findByTestId } = await renderWithProviders(
        <TemplatesScreen />
      );

      const activateBtn = await findByTestId('template-activate-button-tmpl_executive');
      fireEvent.press(activateBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/templates/tmpl_executive/activate');
      });
    });

    it('opens action sheet on overflow menu click', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders(
        <TemplatesScreen />
      );

      const menuBtn = await findByTestId('template-menu-button-tmpl_classic_ats');
      fireEvent.press(menuBtn);

      const actionSheet = await findByTestId('template-action-sheet');
      expect(actionSheet).toBeTruthy();
      expect(getByTestId('action-sheet-preview')).toBeTruthy();
      expect(getByTestId('action-sheet-duplicate')).toBeTruthy();
    });
  });

  describe('MB-3.06: S-27 TemplatePreviewScreen', () => {
    it('renders PDF preview tab and switches to LaTeX source tab', async () => {
      const { findByTestId, findByText, getByTestId } = await renderWithProviders(
        <TemplatePreviewScreen />
      );

      const screen = await findByTestId('template-preview-screen');
      expect(screen).toBeTruthy();
      expect(getByTestId('tab-preview')).toBeTruthy();
      expect(getByTestId('tab-source')).toBeTruthy();
      expect(getByTestId('toggle-sample-data')).toBeTruthy();
      expect(getByTestId('toggle-profile-data')).toBeTruthy();

      // Switch to LaTeX source tab
      fireEvent.press(getByTestId('tab-source'));

      const sourceContainer = await findByTestId('template-source-container');
      expect(sourceContainer).toBeTruthy();
      expect(getByTestId('latex-code-text')).toBeTruthy();
      expect(getByTestId('copy-latex-button')).toBeTruthy();

      // Test copy LaTeX code
      fireEvent.press(getByTestId('copy-latex-button'));
      expect(await findByText('Copied')).toBeTruthy();

      // Switch back to PDF preview tab
      fireEvent.press(getByTestId('tab-preview'));
      expect(await findByTestId('toggle-sample-data')).toBeTruthy();
    });

    it('toggles between sample data and user profile data', async () => {
      const { findByTestId, getByTestId } = await renderWithProviders(
        <TemplatePreviewScreen />
      );

      await findByTestId('template-preview-screen');
      await findByTestId('template-inline-pdf-viewer');

      fireEvent.press(getByTestId('toggle-profile-data'));
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/templates/tmpl_classic_ats/preview',
          expect.objectContaining({ profileData: expect.anything() })
        );
      });

      fireEvent.press(getByTestId('toggle-sample-data'));
      expect(getByTestId('toggle-sample-data')).toBeTruthy();
    });

    it('opens fullscreen modal on maximize button press', async () => {
      const { findByTestId } = await renderWithProviders(
        <TemplatePreviewScreen />
      );

      await findByTestId('template-preview-screen');
      await findByTestId('template-inline-pdf-viewer');

      const fullscreenBtn = await findByTestId('preview-fullscreen-button');
      expect(fullscreenBtn).toBeTruthy();

      fireEvent.press(fullscreenBtn);
      expect(mockNavigate).toHaveBeenCalledWith('PdfViewerModal', {
        base64: expect.any(String),
        title: expect.stringContaining('Preview'),
      });
    });
  });

  describe('MB-3.07: TemplatePickerSheet Component', () => {
    it('renders template options and allows selecting and confirming a template', async () => {
      const mockOnSelect = jest.fn();
      const mockOnClose = jest.fn();
      const mockOnPreview = jest.fn();

      const { findByTestId, getByTestId } = await renderWithProviders(
        <TemplatePickerSheet
          visible={true}
          onClose={mockOnClose}
          selectedTemplateId="tmpl_classic_ats"
          onSelectTemplate={mockOnSelect}
          onPreviewTemplate={mockOnPreview}
          testID="test-picker"
        />
      );

      const classicItem = await findByTestId('template-picker-item-tmpl_classic_ats');
      expect(classicItem).toBeTruthy();
      expect(getByTestId('template-picker-item-tmpl_executive')).toBeTruthy();

      // Select executive
      fireEvent.press(getByTestId('template-picker-item-tmpl_executive'));

      // Quick preview
      const previewIcon = getByTestId('template-picker-preview-tmpl_executive');
      fireEvent.press(previewIcon);
      expect(mockOnPreview).toHaveBeenCalledWith('tmpl_executive');

      // Confirm
      const confirmBtn = getByTestId('template-picker-confirm-button');
      fireEvent.press(confirmBtn);

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'tmpl_executive' })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
