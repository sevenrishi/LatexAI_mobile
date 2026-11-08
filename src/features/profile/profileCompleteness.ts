import { UserProfile } from '../../types/user';

export interface SectionCompleteness {
  key: string;
  title: string;
  isComplete: boolean;
  score: number;
  weight: number;
  description: string;
}

export function calculateProfileCompleteness(profile: Partial<UserProfile> | null | undefined): {
  percent: number;
  sections: SectionCompleteness[];
} {
  if (!profile) {
    return {
      percent: 0,
      sections: [],
    };
  }

  // Contact (20%)
  const hasName = Boolean(profile.contact?.fullName?.trim());
  const hasEmail = Boolean(profile.contact?.email?.trim());
  const hasPhone = Boolean(profile.contact?.phone?.trim());
  const contactComplete = hasName && hasEmail && hasPhone;
  const contactScore = contactComplete ? 20 : (hasName ? 10 : 0) + (hasEmail ? 5 : 0) + (hasPhone ? 5 : 0);

  // Summary (15%)
  const summaryLength = profile.summary?.trim()?.length || 0;
  const summaryComplete = summaryLength >= 50;
  const summaryScore = summaryComplete ? 15 : summaryLength > 0 ? 8 : 0;

  // Experience (25%)
  const experienceCount = profile.experience?.length || 0;
  const hasBullets = profile.experience?.some(e => e.bullets && e.bullets.length > 0) || false;
  const experienceComplete = experienceCount >= 1 && hasBullets;
  const experienceScore = experienceComplete ? 25 : experienceCount > 0 ? 15 : 0;

  // Education (15%)
  const educationCount = profile.education?.length || 0;
  const educationComplete = educationCount >= 1;
  const educationScore = educationComplete ? 15 : 0;

  // Skills (15%)
  const totalSkills = (profile.skills || []).reduce((acc, cat) => acc + (cat.skills?.length || 0), 0);
  const skillsComplete = totalSkills >= 5;
  const skillsScore = skillsComplete ? 15 : totalSkills > 0 ? Math.min(12, totalSkills * 2.5) : 0;

  // Projects & Certs (10%)
  const projectCount = profile.projects?.length || 0;
  const certCount = profile.certifications?.length || 0;
  const additionsComplete = projectCount >= 1 || certCount >= 1;
  const additionsScore = additionsComplete ? 10 : 0;

  const totalScore = Math.round(
    contactScore + summaryScore + experienceScore + educationScore + skillsScore + additionsScore
  );

  const sections: SectionCompleteness[] = [
    {
      key: 'contact',
      title: 'Contact Information',
      isComplete: contactComplete,
      score: contactScore,
      weight: 20,
      description: contactComplete ? 'Name, email, and phone added' : 'Add phone number and social links',
    },
    {
      key: 'summary',
      title: 'Professional Summary',
      isComplete: summaryComplete,
      score: summaryScore,
      weight: 15,
      description: summaryComplete ? `${summaryLength} characters` : 'Write at least 50 characters',
    },
    {
      key: 'experience',
      title: 'Work Experience',
      isComplete: experienceComplete,
      score: experienceScore,
      weight: 25,
      description: `${experienceCount} role${experienceCount === 1 ? '' : 's'} added`,
    },
    {
      key: 'education',
      title: 'Education',
      isComplete: educationComplete,
      score: educationScore,
      weight: 15,
      description: `${educationCount} school${educationCount === 1 ? '' : 's'} / degree${educationCount === 1 ? '' : 's'}`,
    },
    {
      key: 'skills',
      title: 'Skills & Tech Stack',
      isComplete: skillsComplete,
      score: skillsScore,
      weight: 15,
      description: `${totalSkills} skill${totalSkills === 1 ? '' : 's'} listed`,
    },
    {
      key: 'certifications',
      title: 'Certifications',
      isComplete: certCount > 0,
      score: certCount > 0 ? 5 : 0,
      weight: 5,
      description: `${certCount} credential${certCount === 1 ? '' : 's'}`,
    },
    {
      key: 'projects',
      title: 'Key Projects',
      isComplete: projectCount > 0,
      score: projectCount > 0 ? 5 : 0,
      weight: 5,
      description: `${projectCount} project${projectCount === 1 ? '' : 's'}`,
    },
  ];

  const calculatedPercent = Math.min(100, Math.max(0, totalScore));
  const finalPercent =
    typeof profile.completenessPercent === 'number' && profile.completenessPercent > 0
      ? profile.completenessPercent
      : calculatedPercent;

  return {
    percent: finalPercent,
    sections,
  };
}

