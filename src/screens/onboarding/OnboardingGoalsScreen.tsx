import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Typography, Button, Icon, Chip, Card } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { OnboardingStackScreenProps } from '../../types/navigation';

const GOAL_OPTIONS = [
  'Beat ATS screening filters',
  'Tailor resumes to specific job posts',
  'Clean pixel-perfect LaTeX formatting',
  'Quantify experience bullets with metrics',
  'Track application versions & score improvements',
];

const TEMPLATE_STYLES = [
  {
    id: 'modern',
    name: 'Modern Executive',
    desc: 'Clean two-column header with subtle accent dividers',
  },
  {
    id: 'classic',
    name: 'Classic Academic',
    desc: 'Traditional single-column layout with high information density',
  },
  {
    id: 'minimal',
    name: 'Tech Minimalist',
    desc: 'Monospaced accents and streamlined bullet hierarchy',
  },
];

export const OnboardingGoalsScreen: React.FC<
  OnboardingStackScreenProps<'OnboardingGoals'>
> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore(state => state.showToast);
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);

  const targetRole = route?.params?.targetRole;
  const experienceLevel = route?.params?.experienceLevel;
  const industry = route?.params?.industry;

  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Beat ATS screening filters',
    'Tailor resumes to specific job posts',
  ]);
  const [preferredTemplate, setPreferredTemplate] = useState('modern');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      await completeOnboarding({
        targetRole,
        experienceLevel,
        industry,
        goals: selectedGoals,
        preferredTemplate,
      });

      showToast({
        type: 'success',
        title: 'Profile Ready',
        message: 'Your personalized resume workspace is setup!',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Setup Error',
        message: err.message || 'Could not save onboarding preferences.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      testID="onboarding-goals-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation & Step Header */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Typography variant="overline" color="brand" weight="bold">
            STEP 3 OF 3
          </Typography>
          <View style={styles.placeholder} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Typography variant="h2" weight="bold">
            Goals & Preferred Style
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            Select your main goals so LatexAI can optimize your ATS recommendations.
          </Typography>
        </View>

        {/* Goals selection */}
        <View style={styles.section}>
          <Typography variant="bodySm" weight="semibold" style={styles.sectionTitle}>
            Primary Resume Objectives
          </Typography>
          <View style={styles.chipGrid}>
            {GOAL_OPTIONS.map(goal => (
              <Chip
                key={goal}
                label={goal}
                selected={selectedGoals.includes(goal)}
                onPress={() => toggleGoal(goal)}
                variant="filter"
              />
            ))}
          </View>
        </View>

        {/* Template Style */}
        <View style={styles.section}>
          <Typography variant="bodySm" weight="semibold" style={styles.sectionTitle}>
            Preferred Starting Template
          </Typography>
          <View style={styles.templateList}>
            {TEMPLATE_STYLES.map(tpl => {
              const isSelected = preferredTemplate === tpl.id;
              return (
                <Pressable
                  key={tpl.id}
                  onPress={() => setPreferredTemplate(tpl.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Card
                    variant={isSelected ? 'elevated' : 'outlined'}
                    style={[
                      styles.templateCard,
                      isSelected
                        ? {
                            borderColor: theme.colors.primary,
                            backgroundColor: theme.colors.primaryLight + '10',
                          }
                        : undefined,
                    ]}
                  >
                    <View style={styles.templateRow}>
                      <View style={styles.templateInfo}>
                        <Typography variant="bodySm" weight="semibold">
                          {tpl.name}
                        </Typography>
                        <Typography variant="caption" color="secondary">
                          {tpl.desc}
                        </Typography>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Icon name="Check" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <View style={styles.actions}>
          <Button
            title="Complete Setup"
            variant="primary"
            fullWidth
            loading={isSubmitting}
            onPress={handleFinish}
            testID="onboarding-complete-button"
            rightIcon={<Icon name="Check" size={18} color="#FFFFFF" />}
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
    paddingBottom: 24,
    flexGrow: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateList: {
    gap: 10,
  },
  templateCard: {
    padding: 14,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    marginTop: 16,
    width: '100%',
  },
});
