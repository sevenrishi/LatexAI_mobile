export type GenerationStatus =
  | 'queued'
  | 'pending'
  | 'parsing_jd'
  | 'extracting'
  | 'analyzing'
  | 'tailoring'
  | 'rendering'
  | 'compiling'
  | 'scoring'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface KeywordCategoryItem {
  keyword: string;
  matched: boolean;
  matchedAs?: string;
  count: number;
  importance: 'required' | 'preferred' | 'domain';
  category?: string;
}

export interface AtsScoreBreakdown {
  keywordScore: number;
  formatScore: number;
  sectionScore: number;
}

export interface FormatCheckIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  deduction: number;
}

export interface FormatChecks {
  score: number;
  passed: boolean;
  issues: FormatCheckIssue[];
  details: {
    hasTables: boolean;
    hasColumns: boolean;
    hasIcons: boolean;
    textExtractable: boolean;
    wordCount: number;
    pageCount: number;
    detectedSections: string[];
  };
}

export interface AtsKeywordMatch {
  keyword: string;
  matchedAs?: string;
  count: number;
  importance: 'required' | 'preferred' | 'domain';
}

export interface AtsKeywordMissing {
  keyword: string;
  importance: 'required' | 'preferred' | 'domain';
}

export interface AtsScoreResult {
  score: number; // 0 - 100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: AtsScoreBreakdown;
  keywordAnalysis: {
    totalKeywords: number;
    matchedCount: number;
    missingCount: number;
    coveragePercentage: number;
    matched: AtsKeywordMatch[];
    missing: AtsKeywordMissing[];
  };
  formatChecks: FormatChecks;
  suggestions: string[];
}

export interface TailoredBullet {
  id: string;
  sourceBulletId?: string;
  text: string;
  keywordsMatched?: string[];
}

export interface TailoredExperience {
  id: string;
  company: string;
  title?: string;
  position?: string;
  location?: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  isCurrent?: boolean;
  bullets: TailoredBullet[];
}

export interface TailoredSkillItem {
  id?: string;
  name: string;
  category?: string;
  isHighlighted?: boolean;
}

export interface TailoredContent {
  summary?: string;
  experience?: TailoredExperience[];
  education?: any[];
  skills?: TailoredSkillItem[];
  projects?: any[];
  certifications?: any[];
}

export interface ChangeSummary {
  totalBulletsOriginal: number;
  totalBulletsTailored: number;
  bulletsModified: number;
  bulletsUnchanged: number;
  bulletsRemediated: number;
  matchedKeywords: string[];
  sectionsChanged: string[];
  tailoringScore: number;
  summaryChanged: boolean;
  remediationNotes: string[];
  notes?: string[];
}

export interface Generation {
  id: string;
  userId: string;
  status: GenerationStatus;
  jobTitle: string | null;
  company: string | null;
  companyName?: string | null;
  jobDescriptionText: string | null;
  jobDescriptionUrl: string | null;
  jobUrl?: string | null;
  templateId: string;
  targetPageCount?: number;
  pageCount?: number | null;
  pdfUrl: string | null;
  texUrl: string | null;
  atsScore: number | null;
  atsScoreResult?: AtsScoreResult | null;
  tailoredContent?: TailoredContent | null;
  originalTailoredContent?: TailoredContent | null;
  changeSummary?: ChangeSummary | null;
  isOutOfDate?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  compileAttempts?: any[];
}

export interface GenerationCreateRequest {
  jobDescriptionText?: string;
  jobDescription?: string;
  jobText?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescriptionUrl?: string;
  jobUrl?: string;
  templateId: string;
  targetPageCount?: number;
  fromGenerationId?: string;
  sourceGenerationId?: string;
}

export interface GenerationCreateResponse {
  id: string;
  status: GenerationStatus;
}

export interface ParseUrlResponse {
  jobTitle: string | null;
  company: string | null;
  jobDescriptionText: string;
  success: boolean;
  warning: string | null;
  extractedVia?: 'jsonld' | 'html';
}

export interface GenerationStatusResponse {
  id: string;
  status: GenerationStatus;
  progress: number;
  currentStage?: string;
  estimatedRemaining?: number | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  pdfUrl?: string | null;
}

export interface GenerationCancelResponse {
  success: boolean;
  id: string;
  status: 'cancelled';
  message?: string;
}

export interface GenerationRetryResponse {
  id: string;
  status: GenerationStatus;
  message?: string;
}

export interface GenerationRerenderResponse {
  id: string;
  status: GenerationStatus;
  pdfUrl?: string | null;
  texUrl?: string | null;
  pageCount?: number;
  compileDurationMs?: number;
  message?: string;
}

export interface GenerationResetResponse {
  id: string;
  status: GenerationStatus;
  pdfUrl?: string | null;
  message?: string;
}

export type StepState = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface GenerationStepInfo {
  id: string;
  title: string;
  description: string;
  state: StepState;
}
