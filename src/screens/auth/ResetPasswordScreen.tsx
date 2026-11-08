import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Typography, TextField, Button, Icon, Card } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../store/uiStore';
import {
  getPasswordStrength,
  validateConfirmPassword,
  validatePassword,
} from '../../utils/validation';

export const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);

  const recoveryToken = route?.params?.token || route?.params?.access_token;
  const refreshToken = route?.params?.refresh_token;
  const isRecoveryMode = Boolean(recoveryToken || route?.params?.type === 'recovery');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // If recovery parameters are provided via deep-link, apply them to supabase session
  useEffect(() => {
    const applyRecoveryParams = async () => {
      if (recoveryToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: recoveryToken,
            refresh_token: refreshToken,
          });
        } catch (e) {
          console.warn('[ResetPasswordScreen] setSession error:', e);
        }
      }
    };
    applyRecoveryParams();
  }, [recoveryToken, refreshToken]);

  const strength = getPasswordStrength(password);

  const validate = (): boolean => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');
    setFormError('');

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.isValid) {
      setPasswordError(pwdCheck.error || 'Invalid password');
      valid = false;
    }

    const confirmCheck = validateConfirmPassword(password, confirmPassword);
    if (!confirmCheck.isValid) {
      setConfirmError(confirmCheck.error || 'Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);
      setFormError('');

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setFormError(error.message || 'Could not update password.');
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: error.message || 'Could not update password.',
        });
        return;
      }

      setIsSuccess(true);
      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed successfully.',
      });
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      testID="reset-password-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        {isSuccess ? (
          /* Success Screen */
          <View style={styles.feedbackContainer} testID="reset-password-success-view">
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: theme.colors.success + '20' },
              ]}
            >
              <Icon name="CheckCircle" size={44} color={theme.colors.success} />
            </View>

            <Typography variant="h2" weight="bold" align="center" style={styles.title}>
              Password Updated
            </Typography>

            <Typography
              variant="body"
              color="secondary"
              align="center"
              style={styles.instructions}
            >
              Your password has been reset successfully. You can now use your new password to sign in.
            </Typography>

            <Button
              title="Sign In to LatexAI"
              variant="primary"
              fullWidth
              onPress={() => navigation.navigate('Login')}
              style={styles.submitBtn}
              testID="reset-success-signin-button"
            />
          </View>
        ) : (
          /* Reset Password Form */
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Typography variant="h1" weight="bold">
                Create New Password
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={styles.subtitle}
              >
                Set a strong, unique password for your account.
              </Typography>
            </View>

            {isRecoveryMode && (
              <Card
                variant="flat"
                style={[styles.bannerCard, { backgroundColor: theme.colors.success + '15' }]}
                testID="recovery-mode-banner"
              >
                <View style={styles.bannerRow}>
                  <Icon name="ShieldCheck" size={18} color={theme.colors.success} />
                  <Typography variant="bodySm" color="success" style={styles.bannerText}>
                    Recovery session active. Enter your new password below.
                  </Typography>
                </View>
              </Card>
            )}

            {Boolean(formError) && (
              <Card
                variant="flat"
                style={[styles.bannerCard, { backgroundColor: theme.colors.danger + '15' }]}
                testID="reset-password-error-banner"
              >
                <View style={styles.bannerRow}>
                  <Icon name="AlertCircle" size={18} color={theme.colors.danger} />
                  <Typography variant="bodySm" color="error" style={styles.bannerText}>
                    {formError}
                  </Typography>
                </View>
              </Card>
            )}

            <View style={styles.form}>
              <TextField
                label="New Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                error={passwordError}
                isPassword
                leftIcon={<Icon name="Lock" size={18} color={theme.colors.textMuted} />}
                testID="reset-password-input"
              />

              {/* Password Strength Indicator */}
              {Boolean(password) && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthHeader}>
                    <Typography variant="caption" color="secondary">
                      Strength:
                    </Typography>
                    <Typography
                      variant="caption"
                      weight="bold"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </Typography>
                  </View>

                  <View
                    style={[
                      styles.strengthTrack,
                      { backgroundColor: theme.colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(strength.score / 4) * 100}%`,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Typography
                    variant="caption"
                    color="muted"
                    style={styles.strengthFeedback}
                  >
                    {strength.feedback}
                  </Typography>
                </View>
              )}

              <TextField
                label="Confirm New Password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmError) setConfirmError('');
                }}
                error={confirmError}
                isPassword
                leftIcon={<Icon name="Lock" size={18} color={theme.colors.textMuted} />}
                testID="reset-confirm-password-input"
              />

              <Button
                title="Update Password"
                variant="primary"
                fullWidth
                loading={isLoading}
                onPress={handleResetPassword}
                style={styles.submitBtn}
                testID="reset-password-submit-button"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  navBar: {
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 6,
  },
  formContainer: {
    width: '100%',
  },
  bannerCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    marginLeft: 8,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  strengthContainer: {
    marginVertical: 4,
    marginBottom: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthFeedback: {
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 20,
    height: 48,
  },
  feedbackContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  instructions: {
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 28,
  },
});
