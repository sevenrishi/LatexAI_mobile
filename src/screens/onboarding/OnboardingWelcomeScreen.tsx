import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Typography, Button, Icon, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { OnboardingStackScreenProps } from '../../types/navigation';

export const OnboardingWelcomeScreen: React.FC<
  OnboardingStackScreenProps<'OnboardingWelcome'>
> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);

  const handleSkip = async () => {
    try {
      await completeOnboarding({});
    } catch (e) {
      console.warn('[Onboarding] Skip error:', e);
    }
  };

  return (
    <View
      testID="onboarding-welcome-screen"
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
        {/* Step Indicator */}
        <View style={styles.stepHeader}>
          <Typography variant="overline" color="brand" weight="bold">
            STEP 1 OF 3
          </Typography>
          <Button
            title="Skip"
            variant="ghost"
            size="sm"
            onPress={handleSkip}
            testID="onboarding-skip-button"
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight + '25' },
            ]}
          >
            <Icon name="Sparkles" size={38} color={theme.colors.primary} />
          </View>
          <Typography variant="h1" weight="bold" align="center" style={styles.heroTitle}>
            Let's Personalize Your Resume
          </Typography>
          <Typography
            variant="body"
            color="secondary"
            align="center"
            style={styles.heroSubtitle}
          >
            Configure your target roles and formatting goals in 60 seconds to unlock high-scoring ATS resumes.
          </Typography>
        </View>

        {/* Value Highlights */}
        <View style={styles.highlightsContainer}>
          <Card variant="flat" style={styles.highlightCard}>
            <View style={styles.highlightRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="Target" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.highlightText}>
                <Typography variant="bodySm" weight="semibold">
                  Tailored ATS Keyword Matching
                </Typography>
                <Typography variant="caption" color="secondary">
                  Align your experience bullets directly with job requirements.
                </Typography>
              </View>
            </View>
          </Card>

          <Card variant="flat" style={styles.highlightCard}>
            <View style={styles.highlightRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.success + '20' },
                ]}
              >
                <Icon name="FileText" size={20} color={theme.colors.success} />
              </View>
              <View style={styles.highlightText}>
                <Typography variant="bodySm" weight="semibold">
                  Standardized LaTeX Blueprints
                </Typography>
                <Typography variant="caption" color="secondary">
                  Professional typography accepted by top engineering & finance firms.
                </Typography>
              </View>
            </View>
          </Card>

          <Card variant="flat" style={styles.highlightCard}>
            <View style={styles.highlightRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.accent + '20' },
                ]}
              >
                <Icon name="ShieldCheck" size={20} color={theme.colors.accent} />
              </View>
              <View style={styles.highlightText}>
                <Typography variant="bodySm" weight="semibold">
                  Compile Guarantee
                </Typography>
                <Typography variant="caption" color="secondary">
                  Always produces valid TeX code with verified compilation checks.
                </Typography>
              </View>
            </View>
          </Card>
        </View>

        {/* Action Button */}
        <View style={styles.actionGroup}>
          <Button
            title="Get Started"
            variant="primary"
            fullWidth
            onPress={() => navigation.navigate('OnboardingRole')}
            testID="onboarding-get-started-button"
            rightIcon={<Icon name="ArrowRight" size={18} color="#FFFFFF" />}
          />
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
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    lineHeight: 38,
  },
  heroSubtitle: {
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 320,
  },
  highlightsContainer: {
    gap: 12,
    marginVertical: 16,
  },
  highlightCard: {
    padding: 14,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  highlightText: {
    flex: 1,
  },
  actionGroup: {
    marginTop: 24,
    width: '100%',
  },
});
