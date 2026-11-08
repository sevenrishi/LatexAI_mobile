export interface DashboardMetrics {
  totalResumes: number;
  completedResumes: number;
  failedResumes: number;
  inProgressResumes: number;
  averageAtsScore: number | null;
}

export interface DashboardQuotas {
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
}

export interface DashboardKeyword {
  keyword: string;
  count: number;
}

export interface DashboardRecentItem {
  id: string;
  jobTitle: string | null;
  company: string | null;
  status: string;
  atsScore: number | null;
  createdAt: string;
  pdfUrl?: string | null;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  quotas: DashboardQuotas;
  topKeywords: DashboardKeyword[];
  templateUsage?: { templateId?: string; count: number }[];
  recentGenerations?: DashboardRecentItem[];
}

