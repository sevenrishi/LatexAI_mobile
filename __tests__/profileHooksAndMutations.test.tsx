import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PROFILE_KEYS,
  useBulkAddSkills,
  useCreateProfileItem,
  useDeleteProfileItem,
  useProfile,
  useReorderProfileSection,
  useUpdateProfileRoot,
} from '../src/features/profile/useProfile';
import { api } from '../src/lib/api';
import { mockProfile } from '../src/mocks/fixtures';
import { UserProfile } from '../src/types/user';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

const wrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Profile TanStack Query Hooks & Optimistic Rollbacks (MB-2.01, MB-2.14)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  it('fetches full profile successfully', async () => {
    jest.spyOn(api, 'get').mockResolvedValueOnce(mockProfile);

    const { result } = await renderHook(() => useProfile(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual(mockProfile);
    expect(api.get).toHaveBeenCalledWith('/profile');
  });

  describe('useUpdateProfileRoot optimistic updates and rollbacks', () => {
    it('optimistically updates profile root and applies server response', async () => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), mockProfile);
      jest.spyOn(api, 'patch').mockResolvedValueOnce({
        ...mockProfile,
        summary: 'Server confirmed summary',
      });

      const { result } = await renderHook(() => useUpdateProfileRoot(), {
        wrapper: wrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ summary: 'Optimistic summary' });
      });

      const cached = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      expect(cached?.summary).toBe('Server confirmed summary');
    });

    it('rolls back cached data when patch API rejects', async () => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), mockProfile);
      const originalSummary = mockProfile.summary;

      jest.spyOn(api, 'patch').mockRejectedValueOnce(new Error('Network failure'));

      const { result } = await renderHook(() => useUpdateProfileRoot(), {
        wrapper: wrapper(queryClient),
      });

      try {
        await act(async () => {
          await result.current.mutateAsync({ summary: 'Temporary optimistic summary' });
        });
      } catch {
        // Expected mutation failure
      }

      const cached = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      expect(cached?.summary).toBe(originalSummary);
    });
  });

  describe('useCreateProfileItem optimistic updates and rollbacks', () => {
    it('optimistically appends an item and rolls back on failure', async () => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), mockProfile);
      const originalCount = mockProfile.experience.length;

      jest.spyOn(api, 'post').mockRejectedValueOnce(new Error('Server error'));

      const { result } = await renderHook(() => useCreateProfileItem('experience'), {
        wrapper: wrapper(queryClient),
      });

      try {
        await act(async () => {
          await result.current.mutateAsync({
            company: 'New Startup Inc',
            position: 'Founder',
            startDate: '2024-01',
            bullets: [],
          });
        });
      } catch {
        // Expected failure
      }

      const cached = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      expect(cached?.experience.length).toBe(originalCount);
    });
  });

  describe('useDeleteProfileItem optimistic deletion', () => {
    it('optimistically deletes an item and restores on failure', async () => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), mockProfile);
      const deleteId = mockProfile.experience[0]?.id || 'exp_1';

      jest.spyOn(api, 'delete').mockRejectedValueOnce(new Error('Delete forbidden'));

      const { result } = await renderHook(() => useDeleteProfileItem('experience'), {
        wrapper: wrapper(queryClient),
      });

      try {
        await act(async () => {
          await result.current.mutateAsync(deleteId);
        });
      } catch {
        // Expected failure
      }

      const cached = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      expect(cached?.experience.some((e) => e.id === deleteId)).toBe(true);
    });
  });

  describe('useReorderProfileSection optimistic sequence', () => {
    it('optimistically updates item ordering and rolls back on failure', async () => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), mockProfile);
      const exp1 = mockProfile.experience[0]?.id || 'exp_1';
      const exp2 = mockProfile.experience[1]?.id || 'exp_2';

      jest.spyOn(api, 'patch').mockRejectedValueOnce(new Error('Reorder failed'));

      const { result } = await renderHook(() => useReorderProfileSection('experience'), {
        wrapper: wrapper(queryClient),
      });

      try {
        await act(async () => {
          await result.current.mutateAsync([exp2, exp1]);
        });
      } catch {
        // Expected failure
      }

      const cached = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      expect(cached?.experience[0]?.id).toBe(exp1);
    });
  });

  describe('useBulkAddSkills', () => {
    it('calls POST /profile/skills/bulk and updates cached profile', async () => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), mockProfile);
      const updatedSkills = [
        ...mockProfile.skills,
        { category: 'AI/ML', skills: ['PyTorch', 'TensorFlow'] },
      ];

      jest.spyOn(api, 'post').mockResolvedValueOnce(updatedSkills);

      const { result } = await renderHook(() => useBulkAddSkills(), {
        wrapper: wrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(['PyTorch', 'TensorFlow']);
      });

      const cached = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      expect(cached?.skills).toEqual(updatedSkills);
    });
  });
});
