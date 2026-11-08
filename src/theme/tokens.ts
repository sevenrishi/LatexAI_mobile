import { Platform } from 'react-native';

export const palette = {
  // Brand colors
  primary50: '#eff6ff',
  primary100: '#dbeafe',
  primary200: '#bfdbfe',
  primary300: '#93c5fd',
  primary400: '#60a5fa',
  primary500: '#3b82f6',
  primary600: '#2563eb', // Core Brand Primary
  primary700: '#1d4ed8',
  primary800: '#1e40af',
  primary900: '#1e3a8a',
  primary950: '#172554',

  // Slate Neutrals
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',

  // Semantic Status Colors
  emerald500: '#10b981', // ATS High / Success
  emerald600: '#059669',
  emerald100: '#d1fae5',

  amber500: '#f59e0b', // ATS Medium / Warning
  amber600: '#d97706',
  amber100: '#fef3c7',

  rose500: '#ef4444', // ATS Low / Destructive
  rose600: '#dc2626',
  rose100: '#fee2e2',

  cyan500: '#06b6d4', // Info
  cyan100: '#cffafe',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export interface ThemeColors {
  mode: 'light' | 'dark';
  primary: string;
  primaryLight: string;
  primaryPressed: string;
  primaryMuted: string;
  primaryText: string;
  accent: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  border: string;
  borderFocus: string;
  borderSubtle: string;

  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  danger: string;
  dangerSurface: string;
  error: string;
  primarySoft: string;
  info: string;
  infoSurface: string;

  scoreHigh: string;
  scoreMedium: string;
  scoreLow: string;

  overlay: string;
  divider: string;
  transparent: string;
}

export const lightColors: ThemeColors = {
  mode: 'light',
  primary: palette.primary600,
  primaryLight: palette.primary100,
  primaryPressed: palette.primary700,
  primaryMuted: palette.primary100,
  primaryText: palette.white,
  accent: palette.cyan500,

  background: palette.white,
  surface: palette.slate50,
  surfaceElevated: palette.white,
  surfacePressed: palette.slate100,

  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  textInverse: palette.white,

  border: palette.slate200,
  borderFocus: palette.primary600,
  borderSubtle: palette.slate100,

  success: palette.emerald600,
  successSurface: palette.emerald100,
  warning: palette.amber600,
  warningSurface: palette.amber100,
  danger: palette.rose600,
  dangerSurface: palette.rose100,
  error: palette.rose600,
  primarySoft: palette.primary100,
  info: palette.cyan500,
  infoSurface: palette.cyan100,

  // ATS score gauge tiers
  scoreHigh: palette.emerald600,
  scoreMedium: palette.amber600,
  scoreLow: palette.rose600,

  overlay: 'rgba(15, 23, 42, 0.4)',
  divider: palette.slate200,
  transparent: palette.transparent,
};

export const darkColors: ThemeColors = {
  mode: 'dark',
  primary: palette.primary500,
  primaryLight: palette.primary800,
  primaryPressed: palette.primary400,
  primaryMuted: palette.primary950,
  primaryText: palette.white,
  accent: palette.cyan500,

  background: palette.slate950,
  surface: palette.slate900,
  surfaceElevated: palette.slate800,
  surfacePressed: palette.slate800,

  textPrimary: palette.slate50,
  textSecondary: palette.slate400,
  textMuted: palette.slate500,
  textInverse: palette.slate950,

  border: palette.slate800,
  borderFocus: palette.primary500,
  borderSubtle: palette.slate900,

  success: palette.emerald500,
  successSurface: 'rgba(16, 185, 129, 0.15)',
  warning: palette.amber500,
  warningSurface: 'rgba(245, 158, 11, 0.15)',
  danger: palette.rose500,
  dangerSurface: 'rgba(239, 68, 68, 0.15)',
  error: palette.rose500,
  primarySoft: palette.primary950,
  info: palette.cyan500,
  infoSurface: 'rgba(6, 182, 212, 0.15)',

  // ATS score gauge tiers
  scoreHigh: palette.emerald500,
  scoreMedium: palette.amber500,
  scoreLow: palette.rose500,

  overlay: 'rgba(0, 0, 0, 0.7)',
  divider: palette.slate800,
  transparent: palette.transparent,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

export type Spacing = typeof spacing;

export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export type Radii = typeof radii;

export const typography = {
  fontFamilies: {
    regular: Platform.select({ ios: 'System', android: 'Roboto' }) as string,
    code: Platform.select({ ios: 'Courier', android: 'monospace' }) as string,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 28,
    xxl: 32,
    xxxl: 38,
    display: 44,
  },
} as const;

export type Typography = typeof typography;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export type Shadows = typeof shadows;

export const zIndex = {
  base: 0,
  card: 1,
  header: 10,
  dropdown: 20,
  bottomSheet: 30,
  modal: 40,
  toast: 50,
} as const;

export type ZIndex = typeof zIndex;

export interface AppTheme {
  colors: ThemeColors;
  spacing: Spacing;
  radii: Radii;
  typography: Typography;
  shadows: Shadows;
  zIndex: ZIndex;
  isDark: boolean;
}

export const createTheme = (colors: ThemeColors): AppTheme => ({
  colors,
  spacing,
  radii,
  typography,
  shadows,
  zIndex,
  isDark: colors.mode === 'dark',
});
