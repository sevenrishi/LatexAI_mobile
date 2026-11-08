export interface HistoryResumeItem {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  status: 'queued' | 'pending' | 'parsing_jd' | 'extracting' | 'analyzing' | 'tailoring' | 'rendering' | 'compiling' | 'scoring' | 'completed' | 'failed' | 'cancelled';
  templateId?: string;
  targetPageCount?: number;
  pageCount?: number | null;
  atsScore?: number | null;
  pdfUrl?: string | null;
  texUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListResumesResponse {
  items: HistoryResumeItem[];
  nextCursor?: string | null;
  hasMore: boolean;
  total?: number;
}

export interface ListResumesFilter {
  search?: string;
  status?: string;
  templateId?: string;
}

