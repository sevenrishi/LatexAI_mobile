import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import {
  createTheme,
  darkColors,
  lightColors,
  spacing,
  radii,
  ThemeProvider,
  useTheme,
} from '../src/theme';

describe('Theme Token System (MB-0.05)', () => {
  it('correctly constructs light theme tokens', () => {
    const theme = createTheme(lightColors);
    expect(theme.isDark).toBe(false);
    expect(theme.colors.primary).toBe(lightColors.primary);
    expect(theme.colors.background).toBe(lightColors.background);
    expect(theme.spacing).toBe(spacing);
    expect(theme.radii).toBe(radii);
    expect(theme.colors.scoreHigh).toBe(lightColors.scoreHigh);
  });

  it('correctly constructs dark theme tokens', () => {
    const theme = createTheme(darkColors);
    expect(theme.isDark).toBe(true);
    expect(theme.colors.primary).toBe(darkColors.primary);
    expect(theme.colors.background).toBe(darkColors.background);
  });

  it('provides theme context and toggles mode', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialMode="light">{children}</ThemeProvider>
    );

    const { result } = await renderHook(() => useTheme(), { wrapper });

    expect(result.current.mode).toBe('light');
    expect(result.current.isDark).toBe(false);

    await act(async () => {
      result.current.setThemeMode('dark');
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.theme.colors.mode).toBe('dark');
  });
});
