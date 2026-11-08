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
import { Typography, TextField, Button, Icon, Chip } from '../../components/ui';
import { OnboardingStackScreenProps } from '../../types/navigation';

const POPULAR_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'Product Manager',
  'Data Scientist',
  'DevOps / SRE',
  'UX/UI Designer',
];

const EXPERIENCE_LEVELS = [
  { id: 'entry', label: 'Entry Level (0-2 yrs)' },
  { id: 'mid', label: 'Mid Level (3-5 yrs)' },
  { id: 'senior', label: 'Senior (6-8 yrs)' },
  { id: 'lead', label: 'Lead / Staff (8+ yrs)' },
  { id: 'executive', label: 'Director / Exec' },
];

export const OnboardingRoleScreen: React.FC<
  OnboardingStackScreenProps<'OnboardingRole'>
> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [industry, setIndustry] = useState('Technology');

  const handleContinue = () => {
    navigation.navigate('OnboardingGoals', {
      targetRole: role,
      experienceLevel,
      industry,
    });
  };

  return (
    <KeyboardAvoidingView
      testID="onboarding-role-screen"
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
            STEP 2 OF 3
          </Typography>
          <View style={styles.placeholder} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Typography variant="h2" weight="bold">
            Target Role & Experience
          </Typography>
          <Typography variant="body" color="secondary" style={styles.subtitle}>
            We'll customize your LaTeX resume templates and bullet points based on your target seniority.
          </Typography>
        </View>

        {/* Target Role Input */}
        <View style={styles.section}>
          <TextField
            label="Target Job Title"
            placeholder="e.g. Senior Software Engineer"
            value={role}
            onChangeText={setRole}
            leftIcon={<Icon name="Briefcase" size={18} color={theme.colors.textMuted} />}
            clearable
            testID="onboarding-role-input"
          />

          <Typography variant="caption" color="secondary" style={styles.chipHeading}>
            Or pick a common title:
          </Typography>
          <View style={styles.chipGrid}>
            {POPULAR_ROLES.map(r => (
              <Chip
                key={r}
                label={r}
                selected={role === r}
                onPress={() => setRole(r)}
                variant="filter"
              />
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Typography variant="bodySm" weight="semibold" style={styles.sectionTitle}>
            Experience Level
          </Typography>
          <View style={styles.chipGrid}>
            {EXPERIENCE_LEVELS.map(lvl => (
              <Chip
                key={lvl.id}
                label={lvl.label}
                selected={experienceLevel === lvl.id}
                onPress={() => setExperienceLevel(lvl.id)}
                variant="choice"
              />
            ))}
          </View>
        </View>

        {/* Industry */}
        <View style={styles.section}>
          <TextField
            label="Primary Industry / Sector"
            placeholder="e.g. Technology, Finance, Healthcare"
            value={industry}
            onChangeText={setIndustry}
            leftIcon={<Icon name="Globe" size={18} color={theme.colors.textMuted} />}
            testID="onboarding-industry-input"
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Continue"
            variant="primary"
            fullWidth
            onPress={handleContinue}
            testID="onboarding-role-continue-button"
            rightIcon={<Icon name="ArrowRight" size={18} color="#FFFFFF" />}
          />
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
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  chipHeading: {
    marginTop: 8,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    marginTop: 16,
    width: '100%',
  },
});
