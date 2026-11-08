import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { Typography, Button, Icon } from '../ui';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

export const SessionExpiredModal: React.FC = () => {
  const { theme } = useTheme();
  const isVisible = useUiStore(state => state.isSessionExpiredModalVisible);
  const setVisible = useUiStore(state => state.setSessionExpiredModalVisible);
  const logout = useAuthStore(state => state.logout);

  const handleSignInAgain = async () => {
    setVisible(false);
    await logout();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleSignInAgain}
      statusBarTranslucent
      testID="session-expired-modal"
    >
      <View style={styles.backdrop}>
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
          accessibilityLabel="Session Expired"
        >
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight + '20' },
            ]}
          >
            <Icon name="Lock" size={28} color={theme.colors.primary} />
          </View>

          <Typography variant="h3" weight="bold" style={styles.title}>
            Session Expired
          </Typography>

          <Typography
            variant="body"
            color="secondary"
            style={styles.message}
          >
            Your session has expired. Please sign in again to continue crafting and optimizing your resumes.
          </Typography>

          <Button
            title="Sign In Again"
            variant="primary"
            fullWidth
            onPress={handleSignInAgain}
            style={styles.button}
            testID="sign-in-again-button"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: 4,
  },
});
