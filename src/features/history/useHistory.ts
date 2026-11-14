import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { HistoryResumeItem, ListResumesFilter, ListResumesResponse } from './types';

export const HISTORY_QUERY_KEY = ['resumes', 'history'] as const;

export function useHistoryResumes(filter: ListResumesFilter = {}) {
  const { search, status, templateId } = filter;

  return useInfiniteQuery<ListResumesResponse>({
    queryKey: [...HISTORY_QUERY_KEY, { search, status, templateId }],
    queryFn: async ({ pageParam = undefined }) => {
      const params: Record<string, any> = {
        limit: 15,
        cursor: pageParam,
      };
      if (search && search.trim().length > 0) {
        params.search = search.trim();
      }
      if (status && status !== 'all') {
        params.status = status;
      }
      if (templateId) {
        params.templateId = templateId;
      }

      const res = await api.get<any>('/resumes', { params });
      const items: HistoryResumeItem[] = (res.items || res.resumes || res.data || []).map((item: any) => ({
        id: item.id,
        userId: item.userId || item.user_id,
        jobTitle: item.jobTitle || item.job_title || 'Resume',
        company: item.company || item.companyName || item.company_name || 'Target Role',
        status: (item.status || 'completed').toLowerCase(),
        templateId: item.templateId || item.template_id,
        pageCount: item.pageCount ?? item.page_count ?? null,
        targetPageCount: item.targetPageCount ?? item.target_page_count ?? 1,
        atsScore:
          typeof item.atsScore === 'number'
            ? item.atsScore
            : typeof item.ats_score === 'number'
            ? item.ats_score
            : item.atsScore?.score ?? item.ats_score?.score ?? null,
        pdfUrl: item.compiledPdfUrl || item.pdfUrl || item.pdf_url || null,
        texUrl: item.texUrl || item.tex_url || null,
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
        updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
      }));

      return {
        items,
        nextCursor: res.nextCursor || res.next_cursor || null,
        hasMore: Boolean(res.hasMore ?? res.has_more ?? (res.nextCursor != null)),
        total: res.total,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 15000,
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, string>({
    mutationFn: async (id: string) => {
      return api.delete(`/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

