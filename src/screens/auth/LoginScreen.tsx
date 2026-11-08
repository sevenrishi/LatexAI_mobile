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
import { validateEmail } from '../../utils/validation';
import { env } from '../../config/env';

export const LoginScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  const initialEmail = route?.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dev demo credentials
  const isDev = __DEV__ || env.appEnv !== 'production';

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || 'Invalid email');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    if (!loginEmail && !validate()) return;

    try {
      setIsLoading(true);
      setFormError('');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim(),
        password: targetPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setFormError('Invalid email or password. Please try again.');
        } else if (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('unverified')
        ) {
          setFormError('Please verify your email address before signing in.');
          showToast({
            type: 'warning',
            title: 'Email Unverified',
            message: 'Please check your inbox or resend verification link.',
          });
          navigation.navigate('VerifyEmail', { email: targetEmail });
        } else {
          setFormError(error.message);
        }
        return;
      }

      if (data?.session) {
        showToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Signed in successfully.',
        });
        await initializeAuth();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      setFormError('');
      const success = await useAuthStore.getState().loginDemoUser();
      if (success) {
        showToast({
          type: 'success',
          title: 'Welcome Back',
          message: 'Signed in as Demo User.',
        });
      } else {
        setFormError('Demo login failed. Please ensure the backend server is running.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      testID="login-screen"
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
            Welcome Back
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            Sign in to access your resumes and ATS match reports.
          </Typography>
        </View>

        {/* Form Error Banner */}
        {Boolean(formError) && (
          <Card variant="flat" style={[styles.errorCard, { backgroundColor: theme.colors.danger + '15' }]}>
            <View style={styles.errorRow}>
              <Icon name="AlertCircle" size={18} color={theme.colors.danger} />
              <Typography
                variant="bodySm"
                color="error"
                style={styles.errorText}
              >
                {formError}
              </Typography>
            </View>
          </Card>
        )}

        {/* Form Inputs */}
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
            testID="login-email-input"
          />

          <TextField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            error={passwordError}
            isPassword
            leftIcon={<Icon name="Lock" size={18} color={theme.colors.textMuted} />}
            testID="login-password-input"
          />

          <View style={styles.forgotPasswordContainer}>
            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              testID="forgot-password-link"
            >
              <Typography variant="bodySm" color="brand" weight="medium">
                Forgot password?
              </Typography>
            </Pressable>
          </View>

          <Button
            title="Sign In"
            variant="primary"
            fullWidth
            loading={isLoading}
            onPress={() => handleLogin()}
            style={styles.submitBtn}
            testID="login-submit-button"
          />

          {/* Dev Demo Login Shortcut */}
          {isDev && (
            <Button
              title="Dev: Quick Demo Sign In"
              variant="secondary"
              fullWidth
              loading={isLoading}
              onPress={handleDemoLogin}
              leftIcon={<Icon name="Sparkles" size={18} color={theme.colors.primary} />}
              style={styles.demoBtn}
              testID="demo-login-button"
            />
          )}
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Typography variant="bodySm" color="secondary">
            Don't have an account?{' '}
          </Typography>
          <Pressable
            onPress={() => navigation.navigate('Signup')}
            accessibilityRole="button"
            accessibilityLabel="Sign up"
          >
            <Typography variant="bodySm" color="brand" weight="bold">
              Sign Up
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 20,
  },
  submitBtn: {
    height: 48,
  },
  demoBtn: {
    marginTop: 12,
    height: 48,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
});
