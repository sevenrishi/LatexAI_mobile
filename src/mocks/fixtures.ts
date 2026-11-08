import { User, UserProfile } from '../types/user';

export const mockUser: User = {
  id: 'usr_01h8x9p3q7r0v2b4k5m6n7p8q9',
  email: 'alex.morgan@example.com',
  name: 'Alex Morgan',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  emailVerified: true,
  createdAt: '2026-01-15T09:30:00Z',
};

export const mockProfile: UserProfile = {
  id: 'prf_01h8x9p3q7r0v2b4k5m6n7p8q9',
  userId: mockUser.id,
  contact: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    website: 'https://alexmorgan.dev',
    linkedin: 'https://linkedin.com/in/alexmorgan',
    github: 'https://github.com/alexmorgan',
  },
  summary:
    'Staff Software Engineer with 8+ years experience architecting scalable distributed systems and high-performance cloud applications. Proven track record leading cross-functional engineering teams and optimizing system latency by 45%.',
  experience: [
    {
      id: 'exp_1',
      company: 'TechCorp Cloud Systems',
      position: 'Staff Software Engineer',
      startDate: '2023-01',
      isCurrent: true,
      location: 'San Francisco, CA',
      bullets: [
        'Architected real-time event streaming platform processing 50M+ daily events with 99.99% uptime.',
        'Mentored 12 senior and mid-level engineers across 3 squads, establishing CI/CD quality gates.',
        'Cut infrastructure expenditure by 32% ($450k ARR) through Kubernetes resource auto-scaling optimizations.',
      ],
    },
    {
      id: 'exp_2',
      company: 'DataFlow Inc.',
      position: 'Senior Full Stack Engineer',
      startDate: '2020-03',
      endDate: '2022-12',
      isCurrent: false,
      location: 'Seattle, WA',
      bullets: [
        'Led migration of legacy monolith to Node.js microservices with gRPC transport layer.',
        'Engineered responsive React Native client application with offline SQLite synchronizer.',
      ],
    },
  ],
  education: [
    {
      id: 'edu_1',
      institution: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      fieldOfStudy: 'Distributed Systems & AI',
      startDate: '2016-09',
      endDate: '2020-05',
      gpa: '3.86',
    },
  ],
  skills: [
    {
      category: 'Languages',
      skills: ['TypeScript', 'Python', 'Go', 'SQL', 'GraphQL', 'Rust'],
    },
    {
      category: 'Frameworks & Libraries',
      skills: ['React Native', 'React', 'Node.js', 'Express', 'TailwindCSS', 'Next.js'],
    },
    {
      category: 'Cloud & Infrastructure',
      skills: ['AWS (ECS, S3, RDS)', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'Kafka'],
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      name: 'AWS Certified Solutions Architect – Professional',
      issuer: 'Amazon Web Services',
      issueDate: '2024-02',
      expiryDate: '2027-02',
    },
  ],
  projects: [
    {
      id: 'proj_1',
      name: 'LatexAI Resume Engine',
      description: 'AI-tailored resume compiler leveraging pdflatex sandboxing and ATS optimization heuristics.',
      technologies: ['React Native', 'TypeScript', 'Node.js', 'pdflatex'],
      url: 'https://github.com/alexmorgan/latexai',
    },
  ],
  completenessPercent: 92,
  updatedAt: '2026-09-20T14:15:00Z',
};

export const mockTemplates = [
  {
    id: 'tmpl_classic_ats',
    name: 'Modern Single Column ATS',
    isDefault: true,
    isSystem: true,
    isActive: true,
    category: 'Engineering',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300',
    description: 'Clean, high-parsing accuracy ATS layout recommended for tech, finance, and engineering.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    placeholders: ['SUMMARY', 'EXPERIENCE_BLOCK', 'EDUCATION_BLOCK', 'SKILLS_BLOCK', 'PROJECTS_BLOCK', 'CERTIFICATIONS_BLOCK'],
    latexCode: `\\documentclass[letterpaper,10pt]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\begin{document}
\\begin{center}
{\\huge \\textbf{{{NAME}}}}\\\\
{{EMAIL}} | {{PHONE}} | {{LOCATION}}
\\end{center}
\\section*{Professional Summary}
{{SUMMARY}}
\\section*{Experience}
{{EXPERIENCE_BLOCK}}
\\section*{Education}
{{EDUCATION_BLOCK}}
\\section*{Skills}
{{SKILLS_BLOCK}}
\\end{document}`,
  },
  {
    id: 'tmpl_executive',
    name: 'Executive Minimalist',
    isDefault: false,
    isSystem: true,
    isActive: false,
    category: 'Executive',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300',
    description: 'Sophisticated header treatment with subtle borders and dedicated leadership highlight section.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    placeholders: ['SUMMARY', 'EXPERIENCE_BLOCK', 'EDUCATION_BLOCK', 'SKILLS_BLOCK'],
    latexCode: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=1in]{geometry}
\\begin{document}
{\\Large \\textbf{{{NAME}}}}\\\\
{{SUMMARY}}
\\end{document}`,
  },
  {
    id: 'tmpl_compact_tech',
    name: 'Compact Software Developer',
    isDefault: false,
    isSystem: true,
    isActive: false,
    category: 'Engineering',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300',
    description: 'Dense formatting maximizing project and skill visibility on a single page.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    placeholders: ['SUMMARY', 'EXPERIENCE_BLOCK', 'SKILLS_BLOCK', 'PROJECTS_BLOCK'],
    latexCode: `\\documentclass[letterpaper,9pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\begin{document}
{\\Large \\textbf{{{NAME}}}}\\\\
{{SUMMARY}}
\\end{document}`,
  },
];

export const mockAtsReport = {
  overallScore: 88,
  matchTier: 'Strong Match' as const,
  breakdown: {
    skillsMatch: 92,
    experienceRelevance: 85,
    educationFormatting: 90,
    atsCompatibility: 95,
  },
  matchedKeywords: [
    'TypeScript',
    'Kubernetes',
    'Distributed Systems',
    'AWS',
    'Docker',
    'Microservices',
    'CI/CD',
    'PostgreSQL',
  ],
  missingKeywords: ['Terraform', 'Kafka Streams', 'Prometheus'],
  recommendations: [
    'Highlight production Terraform experience under DataFlow Inc.',
    'Quantify latency reduction on event streaming architecture.',
  ],
};

export const mockAtsScore = {
  score: 88,
  grade: 'A' as const,
  breakdown: {
    keywordScore: 86,
    formatScore: 95,
    sectionScore: 100,
  },
  keywordAnalysis: {
    totalKeywords: 16,
    matchedCount: 13,
    missingCount: 3,
    coveragePercentage: 81,
    matched: [
      { keyword: 'Go', count: 4, importance: 'required' as const, matchedAs: 'Go' },
      { keyword: 'Kubernetes', count: 3, importance: 'required' as const, matchedAs: 'Kubernetes' },
      { keyword: 'AWS', count: 2, importance: 'required' as const, matchedAs: 'AWS (ECS, S3, RDS)' },
      { keyword: 'Distributed Systems', count: 3, importance: 'required' as const },
      { keyword: 'TypeScript', count: 2, importance: 'preferred' as const },
      { keyword: 'Microservices', count: 2, importance: 'preferred' as const },
      { keyword: 'Docker', count: 1, importance: 'preferred' as const },
      { keyword: 'gRPC', count: 1, importance: 'preferred' as const },
      { keyword: 'Kafka', count: 1, importance: 'preferred' as const },
      { keyword: 'Redis', count: 1, importance: 'preferred' as const },
      { keyword: 'CI/CD', count: 2, importance: 'preferred' as const },
      { keyword: 'Observability', count: 1, importance: 'domain' as const },
      { keyword: 'High-Throughput', count: 1, importance: 'domain' as const },
    ],
    missing: [
      { keyword: 'Terraform', importance: 'required' as const },
      { keyword: 'Prometheus', importance: 'preferred' as const },
      { keyword: 'FinTech', importance: 'domain' as const },
    ],
  },
  formatChecks: {
    score: 95,
    passed: true,
    issues: [
      {
        id: 'no-tables',
        severity: 'info' as const,
        message: 'No complex nested tables detected. Clean linear parsing.',
        deduction: 0,
      },
      {
        id: 'standard-fonts',
        severity: 'info' as const,
        message: 'Unicode standard Computer Modern fonts utilized.',
        deduction: 0,
      },
    ],
    details: {
      hasTables: false,
      hasColumns: false,
      hasIcons: false,
      textExtractable: true,
      wordCount: 412,
      pageCount: 1,
      detectedSections: ['Summary', 'Experience', 'Education', 'Skills', 'Certifications'],
    },
  },
  suggestions: [
    'Add "Terraform" to your profile skills or projects to cover all required keywords.',
    'Mention observability tools like Prometheus or Datadog in your recent experience bullet points.',
    'Highlight transaction throughput metrics in your TechCorp experience to emphasize FinTech relevance.',
  ],
};

export const mockChangeSummary = {
  totalBulletsOriginal: 5,
  totalBulletsTailored: 5,
  bulletsModified: 4,
  bulletsUnchanged: 1,
  bulletsRemediated: 0,
  matchedKeywords: ['Go', 'Kubernetes', 'AWS', 'Distributed Systems', 'gRPC', 'Kafka', 'Observability'],
  sectionsChanged: ['summary', 'experience', 'skills'],
  tailoringScore: 80,
  summaryChanged: true,
  remediationNotes: [],
  notes: [
    'Tailored professional summary to emphasize high-throughput distributed systems & AWS cloud architecture requested by Stripe.',
    'Aligned TechCorp bullets with Go, Kubernetes, and 99.99% uptime metrics directly targeting the job requirements.',
    'Elevated DataFlow microservices migration to demonstrate gRPC transport layer and scalable backend systems.',
  ],
};

export const mockTailoredContent = {
  summary:
    'Staff Software Engineer specializing in scalable distributed systems and high-throughput backend infrastructure. Experienced in architecting event-driven architectures with Go, Kubernetes, and AWS to deliver 99.99% service availability.',
  experience: [
    {
      id: 'exp_1',
      company: 'TechCorp Cloud Systems',
      position: 'Staff Software Engineer',
      startDate: '2023-01',
      isCurrent: true,
      location: 'San Francisco, CA',
      bullets: [
        {
          id: 'b_tailored_1',
          sourceBulletId: 'b_orig_1',
          text: 'Architected real-time event streaming platform with Go and Kafka processing 50M+ daily events with 99.99% uptime.',
          keywordsMatched: ['Go', 'Kafka', '99.99% uptime'],
        },
        {
          id: 'b_tailored_2',
          sourceBulletId: 'b_orig_2',
          text: 'Mentored 12 senior and mid-level engineers across 3 squads, establishing CI/CD quality gates and automated testing standards.',
          keywordsMatched: ['CI/CD', 'mentored'],
        },
        {
          id: 'b_tailored_3',
          sourceBulletId: 'b_orig_3',
          text: 'Cut infrastructure expenditure by 32% ($450k ARR) through Kubernetes resource auto-scaling and AWS ECS container optimizations.',
          keywordsMatched: ['Kubernetes', 'AWS'],
        },
      ],
    },
    {
      id: 'exp_2',
      company: 'DataFlow Inc.',
      position: 'Senior Full Stack Engineer',
      startDate: '2020-03',
      endDate: '2022-12',
      isCurrent: false,
      location: 'Seattle, WA',
      bullets: [
        {
          id: 'b_tailored_4',
          sourceBulletId: 'b_orig_4',
          text: 'Led migration of legacy monolith to high-performance Node.js microservices utilizing gRPC transport and Redis caching.',
          keywordsMatched: ['Microservices', 'gRPC', 'Redis'],
        },
        {
          id: 'b_tailored_5',
          sourceBulletId: 'b_orig_5',
          text: 'Engineered responsive React Native client application with offline SQLite synchronizer.',
          keywordsMatched: ['React Native'],
        },
      ],
    },
  ],
  skills: [
    { id: 'sk_1', name: 'Go', category: 'Languages', isHighlighted: true },
    { id: 'sk_2', name: 'Kubernetes', category: 'Cloud & Infrastructure', isHighlighted: true },
    { id: 'sk_3', name: 'AWS (ECS, S3, RDS)', category: 'Cloud & Infrastructure', isHighlighted: true },
    { id: 'sk_4', name: 'TypeScript', category: 'Languages', isHighlighted: true },
    { id: 'sk_5', name: 'Distributed Systems', category: 'Expertise', isHighlighted: true },
    { id: 'sk_6', name: 'Kafka', category: 'Cloud & Infrastructure', isHighlighted: true },
    { id: 'sk_7', name: 'Docker', category: 'Cloud & Infrastructure', isHighlighted: false },
    { id: 'sk_8', name: 'Redis', category: 'Cloud & Infrastructure', isHighlighted: false },
  ],
  education: [
    {
      id: 'edu_1',
      institution: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      fieldOfStudy: 'Distributed Systems & AI',
      startDate: '2016-09',
      endDate: '2020-05',
      gpa: '3.86',
    },
  ],
  projects: [
    {
      id: 'proj_1',
      name: 'LatexAI Resume Engine',
      description: 'AI-tailored resume compiler leveraging pdflatex sandboxing and ATS optimization heuristics.',
      technologies: ['React Native', 'TypeScript', 'Node.js', 'pdflatex'],
      url: 'https://github.com/alexmorgan/latexai',
    },
  ],
};

export const mockOriginalTailoredContent = {
  summary: mockProfile.summary,
  experience: mockProfile.experience.map((exp, expIdx) => ({
    id: exp.id,
    company: exp.company,
    position: exp.position,
    startDate: exp.startDate,
    endDate: exp.endDate,
    isCurrent: exp.isCurrent,
    location: exp.location,
    bullets: exp.bullets.map((bText, bIdx) => ({
      id: `b_orig_${expIdx * 3 + bIdx + 1}`,
      sourceBulletId: `b_orig_${expIdx * 3 + bIdx + 1}`,
      text: typeof bText === 'string' ? bText : (bText as any)?.text || '',
      keywordsMatched: [],
    })),
  })),
  skills: mockProfile.skills.flatMap((cat) =>
    cat.skills.map((s, idx) => ({ id: `sk_orig_${idx}`, name: s, category: cat.category, isHighlighted: false }))
  ),
  education: mockProfile.education,
  projects: mockProfile.projects,
};

export const mockGenerations = [
  {
    id: 'gen_01h8x9p3q7r0v2b4k5m6n7p8q1',
    roleTitle: 'Staff Backend Infrastructure Engineer',
    jobTitle: 'Staff Backend Infrastructure Engineer',
    companyName: 'Stripe',
    company: 'Stripe',
    createdAt: '2026-09-21T18:00:00Z',
    status: 'COMPLETED',
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
    templateId: 'tmpl_classic_ats',
    jobDescription:
      'We are looking for a Staff Backend Infrastructure Engineer to scale Stripe global transaction engine with Go, Kubernetes, and AWS.',
    jobDescriptionText:
      'We are looking for a Staff Backend Infrastructure Engineer to scale Stripe global transaction engine with Go, Kubernetes, and AWS.',
  },
  {
    id: 'gen_01h8x9p3q7r0v2b4k5m6n7p8q2',
    roleTitle: 'Lead Mobile Platform Engineer',
    jobTitle: 'Lead Mobile Platform Engineer',
    companyName: 'Airbnb',
    company: 'Airbnb',
    createdAt: '2026-09-18T11:20:00Z',
    status: 'COMPLETED',
    atsScore: 82,
    atsScoreResult: {
      ...mockAtsScore,
      score: 82,
      grade: 'B' as const,
    },
    changeSummary: mockChangeSummary,
    tailoredContent: mockTailoredContent,
    originalTailoredContent: mockOriginalTailoredContent,
    isOutOfDate: false,
    pageCount: 1,
    targetPageCount: 1,
    pdfUrl: 'https://raw.githubusercontent.com/latexai/fixtures/main/sample_resume.pdf',
    texUrl: 'https://raw.githubusercontent.com/latexai/fixtures/main/sample_resume.tex',
    templateId: 'tmpl_executive',
    jobDescription:
      'Join Airbnb as Lead Mobile Platform Engineer directing cross-platform React Native foundations, performance, and developer tooling.',
    jobDescriptionText:
      'Join Airbnb as Lead Mobile Platform Engineer directing cross-platform React Native foundations, performance, and developer tooling.',
  },
];

export const mockDashboardSummary = {
  totalGenerations: 14,
  averageAtsScore: 85,
  profileCompleteness: 92,
  recentGenerations: mockGenerations,
};
