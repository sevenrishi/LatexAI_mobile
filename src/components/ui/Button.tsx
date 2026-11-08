import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from './Typography';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  onPress,
  ...pressableProps
}) => {
  const { theme } = useTheme();

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let backgroundColor: string = theme.colors.primary;
    let borderColor: string = theme.colors.transparent;
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        backgroundColor = pressed
          ? theme.colors.primaryPressed
          : theme.colors.primary;
        break;
      case 'secondary':
        backgroundColor = pressed
          ? theme.colors.surfacePressed
          : theme.colors.surface;
        borderColor = theme.colors.border;
        borderWidth = 1;
        break;
      case 'outline':
        backgroundColor = pressed
          ? theme.colors.primaryMuted
          : theme.colors.transparent;
        borderColor = theme.colors.primary;
        borderWidth = 1.5;
        break;
      case 'ghost':
        backgroundColor = pressed
          ? theme.colors.surfacePressed
          : theme.colors.transparent;
        break;
      case 'destructive':
        backgroundColor = pressed
          ? theme.colors.danger
          : theme.colors.danger;
        break;
    }

    let minHeight = 48;
    let paddingHorizontal: number = theme.spacing.lg;
    let paddingVertical: number = theme.spacing.sm;

    if (size === 'sm') {
      minHeight = 44; // WCAG 44x44 minimum touch target
      paddingHorizontal = theme.spacing.md;
      paddingVertical = theme.spacing.xs;
    } else if (size === 'lg') {
      minHeight = 56;
      paddingHorizontal = theme.spacing.xl;
      paddingVertical = theme.spacing.md;
    }

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      minHeight,
      minWidth: 44, // WCAG minimum touch target
      paddingHorizontal,
      paddingVertical,
      borderRadius: theme.radii.lg,
      opacity: disabled || loading ? 0.6 : 1,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return theme.colors.primaryText;
      case 'secondary':
        return theme.colors.textPrimary;
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
    }
  };

  const textColor = getTextColor();

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.buttonBase,
        getContainerStyle(pressed),
        style,
      ]}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor}
          style={styles.spinner}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
          <Typography
            variant={size === 'sm' ? 'bodySm' : size === 'lg' ? 'h3' : 'body'}
            weight="semibold"
            customColor={textColor}
            style={[styles.text, textStyle]}
          >
            {title}
          </Typography>
          {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  spinner: {
    paddingVertical: 2,
  },
  text: {
    textAlign: 'center',
  },
});
