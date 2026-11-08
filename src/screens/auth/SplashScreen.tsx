import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography, Button, Icon } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

export interface SplashScreenProps {
  navigation?: any;
  minDurationMs?: number;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  navigation,
  minDurationMs = 1200,
  onFinish,
}) => {
  const { theme } = useTheme();
  const {
    isAuthenticated,
    isOnboarded,
    isLoading,
    isBiometricsLocked,
    unlockWithBiometrics,
  } = useAuthStore();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.92));
  const [minTimerElapsed, setMinTimerElapsed] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Enforce minimum display duration so screen does not flicker
    const timer = setTimeout(() => {
      setMinTimerElapsed(true);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, minDurationMs]);

  // Handle navigation after session check and minimum duration
  useEffect(() => {
    if (!minTimerElapsed || isLoading) return;

    if (isBiometricsLocked) {
      // Prompt biometrics once ready
      handleUnlock();
      return;
    }

    const setSplashFinished = useAuthStore.getState().setSplashFinished;
    setSplashFinished(true);

    if (onFinish) {
      onFinish();
    } else if (navigation?.replace) {
      if (!isAuthenticated) {
        navigation.replace('Welcome');
      } else if (!isOnboarded) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('AppTabs');
      }
    }
  }, [minTimerElapsed, isLoading, isBiometricsLocked, isAuthenticated, isOnboarded, onFinish, navigation]);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      const unlocked = await unlockWithBiometrics();
      if (unlocked) {
        useAuthStore.getState().setSplashFinished(true);
        if (onFinish) {
          onFinish();
        } else if (navigation?.replace) {
          if (!isOnboarded) {
            navigation.replace('Onboarding');
          } else {
            navigation.replace('AppTabs');
          }
        }
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <View
      testID="splash-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: theme.colors.primaryLight + '25',
              borderColor: theme.colors.borderFocus,
            },
          ]}
        >
          <Icon name="FileText" size={54} color={theme.colors.primary} />
        </View>

        <Typography variant="h1" weight="bold" color="brand" style={styles.title}>
          LatexAI
        </Typography>

        <Typography
          variant="body"
          color="secondary"
          style={styles.subtitle}
        >
          AI-Powered ATS LaTeX Resumes
        </Typography>

        {isBiometricsLocked && minTimerElapsed ? (
          <View style={styles.lockContainer}>
            <View style={styles.lockIconRow}>
              <Icon name="Lock" size={20} color={theme.colors.textSecondary} />
              <Typography variant="bodySm" color="secondary" style={styles.lockText}>
                App is Locked
              </Typography>
            </View>
            <Button
              title="Unlock with Biometrics"
              variant="primary"
              loading={isUnlocking}
              onPress={handleUnlock}
              style={styles.unlockButton}
            />
          </View>
        ) : (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              testID="splash-loader"
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: 40,
    height: 36,
    justifyContent: 'center',
  },
  lockContainer: {
    marginTop: 36,
    width: '100%',
    alignItems: 'center',
  },
  lockIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockText: {
    marginLeft: 8,
  },
  unlockButton: {
    width: '100%',
  },
});
