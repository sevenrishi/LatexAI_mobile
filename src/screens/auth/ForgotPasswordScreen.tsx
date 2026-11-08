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
import { validateEmail } from '../../utils/validation';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async () => {
    setEmailError('');
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || 'Invalid email');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'latexai://auth/reset-password',
      });

      if (error) {
        showToast({
          type: 'error',
          title: 'Request Failed',
          message: error.message || 'Could not send reset email.',
        });
        return;
      }

      setIsSubmitted(true);
      setCooldown(60);
      showToast({
        type: 'success',
        title: 'Reset Link Sent',
        message: 'Check your email inbox for the reset link.',
      });
    } catch (err: any) {
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
      testID="forgot-password-screen"
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

        {isSubmitted ? (
          /* Submission Feedback State */
          <View style={styles.feedbackContainer} testID="forgot-password-success-view">
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: theme.colors.success + '20' },
              ]}
            >
              <Icon name="CheckCircle" size={44} color={theme.colors.success} />
            </View>

            <Typography variant="h2" weight="bold" align="center" style={styles.title}>
              Reset Link Sent
            </Typography>

            <Typography
              variant="body"
              color="secondary"
              align="center"
              style={styles.feedbackMessage}
            >
              We have sent password reset instructions to:
            </Typography>

            <Card variant="flat" style={styles.emailCard}>
              <Typography
                variant="bodySm"
                weight="bold"
                color="brand"
                align="center"
              >
                {email}
              </Typography>
            </Card>

            <Typography
              variant="caption"
              color="muted"
              align="center"
              style={styles.instructions}
            >
              If an account exists with this email, you will receive instructions in your inbox shortly. Please check your spam folder as well.
            </Typography>

            <View style={styles.actions}>
              <Button
                title={cooldown > 0 ? `Resend Instructions (${cooldown}s)` : 'Resend Instructions'}
                variant="outline"
                fullWidth
                disabled={cooldown > 0}
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.submitBtn}
                testID="resend-reset-button"
              />

              <Button
                title="Return to Sign In"
                variant="primary"
                fullWidth
                onPress={() => navigation.navigate('Login')}
                style={styles.submitBtn}
              />
            </View>
          </View>
        ) : (
          /* Form Input State */
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Typography variant="h1" weight="bold">
                Reset Password
              </Typography>
              <Typography
                variant="body"
                color="secondary"
                style={styles.subtitle}
              >
                Enter your account email and we'll send you a link to reset your password.
              </Typography>
            </View>

            <View style={styles.form}>
              <TextField
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                clearable
                leftIcon={<Icon name="Mail" size={18} color={theme.colors.textMuted} />}
                testID="forgot-password-email-input"
              />

              <Button
                title="Send Reset Instructions"
                variant="primary"
                fullWidth
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.submitBtn}
                testID="forgot-password-submit-button"
              />
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
              >
                <Typography variant="bodySm" color="brand" weight="medium">
                  Remember your password? Sign In
                </Typography>
              </Pressable>
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
  form: {
    width: '100%',
  },
  submitBtn: {
    marginTop: 20,
    height: 48,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  feedbackContainer: {
    alignItems: 'center',
    marginTop: 20,
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
  feedbackMessage: {
    marginBottom: 12,
  },
  emailCard: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  instructions: {
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
});
