import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { Button, Card, Icon, TextField, Typography } from '../../components/ui';
import { useUiStore } from '../../store/uiStore';
import { api } from '../../lib/api';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ChangePasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore((state) => state.showToast);

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && passwordsMatch;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);

    try {
      await api.post('/auth/password', {
        currentPassword: currentPassword || undefined,
        newPassword,
      });

      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed successfully.',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Could not update password. Please check your credentials.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="change-password-screen"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
          testID="btn-password-back"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Typography variant="body" weight="bold" style={styles.headerTitle}>
          Change Password
        </Typography>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card variant="outlined" style={styles.cardSection}>
          <TextField
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secureTextEntry
            testID="input-current-password"
          />

          <TextField
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            testID="input-new-password"
            containerStyle={{ marginTop: 12 }}
          />

          <TextField
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry
            testID="input-confirm-password"
            containerStyle={{ marginTop: 12 }}
          />

          {/* Validation Checklist */}
          <View style={styles.rulesContainer}>
            <View style={styles.ruleItem}>
              <Icon
                name={hasMinLength ? 'Check' : 'Circle'}
                size={14}
                color={hasMinLength ? theme.colors.scoreHigh : theme.colors.textMuted}
              />
              <Typography
                variant="caption"
                customColor={hasMinLength ? theme.colors.scoreHigh : theme.colors.textMuted}
              >
                At least 8 characters long
              </Typography>
            </View>

            <View style={styles.ruleItem}>
              <Icon
                name={passwordsMatch ? 'Check' : 'Circle'}
                size={14}
                color={passwordsMatch ? theme.colors.scoreHigh : theme.colors.textMuted}
              />
              <Typography
                variant="caption"
                customColor={passwordsMatch ? theme.colors.scoreHigh : theme.colors.textMuted}
              >
                Passwords match
              </Typography>
            </View>
          </View>
        </Card>

        <Button
          title="Update Password"
          variant="primary"
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          testID="btn-submit-change-password"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  cardSection: {
    padding: 16,
    borderRadius: 12,
  },
  rulesContainer: {
    marginTop: 14,
    gap: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
