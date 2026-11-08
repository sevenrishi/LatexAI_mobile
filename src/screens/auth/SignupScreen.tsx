import React, { useState } from 'react';
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
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import {
  getPasswordStrength,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '../../utils/validation';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const validate = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setTermsError('');
    setFormError('');

    if (!fullName.trim()) {
      setNameError('Full name is required.');
      valid = false;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || 'Invalid email');
      valid = false;
    }

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

    if (!acceptTerms) {
      setTermsError('You must agree to the Terms of Service & Privacy Policy.');
      valid = false;
    }

    return valid;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);
      setFormError('');

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: 'latexai://verify-email',
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Welcome to LatexAI!',
      });

      // If session is present directly (email auto-confirm enabled in dev)
      if (data?.session) {
        await initializeAuth();
      } else {
        // Confirmation email required
        navigation.navigate('VerifyEmail', { email: email.trim() });
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      testID="signup-screen"
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

        {/* Title Header */}
        <View style={styles.header}>
          <Typography variant="h1" weight="bold">
            Create Account
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            Join professionals building LaTeX ATS-optimized resumes.
          </Typography>
        </View>

        {/* Form Error Banner */}
        {Boolean(formError) && (
          <Card variant="flat" style={[styles.errorCard, { backgroundColor: theme.colors.danger + '15' }]}>
            <View style={styles.errorRow}>
              <Icon name="AlertCircle" size={18} color={theme.colors.danger} />
              <Typography variant="bodySm" color="error" style={styles.errorText}>
                {formError}
              </Typography>
            </View>
          </Card>
        )}

        {/* Input Fields */}
        <View style={styles.form}>
          <TextField
            label="Full Name"
            placeholder="Jane Doe"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (nameError) setNameError('');
            }}
            error={nameError}
            autoCapitalize="words"
            leftIcon={<Icon name="User" size={18} color={theme.colors.textMuted} />}
            testID="signup-name-input"
          />

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
            testID="signup-email-input"
          />

          <TextField
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
            isPassword
            leftIcon={<Icon name="Lock" size={18} color={theme.colors.textMuted} />}
            testID="signup-password-input"
          />

          {/* Password Strength Indicator */}
          {Boolean(password) && (
            <View style={styles.strengthContainer} testID="password-strength-container">
              <View style={styles.strengthHeader}>
                <Typography variant="caption" color="secondary">
                  Password Strength:
                </Typography>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ color: strength.color }}
                  testID="password-strength-label"
                >
                  {strength.label}
                </Typography>
              </View>

              {/* Strength Meter Bar */}
              <View style={[styles.strengthTrack, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: strength.color,
                    },
                  ]}
                  testID="password-strength-meter"
                />
              </View>

              <Typography variant="caption" color="muted" style={styles.strengthFeedback}>
                {strength.feedback}
              </Typography>
            </View>
          )}

          <TextField
            label="Confirm Password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmError) setConfirmError('');
            }}
            error={confirmError}
            isPassword
            leftIcon={<Icon name="Lock" size={18} color={theme.colors.textMuted} />}
            testID="signup-confirm-password-input"
          />

          {/* Terms and Conditions Checkbox */}
          <Pressable
            style={styles.termsRow}
            onPress={() => {
              setAcceptTerms(!acceptTerms);
              if (termsError) setTermsError('');
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptTerms }}
            accessibilityLabel="Accept Terms and Conditions"
            testID="terms-checkbox"
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsError ? theme.colors.danger : theme.colors.borderFocus,
                  backgroundColor: acceptTerms ? theme.colors.primary : 'transparent',
                },
              ]}
            >
              {acceptTerms && <Icon name="Check" size={14} color="#FFFFFF" />}
            </View>
            <Typography variant="bodySm" color="secondary" style={styles.termsText}>
              I agree to the Terms of Service & Privacy Policy
            </Typography>
          </Pressable>

          {Boolean(termsError) && (
            <Typography variant="caption" color="error" style={styles.termsErrorText}>
              {termsError}
            </Typography>
          )}

          <Button
            title="Create Account"
            variant="primary"
            fullWidth
            loading={isLoading}
            onPress={handleSignup}
            style={styles.submitBtn}
            testID="signup-submit-button"
          />
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Typography variant="bodySm" color="secondary">
            Already have an account?{' '}
          </Typography>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Typography variant="bodySm" color="brand" weight="bold">
              Sign In
            </Typography>
          </Pressable>
        </View>
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
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 6,
  },
  errorCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  termsText: {
    flex: 1,
  },
  termsErrorText: {
    marginBottom: 8,
  },
  submitBtn: {
    marginTop: 18,
    height: 48,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
});
