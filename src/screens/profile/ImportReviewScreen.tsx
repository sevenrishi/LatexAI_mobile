import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Card, Chip, ConfirmDialog, Icon, Typography } from '../../components/ui';
import {
  useConfirmImportResume,
  useDiscardImportResume,
  useProfile,
} from '../../features/profile/useProfile';
import { RootStackParamList } from '../../types/navigation';
import { ResumeImportDraft } from '../../types/user';

type ImportReviewRouteProp = RouteProp<RootStackParamList, 'ImportReview'>;

export const ImportReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<ImportReviewRouteProp>();
  const { importId, draft } = route.params;

  const { data: currentProfile } = useProfile();
  const confirmMutation = useConfirmImportResume();
  const discardMutation = useDiscardImportResume();

  const [strategy, setStrategy] = useState<'merge' | 'replace'>('merge');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Section toggle state (default all enabled if data present)
  const parsedData = draft?.parsedData || {};

  const [includeContact, setIncludeContact] = useState(
    Boolean(parsedData.contact && Object.keys(parsedData.contact).length > 0)
  );
  const [includeSummary, setIncludeSummary] = useState(
    Boolean(parsedData.summary)
  );
  const [includeExperience, setIncludeExperience] = useState(
    Boolean(parsedData.experience && parsedData.experience.length > 0)
  );
  const [includeEducation, setIncludeEducation] = useState(
    Boolean(parsedData.education && parsedData.education.length > 0)
  );
  const [includeSkills, setIncludeSkills] = useState(
    Boolean(parsedData.skills && parsedData.skills.length > 0)
  );
  const [includeCertifications, setIncludeCertifications] = useState(
    Boolean(parsedData.certifications && parsedData.certifications.length > 0)
  );
  const [includeProjects, setIncludeProjects] = useState(
    Boolean(parsedData.projects && parsedData.projects.length > 0)
  );

  const handleConfirm = async () => {
    try {
      const selectedData: any = {};
      if (includeContact && parsedData.contact) selectedData.contact = parsedData.contact;
      if (includeSummary && parsedData.summary) selectedData.summary = parsedData.summary;
      if (includeExperience && parsedData.experience) selectedData.experience = parsedData.experience;
      if (includeEducation && parsedData.education) selectedData.education = parsedData.education;
      if (includeSkills && parsedData.skills) selectedData.skills = parsedData.skills;
      if (includeCertifications && parsedData.certifications) selectedData.certifications = parsedData.certifications;
      if (includeProjects && parsedData.projects) selectedData.projects = parsedData.projects;

      await confirmMutation.mutateAsync({
        importId,
        payload: {
          strategy,
          sections: {
            contact: includeContact,
            summary: includeSummary,
            experience: includeExperience,
            education: includeEducation,
            skills: includeSkills,
            certifications: includeCertifications,
            projects: includeProjects,
          },
          selectedData,
        },
      });

      // Navigate back to profile root
      navigation.navigate('ProfileTab');
    } catch (err: any) {
      Alert.alert('Error Applying Resume', err.message || 'Failed to apply parsed resume.');
    }
  };

  const handleDiscard = async () => {
    try {
      await discardMutation.mutateAsync(importId);
      navigation.goBack();
    } catch {
      navigation.goBack();
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      testID="import-review-screen"
    >
      <Typography variant="h2" weight="bold">
        Review Parsed Resume
      </Typography>
      <Typography variant="body" color="secondary" style={styles.subtitle}>
        Select which sections to import and choose whether to merge with your current knowledge base or replace it.
      </Typography>

      {/* Strategy Selector */}
      <Card variant="elevated" style={styles.strategyCard}>
        <Typography variant="body" weight="bold" style={{ marginBottom: 12 }}>
          Import Strategy
        </Typography>

        <View style={styles.strategyOptionsRow}>
          <TouchableOpacity
            onPress={() => setStrategy('merge')}
            style={[
              styles.strategyBox,
              {
                borderColor: strategy === 'merge' ? theme.colors.primary : theme.colors.border,
                backgroundColor:
                  strategy === 'merge'
                    ? `${theme.colors.primary}12`
                    : theme.colors.surfaceElevated,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: strategy === 'merge' }}
            testID="strategy-merge-radio"
          >
            <View style={styles.radioHeader}>
              <Icon
                name={strategy === 'merge' ? 'CheckCircle2' : 'Circle'}
                size={18}
                color={strategy === 'merge' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Typography
                variant="body"
                weight={strategy === 'merge' ? 'bold' : 'regular'}
                style={{ marginLeft: 8 }}
              >
                Merge with Profile
              </Typography>
            </View>
            <Typography variant="caption" color="secondary" style={styles.strategyDesc}>
              Appends new experiences, schools, and skills to your existing profile without deleting existing data.
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStrategy('replace')}
            style={[
              styles.strategyBox,
              {
                borderColor: strategy === 'replace' ? theme.colors.primary : theme.colors.border,
                backgroundColor:
                  strategy === 'replace'
                    ? `${theme.colors.primary}12`
                    : theme.colors.surfaceElevated,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: strategy === 'replace' }}
            testID="strategy-replace-radio"
          >
            <View style={styles.radioHeader}>
              <Icon
                name={strategy === 'replace' ? 'CheckCircle2' : 'Circle'}
                size={18}
                color={strategy === 'replace' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Typography
                variant="body"
                weight={strategy === 'replace' ? 'bold' : 'regular'}
                style={{ marginLeft: 8 }}
              >
                Replace Profile
              </Typography>
            </View>
            <Typography variant="caption" color="secondary" style={styles.strategyDesc}>
              Overwrites your existing profile with the newly parsed content from this resume.
            </Typography>
          </TouchableOpacity>
        </View>
      </Card>

      <Typography variant="caption" weight="bold" color="secondary" style={styles.sectionHeader}>
        PARSED SECTIONS
      </Typography>

      {/* 1. Contact Section */}
      {parsedData.contact && (
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="User" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="bold" style={styles.sectionTitle}>
                Contact Information
              </Typography>
            </View>
            <Switch
              value={includeContact}
              onValueChange={setIncludeContact}
              trackColor={{ true: theme.colors.primary }}
              testID="toggle-contact-switch"
            />
          </View>
          {includeContact && (
            <View style={styles.sectionDetails}>
              <Typography variant="caption" weight="medium">
                {parsedData.contact.fullName || 'No name'}
              </Typography>
              <Typography variant="caption" color="secondary">
                {parsedData.contact.email} • {parsedData.contact.phone || 'No phone'}
              </Typography>
              {parsedData.contact.location ? (
                <Typography variant="caption" color="secondary">
                  {parsedData.contact.location}
                </Typography>
              ) : null}
            </View>
          )}
        </Card>
      )}

      {/* 2. Summary Section */}
      {parsedData.summary && (
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="FileText" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="bold" style={styles.sectionTitle}>
                Professional Summary
              </Typography>
            </View>
            <Switch
              value={includeSummary}
              onValueChange={setIncludeSummary}
              trackColor={{ true: theme.colors.primary }}
              testID="toggle-summary-switch"
            />
          </View>
          {includeSummary && (
            <View style={styles.sectionDetails}>
              <Typography variant="caption" color="secondary" numberOfLines={3}>
                {parsedData.summary}
              </Typography>
            </View>
          )}
        </Card>
      )}

      {/* 3. Experience Section */}
      {parsedData.experience && parsedData.experience.length > 0 && (
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="Briefcase" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="bold" style={styles.sectionTitle}>
                Experience ({parsedData.experience.length})
              </Typography>
            </View>
            <Switch
              value={includeExperience}
              onValueChange={setIncludeExperience}
              trackColor={{ true: theme.colors.primary }}
              testID="toggle-experience-switch"
            />
          </View>
          {includeExperience && (
            <View style={styles.sectionDetails}>
              {parsedData.experience.map((exp: any, i: number) => (
                <View key={exp.id || i} style={styles.itemPreviewRow}>
                  <Typography variant="caption" weight="bold">
                    {exp.position || exp.title} – {exp.company}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {exp.startDate} to {exp.isCurrent ? 'Present' : exp.endDate || 'Present'} • {exp.bullets?.length || 0} bullets
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* 4. Education Section */}
      {parsedData.education && parsedData.education.length > 0 && (
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="GraduationCap" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="bold" style={styles.sectionTitle}>
                Education ({parsedData.education.length})
              </Typography>
            </View>
            <Switch
              value={includeEducation}
              onValueChange={setIncludeEducation}
              trackColor={{ true: theme.colors.primary }}
              testID="toggle-education-switch"
            />
          </View>
          {includeEducation && (
            <View style={styles.sectionDetails}>
              {parsedData.education.map((edu: any, i: number) => (
                <View key={edu.id || i} style={styles.itemPreviewRow}>
                  <Typography variant="caption" weight="bold">
                    {edu.degree} – {edu.institution}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {edu.startDate} to {edu.endDate || 'Present'}
                  </Typography>
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      {/* 5. Skills Section */}
      {parsedData.skills && parsedData.skills.length > 0 && (
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="Code" size={18} color={theme.colors.primary} />
              <Typography variant="body" weight="bold" style={styles.sectionTitle}>
                Skills & Tech Stack
              </Typography>
            </View>
            <Switch
              value={includeSkills}
              onValueChange={setIncludeSkills}
              trackColor={{ true: theme.colors.primary }}
              testID="toggle-skills-switch"
            />
          </View>
          {includeSkills && (
            <View style={[styles.sectionDetails, styles.skillsWrap]}>
              {Array.isArray(parsedData.skills) &&
                parsedData.skills.slice(0, 12).map((s: any, idx: number) => {
                  const skillName = typeof s === 'string' ? s : s.name || (s.skills ? s.skills.join(', ') : '');
                  return <Chip key={`${skillName}-${idx}`} label={skillName} variant="filter" />;
                })}
            </View>
          )}
        </Card>
      )}

      {/* Actions */}
      <View style={styles.footerActions}>
        <Button
          variant="primary"
          title="Apply to Profile"
          loading={confirmMutation.isPending}
          onPress={handleConfirm}
          testID="apply-import-btn"
        />
        <Button
          variant="outline"
          title="Discard Import"
          onPress={() => setShowDiscardConfirm(true)}
          style={styles.discardBtn}
          testID="discard-import-btn"
        />
      </View>

      <ConfirmDialog
        visible={showDiscardConfirm}
        title="Discard Import Draft?"
        message="Are you sure you want to discard this parsed resume draft? No changes will be applied to your profile."
        confirmText="Discard Draft"
        cancelText="Continue Review"
        isDestructive
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
  },
  strategyCard: {
    padding: 16,
    marginBottom: 20,
  },
  strategyOptionsRow: {
    gap: 12,
  },
  strategyBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
  },
  radioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strategyDesc: {
    marginTop: 6,
    marginLeft: 26,
    lineHeight: 18,
  },
  sectionHeader: {
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: 8,
  },
  sectionDetails: {
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E130',
    paddingTop: 8,
  },
  itemPreviewRow: {
    marginBottom: 6,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  footerActions: {
    marginTop: 16,
    gap: 10,
  },
  discardBtn: {
    marginTop: 4,
  },
});
