import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { notifyGenerationFinished } from '../../utils/notifications';
import {
  AtsScoreResult,
  Generation,
  GenerationCancelResponse,
  GenerationCreateRequest,
  GenerationCreateResponse,
  GenerationRerenderResponse,
  GenerationResetResponse,
  GenerationRetryResponse,
  GenerationStatus,
  GenerationStatusResponse,
  GenerationStepInfo,
  ParseUrlResponse,
  StepState,
} from './types';

export const GENERATION_KEYS = {
  all: ['generations'] as const,
  list: () => [...GENERATION_KEYS.all, 'list'] as const,
  detail: (id: string) => [...GENERATION_KEYS.all, 'detail', id] as const,
  status: (id: string) => [...GENERATION_KEYS.all, 'status', id] as const,
  atsScore: (id: string) => [...GENERATION_KEYS.all, 'atsScore', id] as const,
};

const TERMINAL_STATUSES: GenerationStatus[] = ['completed', 'failed', 'cancelled'];

export interface UseGenerationStatusOptions {
  enabled?: boolean;
  pollInterval?: number; // ms, default 2500
  backgroundPollInterval?: number; // ms, default 15000
  onComplete?: (status: GenerationStatusResponse) => void;
  onError?: (error: any) => void;
}

/**
 * Hook to retrieve a single generation by ID.
 * Used for pre-filling generation parameters (MB-4.04) and review screen inspection (MB-5.01).
 */
export function useGeneration(id?: string) {
  return useQuery<Generation>({
    queryKey: GENERATION_KEYS.detail(id || ''),
    queryFn: async () => {
      const data = await api.get<any>(`/generate/${id}`);
      const rawScore =
        typeof data.atsScore === 'number'
          ? data.atsScore
          : typeof data.ats_score === 'number'
          ? data.ats_score
          : data.atsScore?.score ?? data.ats_score?.score ?? null;

      const atsScoreResult =
        data.atsScoreResult ||
        (typeof data.ats_score === 'object' && data.ats_score !== null
          ? data.ats_score
          : typeof data.atsScore === 'object' && data.atsScore !== null
          ? data.atsScore
          : null);

      return {
        id: data.id,
        userId: data.userId || data.user_id,
        status: (data.status || 'queued').toLowerCase() as GenerationStatus,
        jobTitle: data.jobTitle || data.job_title || null,
        company: data.companyName || data.company || null,
        companyName: data.companyName || data.company || null,
        jobDescriptionText:
          data.jobDescription || data.job_text || data.jobDescriptionText || null,
        jobDescriptionUrl:
          data.jobUrl || data.job_url || data.jobDescriptionUrl || null,
        jobUrl: data.jobUrl || data.job_url || data.jobDescriptionUrl || null,
        templateId: data.templateId || data.template_id,
        targetPageCount: data.targetPageCount ?? data.target_page_count ?? 1,
        pageCount: data.pageCount ?? data.page_count ?? null,
        pdfUrl: data.compiledPdfUrl || data.pdfUrl || data.pdf_url || null,
        texUrl: data.texUrl || data.tex_url || null,
        atsScore: rawScore,
        atsScoreResult,
        tailoredContent: data.tailoredContent || data.tailored_content || null,
        originalTailoredContent:
          data.originalTailoredContent || data.original_tailored_content || null,
        changeSummary: data.changes || data.changeSummary || data.change_summary || null,
        isOutOfDate: Boolean(data.isOutOfDate ?? data.is_out_of_date ?? false),
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        completedAt: data.completedAt || data.completed_at || null,
        failedAt: data.failedAt || data.failed_at || null,
        failureReason: data.failureReason || data.errorMessage || null,
        compileAttempts: data.compileAttempts || data.compile_attempts || [],
      };
    },
    enabled: Boolean(id),
  });
}

/**
 * Hook to retrieve full ATS score audit report for a generation (MB-5.03).
 * Uses GET /generate/:id/ats-score
 */
export function useAtsScore(generationId?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery<AtsScoreResult>({
    queryKey: GENERATION_KEYS.atsScore(generationId || ''),
    queryFn: async () => {
      const data = await api.get<any>(`/generate/${generationId}/ats-score`);
      return {
        score: data.score ?? 0,
        grade: data.grade || 'B',
        breakdown: {
          keywordScore: data.breakdown?.keywordScore ?? 0,
          formatScore: data.breakdown?.formatScore ?? 0,
          sectionScore: data.breakdown?.sectionScore ?? 0,
        },
        keywordAnalysis: {
          totalKeywords: data.keywordAnalysis?.totalKeywords ?? 0,
          matchedCount: data.keywordAnalysis?.matchedCount ?? 0,
          missingCount: data.keywordAnalysis?.missingCount ?? 0,
          coveragePercentage: data.keywordAnalysis?.coveragePercentage ?? 0,
          matched: data.keywordAnalysis?.matched || [],
          missing: data.keywordAnalysis?.missing || [],
        },
        formatChecks: {
          score: data.formatChecks?.score ?? 100,
          passed: data.formatChecks?.passed ?? true,
          issues: data.formatChecks?.issues || [],
          details: {
            hasTables: Boolean(data.formatChecks?.details?.hasTables),
            hasColumns: Boolean(data.formatChecks?.details?.hasColumns),
            hasIcons: Boolean(data.formatChecks?.details?.hasIcons),
            textExtractable: data.formatChecks?.details?.textExtractable ?? true,
            wordCount: data.formatChecks?.details?.wordCount ?? 0,
            pageCount: data.formatChecks?.details?.pageCount ?? 1,
            detectedSections: data.formatChecks?.details?.detectedSections || [],
          },
        },
        suggestions: data.suggestions || [],
      };
    },
    enabled: Boolean(generationId) && enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to trigger re-rendering of the tailored resume PDF without re-running AI (MB-5.02, MB-5.06).
 * Uses POST /generate/:id/rerender
 */
export function useRerenderGeneration() {
  const queryClient = useQueryClient();

  return useMutation<GenerationRerenderResponse, Error, string>({
    mutationFn: async (generationId: string) => {
      const res = await api.post<any>(`/generate/${generationId}/rerender`);
      return {
        id: res.id || generationId,
        status: (res.status || 'completed').toLowerCase() as GenerationStatus,
        pdfUrl: res.compiledPdfUrl || res.pdfUrl || res.pdf_url || null,
        texUrl: res.texUrl || res.tex_url || null,
        pageCount: res.pageCount ?? res.page_count,
        compileDurationMs: res.compileDurationMs ?? res.durationMs,
        message: res.message,
      };
    },
    onSuccess: (data, generationId) => {
      // Clear out-of-date status and update cached PDF URL
      queryClient.setQueryData<Generation>(
        GENERATION_KEYS.detail(generationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            isOutOfDate: false,
            pdfUrl: data.pdfUrl || old.pdfUrl,
            texUrl: data.texUrl || old.texUrl,
            pageCount: data.pageCount ?? old.pageCount,
            updatedAt: new Date().toISOString(),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.detail(generationId) });
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.atsScore(generationId) });
    },
    onError: (err, generationId) => {
      // MB-5.06: Preserves valid fallback PDF on compiler errors
      queryClient.setQueryData<Generation>(
        GENERATION_KEYS.detail(generationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            // Fallback pdfUrl is retained
            isOutOfDate: true,
            failureReason: err?.message || 'Re-compilation failed. Previous PDF retained.',
          };
        }
      );
    },
  });
}

/**
 * Hook to update tailored resume content (summary, experience bullets, skills, projects) (MB-5.05).
 * Uses PATCH /generate/:id/content
 */
export function useUpdateTailoredContent() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { generationId: string; content: any }>({
    mutationFn: async ({ generationId, content }) => {
      const res = await api.patch<any>(`/generate/${generationId}/content`, content);
      return res;
    },
    onSuccess: (data, { generationId, content }) => {
      queryClient.setQueryData<Generation>(
        GENERATION_KEYS.detail(generationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            isOutOfDate: true, // Content changed, requires re-render
            tailoredContent: {
              ...old.tailoredContent,
              ...content,
            },
            updatedAt: new Date().toISOString(),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.detail(generationId) });
    },
  });
}

/**
 * Hook to reset tailored resume content back to original AI generation (MB-5.04, MB-5.09).
 * Uses POST /generate/:id/content/reset
 */
export function useResetTailoredContent() {
  const queryClient = useQueryClient();

  return useMutation<GenerationResetResponse, Error, string>({
    mutationFn: async (generationId: string) => {
      const res = await api.post<any>(`/generate/${generationId}/content/reset`);
      return {
        id: res.id || generationId,
        status: (res.status || 'completed').toLowerCase() as GenerationStatus,
        pdfUrl: res.compiledPdfUrl || res.pdfUrl || res.pdf_url || null,
        message: res.message,
      };
    },
    onSuccess: (data, generationId) => {
      queryClient.setQueryData<Generation>(
        GENERATION_KEYS.detail(generationId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            isOutOfDate: false,
            tailoredContent: old.originalTailoredContent || old.tailoredContent,
            pdfUrl: data.pdfUrl || old.pdfUrl,
            updatedAt: new Date().toISOString(),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.detail(generationId) });
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.atsScore(generationId) });
    },
  });
}

/**
 * Hook to poll generation status with background throttling and foreground resume (MB-4.05).
 * - Fast polling in foreground (default 2500ms)
 * - Throttled polling in background (default 15000ms)
 * - Immediate refetch trigger upon returning to foreground
 * - Automatically stops polling on terminal statuses: completed, failed, cancelled
 */
export function useGenerationStatus(
  id?: string,
  options: UseGenerationStatusOptions = {}
) {
  const {
    enabled = true,
    pollInterval = 2500,
    backgroundPollInterval = 15000,
    onComplete,
    onError,
  } = options;

  const [appState, setAppState] = useState<AppStateStatus>(
    (AppState.currentState as AppStateStatus) || 'active'
  );
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const query = useQuery<GenerationStatusResponse>({
    queryKey: GENERATION_KEYS.status(id || ''),
    queryFn: async () => {
      const res = await api.get<any>(`/generate/${id}/status`);
      const status: GenerationStatus = (res.status || 'queued').toLowerCase() as GenerationStatus;
      const progress = typeof res.progress === 'number' ? res.progress : 0;
      return {
        id: res.id || id || '',
        status,
        progress,
        currentStage: res.currentStage || res.current_stage,
        estimatedRemaining: res.estimatedRemaining ?? res.estimated_remaining ?? null,
        errorMessage: res.errorMessage || res.error_message || res.failureReason || null,
        errorCode: res.errorCode || res.error_code || null,
        completedAt: res.completedAt || res.completed_at || null,
        failedAt: res.failedAt || res.failed_at || null,
        pdfUrl: res.compiledPdfUrl || res.pdfUrl || res.pdf_url || null,
      };
    },
    enabled: Boolean(id) && enabled,
    refetchInterval: (queryState) => {
      const currentData = queryState.state.data;
      if (currentData && TERMINAL_STATUSES.includes(currentData.status)) {
        return false;
      }
      return appState === 'active' ? pollInterval : backgroundPollInterval;
    },
    refetchIntervalInBackground: true,
  });

  const { refetch, data, isError, error } = query;

  // Foreground resume triggers: immediately refetch when app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const isComingToForeground =
        appState.match(/inactive|background/) && nextAppState === 'active';
      setAppState(nextAppState);

      if (isComingToForeground && id && enabled) {
        if (!data || !TERMINAL_STATUSES.includes(data.status)) {
          refetch();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState, id, enabled, data, refetch]);

  // Terminal state callbacks & Push Notification alert (MB-6.09)
  useEffect(() => {
    if (data?.status === 'completed') {
      onCompleteRef.current?.(data);
      if (appState !== 'active') {
        notifyGenerationFinished({
          generationId: id || '',
          jobTitle: 'Resume',
          status: 'completed',
        });
      }
    } else if (data?.status === 'failed') {
      if (appState !== 'active') {
        notifyGenerationFinished({
          generationId: id || '',
          jobTitle: 'Resume',
          status: 'failed',
        });
      }
    }
  }, [data, appState, id]);

  useEffect(() => {
    if (isError && error) {
      onErrorRef.current?.(error);
    }
  }, [isError, error]);

  return query;
}

/**
 * Hook to cancel an ongoing generation (MB-4.07).
 * Calls POST /generate/:id/cancel
 */
export function useCancelGeneration() {
  const queryClient = useQueryClient();

  return useMutation<GenerationCancelResponse, Error, string>({
    mutationFn: async (id: string) => {
      const res = await api.post<any>(`/generate/${id}/cancel`);
      return {
        success: res.success ?? true,
        id: res.id || id,
        status: 'cancelled',
        message: res.message,
      };
    },
    onSuccess: (data, id) => {
      // Optimistically update status query
      queryClient.setQueryData<GenerationStatusResponse>(
        GENERATION_KEYS.status(id),
        (old) =>
          old
            ? { ...old, status: 'cancelled' }
            : {
                id,
                status: 'cancelled',
                progress: 0,
                currentStage: 'cancelled',
                estimatedRemaining: null,
              }
      );
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook to retry a failed or cancelled generation.
 * Calls POST /generate/:id/retry
 */
export function useRetryGeneration() {
  const queryClient = useQueryClient();

  return useMutation<GenerationRetryResponse, Error, string>({
    mutationFn: async (id: string) => {
      const res = await api.post<any>(`/generate/${id}/retry`);
      return {
        id: res.id || id,
        status: (res.status || 'queued').toLowerCase() as GenerationStatus,
        message: res.message,
      };
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.status(id) });
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.list() });
    },
  });
}

/**
 * Compute the 5-step status stepper stages from status and progress (MB-4.06).
 */
export function computeGenerationStages(
  status: GenerationStatus = 'queued',
  progress: number = 0
): GenerationStepInfo[] {
  const stepTemplates = [
    {
      id: 'extract',
      title: 'Extract Job Requirements',
      description: 'Extracting key skills, qualifications, and role requirements from the posting',
    },
    {
      id: 'analyze',
      title: 'Analyze Keyword Alignment',
      description: 'Evaluating candidate experience and matching required terminology',
    },
    {
      id: 'tailor',
      title: 'Tailor Resume Content',
      description: 'Generating role-specific bullet points with action verbs and metrics',
    },
    {
      id: 'compile',
      title: 'Compile LaTeX Document',
      description: 'Building publication-quality ATS-friendly PDF via XeLaTeX engine',
    },
    {
      id: 'score',
      title: 'ATS Scoring & Finalizing',
      description: 'Calculating keyword match rate and verifying layout parsability',
    },
  ];

  // Map status or progress to active index (0 to 4)
  let activeIndex = 0;
  if (status === 'completed') {
    activeIndex = 5; // All completed
  } else if (status === 'scoring') {
    activeIndex = 4;
  } else if (status === 'compiling' || status === 'rendering') {
    activeIndex = 3;
  } else if (status === 'tailoring') {
    activeIndex = 2;
  } else if (status === 'analyzing') {
    activeIndex = 1;
  } else if (status === 'parsing_jd' || status === 'extracting') {
    activeIndex = 0;
  } else {
    // Queued or pending: map via progress percentage
    if (progress >= 95) activeIndex = 4;
    else if (progress >= 75) activeIndex = 3;
    else if (progress >= 45) activeIndex = 2;
    else if (progress >= 20) activeIndex = 1;
    else activeIndex = 0;
  }

  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';

  return stepTemplates.map((template, idx) => {
    let state: StepState = 'pending';

    if (idx < activeIndex) {
      state = 'completed';
    } else if (idx === activeIndex) {
      if (isFailed || isCancelled) {
        state = 'failed';
      } else if (status === 'completed') {
        state = 'completed';
      } else {
        state = 'in_progress';
      }
    } else {
      state = 'pending';
    }

    return {
      ...template,
      state,
    };
  });
}

/**
 * Hook to parse a job URL and extract job description text.
 * Uses POST /jobs/fetch with graceful fallback to POST /generate/parse-url.
 */
export function useParseJobUrl() {
  return useMutation<ParseUrlResponse, Error, string>({
    mutationFn: async (url: string) => {
      try {
        const res = await api.post<any>('/jobs/fetch', { url });
        const jobDescriptionText =
          res.rawText || res.jobDescriptionText || res.jobDescription || '';
        return {
          jobTitle: res.jobTitle || null,
          company: res.companyName || res.company || null,
          jobDescriptionText,
          success: true,
          warning: res.warning || null,
          extractedVia: res.extractedVia,
        };
      } catch (err: any) {
        if (err?.code === 'NOT_FOUND' || err?.status === 404) {
          const fallback = await api.post<any>('/generate/parse-url', { url });
          return {
            jobTitle: fallback.jobTitle || null,
            company: fallback.company || fallback.companyName || null,
            jobDescriptionText:
              fallback.jobDescriptionText ||
              fallback.rawText ||
              fallback.jobDescription ||
              '',
            success: true,
            warning: fallback.warning || null,
            extractedVia: fallback.extractedVia,
          };
        }
        throw err;
      }
    },
  });
}

/**
 * Hook to create a new generation (resume tailoring job).
 * Uses POST /generate
 */
export function useCreateGeneration() {
  const queryClient = useQueryClient();

  return useMutation<GenerationCreateResponse, Error, GenerationCreateRequest>({
    mutationFn: async (request: GenerationCreateRequest) => {
      const payload = {
        jobDescription: request.jobDescriptionText || request.jobDescription,
        jobText: request.jobDescriptionText || request.jobText,
        jobUrl: request.jobDescriptionUrl || request.jobUrl,
        templateId: request.templateId,
        targetPageCount: request.targetPageCount || 1,
        sourceGenerationId: request.fromGenerationId || request.sourceGenerationId,
        jobDescriptionText: request.jobDescriptionText || request.jobDescription,
        jobDescriptionUrl: request.jobDescriptionUrl || request.jobUrl,
        fromGenerationId: request.fromGenerationId || request.sourceGenerationId,
      };
      return api.post<GenerationCreateResponse>('/generate', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERATION_KEYS.list() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
