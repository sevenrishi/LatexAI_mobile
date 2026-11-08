import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Card, Icon, ScoreGauge, Typography } from '../../components/ui';
import { useProfile } from '../../features/profile/useProfile';
import { calculateProfileCompleteness } from '../../features/profile/profileCompleteness';

export const ProfileHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: profile, isLoading, isRefetching, refetch } = useProfile();

  const { percent, sections } = calculateProfileCompleteness(profile);

  const getSectionStatus = (key: string) => {
    const sec = sections.find((s) => s.key === key);
    return sec?.isComplete;
  };

  const getStatusSubtitle = (key: string) => {
    switch (key) {
      case 'contact':
        return profile?.contact?.fullName
          ? `${profile.contact.fullName} • ${profile.contact.email || ''}`
          : 'Add your name, email, and phone';
      case 'summary':
        return profile?.summary
          ? `${profile.summary.length} characters written`
          : 'Write a brief professional summary';
      case 'experience':
        const expCount = profile?.experience?.length || 0;
        return expCount > 0
          ? `${expCount} work position${expCount === 1 ? '' : 's'} added`
          : 'Add your past and current roles';
      case 'education':
        const eduCount = profile?.education?.length || 0;
        return eduCount > 0
          ? `${eduCount} educational degree${eduCount === 1 ? '' : 's'}`
          : 'Add your degrees and institutions';
      case 'skills':
        const skillCount = (profile?.skills || []).reduce(
          (acc, c) => acc + (c.skills?.length || 0),
          0
        );
        return skillCount > 0
          ? `${skillCount} skill${skillCount === 1 ? '' : 's'} categorized`
          : 'Add technical and soft skills';
      case 'certifications':
        const certCount = profile?.certifications?.length || 0;
        return certCount > 0
          ? `${certCount} credential${certCount === 1 ? '' : 's'}`
          : 'Add licenses or certifications';
      case 'projects':
        const projCount = profile?.projects?.length || 0;
        return projCount > 0
          ? `${projCount} showcase project${projCount === 1 ? '' : 's'}`
          : 'Add key projects and repositories';
      default:
        return '';
    }
  };

  const sectionRows = [
    {
      key: 'contact',
      title: 'Contact Information',
      icon: 'User',
      route: 'ContactInfo',
    },
    {
      key: 'summary',
      title: 'Professional Summary',
      icon: 'FileText',
      route: 'SummaryEdit',
    },
    {
      key: 'experience',
      title: 'Work Experience',
      icon: 'Briefcase',
      route: 'ExperienceList',
    },
    {
      key: 'education',
      title: 'Education',
      icon: 'GraduationCap',
      route: 'EducationList',
    },
    {
      key: 'skills',
      title: 'Skills & Tech Stack',
      icon: 'Code',
      route: 'SkillsEdit',
    },
    {
      key: 'certifications',
      title: 'Certifications',
      icon: 'Award',
      route: 'CertificationsList',
    },
    {
      key: 'projects',
      title: 'Key Projects',
      icon: 'FolderGit2',
      route: 'ProjectsList',
    },
  ];

  if (isLoading && !profile) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography
          variant="body"
          color="secondary"
          style={styles.loadingText}
        >
          Loading your profile...
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
          tintColor={theme.colors.primary}
        />
      }
      testID="profile-home-screen"
    >
      {/* Title strip */}
      <View style={styles.titleSection}>
        <Typography variant="h2" weight="bold">
          Knowledge Base
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Your unified career record used by AI to generate targeted resumes.
        </Typography>
      </View>

      {/* Completeness Ring Card */}
      <Card variant="elevated" style={styles.completenessCard}>
        <View style={styles.completenessRow}>
          <ScoreGauge
            score={percent}
            size={90}
            strokeWidth={8}
            label="Complete"
          />
          <View style={styles.completenessTextContainer}>
            <Typography variant="h3" weight="bold">
              {percent >= 85
                ? 'Strong Profile'
                : percent >= 50
                ? 'Good Progress'
                : 'Needs Details'}
            </Typography>
            <Typography
              variant="caption"
              color="secondary"
              style={styles.completenessDesc}
            >
              {percent >= 85
                ? 'Your knowledge base is well-rounded and ready for ATS tailoring.'
                : 'Complete more sections to generate higher scoring resumes.'}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Quick Action: Import Resume */}
      <Card
        variant="elevated"
        style={[
          styles.importBanner,
          {
            backgroundColor: theme.colors.primarySoft || `${theme.colors.primary}12`,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <View style={styles.importHeader}>
          <View
            style={[
              styles.importIconCircle,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Icon name="UploadCloud" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.importTextWrap}>
            <Typography variant="body" weight="bold">
              Import Existing Resume
            </Typography>
            <Typography variant="caption" color="secondary">
              Upload a PDF or Word document to auto-populate your entire profile in seconds.
            </Typography>
          </View>
        </View>
        <Button
          variant="primary"
          title="Upload & Parse Resume"
          size="sm"
          onPress={() => navigation.navigate('ImportResume')}
          style={styles.importBtn}
          testID="profile-home-import-btn"
        />
      </Card>

      {/* Section Status Rows */}
      <Typography
        variant="caption"
        weight="bold"
        color="secondary"
        style={styles.sectionHeader}
      >
        PROFILE SECTIONS
      </Typography>

      <View style={styles.sectionList}>
        {sectionRows.map((row) => {
          const isComplete = getSectionStatus(row.key);
          const sub = getStatusSubtitle(row.key);

          return (
            <TouchableOpacity
              key={row.key}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(row.route)}
              style={[
                styles.sectionRowItem,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}, ${isComplete ? 'complete' : 'incomplete'}`}
              testID={`profile-section-row-${row.key}`}
            >
              <View
                style={[
                  styles.sectionIconWrap,
                  {
                    backgroundColor: isComplete
                      ? `${theme.colors.success}18`
                      : `${theme.colors.textMuted}18`,
                  },
                ]}
              >
                <Icon
                  name={row.icon as any}
                  size={20}
                  color={isComplete ? theme.colors.success : theme.colors.textSecondary}
                />
              </View>

              <View style={styles.rowTextWrap}>
                <View style={styles.rowHeader}>
                  <Typography variant="body" weight="semibold">
                    {row.title}
                  </Typography>
                  {isComplete ? (
                    <View style={styles.statusBadge}>
                      <Icon
                        name="CheckCircle2"
                        size={14}
                        color={theme.colors.success}
                      />
                      <Typography
                        variant="caption"
                        color="success"
                        weight="semibold"
                        style={styles.statusBadgeText}
                      >
                        Complete
                      </Typography>
                    </View>
                  ) : (
                    <View style={styles.incompleteBadge}>
                      <Typography
                        variant="caption"
                        color="secondary"
                        weight="medium"
                      >
                        Add Info
                      </Typography>
                    </View>
                  )}
                </View>
                <Typography
                  variant="caption"
                  color="secondary"
                  numberOfLines={1}
                  style={styles.rowSubtitle}
                >
                  {sub}
                </Typography>
              </View>

              <Icon
                name="ChevronRight"
                size={18}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  titleSection: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 4,
  },
  completenessCard: {
    padding: 16,
    marginBottom: 16,
  },
  completenessRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completenessTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  completenessDesc: {
    marginTop: 4,
    lineHeight: 18,
  },
  importBanner: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  importIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  importTextWrap: {
    flex: 1,
  },
  importBtn: {
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionList: {
    gap: 10,
  },
  sectionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 64,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    marginLeft: 2,
  },
  incompleteBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rowSubtitle: {
    marginTop: 2,
  },
});
