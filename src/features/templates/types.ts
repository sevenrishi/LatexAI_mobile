export interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isSystem: boolean;
  isActive: boolean;
  thumbnailUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateDetail extends TemplateListItem {
  latexCode: string;
  placeholders: string[];
}

export interface TemplatePreviewResponse {
  pdfBase64: string;
  pageCount: number;
  renderedLatex: string;
  durationMs: number;
}

export interface PreviewTemplatePayload {
  profileData?: Record<string, unknown>;
  latexOverride?: string;
}

export interface CreateTemplatePayload {
  name: string;
  description?: string;
  category?: string;
  latexCode: string;
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  category?: string;
  latexCode?: string;
}

