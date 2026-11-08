import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  PreviewTemplatePayload,
  TemplateDetail,
  TemplateListItem,
  TemplatePreviewResponse,
} from './types';

export const TEMPLATES_QUERY_KEY = ['templates'] as const;
export const templateDetailQueryKey = (id: string) => ['templates', id] as const;

export const useTemplates = () => {
  return useQuery<TemplateListItem[]>({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: async () => {
      const result = await api.get<TemplateListItem[]>('/templates');
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTemplate = (id: string) => {
  return useQuery<TemplateDetail>({
    queryKey: templateDetailQueryKey(id),
    queryFn: async () => {
      const result = await api.get<TemplateDetail>(`/templates/${id}`);
      return result;
    },
    enabled: Boolean(id),
  });
};

export const useActivateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<{ activeTemplateId: string }, Error, string>({
    mutationFn: async (templateId: string) => {
      return api.post<{ activeTemplateId: string }>(`/templates/${templateId}/activate`);
    },
    onMutate: async (templateId: string) => {
      await queryClient.cancelQueries({ queryKey: TEMPLATES_QUERY_KEY });
      const previousTemplates = queryClient.getQueryData<TemplateListItem[]>(TEMPLATES_QUERY_KEY);

      if (previousTemplates) {
        queryClient.setQueryData<TemplateListItem[]>(
          TEMPLATES_QUERY_KEY,
          previousTemplates.map((t) => ({
            ...t,
            isActive: t.id === templateId,
          }))
        );
      }

      return { previousTemplates };
    },
    onError: (_err, _templateId, context: any) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(TEMPLATES_QUERY_KEY, context.previousTemplates);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
};

export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<TemplateDetail, Error, { templateId: string; name?: string }>({
    mutationFn: async ({ templateId, name }) => {
      return api.post<TemplateDetail>(`/templates/${templateId}/duplicate`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { deleted: boolean; fallbackActivated: boolean; activeTemplateId: string },
    Error,
    string
  >({
    mutationFn: async (templateId: string) => {
      return api.delete<{ deleted: boolean; fallbackActivated: boolean; activeTemplateId: string }>(
        `/templates/${templateId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_QUERY_KEY });
    },
  });
};

export const usePreviewTemplate = (templateId: string) => {
  return useMutation<TemplatePreviewResponse, Error, PreviewTemplatePayload | undefined>({
    mutationFn: async (payload) => {
      return api.post<TemplatePreviewResponse>(
        `/templates/${templateId}/preview`,
        payload || {}
      );
    },
  });
};

