import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from './Typography';
import { Icon } from './Icon';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  clearable = false,
  onClear,
  containerStyle,
  inputStyle,
  value,
  onChangeText,
  disabled,
  placeholder,
  ...inputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error);

  const getBorderColor = (): string => {
    if (hasError) return theme.colors.danger;
    if (isFocused) return theme.colors.borderFocus;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography
          variant="label"
          weight="medium"
          color={hasError ? 'error' : 'secondary'}
          style={styles.label}
        >
          {label}
        </Typography>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getBorderColor(),
            borderRadius: theme.radii.md,
          },
          isFocused && styles.focusedInput,
        ]}
      >
        {leftIcon && <View style={styles.leftSlot}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamilies.regular,
              fontSize: theme.typography.fontSizes.md,
            },
            inputStyle,
          ]}
          accessible={true}
          accessibilityLabel={label || placeholder || 'Text input'}
          accessibilityHint={helperText}
          {...inputProps}
        />

        {clearable && Boolean(value) && (
          <Pressable
            onPress={() => {
              onChangeText?.('');
              onClear?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="X" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(prev => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={showPassword ? 'EyeOff' : 'Eye'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}

        {!isPassword && !clearable && rightIcon && (
          <View style={styles.rightSlot}>{rightIcon}</View>
        )}
      </View>

      {(hasError || helperText) && (
        <Typography
          variant="caption"
          color={hasError ? 'error' : 'muted'}
          style={styles.feedbackText}
        >
          {error || helperText}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 48, // Touch target guideline
    paddingHorizontal: 12,
  },
  focusedInput: {
    shadowOpacity: 0.1,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    minHeight: 44,
  },
  leftSlot: {
    marginRight: 8,
  },
  rightSlot: {
    marginLeft: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    marginTop: 4,
  },
});
