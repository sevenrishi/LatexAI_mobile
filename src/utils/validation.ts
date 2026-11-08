export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  feedback: string;
}

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

export const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  return EMAIL_REGEX.test(email.trim());
};

export const isValidUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  return URL_REGEX.test(url.trim());
};

export const validateEmail = (
  email: string
): { isValid: boolean; error?: string } => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const cleanEmail = email.trim();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true };
};

export const validateUrl = (
  url: string
): { isValid: boolean; error?: string } => {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required.' };
  }
  if (!isValidUrl(url.trim())) {
    return { isValid: false, error: 'Please enter a valid URL.' };
  }
  return { isValid: true };
};

export const getPasswordStrength = (
  password: string
): PasswordStrengthResult => {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 8;
  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(pwd);

  let criteriaMet = 0;
  if (hasMinLength) criteriaMet++;
  if (hasUpperCase && hasLowerCase) criteriaMet++;
  if (hasNumber) criteriaMet++;
  if (hasSpecialChar) criteriaMet++;

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let color = '#ef4444'; // Red
  let feedback = 'Use at least 8 characters with letters, numbers & symbols.';

  if (criteriaMet <= 1) {
    label = 'Weak';
    color = '#ef4444';
    feedback = 'Too weak. Add more variety of characters.';
  } else if (criteriaMet === 2) {
    label = 'Fair';
    color = '#f59e0b'; // Amber
    feedback = 'Fair. Add numbers and special characters.';
  } else if (criteriaMet === 3) {
    label = 'Good';
    color = '#3b82f6'; // Blue
    feedback = 'Good password. Add symbols for maximum security.';
  } else {
    label = 'Strong';
    color = '#10b981'; // Green
    feedback = 'Strong password!';
  }

  return {
    score: criteriaMet,
    label,
    color,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
    feedback,
  };
};

export const validatePassword = (
  password: string
): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }
  return { isValid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match.' };
  }
  return { isValid: true };
};
