import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Typography, Button, Icon } from '../ui';
import { useAuthStore } from '../../store/authStore';

export const BiometricLockModal: React.FC = () => {
  const { theme } = useTheme();
  const {
    isAuthenticated,
    isSplashFinished,
    isBiometricsLocked,
    unlockWithBiometrics,
    logout,
  } = useAuthStore();

  const [isUnlocking, setIsUnlocking] = useState(false);

  const isVisible = isAuthenticated && isSplashFinished && isBiometricsLocked;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlockWithBiometrics();
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      testID="biometric-lock-modal"
      statusBarTranslucent
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
              ...theme.shadows.lg,
            },
          ]}
          accessible={true}
          accessibilityRole="alertdialog"
          accessibilityLabel="App is Locked"
        >
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight + '20' },
            ]}
          >
            <Icon name="Lock" size={32} color={theme.colors.primary} />
          </View>

          <Typography variant="h2" weight="bold" style={styles.title}>
            LatexAI Locked
          </Typography>

          <Typography
            variant="body"
            color="secondary"
            style={styles.message}
          >
            Biometric authentication is required to access your account and resumes.
          </Typography>

          <Button
            title="Unlock with Biometrics"
            variant="primary"
            fullWidth
            loading={isUnlocking}
            onPress={handleUnlock}
            testID="biometric-unlock-button"
            style={styles.unlockBtn}
          />

          <Button
            title="Log Out"
            variant="ghost"
            fullWidth
            onPress={handleSignOut}
            testID="biometric-logout-button"
            style={styles.logoutBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  unlockBtn: {
    marginBottom: 12,
  },
  logoutBtn: {
    minHeight: 44,
  },
});
