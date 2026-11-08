import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DashboardSummary } from './types';

export const DASHBOARD_QUERY_KEY = ['dashboard', 'summary'] as const;

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const data = await api.get<any>('/dashboard/summary');
      return {
        metrics: {
          totalResumes: data.metrics?.totalResumes ?? data.totalResumes ?? 0,
          completedResumes: data.metrics?.completedResumes ?? data.completedResumes ?? 0,
          failedResumes: data.metrics?.failedResumes ?? data.failedResumes ?? 0,
          inProgressResumes: data.metrics?.inProgressResumes ?? data.inProgressResumes ?? 0,
          averageAtsScore: data.metrics?.averageAtsScore ?? data.averageAtsScore ?? null,
        },
        quotas: {
          dailyLimit: data.quotas?.dailyLimit ?? data.dailyLimit ?? 10,
          dailyUsed: data.quotas?.dailyUsed ?? data.dailyUsed ?? 0,
          dailyRemaining: data.quotas?.dailyRemaining ?? data.dailyRemaining ?? 10,
        },
        topKeywords: data.topKeywords || [],
        templateUsage: data.templateUsage || [],
        recentGenerations: (data.recentGenerations || []).map((item: any) => ({
          id: item.id,
          jobTitle: item.jobTitle || item.job_title || 'Resume',
          company: item.company || item.companyName || 'Company',
          status: item.status || 'completed',
          atsScore: item.atsScore ?? item.ats_score ?? null,
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          pdfUrl: item.pdfUrl || item.pdf_url || null,
        })),
      };
    },
    staleTime: 30000,
  });
}

