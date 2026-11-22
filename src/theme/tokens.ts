import { Platform } from 'react-native';

export const palette = {
  // Brand colors - Kolomly Golden Amber (#ECB12D)
  primary50: '#fefce8',
  primary100: '#fef3c7',
  primary200: '#fde68a',
  primary300: '#fcd34d',
  primary400: '#fbbf24',
  primary500: '#ecb12d', // Core Brand Primary (Exact Kolomly Logo Gold)
  primary600: '#d99718', // Rich Amber Gold
  primary700: '#b87908', // Deep Warm Gold
  primary800: '#945e08',
  primary900: '#75480a',
  primary950: '#422602',

  // Warm Stone & Charcoal Neutrals (replaces cold blue slate)
  slate50: '#faf9f5',
  slate100: '#f3f1ea',
  slate200: '#e5e1d6',
  slate300: '#cfc9bb',
  slate400: '#9c9586',
  slate500: '#6f695b',
  slate600: '#4e493e',
  slate700: '#353129',
  slate800: '#23201a',
  slate900: '#171511',
  slate950: '#0e0d0a',

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
  primary: palette.primary500,
  primaryLight: palette.primary100,
  primaryPressed: palette.primary700,
  primaryMuted: palette.primary100,
  primaryText: '#18150e',
  accent: palette.primary500,

  background: palette.slate50,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfacePressed: palette.slate100,

  textPrimary: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate400,
  textInverse: palette.white,

  border: palette.slate200,
  borderFocus: palette.primary500,
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

  overlay: 'rgba(23, 21, 17, 0.4)',
  divider: palette.slate200,
  transparent: palette.transparent,
};

export const darkColors: ThemeColors = {
  mode: 'dark',
  primary: palette.primary500,
  primaryLight: 'rgba(236, 177, 45, 0.2)',
  primaryPressed: palette.primary300,
  primaryMuted: 'rgba(236, 177, 45, 0.15)',
  primaryText: '#14120a',
  accent: palette.primary400,

  background: palette.slate950,
  surface: palette.slate900,
  surfaceElevated: palette.slate800,
  surfacePressed: palette.slate800,

  textPrimary: palette.slate50,
  textSecondary: palette.slate300,
  textMuted: palette.slate400,
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
  primarySoft: 'rgba(236, 177, 45, 0.12)',
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
    shadowColor: '#171511',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#171511',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#171511',
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
