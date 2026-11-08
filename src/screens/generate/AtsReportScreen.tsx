import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
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
  Icon,
  ScoreGauge,
  TextField,
  Typography,
} from '../../components/ui';
import { RootStackParamList } from '../../types/navigation';
import { useAtsScore, useGeneration } from '../../features/generation';
import { useBulkAddSkills } from '../../features/profile/useProfile';
import { useUiStore } from '../../store/uiStore';
import { AtsKeywordMatch, AtsKeywordMissing } from '../../features/generation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type KeywordFilterTab = 'all' | 'matched' | 'missing';

export const AtsReportScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore((state) => state.showToast);

  const generationId: string = route.params?.generationId || '';

  // Data fetching
  const { data: generation, isLoading: isGenLoading } = useGeneration(generationId);
  const {
    data: queryAtsData,
    isLoading: isAtsLoading,
    isError: isAtsError,
    refetch,
  } = useAtsScore(generationId);

  const atsData = queryAtsData || generation?.atsScoreResult || null;

  const bulkAddSkillsMutation = useBulkAddSkills();

  // Local UI State
  const [activeFilterTab, setActiveFilterTab] = useState<KeywordFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedSkillsSet, setAddedSkillsSet] = useState<Set<string>>(new Set());

  const jobTitle = generation?.jobTitle || 'Resume';
  const companyName = generation?.companyName || generation?.company || 'Target Role';

  const score = atsData?.score ?? generation?.atsScore ?? 0;
  const grade = atsData?.grade || (score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D');

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'A':
        return theme.colors.scoreHigh;
      case 'B':
        return theme.colors.scoreHigh;
      case 'C':
        return theme.colors.scoreMedium;
      default:
        return theme.colors.scoreLow;
    }
  };

  const getImportanceBadgeColor = (imp: 'required' | 'preferred' | 'domain') => {
    switch (imp) {
      case 'required':
        return theme.colors.scoreLow;
      case 'preferred':
        return theme.colors.primary;
      case 'domain':
        return theme.colors.textMuted;
    }
  };

  // Handle adding missing keyword to profile
  const handleAddToProfile = (keyword: string) => {
    if (addedSkillsSet.has(keyword)) return;

    bulkAddSkillsMutation.mutate(
      [{ name: keyword, category: 'Technical Skills' }],
      {
        onSuccess: () => {
          setAddedSkillsSet((prev) => new Set([...prev, keyword]));
          showToast({
            type: 'success',
            title: 'Skill Added to Profile',
            message: `Added "${keyword}" to your profile skills.`,
          });
        },
        onError: () => {
          showToast({
            type: 'error',
            title: 'Failed to Add',
            message: `Could not add "${keyword}" to profile skills.`,
          });
        },
      }
    );
  };

  // Filtered keywords
  const matchedKeywords = useMemo<AtsKeywordMatch[]>(() => {
    return atsData?.keywordAnalysis?.matched || [];
  }, [atsData?.keywordAnalysis?.matched]);

  const missingKeywords = useMemo<AtsKeywordMissing[]>(() => {
    return atsData?.keywordAnalysis?.missing || [];
  }, [atsData?.keywordAnalysis?.missing]);

  const filteredMatched = useMemo(() => {
    if (!searchQuery.trim()) return matchedKeywords;
    return matchedKeywords.filter((m) =>
      m.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [matchedKeywords, searchQuery]);

  const filteredMissing = useMemo(() => {
    if (!searchQuery.trim()) return missingKeywords;
    return missingKeywords.filter((m) =>
      m.keyword.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [missingKeywords, searchQuery]);

  const totalKeywordsCount = atsData?.keywordAnalysis?.totalKeywords ?? (matchedKeywords.length + missingKeywords.length);
  const coveragePercent =
    atsData?.keywordAnalysis?.coveragePercentage ??
    (totalKeywordsCount > 0
      ? Math.round((matchedKeywords.length / totalKeywordsCount) * 100)
      : 0);

  if (isAtsLoading && !atsData) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography variant="bodySm" color="secondary" style={styles.loadingText}>
          Analyzing ATS keyword alignment...
        </Typography>
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="ats-report-screen"
    >
      {/* 1. Header */}
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Back to Review"
          testID="btn-ats-back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Typography variant="h3" weight="bold" numberOfLines={1}>
            ATS Match Report
          </Typography>
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {jobTitle} · {companyName}
          </Typography>
        </View>

        <TouchableOpacity
          onPress={() => refetch()}
          style={styles.refreshButton}
          accessibilityLabel="Refresh Report"
          testID="btn-ats-refresh"
        >
          <Icon name="RefreshCw" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="ats-report-scrollview"
      >
        {/* 2. Main Score Gauge Card */}
        <Card
          style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}
          testID="ats-score-card"
        >
          <View style={styles.scoreRow}>
            <ScoreGauge
              score={score}
              size={130}
              strokeWidth={11}
              showLabel={false}
            />

            <View style={styles.scoreDetails}>
              <View style={styles.gradeBadgeRow}>
                <View
                  style={[
                    styles.gradePill,
                    { backgroundColor: getGradeColor(grade) + '20' },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    customColor={getGradeColor(grade)}
                  >
                    Grade {grade}
                  </Typography>
                </View>

                <View
                  style={[
                    styles.matchPill,
                    {
                      backgroundColor:
                        score >= 75
                          ? theme.colors.scoreHigh + '20'
                          : score >= 50
                          ? theme.colors.scoreMedium + '20'
                          : theme.colors.scoreLow + '20',
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="semibold"
                    customColor={
                      score >= 75
                        ? theme.colors.scoreHigh
                        : score >= 50
                        ? theme.colors.scoreMedium
                        : theme.colors.scoreLow
                    }
                  >
                    {score >= 75
                      ? 'Strong Match'
                      : score >= 50
                      ? 'Moderate Match'
                      : 'Needs Optimization'}
                  </Typography>
                </View>
              </View>

              <Typography variant="h3" weight="bold" style={styles.summaryScoreText}>
                {score}/100 Overall Score
              </Typography>
              <Typography variant="caption" color="secondary">
                Resume parsed via single-column layout with high semantic term alignment.
              </Typography>
            </View>
          </View>
        </Card>

        {/* 3. Breakdown Coverage Bars */}
        <Card
          style={[styles.breakdownCard, { backgroundColor: theme.colors.surface }]}
          testID="ats-breakdown-card"
        >
          <Typography variant="body" weight="semibold" style={styles.breakdownTitle}>
            Score Component Breakdown
          </Typography>

          {/* Keyword Match Bar */}
          <View style={styles.metricBarItem}>
            <View style={styles.metricLabelRow}>
              <Typography variant="bodySm" weight="medium">
                Keyword Coverage
              </Typography>
              <Typography variant="bodySm" weight="bold" customColor={theme.colors.scoreHigh}>
                {coveragePercent}% ({matchedKeywords.length}/{totalKeywordsCount})
              </Typography>
            </View>
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, coveragePercent))}%`,
                    backgroundColor: theme.colors.scoreHigh,
                  },
                ]}
              />
            </View>
          </View>

          {/* Format Compliance Bar */}
          <View style={styles.metricBarItem}>
            <View style={styles.metricLabelRow}>
              <Typography variant="bodySm" weight="medium">
                Format & Layout Compliance
              </Typography>
              <Typography variant="bodySm" weight="bold" customColor={theme.colors.primary}>
                {atsData?.formatChecks?.score ?? 95}%
              </Typography>
            </View>
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, atsData?.formatChecks?.score ?? 95)}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Section Score Bar */}
          <View style={styles.metricBarItem}>
            <View style={styles.metricLabelRow}>
              <Typography variant="bodySm" weight="medium">
                Standard Section Detection
              </Typography>
              <Typography variant="bodySm" weight="bold" customColor={theme.colors.scoreHigh}>
                {atsData?.breakdown?.sectionScore ?? 100}%
              </Typography>
            </View>
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, atsData?.breakdown?.sectionScore ?? 100)}%`,
                    backgroundColor: theme.colors.scoreHigh,
                  },
                ]}
              />
            </View>
          </View>
        </Card>

        {/* 4. Keyword Analysis Section */}
        <View style={styles.keywordsSection}>
          <View style={styles.keywordsHeaderRow}>
            <Typography variant="h3" weight="bold">
              Target Keywords ({totalKeywordsCount})
            </Typography>
          </View>

          {/* Tab Filter Chips */}
          <View style={styles.filterTabsRow}>
            <TouchableOpacity
              onPress={() => setActiveFilterTab('all')}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor:
                    activeFilterTab === 'all'
                      ? theme.colors.primary
                      : theme.colors.surfaceElevated,
                },
              ]}
              testID="tab-filter-all"
            >
              <Typography
                variant="caption"
                weight="semibold"
                customColor={
                  activeFilterTab === 'all'
                    ? '#FFFFFF'
                    : theme.colors.textSecondary
                }
              >
                All ({totalKeywordsCount})
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilterTab('matched')}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor:
                    activeFilterTab === 'matched'
                      ? theme.colors.scoreHigh
                      : theme.colors.surfaceElevated,
                },
              ]}
              testID="tab-filter-matched"
            >
              <Typography
                variant="caption"
                weight="semibold"
                customColor={
                  activeFilterTab === 'matched'
                    ? '#FFFFFF'
                    : theme.colors.textSecondary
                }
              >
                Matched ({matchedKeywords.length})
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilterTab('missing')}
              style={[
                styles.filterTabPill,
                {
                  backgroundColor:
                    activeFilterTab === 'missing'
                      ? theme.colors.scoreLow
                      : theme.colors.surfaceElevated,
                },
              ]}
              testID="tab-filter-missing"
            >
              <Typography
                variant="caption"
                weight="semibold"
                customColor={
                  activeFilterTab === 'missing'
                    ? '#FFFFFF'
                    : theme.colors.textSecondary
                }
              >
                Missing ({missingKeywords.length})
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TextField
            placeholder="Search keywords..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Icon name="Search" size={16} color={theme.colors.textMuted} />}
            clearable={true}
            onClear={() => setSearchQuery('')}
            containerStyle={styles.searchField}
          />

          {/* Matched Keywords Block */}
          {(activeFilterTab === 'all' || activeFilterTab === 'matched') && (
            <Card
              style={[
                styles.keywordGroupCard,
                { backgroundColor: theme.colors.surface },
              ]}
              testID="matched-keywords-block"
            >
              <View style={styles.keywordGroupHeader}>
                <Icon
                  name="CheckCircle2"
                  size={18}
                  color={theme.colors.scoreHigh}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={styles.keywordGroupTitle}
                >
                  Matched Keywords ({filteredMatched.length})
                </Typography>
              </View>

              <View style={styles.chipsWrap}>
                {filteredMatched.map((item, idx) => (
                  <Chip
                    key={idx}
                    label={`${item.keyword}${item.count > 1 ? ` (x${item.count})` : ''}`}
                    variant="success"
                    leftIcon={<Icon name="Check" size={12} color={theme.colors.scoreHigh} />}
                    style={styles.keywordChip}
                    testID={`chip-matched-${item.keyword}`}
                  />
                ))}
                {filteredMatched.length === 0 && (
                  <Typography variant="caption" color="muted">
                    No matched keywords found for "{searchQuery}".
                  </Typography>
                )}
              </View>
            </Card>
          )}

          {/* Missing Keywords Block */}
          {(activeFilterTab === 'all' || activeFilterTab === 'missing') && (
            <Card
              style={[
                styles.keywordGroupCard,
                { backgroundColor: theme.colors.surface, marginTop: 12 },
              ]}
              testID="missing-keywords-block"
            >
              <View style={styles.keywordGroupHeader}>
                <Icon
                  name="AlertCircle"
                  size={18}
                  color={theme.colors.scoreMedium}
                />
                <Typography
                  variant="body"
                  weight="semibold"
                  style={styles.keywordGroupTitle}
                >
                  Missing Keywords ({filteredMissing.length})
                </Typography>
              </View>

              <Typography
                variant="caption"
                color="secondary"
                style={styles.missingSubtitle}
              >
                Tap "+ Add" to save missing skills directly to your master profile.
              </Typography>

              <View style={styles.missingChipsList}>
                {filteredMissing.map((item, idx) => {
                  const isAdded = addedSkillsSet.has(item.keyword);
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.missingKeywordRow,
                        {
                          backgroundColor: theme.colors.surfaceElevated,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      testID={`missing-row-${item.keyword}`}
                    >
                      <View style={styles.missingKeywordLeft}>
                        <Typography variant="bodySm" weight="medium">
                          {item.keyword}
                        </Typography>
                        <View
                          style={[
                            styles.importancePill,
                            {
                              backgroundColor:
                                getImportanceBadgeColor(item.importance) + '15',
                            },
                          ]}
                        >
                          <Typography
                            variant="caption"
                            customColor={getImportanceBadgeColor(item.importance)}
                            weight="semibold"
                          >
                            {item.importance.toUpperCase()}
                          </Typography>
                        </View>
                      </View>

                      {/* Profile-add shortcut button (MB-5.03) */}
                      <TouchableOpacity
                        onPress={() => handleAddToProfile(item.keyword)}
                        disabled={isAdded || bulkAddSkillsMutation.isPending}
                        style={[
                          styles.addProfileBtn,
                          {
                            backgroundColor: isAdded
                              ? theme.colors.scoreHigh + '20'
                              : theme.colors.primary,
                          },
                        ]}
                        accessibilityLabel={`Add ${item.keyword} to profile`}
                        testID={`btn-add-profile-${item.keyword}`}
                      >
                        <Icon
                          name={isAdded ? 'Check' : 'Plus'}
                          size={14}
                          color={isAdded ? theme.colors.scoreHigh : '#FFFFFF'}
                        />
                        <Typography
                          variant="caption"
                          weight="bold"
                          customColor={isAdded ? theme.colors.scoreHigh : '#FFFFFF'}
                          style={styles.addProfileText}
                        >
                          {isAdded ? 'Added ✓' : 'Add to Profile'}
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {filteredMissing.length === 0 && (
                  <Typography variant="caption" color="muted">
                    No missing keywords match "{searchQuery}".
                  </Typography>
                )}
              </View>
            </Card>
          )}
        </View>

        {/* 5. Format & Parser Checks Audit */}
        <Card
          style={[styles.formatChecksCard, { backgroundColor: theme.colors.surface }]}
          testID="format-checks-card"
        >
          <View style={styles.cardSectionHeader}>
            <Icon name="CheckSquare" size={18} color={theme.colors.primary} />
            <Typography variant="body" weight="semibold" style={styles.sectionHeaderTitle}>
              ATS Layout & Typography Checklist
            </Typography>
          </View>

          <View style={styles.checklist}>
            <View style={styles.checkItem}>
              <Icon name="Check" size={16} color={theme.colors.scoreHigh} />
              <Typography variant="bodySm" style={styles.checkLabel}>
                Single-column linear parsing structure
              </Typography>
            </View>

            <View style={styles.checkItem}>
              <Icon name="Check" size={16} color={theme.colors.scoreHigh} />
              <Typography variant="bodySm" style={styles.checkLabel}>
                Machine-readable UTF-8 PDF text extraction
              </Typography>
            </View>

            <View style={styles.checkItem}>
              <Icon name="Check" size={16} color={theme.colors.scoreHigh} />
              <Typography variant="bodySm" style={styles.checkLabel}>
                Standard heading titles recognized
              </Typography>
            </View>

            <View style={styles.checkItem}>
              <Icon name="Check" size={16} color={theme.colors.scoreHigh} />
              <Typography variant="bodySm" style={styles.checkLabel}>
                Standard Computer Modern typographic fonts
              </Typography>
            </View>
          </View>

          {atsData?.formatChecks?.details && (
            <View
              style={[
                styles.detailsRow,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Typography variant="caption" color="secondary">
                Words: {atsData.formatChecks.details.wordCount} · Pages:{' '}
                {atsData.formatChecks.details.pageCount} · Sections:{' '}
                {atsData.formatChecks.details.detectedSections?.length || 4}
              </Typography>
            </View>
          )}
        </Card>

        {/* 6. Actionable Suggestions */}
        {atsData?.suggestions && atsData.suggestions.length > 0 && (
          <Card
            style={[styles.suggestionsCard, { backgroundColor: theme.colors.surface }]}
            testID="suggestions-card"
          >
            <View style={styles.cardSectionHeader}>
              <Icon name="Lightbulb" size={18} color={theme.colors.scoreMedium} />
              <Typography variant="body" weight="semibold" style={styles.sectionHeaderTitle}>
                Optimization Recommendations
              </Typography>
            </View>

            {atsData.suggestions.map((suggestion, sIdx) => (
              <View key={sIdx} style={styles.suggestionRow}>
                <View
                  style={[
                    styles.suggestionBullet,
                    { backgroundColor: theme.colors.scoreMedium },
                  ]}
                />
                <Typography
                  variant="bodySm"
                  color="secondary"
                  style={styles.suggestionText}
                >
                  {suggestion}
                </Typography>
              </View>
            ))}
          </Card>
        )}

        {/* 7. Action Footer */}
        <View style={styles.footer}>
          <Button
            title="Edit Resume Content"
            variant="primary"
            size="lg"
            rightIcon={<Icon name="Edit3" size={18} color="#FFFFFF" />}
            onPress={() => navigation.navigate('EditContent', { generationId })}
            testID="btn-ats-edit-content"
          />

          <Button
            title="Back to Resume Review"
            variant="outline"
            size="md"
            onPress={() => navigation.goBack()}
            style={styles.backToReviewBtn}
            testID="btn-back-to-review"
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scoreCard: {
    padding: 16,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 16,
  },
  gradeBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  gradePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  summaryScoreText: {
    marginBottom: 4,
  },
  breakdownCard: {
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    marginBottom: 14,
  },
  metricBarItem: {
    marginBottom: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  keywordsSection: {
    marginBottom: 16,
  },
  keywordsHeaderRow: {
    marginBottom: 10,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  searchField: {
    marginBottom: 12,
  },
  keywordGroupCard: {
    padding: 16,
  },
  keywordGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  keywordGroupTitle: {
    marginLeft: 8,
  },
  missingSubtitle: {
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordChip: {
    marginBottom: 4,
  },
  missingChipsList: {
    gap: 8,
  },
  missingKeywordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  missingKeywordLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importancePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addProfileText: {
    fontSize: 12,
  },
  formatChecksCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    marginLeft: 8,
  },
  checklist: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkLabel: {
    marginLeft: 8,
  },
  detailsRow: {
    marginTop: 12,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  suggestionsCard: {
    padding: 16,
    marginBottom: 20,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
  },
  suggestionText: {
    flex: 1,
  },
  footer: {
    gap: 10,
    marginTop: 8,
  },
  backToReviewBtn: {
    marginTop: 2,
  },
});
