import React, { useEffect, useState, useCallback } from 'react';
import {
  AppState,
  AppStateStatus,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Typography, Button, Icon, Card } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

export const VerifyEmailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  const email = route?.params?.email || 'your email address';
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Check verification status
  const checkEmailVerification = useCallback(async () => {
    try {
      setIsChecking(true);
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.email_confirmed_at) {
        showToast({
          type: 'success',
          title: 'Email Verified',
          message: 'Your email has been confirmed! Welcome.',
        });
        await initializeAuth();
        return;
      }
    } catch (e) {
      console.warn('[VerifyEmailScreen] Check error:', e);
    } finally {
      setIsChecking(false);
    }
  }, [initializeAuth, showToast]);

  // Foreground auto-advance listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkEmailVerification();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [checkEmailVerification]);

  // Deep-link token auto-verification
  useEffect(() => {
    const token = route?.params?.token;
    if (token && email && email !== 'your email address') {
      (async () => {
        try {
          setIsChecking(true);
          const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
          });
          if (!error) {
            showToast({
              type: 'success',
              title: 'Email Verified',
              message: 'Your email has been confirmed! Welcome.',
            });
            await initializeAuth();
          }
        } catch (e) {
          console.warn('[VerifyEmailScreen] Auto OTP verification error:', e);
        } finally {
          setIsChecking(false);
        }
      })();
    }
  }, [route?.params?.token, email, initializeAuth, showToast]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'latexai://verify-email',
        },
      });

      if (error) {
        showToast({
          type: 'error',
          title: 'Resend Failed',
          message: error.message || 'Could not resend verification email.',
        });
        return;
      }

      setCooldown(60);
      showToast({
        type: 'success',
        title: 'Email Sent',
        message: 'A fresh verification link has been sent to your inbox.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Network error while resending email.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View
      testID="verify-email-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Email Icon Envelope */}
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight + '25' },
            ]}
          >
            <Icon name="Mail" size={44} color={theme.colors.primary} />
          </View>

          <Typography variant="h2" weight="bold" align="center" style={styles.title}>
            Verify Your Email
          </Typography>

          <Typography
            variant="body"
            color="secondary"
            align="center"
            style={styles.description}
          >
            We've sent a verification link to:
          </Typography>

          {/* Email Badge Card */}
          <Card variant="flat" style={styles.emailCard}>
            <Typography
              variant="bodySm"
              weight="bold"
              color="brand"
              align="center"
              testID="verify-email-address"
            >
              {email}
            </Typography>
          </Card>

          <Typography
            variant="bodySm"
            color="muted"
            align="center"
            style={styles.instruction}
          >
            Please tap the link in the message to activate your account. You will automatically be redirected once confirmed.
          </Typography>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="I've Confirmed My Email"
              variant="primary"
              fullWidth
              loading={isChecking}
              onPress={checkEmailVerification}
              style={styles.actionBtn}
              testID="check-verification-button"
            />

            <Button
              title={cooldown > 0 ? `Resend Email (${cooldown}s)` : 'Resend Verification Email'}
              variant="outline"
              fullWidth
              loading={isResending}
              disabled={cooldown > 0}
              onPress={handleResendEmail}
              style={styles.actionBtn}
              testID="resend-email-button"
            />
          </View>
        </View>

        {/* Back to Login Link */}
        <View style={styles.footer}>
          <Pressable
            onPress={async () => {
              if (useAuthStore.getState().isAuthenticated) {
                await useAuthStore.getState().logout();
              }
              if (navigation?.navigate) {
                navigation.navigate('Login');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            testID="verify-back-to-login"
          >
            <Typography variant="bodySm" color="secondary" weight="medium">
              Back to Sign In
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
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
  description: {
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
  instruction: {
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 28,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    height: 48,
  },
  footer: {
    marginTop: 32,
    marginBottom: 8,
  },
});
