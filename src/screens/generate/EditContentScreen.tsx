import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Icon,
  TextField,
  Typography,
} from '../../components/ui';
import { RootStackParamList } from '../../types/navigation';
import {
  TailoredContent,
  TailoredExperience,
  TailoredSkillItem,
  useGeneration,
  useRerenderGeneration,
  useResetTailoredContent,
  useUpdateTailoredContent,
} from '../../features/generation';
import { useUiStore } from '../../store/uiStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditSection = 'summary' | 'experience' | 'skills' | 'projects';

export const EditContentScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore((state) => state.showToast);

  const generationId: string = route.params?.generationId || '';

  const { data: generation, isLoading: isGenLoading } = useGeneration(generationId);
  const updateMutation = useUpdateTailoredContent();
  const rerenderMutation = useRerenderGeneration();
  const resetMutation = useResetTailoredContent();

  const [activeSection, setActiveSection] = useState<EditSection>('summary');

  // Form states
  const [summary, setSummary] = useState<string>('');
  const [experiences, setExperiences] = useState<TailoredExperience[]>([]);
  const [skills, setSkills] = useState<TailoredSkillItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Track initial snapshot for dirty state checks (MB-5.05)
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // New item inputs
  const [newSkillText, setNewSkillText] = useState<string>('');
  const [newSkillCategory, setNewSkillCategory] = useState<string>('Technical');

  // Populate data when generation is loaded
  useEffect(() => {
    if (generation?.tailoredContent) {
      const tc = generation.tailoredContent;
      const initialSummary = tc.summary || '';
      const initialExp = tc.experience || [];
      const initialSkills = tc.skills || [];
      const initialProjects = tc.projects || [];

      setSummary(initialSummary);
      setExperiences(JSON.parse(JSON.stringify(initialExp)));
      setSkills(JSON.parse(JSON.stringify(initialSkills)));
      setProjects(JSON.parse(JSON.stringify(initialProjects)));

      const snapshot = JSON.stringify({
        summary: initialSummary,
        experience: initialExp,
        skills: initialSkills,
        projects: initialProjects,
      });
      setInitialSnapshot(snapshot);
    }
  }, [generation?.tailoredContent]);

  // Dirty state calculation
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      summary,
      experience: experiences,
      skills,
      projects,
    });
  }, [summary, experiences, skills, projects]);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return initialSnapshot !== currentSnapshot;
  }, [initialSnapshot, currentSnapshot]);

  // Handle hardware back or header back with dirty-state guard
  const handleBackPress = () => {
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
    } else {
      navigation.goBack();
    }
  };

  // Bullet point edits for experiences
  const handleUpdateBullet = (
    expIndex: number,
    bulletIndex: number,
    text: string
  ) => {
    setExperiences((prev) => {
      const next = [...prev];
      const targetExp = next[expIndex];
      if (!targetExp) return prev;
      const prevBullets = targetExp.bullets || [];
      const nextBullets = [...prevBullets];
      nextBullets[bulletIndex] = {
        ...nextBullets[bulletIndex],
        id: nextBullets[bulletIndex]?.id || `b_${bulletIndex}`,
        text,
      };
      next[expIndex] = {
        ...targetExp,
        bullets: nextBullets,
      };
      return next;
    });
  };

  const handleAddBullet = (expIndex: number) => {
    setExperiences((prev) => {
      const next = [...prev];
      const targetExp = next[expIndex];
      if (!targetExp) return prev;
      const prevBullets = targetExp.bullets || [];
      const nextBullets = [
        ...prevBullets,
        {
          id: `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          text: 'Accomplished [X], as measured by [Y], by doing [Z].',
        },
      ];
      next[expIndex] = {
        ...targetExp,
        bullets: nextBullets,
      };
      return next;
    });
  };

  const handleRemoveBullet = (expIndex: number, bulletIndex: number) => {
    setExperiences((prev) => {
      const next = [...prev];
      const targetExp = next[expIndex];
      if (!targetExp) return prev;
      const prevBullets = targetExp.bullets || [];
      const nextBullets = prevBullets.filter((_, idx) => idx !== bulletIndex);
      next[expIndex] = {
        ...targetExp,
        bullets: nextBullets,
      };
      return next;
    });
  };

  // Skills handlers
  const handleAddSkill = () => {
    if (!newSkillText.trim()) return;
    const newSkill: TailoredSkillItem = {
      id: `skill_${Date.now()}`,
      name: newSkillText.trim(),
      category: newSkillCategory || 'Technical',
      isHighlighted: false,
    };
    setSkills((prev) => [...prev, newSkill]);
    setNewSkillText('');
  };

  const handleRemoveSkill = (skillIndex: number) => {
    setSkills((prev) => prev.filter((_, idx) => idx !== skillIndex));
  };

  // Save changes flow
  const handleSave = async (shouldRerender = false) => {
    const payload: TailoredContent = {
      summary,
      experience: experiences,
      skills,
      projects,
    };

    try {
      await updateMutation.mutateAsync({
        generationId,
        content: payload,
      });

      // Update snapshot so form is not dirty
      setInitialSnapshot(currentSnapshot);

      showToast({
        type: 'success',
        title: 'Changes Saved',
        message: 'Resume content updated successfully.',
      });

      if (shouldRerender) {
        // MB-5.06: Request re-render, fallback PDF preserved on compiler failure
        rerenderMutation.mutate(generationId, {
          onSuccess: () => {
            showToast({
              type: 'success',
              title: 'PDF Re-compiled',
              message: 'Your resume has been re-rendered with recent content.',
            });
            navigation.goBack();
          },
          onError: (err: any) => {
            Alert.alert(
              'Compiler Warning',
              err?.message ||
                'LaTeX compilation encountered syntax issues. Your edits were saved, and the previous PDF has been kept as a valid fallback.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          },
        });
      } else {
        navigation.goBack();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err?.message || 'Could not save resume content edits.',
      });
    }
  };

  // Reset to original AI version (MB-5.09)
  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    resetMutation.mutate(generationId, {
      onSuccess: () => {
        showToast({
          type: 'info',
          title: 'Reset to AI',
          message: 'Content restored to original AI generation.',
        });
        navigation.goBack();
      },
      onError: (err: any) => {
        showToast({
          type: 'error',
          title: 'Reset Failed',
          message: err?.message || 'Failed to reset content.',
        });
      },
    });
  };

  if (isGenLoading && !generation) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography variant="bodySm" color="secondary" style={styles.loadingText}>
          Loading resume content...
        </Typography>
      </View>
    );
  }

  const isSaving = updateMutation.isPending || rerenderMutation.isPending;

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="edit-content-screen"
    >
      {/* 1. Header Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.headerIconButton}
          accessibilityLabel="Back"
          testID="btn-edit-back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Typography variant="body" weight="bold" numberOfLines={1}>
            Edit Resume Content
          </Typography>
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {isDirty ? 'Unsaved modifications' : 'All changes saved'}
          </Typography>
        </View>

        {/* Reset to AI Button (MB-5.09) */}
        <TouchableOpacity
          onPress={() => setIsResetConfirmOpen(true)}
          style={styles.headerTextButton}
          testID="btn-edit-reset-ai"
        >
          <Icon name="RotateCcw" size={16} color={theme.colors.scoreLow} />
          <Typography
            variant="caption"
            weight="semibold"
            customColor={theme.colors.scoreLow}
          >
            Reset
          </Typography>
        </TouchableOpacity>
      </View>

      {/* 2. Section Selector Tabs */}
      <View
        style={[
          styles.sectionTabBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {(
          [
            { id: 'summary', label: 'Summary', icon: 'FileText' },
            { id: 'experience', label: 'Experience', icon: 'Briefcase' },
            { id: 'skills', label: 'Skills', icon: 'Award' },
            { id: 'projects', label: 'Projects', icon: 'Code' },
          ] as const
        ).map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveSection(tab.id)}
              style={[
                styles.sectionTabItem,
                isActive && [
                  styles.sectionTabItemActive,
                  { borderBottomColor: theme.colors.primary },
                ],
              ]}
              testID={`tab-edit-${tab.id}`}
            >
              <Icon
                name={tab.icon as any}
                size={16}
                color={isActive ? theme.colors.primary : theme.colors.textMuted}
              />
              <Typography
                variant="bodySm"
                weight={isActive ? 'bold' : 'regular'}
                customColor={
                  isActive ? theme.colors.primary : theme.colors.textSecondary
                }
                style={styles.sectionTabText}
              >
                {tab.label}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Section Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        testID="edit-content-scroll"
      >
        {/* SUMMARY SECTION */}
        {activeSection === 'summary' && (
          <View style={styles.sectionContainer} testID="edit-section-summary">
            <Typography variant="body" weight="bold" style={styles.sectionHeading}>
              Professional Summary
            </Typography>
            <Typography variant="bodySm" color="secondary" style={styles.sectionSubtext}>
              Tailored overview highlighted for targeted keyword matching.
            </Typography>

            <Card style={[styles.fieldCard, { backgroundColor: theme.colors.surface }]}>
              <TextInput
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={6}
                placeholder="Write your professional summary..."
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.summaryInput,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  },
                ]}
                testID="input-summary"
              />
              <View style={styles.charCountRow}>
                <Typography variant="caption" color="muted">
                  {summary.length} characters
                </Typography>
              </View>
            </Card>
          </View>
        )}

        {/* EXPERIENCE SECTION */}
        {activeSection === 'experience' && (
          <View style={styles.sectionContainer} testID="edit-section-experience">
            <Typography variant="body" weight="bold" style={styles.sectionHeading}>
              Experience & Achievements
            </Typography>
            <Typography variant="bodySm" color="secondary" style={styles.sectionSubtext}>
              Refine tailored bullets to highlight impact, quantified outcomes, and keywords.
            </Typography>

            {experiences.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Typography variant="bodySm" color="secondary">
                  No experience entries in this tailored resume.
                </Typography>
              </Card>
            ) : (
              experiences.map((exp, expIdx) => (
                <Card
                  key={exp.id || expIdx}
                  style={[styles.expCard, { backgroundColor: theme.colors.surface }]}
                  testID={`exp-item-${expIdx}`}
                >
                  <View style={styles.expHeader}>
                    <View style={styles.expInfo}>
                      <Typography variant="body" weight="bold">
                        {exp.title || exp.position || 'Role'}
                      </Typography>
                      <Typography variant="bodySm" customColor={theme.colors.primary}>
                        {exp.company}
                      </Typography>
                    </View>
                    <Typography variant="caption" color="muted">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate || ''}
                    </Typography>
                  </View>

                  <View style={styles.bulletList}>
                    {exp.bullets?.map((bullet, bIdx) => (
                      <View key={bullet.id || bIdx} style={styles.bulletRow}>
                        <View style={styles.bulletIconCol}>
                          <Icon
                            name="CornerDownRight"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </View>
                        <TextInput
                          value={bullet.text}
                          onChangeText={(t) => handleUpdateBullet(expIdx, bIdx, t)}
                          multiline
                          style={[
                            styles.bulletInput,
                            {
                              color: theme.colors.textPrimary,
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.background,
                            },
                          ]}
                          testID={`input-bullet-${expIdx}-${bIdx}`}
                        />
                        <TouchableOpacity
                          onPress={() => handleRemoveBullet(expIdx, bIdx)}
                          style={styles.bulletDeleteBtn}
                          testID={`btn-delete-bullet-${expIdx}-${bIdx}`}
                        >
                          <Icon name="Trash2" size={16} color={theme.colors.scoreLow} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAddBullet(expIdx)}
                    style={[
                      styles.addBulletBtn,
                      { borderColor: theme.colors.primary + '50' },
                    ]}
                    testID={`btn-add-bullet-${expIdx}`}
                  >
                    <Icon name="Plus" size={16} color={theme.colors.primary} />
                    <Typography
                      variant="caption"
                      weight="semibold"
                      customColor={theme.colors.primary}
                    >
                      Add Achievement Bullet
                    </Typography>
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        )}

        {/* SKILLS SECTION */}
        {activeSection === 'skills' && (
          <View style={styles.sectionContainer} testID="edit-section-skills">
            <Typography variant="body" weight="bold" style={styles.sectionHeading}>
              Key Skills & Technologies
            </Typography>
            <Typography variant="bodySm" color="secondary" style={styles.sectionSubtext}>
              Target skills parsed from job requirements and candidate profile.
            </Typography>

            <Card style={[styles.fieldCard, { backgroundColor: theme.colors.surface }]}>
              {/* Add Skill Row */}
              <View style={styles.addSkillRow}>
                <TextInput
                  value={newSkillText}
                  onChangeText={setNewSkillText}
                  placeholder="e.g. TypeScript, Docker, Kubernetes"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.skillInput,
                    {
                      color: theme.colors.textPrimary,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  testID="input-new-skill"
                />
                <Button
                  title="Add"
                  variant="primary"
                  size="sm"
                  onPress={handleAddSkill}
                  disabled={!newSkillText.trim()}
                  testID="btn-add-skill"
                />
              </View>

              {/* Skills Chips */}
              <View style={styles.skillsChipGrid}>
                {skills.map((skill, sIdx) => (
                  <View
                    key={skill.id || sIdx}
                    style={[
                      styles.skillChipItem,
                      {
                        backgroundColor: theme.colors.primaryLight + '20',
                        borderColor: theme.colors.primary + '40',
                      },
                    ]}
                    testID={`skill-chip-${sIdx}`}
                  >
                    <Typography
                      variant="caption"
                      weight="medium"
                      customColor={theme.colors.primary}
                    >
                      {skill.name}
                    </Typography>
                    <TouchableOpacity
                      onPress={() => handleRemoveSkill(sIdx)}
                      style={styles.skillRemoveBtn}
                      testID={`btn-remove-skill-${sIdx}`}
                    >
                      <Icon name="X" size={12} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* PROJECTS SECTION */}
        {activeSection === 'projects' && (
          <View style={styles.sectionContainer} testID="edit-section-projects">
            <Typography variant="body" weight="bold" style={styles.sectionHeading}>
              Key Projects
            </Typography>
            <Typography variant="bodySm" color="secondary" style={styles.sectionSubtext}>
              Notable software projects relevant to the target role.
            </Typography>

            {projects.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Typography variant="bodySm" color="secondary">
                  No project entries attached to this generation.
                </Typography>
              </Card>
            ) : (
              projects.map((proj, pIdx) => (
                <Card
                  key={proj.id || pIdx}
                  style={[styles.expCard, { backgroundColor: theme.colors.surface }]}
                >
                  <Typography variant="body" weight="bold">
                    {proj.title || 'Project'}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {proj.description || ''}
                  </Typography>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* 4. Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 16,
          },
        ]}
      >
        <Button
          title="Save Draft"
          variant="secondary"
          onPress={() => handleSave(false)}
          loading={isSaving}
          disabled={!isDirty || isSaving}
          style={styles.actionBtnHalf}
          testID="btn-save-draft"
        />

        <Button
          title="Save & Re-render"
          variant="primary"
          onPress={() => handleSave(true)}
          loading={isSaving}
          disabled={isSaving}
          style={styles.actionBtnHalf}
          testID="btn-save-rerender"
        />
      </View>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        visible={isDiscardConfirmOpen}
        title="Discard Unsaved Changes?"
        message="You have unsaved edits in your resume content. Leaving will discard these changes."
        confirmText="Discard"
        cancelText="Keep Editing"
        isDestructive={true}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          navigation.goBack();
        }}
        onCancel={() => setIsDiscardConfirmOpen(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        visible={isResetConfirmOpen}
        title="Reset Content to AI Version?"
        message="This will discard all manual bullet and summary edits and revert to the original AI-tailored resume."
        confirmText="Reset to AI"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sectionTabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  sectionTabItemActive: {},
  sectionTabText: {
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
  },
  sectionSubtext: {
    marginBottom: 8,
  },
  fieldCard: {
    padding: 14,
    borderRadius: 12,
  },
  summaryInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  expCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expInfo: {
    flex: 1,
    marginRight: 8,
  },
  bulletList: {
    gap: 8,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletIconCol: {
    paddingTop: 8,
  },
  bulletInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
    minHeight: 50,
  },
  bulletDeleteBtn: {
    padding: 8,
  },
  addBulletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  skillsChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  skillRemoveBtn: {
    padding: 2,
  },
  bottomActionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  actionBtnHalf: {
    flex: 1,
  },
});
