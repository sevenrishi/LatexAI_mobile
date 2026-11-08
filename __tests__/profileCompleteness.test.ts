import { calculateProfileCompleteness } from '../src/features/profile/profileCompleteness';
import { mockProfile } from '../src/mocks/fixtures';

describe('Profile Completeness (MB-2.03)', () => {
  it('returns 0% and incomplete sections for empty or null profile', () => {
    const result = calculateProfileCompleteness(null);
    expect(result.percent).toBe(0);
    expect(result.sections).toHaveLength(0);

    const emptyResult = calculateProfileCompleteness({});
    expect(emptyResult.percent).toBe(0);
    expect(emptyResult.sections.every((s) => !s.isComplete)).toBe(true);
  });

  it('correctly calculates completeness percent for mockProfile', () => {
    const result = calculateProfileCompleteness(mockProfile);
    expect(result.percent).toBeGreaterThanOrEqual(90);
    expect(result.sections.length).toBe(7);

    const contactSec = result.sections.find((s) => s.key === 'contact');
    expect(contactSec?.isComplete).toBe(true);

    const expSec = result.sections.find((s) => s.key === 'experience');
    expect(expSec?.isComplete).toBe(true);

    const eduSec = result.sections.find((s) => s.key === 'education');
    expect(eduSec?.isComplete).toBe(true);

    const skillsSec = result.sections.find((s) => s.key === 'skills');
    expect(skillsSec?.isComplete).toBe(true);
  });

  it('evaluates section partial progress correctly', () => {
    const partialProfile = {
      contact: {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
      },
      summary: 'Short', // < 50 chars
      experience: [],
      education: [],
      skills: [{ category: 'Languages', skills: ['Python'] }], // < 5 skills
      projects: [],
      certifications: [],
    };

    const result = calculateProfileCompleteness(partialProfile as any);
    const summarySec = result.sections.find((s) => s.key === 'summary');
    expect(summarySec?.isComplete).toBe(false);

    const skillsSec = result.sections.find((s) => s.key === 'skills');
    expect(skillsSec?.isComplete).toBe(false);
  });
});

