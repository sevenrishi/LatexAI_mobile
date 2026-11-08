import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'code'
  | 'overline';

export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'inverse'
  | 'brand'
  | 'error'
  | 'success'
  | 'warning';

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  customColor?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  customColor,
  weight,
  align,
  style,
  children,
  allowFontScaling = true,
  ...props
}) => {
  const { theme } = useTheme();

  const resolveColor = (): string => {
    if (customColor) return customColor;
    switch (color) {
      case 'secondary':
        return theme.colors.textSecondary;
      case 'muted':
        return theme.colors.textMuted;
      case 'inverse':
        return theme.colors.textInverse;
      case 'brand':
        return theme.colors.primary;
      case 'error':
        return theme.colors.danger;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'primary':
      default:
        return theme.colors.textPrimary;
    }
  };

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: theme.typography.fontSizes.xxxl,
          lineHeight: theme.typography.lineHeights.xxxl,
          fontWeight: theme.typography.fontWeights.bold,
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'h2':
        return {
          fontSize: theme.typography.fontSizes.xxl,
          lineHeight: theme.typography.lineHeights.xxl,
          fontWeight: theme.typography.fontWeights.bold,
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'h3':
        return {
          fontSize: theme.typography.fontSizes.xl,
          lineHeight: theme.typography.lineHeights.xl,
          fontWeight: theme.typography.fontWeights.semibold,
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'bodySm':
        return {
          fontSize: theme.typography.fontSizes.sm,
          lineHeight: theme.typography.lineHeights.sm,
          fontWeight: theme.typography.fontWeights.regular,
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'caption':
        return {
          fontSize: theme.typography.fontSizes.xs,
          lineHeight: theme.typography.lineHeights.xs,
          fontWeight: theme.typography.fontWeights.regular,
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'label':
        return {
          fontSize: theme.typography.fontSizes.sm,
          lineHeight: theme.typography.lineHeights.sm,
          fontWeight: theme.typography.fontWeights.medium,
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'code':
        return {
          fontSize: theme.typography.fontSizes.sm,
          lineHeight: theme.typography.lineHeights.sm,
          fontWeight: theme.typography.fontWeights.regular,
          fontFamily: theme.typography.fontFamilies.code,
        };
      case 'overline':
        return {
          fontSize: theme.typography.fontSizes.xs,
          lineHeight: theme.typography.lineHeights.xs,
          fontWeight: theme.typography.fontWeights.bold,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          fontFamily: theme.typography.fontFamilies.regular,
        };
      case 'body':
      default:
        return {
          fontSize: theme.typography.fontSizes.md,
          lineHeight: theme.typography.lineHeights.md,
          fontWeight: theme.typography.fontWeights.regular,
          fontFamily: theme.typography.fontFamilies.regular,
        };
    }
  };

  const fontWeightOverride = weight
    ? { fontWeight: theme.typography.fontWeights[weight] }
    : {};

  const alignOverride = align ? { textAlign: align } : {};

  const isHeader = variant === 'h1' || variant === 'h2' || variant === 'h3';

  return (
    <RNText
      style={[
        getVariantStyle(),
        { color: resolveColor() },
        fontWeightOverride,
        alignOverride,
        style,
      ]}
      allowFontScaling={allowFontScaling}
      accessibilityRole={isHeader ? 'header' : 'text'}
      {...props}
    >
      {children}
    </RNText>
  );
};
