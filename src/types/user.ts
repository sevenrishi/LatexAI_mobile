export interface User {
  id: string;
  email: string;
  name?: string;
  headline?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface CustomLink {
  id?: string;
  label: string;
  url: string;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  customLinks?: CustomLink[];
}

export interface BulletPoint {
  id?: string;
  text: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position?: string;
  title?: string;
  startDate: string; // YYYY-MM
  endDate?: string | null; // YYYY-MM or null if current
  isCurrent?: boolean;
  current?: boolean;
  location?: string;
  bullets: (string | BulletPoint)[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  gpa?: string;
  honors?: string;
}

export interface SkillItem {
  id?: string;
  name: string;
  category?: string;
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  doesNotExpire?: boolean;
  credentialId?: string;
  credentialUrl?: string;
  url?: string;
}

export interface Project {
  id: string;
  name?: string;
  title?: string;
  role?: string;
  description: string;
  technologies?: string[];
  techStack?: string[];
  liveUrl?: string;
  repoUrl?: string;
  url?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  contact: ContactInfo;
  headline?: string;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  certifications: Certification[];
  projects: Project[];
  completenessPercent: number;
  updatedAt?: string;
}

export interface ResumeImportDraft {
  importId: string;
  status?: 'pending' | 'parsed' | 'confirmed' | 'discarded';
  fileName?: string;
  fileSize?: number;
  parsedData: {
    contact?: Partial<ContactInfo>;
    summary?: string;
    experience?: WorkExperience[];
    education?: Education[];
    skills?: (string | SkillItem | SkillCategory)[];
    certifications?: Certification[];
    projects?: Project[];
  };
  createdAt?: string;
}

export interface ConfirmImportPayload {
  strategy: 'merge' | 'replace';
  sections?: {
    contact?: boolean;
    summary?: boolean;
    experience?: boolean;
    education?: boolean;
    skills?: boolean;
    certifications?: boolean;
    projects?: boolean;
  };
  selectedData?: Partial<ResumeImportDraft['parsedData']>;
}
