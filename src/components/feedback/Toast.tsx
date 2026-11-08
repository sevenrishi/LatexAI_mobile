import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { Icon, IconName } from '../ui/Icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastProps {
  toast: ToastItem | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleDismiss = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [opacity, translateY, onDismiss]);

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration || 3500);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast, translateY, opacity, handleDismiss]);

  if (!toast) return null;

  const getToastConfig = (): {
    bg: string;
    border: string;
    icon: IconName;
    iconColor: string;
  } => {
    switch (toast.type) {
      case 'success':
        return {
          bg: theme.colors.surfaceElevated,
          border: theme.colors.success,
          icon: 'CheckCircle',
          iconColor: theme.colors.success,
        };
      case 'error':
        return {
          bg: theme.colors.surfaceElevated,
          border: theme.colors.danger,
          icon: 'AlertCircle',
          iconColor: theme.colors.danger,
        };
      case 'warning':
        return {
          bg: theme.colors.surfaceElevated,
          border: theme.colors.warning,
          icon: 'AlertTriangle',
          iconColor: theme.colors.warning,
        };
      case 'info':
      default:
        return {
          bg: theme.colors.surfaceElevated,
          border: theme.colors.info,
          icon: 'Info',
          iconColor: theme.colors.info,
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          top: Math.max(insets.top, 12) + 8,
          transform: [{ translateY }],
          opacity,
          zIndex: theme.zIndex.toast,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`${toast.type} notification: ${toast.title ? toast.title + ' - ' : ''}${toast.message}`}
    >
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: config.bg,
            borderLeftColor: config.border,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
            ...theme.shadows.md,
          },
        ]}
      >
        <Icon name={config.icon} size={22} color={config.iconColor} />

        <View style={styles.textContainer}>
          {toast.title && (
            <Typography variant="bodySm" weight="semibold" style={styles.title}>
              {toast.title}
            </Typography>
          )}
          <Typography variant="caption" color="secondary">
            {toast.message}
          </Typography>
        </View>

        <Pressable
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="X" size={16} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 480,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    marginBottom: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
