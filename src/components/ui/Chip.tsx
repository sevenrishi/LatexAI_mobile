import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from './Typography';
import { Icon } from './Icon';

export type ChipVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'filter'
  | 'choice';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  removable?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'default',
  selected = false,
  removable = false,
  onPress,
  onRemove,
  leftIcon,
  style,
  testID,
}) => {
  const { theme } = useTheme();

  const getChipColors = () => {
    if (selected) {
      return {
        bg: theme.colors.primary,
        border: theme.colors.primary,
        text: theme.colors.primaryText,
      };
    }

    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primaryMuted,
          border: theme.colors.primary,
          text: theme.colors.primary,
        };
      case 'success':
        return {
          bg: theme.colors.successSurface,
          border: theme.colors.success,
          text: theme.colors.success,
        };
      case 'warning':
        return {
          bg: theme.colors.warningSurface,
          border: theme.colors.warning,
          text: theme.colors.warning,
        };
      case 'danger':
        return {
          bg: theme.colors.dangerSurface,
          border: theme.colors.danger,
          text: theme.colors.danger,
        };
      case 'info':
        return {
          bg: theme.colors.infoSurface,
          border: theme.colors.info,
          text: theme.colors.info,
        };
      case 'filter':
        return {
          bg: theme.colors.surfaceElevated,
          border: theme.colors.border,
          text: theme.colors.textSecondary,
        };
      case 'choice':
        return {
          bg: theme.colors.surface,
          border: theme.colors.border,
          text: theme.colors.textPrimary,
        };
      case 'default':
      default:
        return {
          bg: theme.colors.surface,
          border: theme.colors.border,
          text: theme.colors.textPrimary,
        };
    }
  };

  const colors = getChipColors();

  const content = (
    <View
      style={[
        styles.chipBase,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderRadius: theme.radii.full,
        },
        style,
      ]}
    >
      {leftIcon && <View style={styles.leftSlot}>{leftIcon}</View>}
      <Typography
        variant="caption"
        weight="medium"
        customColor={colors.text}
        style={styles.label}
      >
        {label}
      </Typography>
      {removable && (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
          style={styles.removeButton}
        >
          <Icon name="X" size={14} color={colors.text} />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessible={true}
        accessibilityRole="checkbox"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={styles.pressableContainer}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={label}
      style={styles.pressableContainer}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    minHeight: 44, // 44pt touch boundary alignment
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginVertical: 4,
  },
  chipBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  leftSlot: {
    marginRight: 6,
  },
  label: {
    paddingVertical: 1,
  },
  removeButton: {
    marginLeft: 6,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
