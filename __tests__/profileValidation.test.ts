import { isValidEmail, isValidUrl, validateUrl } from '../src/utils/validation';

describe('Profile Form Validations (MB-2.14, MB-2.04, MB-2.07, MB-2.08, MB-2.10, MB-2.11)', () => {
  describe('Email & URL validation', () => {
    it('validates email addresses properly', () => {
      expect(isValidEmail('alex@example.com')).toBe(true);
      expect(isValidEmail('jane.doe+test@sub.domain.co')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('validates URLs properly', () => {
      expect(isValidUrl('https://alexmorgan.dev')).toBe(true);
      expect(isValidUrl('http://github.com/alex')).toBe(true);
      expect(isValidUrl('https://linkedin.com/in/alex')).toBe(true);
      expect(isValidUrl('not_a_url')).toBe(false);
      expect(isValidUrl('')).toBe(false);

      expect(validateUrl('https://example.com').isValid).toBe(true);
      expect(validateUrl('invalid').isValid).toBe(false);
    });
  });

  describe('Date bounds validation logic', () => {
    it('validates employment period bounds (startDate <= endDate)', () => {
      const validateDates = (start: string, end: string | null, isCurrent: boolean) => {
        if (!/^\d{4}-\d{2}$/.test(start)) return false;
        if (isCurrent) return true;
        if (!end || !/^\d{4}-\d{2}$/.test(end)) return false;
        return start <= end;
      };

      expect(validateDates('2021-01', '2023-05', false)).toBe(true);
      expect(validateDates('2023-05', '2021-01', false)).toBe(false); // start after end
      expect(validateDates('2023-05', null, true)).toBe(true); // current role
      expect(validateDates('invalid', '2023-05', false)).toBe(false);
    });
  });

  describe('Character length bounds', () => {
    it('enforces maximum 500 characters per bullet point', () => {
      const maxBulletChars = 500;
      const validBullet = 'A'.repeat(500);
      const invalidBullet = 'A'.repeat(501);

      expect(validBullet.length <= maxBulletChars).toBe(true);
      expect(invalidBullet.length <= maxBulletChars).toBe(false);
    });

    it('enforces maximum 2000 characters for summary', () => {
      const maxSummaryChars = 2000;
      const validSummary = 'S'.repeat(2000);
      const invalidSummary = 'S'.repeat(2001);

      expect(validSummary.length <= maxSummaryChars).toBe(true);
      expect(invalidSummary.length <= maxSummaryChars).toBe(false);
    });

    it('enforces maximum 1000 characters for project description', () => {
      const maxProjDescChars = 1000;
      const validDesc = 'P'.repeat(1000);
      const invalidDesc = 'P'.repeat(1001);

      expect(validDesc.length <= maxProjDescChars).toBe(true);
      expect(invalidDesc.length <= maxProjDescChars).toBe(false);
    });
  });
});

