import { registerMockHandler, RequestOptions } from '../lib/api';
import { ApiError } from '../lib/errors';
import { ResumeImportDraft, UserProfile } from '../types/user';
import {
  mockAtsScore,
  mockChangeSummary,
  mockDashboardSummary,
  mockGenerations,
  mockOriginalTailoredContent,
  mockProfile,
  mockTailoredContent,
  mockTemplates,
  mockUser,
} from './fixtures';

let inMemoryProfile: UserProfile = JSON.parse(JSON.stringify(mockProfile));
let inMemoryTemplates: any[] = JSON.parse(JSON.stringify(mockTemplates));

export const getInMemoryProfile = () => inMemoryProfile;
export const resetInMemoryProfile = () => {
  inMemoryProfile = JSON.parse(JSON.stringify(mockProfile));
  inMemoryTemplates = JSON.parse(JSON.stringify(mockTemplates));
};

export const handleMockRequest = async (
  endpoint: string,
  options?: RequestOptions
): Promise<unknown | null> => {
  const method = options?.method || 'GET';
  const cleanPath = endpoint.replace(/^\/api\/v1/, '').replace(/^\//, '');

  // Simulate network latency in dev/mock (50ms for tests, 150ms default)
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 50));

  if (method === 'GET') {
    if (cleanPath === 'auth/me') {
      return {
        user: mockUser,
        isOnboarded: true,
        completenessPercent: inMemoryProfile.completenessPercent,
      };
    }

    if (cleanPath === 'profile') {
      return inMemoryProfile;
    }

    if (cleanPath.startsWith('profile/')) {
      const section = cleanPath.split('/')[1] as keyof UserProfile;
      if (inMemoryProfile[section]) {
        return inMemoryProfile[section];
      }
    }

    if (cleanPath === 'templates') {
      return inMemoryTemplates;
    }

    if (cleanPath.startsWith('templates/')) {
      const templateId = cleanPath.split('/')[1];
      const template = inMemoryTemplates.find((t) => t.id === templateId);
      if (template) {
        return template;
      }
    }

    if (cleanPath === 'dashboard/summary') {
      return mockDashboardSummary;
    }

    if (cleanPath === 'history' || cleanPath === 'generations') {
      return {
        items: mockGenerations,
        total: mockGenerations.length,
      };
    }
  }

  if (method === 'PATCH' && cleanPath === 'profile') {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    inMemoryProfile = {
      ...inMemoryProfile,
      ...body,
      contact: {
        ...inMemoryProfile.contact,
        ...(body.contact || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    return inMemoryProfile;
  }

  // Section item CRUD
  const sectionReorderMatch = cleanPath.match(/^profile\/([^/]+)\/reorder$/);
  if (method === 'PATCH' && sectionReorderMatch) {
    const section = sectionReorderMatch[1] as keyof UserProfile;
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const orderedIds: string[] = body.orderedIds || [];
    const currentItems: any[] = (inMemoryProfile[section] as any[]) || [];
    const itemMap = new Map(currentItems.map((i) => [i.id, i]));
    const reordered = orderedIds.map((id) => itemMap.get(id)).filter(Boolean);
    currentItems.forEach((item) => {
      if (!orderedIds.includes(item.id)) {
        reordered.push(item);
      }
    });
    (inMemoryProfile as any)[section] = reordered;
    return inMemoryProfile;
  }

  // Bulk skills
  if (method === 'POST' && cleanPath === 'profile/skills/bulk') {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const newSkills: (string | { name: string; category?: string })[] = body.skills || [];
    const skillsList = [...inMemoryProfile.skills];
    newSkills.forEach((item) => {
      const name = typeof item === 'string' ? item : item.name;
      const cat = typeof item === 'string' ? 'Other' : item.category || 'Other';
      let foundCat = skillsList.find((c) => c.category.toLowerCase() === cat.toLowerCase());
      if (!foundCat) {
        foundCat = { category: cat, skills: [] };
        skillsList.push(foundCat);
      }
      if (!foundCat.skills.includes(name)) {
        foundCat.skills.push(name);
      }
    });
    inMemoryProfile.skills = skillsList;
    return inMemoryProfile.skills;
  }

  // Resume import
  if (method === 'POST' && cleanPath === 'profile/import-resume') {
    const mockDraft: ResumeImportDraft = {
      importId: `imp_${Date.now()}`,
      status: 'parsed',
      fileName: 'imported_resume.pdf',
      fileSize: 102400,
      parsedData: {
        contact: {
          fullName: 'Taylor Swift',
          email: 'taylor@example.com',
          phone: '+1 (555) 987-6543',
          location: 'Nashville, TN',
          website: 'https://taylorswift.com',
          linkedin: 'https://linkedin.com/in/taylorswift',
          github: 'https://github.com/taylorswift',
        },
        summary: 'Award-winning creative technologist and systems architect with deep passion for mobile applications and cloud infrastructure.',
        experience: [
          {
            id: `exp_imp_1`,
            company: 'Era Music Tech',
            position: 'Chief Architect',
            startDate: '2022-01',
            isCurrent: true,
            location: 'New York, NY',
            bullets: [
              'Architected high-throughput ticketing streaming pipeline for global stadium tours.',
              'Designed offline-first mobile app for stadium crew with React Native and SQLite.',
            ],
          },
        ],
        education: [
          {
            id: `edu_imp_1`,
            institution: 'Vanderbilt University',
            degree: 'B.S.',
            fieldOfStudy: 'Computer Science & Music Theory',
            startDate: '2015-08',
            endDate: '2019-05',
            gpa: '3.95',
          },
        ],
        skills: [
          { category: 'Languages', skills: ['Swift', 'TypeScript', 'Rust', 'Python'] },
          { category: 'Frameworks', skills: ['React Native', 'SwiftUI', 'FastAPI'] },
        ],
        certifications: [
          {
            id: `cert_imp_1`,
            name: 'AWS Certified Solutions Architect',
            issuer: 'Amazon Web Services',
            issueDate: '2023-05',
          },
        ],
        projects: [
          {
            id: `proj_imp_1`,
            name: 'SoundWave Synthesizer',
            description: 'Real-time DSP audio synthesizer built with C++ and React Native audio worklets.',
            technologies: ['C++', 'React Native', 'AudioDSP'],
          },
        ],
      },
      createdAt: new Date().toISOString(),
    };
    return mockDraft;
  }

  // Confirm import
  const confirmMatch = cleanPath.match(/^profile\/import-resume\/([^/]+)\/confirm$/);
  if (method === 'POST' && confirmMatch) {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const { strategy, selectedData } = body;
    if (strategy === 'replace') {
      if (selectedData) {
        if (selectedData.contact) inMemoryProfile.contact = { ...inMemoryProfile.contact, ...selectedData.contact };
        if (selectedData.summary) inMemoryProfile.summary = selectedData.summary;
        if (selectedData.experience) inMemoryProfile.experience = selectedData.experience;
        if (selectedData.education) inMemoryProfile.education = selectedData.education;
        if (selectedData.skills) inMemoryProfile.skills = selectedData.skills;
        if (selectedData.certifications) inMemoryProfile.certifications = selectedData.certifications;
        if (selectedData.projects) inMemoryProfile.projects = selectedData.projects;
      }
    } else {
      // Merge
      if (selectedData) {
        if (selectedData.contact) inMemoryProfile.contact = { ...inMemoryProfile.contact, ...selectedData.contact };
        if (selectedData.summary) inMemoryProfile.summary = selectedData.summary;
        if (selectedData.experience) inMemoryProfile.experience = [...inMemoryProfile.experience, ...selectedData.experience];
        if (selectedData.education) inMemoryProfile.education = [...inMemoryProfile.education, ...selectedData.education];
        if (selectedData.certifications) inMemoryProfile.certifications = [...inMemoryProfile.certifications, ...selectedData.certifications];
        if (selectedData.projects) inMemoryProfile.projects = [...inMemoryProfile.projects, ...selectedData.projects];
      }
    }
    return inMemoryProfile;
  }

  // Discard import
  const discardMatch = cleanPath.match(/^profile\/import-resume\/([^/]+)$/);
  if (method === 'DELETE' && discardMatch) {
    return { success: true };
  }

  // Create section item
  const sectionCreateMatch = cleanPath.match(/^profile\/([^/]+)$/);
  if (method === 'POST' && sectionCreateMatch) {
    const section = sectionCreateMatch[1] as keyof UserProfile;
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const newItem = { ...body, id: `${section.slice(0, 3)}_${Date.now()}` };
    if (Array.isArray((inMemoryProfile as any)[section])) {
      (inMemoryProfile as any)[section].push(newItem);
    }
    return newItem;
  }

  // Update section item
  const sectionUpdateMatch = cleanPath.match(/^profile\/([^/]+)\/([^/]+)$/);
  if (method === 'PUT' && sectionUpdateMatch) {
    const section = sectionUpdateMatch[1] as keyof UserProfile;
    const itemId = sectionUpdateMatch[2];
    const body = options?.body ? JSON.parse(options.body as string) : {};
    if (Array.isArray((inMemoryProfile as any)[section])) {
      (inMemoryProfile as any)[section] = (inMemoryProfile as any)[section].map(
        (item: any) => (item.id === itemId ? { ...item, ...body } : item)
      );
    }
    return { id: itemId, ...body };
  }

  // Delete section item
  const sectionDeleteMatch = cleanPath.match(/^profile\/([^/]+)\/([^/]+)$/);
  if (method === 'DELETE' && sectionDeleteMatch) {
    const section = sectionDeleteMatch[1] as keyof UserProfile;
    const itemId = sectionDeleteMatch[2];
    if (Array.isArray((inMemoryProfile as any)[section])) {
      (inMemoryProfile as any)[section] = (inMemoryProfile as any)[section].filter(
        (item: any) => item.id !== itemId
      );
    }
    return { success: true, id: itemId };
  }

  // Template actions
  const activateMatch = cleanPath.match(/^templates\/([^/]+)\/activate$/);
  if (method === 'POST' && activateMatch) {
    const templateId = activateMatch[1];
    inMemoryTemplates = inMemoryTemplates.map((t) => ({
      ...t,
      isActive: t.id === templateId,
    }));
    return { activeTemplateId: templateId };
  }

  const duplicateMatch = cleanPath.match(/^templates\/([^/]+)\/duplicate$/);
  if (method === 'POST' && duplicateMatch) {
    const templateId = duplicateMatch[1];
    const source = inMemoryTemplates.find((t) => t.id === templateId);
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const newName = body.name || `Copy of ${source?.name || 'Template'}`;
    const duplicated = {
      ...source,
      id: `tmpl_custom_${Date.now()}`,
      name: newName,
      isSystem: false,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryTemplates.push(duplicated);
    return duplicated;
  }

  const previewMatch = cleanPath.match(/^templates\/([^/]+)\/preview$/);
  if (method === 'POST' && previewMatch) {
    const templateId = previewMatch[1];
    const source = inMemoryTemplates.find((t) => t.id === templateId);
    return {
      pdfBase64: 'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0KeAEFwQEBADAIwLB+a208nGBfDAhOEGkCAAAAAElFTkSuQmCC',
      pageCount: 1,
      renderedLatex: source?.latexCode || '\\documentclass{article}\\begin{document}Resume\\end{document}',
      durationMs: 380,
    };
  }

  const templateDeleteMatch = cleanPath.match(/^templates\/([^/]+)$/);
  if (method === 'DELETE' && templateDeleteMatch) {
    const templateId = templateDeleteMatch[1];
    inMemoryTemplates = inMemoryTemplates.filter((t) => t.id !== templateId);
    return { deleted: true, fallbackActivated: false, activeTemplateId: 'tmpl_classic_ats' };
  }

  // Job URL fetch / parse (MB-4.02)
  if (method === 'POST' && (cleanPath === 'jobs/fetch' || cleanPath === 'generate/parse-url')) {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    const url: string = body.url || '';

    if (url.includes('blocked') || url.includes('linkedin.com/login')) {
      throw new ApiError(
        'This job posting URL is protected by anti-bot verification or a login wall. Please copy and paste the job description text directly.',
        'URL_BLOCKED',
        400
      );
    }

    if (url.includes('failed') || url.includes('expired')) {
      throw new ApiError(
        'Could not retrieve job posting from the specified URL.',
        'URL_FETCH_FAILED',
        400
      );
    }

    return {
      jobTitle: 'Senior Distributed Systems Engineer',
      companyName: 'CloudScale Technologies',
      company: 'CloudScale Technologies',
      rawText:
        'We are seeking a Senior Distributed Systems Engineer to scale our global edge compute network. Requirements: 5+ years with Go, Kubernetes, TypeScript, high-throughput distributed architectures, and observability.',
      jobDescriptionText:
        'We are seeking a Senior Distributed Systems Engineer to scale our global edge compute network. Requirements: 5+ years with Go, Kubernetes, TypeScript, high-throughput distributed architectures, and observability.',
      success: true,
      warning: null,
      extractedVia: 'jsonld',
    };
  }

  // Generation submission (MB-4.03)
  if (method === 'POST' && cleanPath === 'generate') {
    const body = options?.body ? JSON.parse(options.body as string) : {};

    // Simulate quota exceeded
    if (body.jobUrl?.includes('quota') || body.jobDescription?.includes('FORCE_QUOTA_EXCEEDED')) {
      throw new ApiError(
        'You have reached your daily generation limit. Please upgrade your subscription or try again tomorrow.',
        'QUOTA_EXCEEDED',
        429
      );
    }

    // Simulate profile incomplete
    if (inMemoryProfile.completenessPercent < 40 || body.jobDescription?.includes('FORCE_PROFILE_INCOMPLETE')) {
      throw new ApiError(
        'Your profile needs more details before generating a resume.',
        'PROFILE_INCOMPLETE',
        400
      );
    }

    return {
      id: `gen_${Date.now()}`,
      status: 'queued',
    };
  }

  // Generation status polling (MB-4.05)
  const genStatusMatch = cleanPath.match(/^generate\/([^/]+)\/status$/);
  if (method === 'GET' && genStatusMatch) {
    const genId = genStatusMatch[1];
    const found = mockGenerations.find((g) => g.id === genId);
    if (found) {
      return {
        id: found.id,
        status: (found.status || 'completed').toLowerCase(),
        progress: 100,
        currentStage: 'completed',
        estimatedRemaining: null,
      };
    }
    return {
      id: genId,
      status: 'tailoring',
      progress: 60,
      currentStage: 'tailoring',
      estimatedRemaining: 15,
    };
  }

  // Generation cancellation (MB-4.07)
  const genCancelMatch = cleanPath.match(/^generate\/([^/]+)\/cancel$/);
  if (method === 'POST' && genCancelMatch) {
    const genId = genCancelMatch[1];
    return {
      success: true,
      id: genId,
      status: 'cancelled',
      message: 'Generation was cancelled by the user.',
    };
  }

  // Generation retry
  const genRetryMatch = cleanPath.match(/^generate\/([^/]+)\/retry$/);
  if (method === 'POST' && genRetryMatch) {
    const genId = genRetryMatch[1];
    return {
      id: genId,
      status: 'queued',
      message: 'Generation restarted.',
    };
  }

  // ATS score calculation & audit report (MB-5.03)
  const genAtsScoreMatch = cleanPath.match(/^generate\/([^/]+)\/ats-score$/);
  if (method === 'GET' && genAtsScoreMatch) {
    const genId = genAtsScoreMatch[1];
    const found = mockGenerations.find((g) => g.id === genId);
    if (found?.atsScoreResult) {
      return found.atsScoreResult;
    }
    return mockAtsScore;
  }

  // Generation re-render (MB-5.02, MB-5.06)
  const genRerenderMatch = cleanPath.match(/^generate\/([^/]+)\/rerender$/);
  if (method === 'POST' && genRerenderMatch) {
    const genId = genRerenderMatch[1];
    const found = mockGenerations.find((g) => g.id === genId);
    if (found) {
      found.isOutOfDate = false;
    }
    return {
      id: genId,
      status: 'completed',
      pdfUrl: found?.pdfUrl || 'https://raw.githubusercontent.com/latexai/fixtures/main/sample_resume.pdf',
      pageCount: 1,
      compileDurationMs: 420,
      message: 'PDF re-rendered successfully.',
    };
  }

  // Reset to original AI content (MB-5.04, MB-5.09)
  const genResetMatch = cleanPath.match(/^generate\/([^/]+)\/content\/reset$/);
  if (method === 'POST' && genResetMatch) {
    const genId = genResetMatch[1];
    const found = mockGenerations.find((g) => g.id === genId);
    if (found) {
      found.isOutOfDate = false;
      found.tailoredContent = JSON.parse(JSON.stringify(found.originalTailoredContent || mockOriginalTailoredContent));
    }
    return {
      id: genId,
      status: 'completed',
      pdfUrl: found?.pdfUrl || 'https://raw.githubusercontent.com/latexai/fixtures/main/sample_resume.pdf',
      message: 'Reset to original AI tailored version.',
    };
  }

  // Generation detail (MB-4.04 prefill, MB-5.01 review)
  const genDetailMatch = cleanPath.match(/^generate\/([^/]+)$/);
  if (method === 'GET' && genDetailMatch) {
    const genId = genDetailMatch[1];
    const found = mockGenerations.find((g) => g.id === genId);
    if (found) {
      return found;
    }
    return {
      id: genId,
      userId: mockUser.id,
      status: 'COMPLETED',
      jobTitle: 'Staff Backend Infrastructure Engineer',
      companyName: 'Stripe',
      company: 'Stripe',
      atsScore: 88,
      atsScoreResult: mockAtsScore,
      changeSummary: mockChangeSummary,
      tailoredContent: mockTailoredContent,
      originalTailoredContent: mockOriginalTailoredContent,
      isOutOfDate: false,
      pageCount: 1,
      targetPageCount: 1,
      pdfUrl: 'https://raw.githubusercontent.com/latexai/fixtures/main/sample_resume.pdf',
      texUrl: 'https://raw.githubusercontent.com/latexai/fixtures/main/sample_resume.tex',
      jobDescription:
        'We are looking for a Staff Backend Infrastructure Engineer to scale Stripe global transaction engine with Go, Kubernetes, and AWS.',
      jobDescriptionText:
        'We are looking for a Staff Backend Infrastructure Engineer to scale Stripe global transaction engine with Go, Kubernetes, and AWS.',
      templateId: 'tmpl_classic_ats',
      createdAt: '2026-09-21T18:00:00Z',
    };
  }

  // Not handled by mock layer, fall back to real request
  return null;
};

// Register mock handler with api
registerMockHandler(handleMockRequest);
