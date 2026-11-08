import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as DocumentPicker from '@react-native-documents/picker';
import { ImportResumeScreen } from '../src/screens/profile/ImportResumeScreen';
import { ImportReviewScreen } from '../src/screens/profile/ImportReviewScreen';
import { api } from '../src/lib/api';
import { ThemeProvider } from '../src/theme';
import { mockProfile } from '../src/mocks/fixtures';

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
      addListener: jest.fn(() => jest.fn()),
    }),
    useRoute: () => ({
      params: {
        importId: 'imp_123',
        draft: {
          importId: 'imp_123',
          parsedData: {
            contact: {
              fullName: 'Taylor Swift',
              email: 'taylor@example.com',
            },
            summary: 'Experienced sound architect.',
            experience: [
              {
                id: 'exp_1',
                company: 'Era Music',
                title: 'Chief Engineer',
                startDate: '2022-01',
                isCurrent: true,
                bullets: ['Led tour streaming platform.'],
              },
            ],
            education: [
              {
                id: 'edu_1',
                institution: 'Vanderbilt',
                degree: 'B.S.',
                startDate: '2015-08',
                endDate: '2019-05',
              },
            ],
            skills: ['Swift', 'TypeScript'],
          },
        },
      },
    }),
  };
});

describe('Resume Import & Review Flow (MB-2.12, MB-2.13, MB-2.14)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    jest.spyOn(api, 'get').mockResolvedValue(mockProfile);
  });

  const renderWithProviders = async (component: React.ReactElement) =>
    await render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialMode="light">{component}</ThemeProvider>
      </QueryClientProvider>
    );

  describe('ImportResumeScreen (MB-2.12)', () => {
    it('picks document and initiates upload and parsing', async () => {
      (DocumentPicker.pick as jest.Mock).mockResolvedValueOnce([
        {
          uri: 'file:///path/to/my_resume.pdf',
          name: 'my_resume.pdf',
          size: 150000,
          type: 'application/pdf',
        },
      ]);

      const mockDraftResponse = {
        importId: 'imp_test_999',
        status: 'parsed',
        parsedData: { contact: { fullName: 'Alex Morgan' } },
      };

      jest.spyOn(api, 'upload').mockResolvedValueOnce(mockDraftResponse);

      const { getByTestId, getByText } = await renderWithProviders(
        <ImportResumeScreen />
      );

      // Select file
      await act(async () => {
        fireEvent.press(getByTestId('pick-resume-file-btn'));
      });

      expect(getByText('my_resume.pdf')).toBeTruthy();

      // Submit upload
      await act(async () => {
        fireEvent.press(getByTestId('upload-and-parse-btn'));
      });

      expect(api.upload).toHaveBeenCalledWith(
        '/profile/import-resume',
        expect.any(FormData)
      );

      expect(mockNavigate).toHaveBeenCalledWith('ImportReview', {
        importId: 'imp_test_999',
        draft: mockDraftResponse,
      });
    });

    it('rejects files larger than 5MB', async () => {
      (DocumentPicker.pick as jest.Mock).mockResolvedValueOnce([
        {
          uri: 'file:///large_resume.pdf',
          name: 'large_resume.pdf',
          size: 6 * 1024 * 1024, // 6 MB
          type: 'application/pdf',
        },
      ]);

      const { getByTestId, getByText } = await renderWithProviders(
        <ImportResumeScreen />
      );

      await act(async () => {
        fireEvent.press(getByTestId('pick-resume-file-btn'));
      });

      expect(
        getByText(/File size exceeds 5MB limit/i)
      ).toBeTruthy();
    });
  });

  describe('ImportReviewScreen (MB-2.13)', () => {
    it('renders parsed draft sections, allows strategy change, and confirms import', async () => {
      jest.spyOn(api, 'post').mockResolvedValueOnce({
        id: 'prf_123',
        userId: 'usr_1',
        contact: { fullName: 'Taylor Swift' },
      });

      const { getByTestId, getByText } = await renderWithProviders(
        <ImportReviewScreen />
      );

      expect(getByText('Taylor Swift')).toBeTruthy();
      expect(getByText('Chief Engineer – Era Music')).toBeTruthy();

      // Select 'replace' strategy
      await act(async () => {
        fireEvent.press(getByTestId('strategy-replace-radio'));
      });

      // Apply to profile
      await act(async () => {
        fireEvent.press(getByTestId('apply-import-btn'));
      });

      expect(api.post).toHaveBeenCalledWith(
        '/profile/import-resume/imp_123/confirm',
        expect.objectContaining({
          strategy: 'replace',
          sections: expect.objectContaining({
            contact: true,
            summary: true,
            experience: true,
          }),
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith('ProfileTab');
    });

    it('allows discarding import draft', async () => {
      jest.spyOn(api, 'delete').mockResolvedValueOnce({ success: true });

      const { getByText } = await renderWithProviders(<ImportReviewScreen />);

      await act(async () => {
        fireEvent.press(getByText('Discard Import'));
      });

      await act(async () => {
        fireEvent.press(getByText('Discard Draft'));
      });

      expect(api.delete).toHaveBeenCalledWith(
        '/profile/import-resume/imp_123'
      );
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
