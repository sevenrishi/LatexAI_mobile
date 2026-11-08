import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  ConfirmImportPayload,
  ResumeImportDraft,
  SkillCategory,
  UserProfile,
} from '../../types/user';

export type ProfileSection =
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects';

export const PROFILE_KEYS = {
  all: ['profile'] as const,
  detail: () => [...PROFILE_KEYS.all, 'detail'] as const,
  section: (sec: ProfileSection) => [...PROFILE_KEYS.all, 'section', sec] as const,
  importDraft: (importId: string) => [...PROFILE_KEYS.all, 'import', importId] as const,
};

/**
 * Hook to fetch the full aggregated profile
 */
export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEYS.detail(),
    queryFn: async () => {
      const data = await api.get<UserProfile>('/profile');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update root profile fields (contact info, links, summary)
 */
export function useUpdateProfileRoot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<UserProfile> | Record<string, unknown>) => {
      return api.patch<UserProfile>('/profile', payload);
    },
    onMutate: async (newProfileData) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail() });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());

      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...previousProfile,
          ...newProfileData,
          contact: {
            ...previousProfile.contact,
            ...((newProfileData as any).contact || {}),
          },
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousProfile };
    },
    onError: (_err, _newProfileData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), context.previousProfile);
      }
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), data);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to add a new item to a profile section (experience, education, certifications, projects)
 */
export function useCreateProfileItem<T = any>(section: ProfileSection) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<T, 'id'> | any) => {
      return api.post<T>(`/profile/${section}`, newItem);
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail() });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());

      if (previousProfile && Array.isArray((previousProfile as any)[section])) {
        const optimisticItem = {
          ...newItem,
          id: `temp_${Date.now()}`,
        };

        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...previousProfile,
          [section]: [...(previousProfile as any)[section], optimisticItem],
        });
      }

      return { previousProfile };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to update an existing item in a profile section
 */
export function useUpdateProfileItem<T = any>(section: ProfileSection) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> | any }) => {
      return api.put<T>(`/profile/${section}/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail() });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());

      if (previousProfile && Array.isArray((previousProfile as any)[section])) {
        const updatedList = (previousProfile as any)[section].map((item: any) =>
          item.id === id ? { ...item, ...data } : item
        );

        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...previousProfile,
          [section]: updatedList,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to delete an item from a profile section
 */
export function useDeleteProfileItem(section: ProfileSection) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete<{ success: boolean; id?: string }>(`/profile/${section}/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail() });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());

      if (previousProfile && Array.isArray((previousProfile as any)[section])) {
        const filteredList = (previousProfile as any)[section].filter(
          (item: any) => item.id !== id
        );

        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...previousProfile,
          [section]: filteredList,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _id, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to reorder items in a section
 */
export function useReorderProfileSection(section: ProfileSection) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      return api.patch<any>(`/profile/${section}/reorder`, { orderedIds });
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail() });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());

      if (previousProfile && Array.isArray((previousProfile as any)[section])) {
        const currentItems: any[] = (previousProfile as any)[section];
        const itemMap = new Map(currentItems.map((item) => [item.id, item]));
        const reordered = orderedIds
          .map((id) => itemMap.get(id))
          .filter(Boolean) as any[];

        // Append any items that were not in orderedIds to avoid accidental loss
        currentItems.forEach((item) => {
          if (!orderedIds.includes(item.id)) {
            reordered.push(item);
          }
        });

        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...previousProfile,
          [section]: reordered,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to bulk add skills
 */
export function useBulkAddSkills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skills: (string | { name: string; category?: string })[]) => {
      return api.post<SkillCategory[]>('/profile/skills/bulk', { skills });
    },
    onSuccess: (updatedSkills) => {
      const currentProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());
      if (currentProfile) {
        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...currentProfile,
          skills: updatedSkills,
        });
      }
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to update all skills categories
 */
export function useUpdateSkillsCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skills: SkillCategory[]) => {
      return api.patch<UserProfile>('/profile', { skills });
    },
    onMutate: async (skills) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_KEYS.detail() });
      const previousProfile = queryClient.getQueryData<UserProfile>(PROFILE_KEYS.detail());

      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(PROFILE_KEYS.detail(), {
          ...previousProfile,
          skills,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(PROFILE_KEYS.detail(), context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to upload and import a resume
 */
export function useImportResume() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return api.upload<ResumeImportDraft>('/profile/import-resume', formData);
    },
  });
}

/**
 * Hook to confirm an imported resume draft with merge or replace strategy
 */
export function useConfirmImportResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      importId,
      payload,
    }: {
      importId: string;
      payload: ConfirmImportPayload;
    }) => {
      return api.post<UserProfile>(
        `/profile/import-resume/${importId}/confirm`,
        payload
      );
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(PROFILE_KEYS.detail(), updatedProfile);
      queryClient.invalidateQueries({ queryKey: PROFILE_KEYS.detail() });
    },
  });
}

/**
 * Hook to discard a resume import draft
 */
export function useDiscardImportResume() {
  return useMutation({
    mutationFn: async (importId: string) => {
      return api.delete<{ success: boolean }>(`/profile/import-resume/${importId}`);
    },
  });
}
