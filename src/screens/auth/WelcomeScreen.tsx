import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Typography, Button, Icon, Card } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { useUiStore } from '../../store/uiStore';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    const setLoading = provider === 'google' ? setIsGoogleLoading : setIsGithubLoading;
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'latexai://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        showToast({
          type: 'error',
          title: 'Sign In Failed',
          message: error.message || `Unable to initialize ${provider} login.`,
        });
        return;
      }

      if (data?.url) {
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          showToast({
            type: 'error',
            title: 'Browser Error',
            message: 'Could not open authentication URL.',
          });
        }
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Error',
        message: err.message || 'An unexpected error occurred during sign in.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      testID="welcome-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Brand Badge */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight + '25' },
            ]}
          >
            <Icon name="FileText" size={32} color={theme.colors.primary} />
          </View>
          <Typography variant="overline" color="brand" weight="bold">
            LATEX RESUME PLATFORM
          </Typography>
          <Typography
            variant="h1"
            weight="bold"
            align="center"
            style={styles.heroTitle}
          >
            Craft Resumes That Win Interviews
          </Typography>
          <Typography
            variant="body"
            color="secondary"
            align="center"
            style={styles.heroSubtitle}
          >
            Sandboxed LaTeX compilation & targeted ATS score optimization designed for top professionals.
          </Typography>
        </View>

        {/* Value Proposition Pills */}
        <View style={styles.features}>
          <Card variant="flat" style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View
                style={[
                  styles.featureIconBadge,
                  { backgroundColor: theme.colors.success + '20' },
                ]}
              >
                <Icon name="CheckCircle" size={18} color={theme.colors.success} />
              </View>
              <View style={styles.featureTextWrapper}>
                <Typography variant="bodySm" weight="semibold">
                  100% Compilable LaTeX
                </Typography>
                <Typography variant="caption" color="secondary">
                  Error-free typesetting and pixel-perfect PDFs
                </Typography>
              </View>
            </View>
          </Card>

          <Card variant="flat" style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View
                style={[
                  styles.featureIconBadge,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="Sparkles" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.featureTextWrapper}>
                <Typography variant="bodySm" weight="semibold">
                  Real-Time ATS Score Match
                </Typography>
                <Typography variant="caption" color="secondary">
                  Tailored to match specific job descriptions
                </Typography>
              </View>
            </View>
          </Card>
        </View>

        {/* Authentication Action Controls */}
        <View style={styles.actionGroup}>
          <Button
            title="Continue with Google"
            variant="outline"
            fullWidth
            loading={isGoogleLoading}
            disabled={isGithubLoading}
            leftIcon={<Icon name="Globe" size={20} color={theme.colors.textPrimary} />}
            onPress={() => handleOAuthSignIn('google')}
            style={styles.socialBtn}
            testID="google-login-button"
          />

          <Button
            title="Continue with GitHub"
            variant="outline"
            fullWidth
            loading={isGithubLoading}
            disabled={isGoogleLoading}
            leftIcon={<Icon name="Code" size={20} color={theme.colors.textPrimary} />}
            onPress={() => handleOAuthSignIn('github')}
            style={styles.socialBtn}
            testID="github-login-button"
          />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Typography variant="caption" color="muted" style={styles.dividerText}>
              OR
            </Typography>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <Button
            title="Sign In with Email"
            variant="primary"
            fullWidth
            onPress={() => navigation.navigate('Login')}
            style={styles.primaryBtn}
            testID="email-login-button"
          />

          <Button
            title="Create an Account"
            variant="ghost"
            fullWidth
            onPress={() => navigation.navigate('Signup')}
            testID="signup-button"
          />
        </View>

        {/* Footer info */}
        <Typography
          variant="caption"
          color="muted"
          align="center"
          style={styles.footerLegal}
        >
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </Typography>
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
    paddingVertical: 12,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    marginTop: 8,
    lineHeight: 38,
  },
  heroSubtitle: {
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 320,
  },
  features: {
    width: '100%',
    marginVertical: 20,
    gap: 12,
  },
  featureCard: {
    padding: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTextWrapper: {
    flex: 1,
  },
  actionGroup: {
    width: '100%',
    gap: 10,
  },
  socialBtn: {
    height: 48,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
  },
  primaryBtn: {
    height: 48,
  },
  footerLegal: {
    marginTop: 16,
    maxWidth: 280,
  },
});
