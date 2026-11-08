import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';
import { Button, Card, Chip, Icon, Typography } from '../../../components/ui';
import {
  ChangeSummary,
  TailoredContent,
  TailoredExperience,
} from '../../../features/generation/types';

export interface ChangesTabProps {
  changeSummary?: ChangeSummary | null;
  tailoredContent?: TailoredContent | null;
  originalTailoredContent?: TailoredContent | null;
  onResetToAi?: () => void;
  onEditContent?: () => void;
  isResetting?: boolean;
  testID?: string;
}

interface BulletDiffItem {
  id: string;
  sourceBulletId?: string;
  originalText: string | null;
  tailoredText: string;
  isModified: boolean;
  keywordsMatched: string[];
}

interface ExperienceDiffItem {
  id: string;
  company: string;
  position: string;
  startDate?: string;
  endDate?: string | null;
  isCurrent?: boolean;
  location?: string;
  bullets: BulletDiffItem[];
}

export const ChangesTab: React.FC<ChangesTabProps> = ({
  changeSummary,
  tailoredContent,
  originalTailoredContent,
  onResetToAi,
  onEditContent,
  isResetting = false,
  testID = 'changes-tab',
}) => {
  const { theme } = useTheme();

  // Build role-based before/after diff structure
  const experienceDiffs = useMemo<ExperienceDiffItem[]>(() => {
    if (!tailoredContent?.experience) return [];

    // Map original bullets by ID or by text
    const originalBulletMap = new Map<string, string>();
    const originalBulletsList: string[] = [];

    if (originalTailoredContent?.experience) {
      for (const origExp of originalTailoredContent.experience) {
        if (origExp.bullets && Array.isArray(origExp.bullets)) {
          for (const b of origExp.bullets) {
            const bText = typeof b === 'string' ? b : b?.text || '';
            const bId = typeof b === 'object' ? b?.id : undefined;
            const bSourceId = typeof b === 'object' ? b?.sourceBulletId : undefined;
            if (bId) originalBulletMap.set(bId, bText);
            if (bSourceId) originalBulletMap.set(bSourceId, bText);
            if (bText) originalBulletsList.push(bText);
          }
        }
      }
    }

    return tailoredContent.experience.map((exp: TailoredExperience, expIdx: number) => {
      const origExp = originalTailoredContent?.experience?.find(
        (oe) => oe.id === exp.id || oe.company.toLowerCase() === exp.company.toLowerCase()
      );

      const bullets: BulletDiffItem[] = (exp.bullets || []).map((b, bIdx) => {
        const tailoredText = typeof b === 'string' ? b : b?.text || '';
        let originalText: string | null = null;

        const bId = typeof b === 'object' ? b?.id : undefined;
        const bSourceId = typeof b === 'object' ? b?.sourceBulletId : undefined;

        if (bSourceId && originalBulletMap.has(bSourceId)) {
          originalText = originalBulletMap.get(bSourceId)!;
        } else if (bId && originalBulletMap.has(bId)) {
          originalText = originalBulletMap.get(bId)!;
        } else if (origExp?.bullets?.[bIdx]) {
          const rawOrig = origExp.bullets[bIdx];
          originalText = typeof rawOrig === 'string' ? rawOrig : rawOrig?.text || null;
        } else if (originalBulletsList[bIdx]) {
          originalText = originalBulletsList[bIdx];
        }

        const isModified = Boolean(
          originalText && originalText.trim() !== tailoredText.trim()
        );

        return {
          id: bId || `bullet-${expIdx}-${bIdx}`,
          sourceBulletId: bSourceId,
          originalText,
          tailoredText,
          isModified: isModified || !originalText,
          keywordsMatched: (typeof b === 'object' && b?.keywordsMatched) || [],
        };
      });

      return {
        id: exp.id || `exp-${expIdx}`,
        company: exp.company,
        position: exp.position || exp.title || 'Role',
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent || exp.current,
        location: exp.location,
        bullets,
      };
    });
  }, [tailoredContent, originalTailoredContent]);

  // Summary Diff
  const summaryDiff = useMemo(() => {
    const rawOrig = originalTailoredContent?.summary;
    const rawTailored = tailoredContent?.summary;
    const origSummary = typeof rawOrig === 'string' ? rawOrig.trim() : '';
    const tailoredSummary = typeof rawTailored === 'string' ? rawTailored.trim() : '';
    const hasChanged = origSummary !== tailoredSummary && Boolean(origSummary && tailoredSummary);

    return {
      origSummary,
      tailoredSummary,
      hasChanged,
    };
  }, [originalTailoredContent?.summary, tailoredContent?.summary]);

  // Tailored Skills
  const prioritizedSkills = useMemo(() => {
    return tailoredContent?.skills?.filter((s) => s.isHighlighted) || [];
  }, [tailoredContent?.skills]);

  const bulletsModifiedCount =
    changeSummary?.bulletsModified ??
    experienceDiffs.reduce(
      (acc, exp) => acc + exp.bullets.filter((b) => b.isModified).length,
      0
    );

  const totalBulletsCount =
    changeSummary?.totalBulletsTailored ??
    experienceDiffs.reduce((acc, exp) => acc + exp.bullets.length, 0);

  const tailoringScore =
    changeSummary?.tailoringScore ??
    (totalBulletsCount > 0
      ? Math.round((bulletsModifiedCount / totalBulletsCount) * 100)
      : 80);

  const matchedKeywordsList = changeSummary?.matchedKeywords || [];

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. High-Level AI Metric Stats Strip */}
      <View style={styles.metricsRow}>
        <Card
          style={[styles.metricCard, { backgroundColor: theme.colors.surfaceElevated }]}
          testID="metric-bullets-modified"
        >
          <Typography variant="h3" weight="bold" customColor={theme.colors.primary}>
            {bulletsModifiedCount}/{totalBulletsCount}
          </Typography>
          <Typography variant="caption" color="secondary">
            Bullets Optimized
          </Typography>
        </Card>

        <Card
          style={[styles.metricCard, { backgroundColor: theme.colors.surfaceElevated }]}
          testID="metric-keywords-aligned"
        >
          <Typography
            variant="h3"
            weight="bold"
            customColor={theme.colors.scoreHigh}
          >
            {matchedKeywordsList.length}
          </Typography>
          <Typography variant="caption" color="secondary">
            Keywords Matched
          </Typography>
        </Card>

        <Card
          style={[styles.metricCard, { backgroundColor: theme.colors.surfaceElevated }]}
          testID="metric-tailoring-score"
        >
          <Typography
            variant="h3"
            weight="bold"
            customColor={theme.colors.scoreHigh}
          >
            {tailoringScore}%
          </Typography>
          <Typography variant="caption" color="secondary">
            Tailoring Score
          </Typography>
        </Card>
      </View>

      {/* 2. AI Optimization Notes Summary */}
      <Card
        style={[styles.notesCard, { backgroundColor: theme.colors.surface }]}
        testID="ai-notes-card"
      >
        <View style={styles.cardHeader}>
          <Icon name="Sparkles" size={18} color={theme.colors.primary} />
          <Typography variant="body" weight="semibold" style={styles.cardTitle}>
            AI Optimization Summary
          </Typography>
        </View>

        {changeSummary?.notes && changeSummary.notes.length > 0 ? (
          changeSummary.notes.map((note, idx) => (
            <View key={idx} style={styles.noteRow}>
              <View
                style={[
                  styles.noteBulletDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <Typography
                variant="bodySm"
                color="secondary"
                style={styles.noteText}
              >
                {note}
              </Typography>
            </View>
          ))
        ) : (
          <Typography variant="bodySm" color="secondary">
            Resume bullets and summary were targeted for this job description, highlighting
            quantifiable impacts and alignment with candidate qualifications.
          </Typography>
        )}

        {/* Remediation notes if any */}
        {changeSummary?.remediationNotes &&
          changeSummary.remediationNotes.length > 0 && (
            <View
              style={[
                styles.remediationBox,
                { backgroundColor: theme.colors.scoreMedium + '15' },
              ]}
            >
              <View style={styles.remediationHeader}>
                <Icon
                  name="ShieldCheck"
                  size={16}
                  color={theme.colors.scoreMedium}
                />
                <Typography
                  variant="caption"
                  weight="semibold"
                  customColor={theme.colors.scoreMedium}
                  style={styles.remediationTitle}
                >
                  Hallucination Prevention Guardrails
                </Typography>
              </View>
              {changeSummary.remediationNotes.map((rem, rIdx) => (
                <Typography
                  key={rIdx}
                  variant="caption"
                  color="secondary"
                  style={styles.remediationText}
                >
                  • {rem}
                </Typography>
              ))}
            </View>
          )}
      </Card>

      {/* 3. Matched Keywords Strip */}
      {matchedKeywordsList.length > 0 && (
        <View style={styles.keywordsSection}>
          <Typography
            variant="caption"
            weight="semibold"
            color="secondary"
            style={styles.sectionHeader}
          >
            KEYWORDS INTEGRATED IN BULLETS
          </Typography>
          <View style={styles.chipsWrap}>
            {matchedKeywordsList.map((kw, i) => (
              <Chip
                key={i}
                label={kw}
                variant="success"
                leftIcon={<Icon name="Check" size={12} color={theme.colors.scoreHigh} />}
                style={styles.keywordChip}
              />
            ))}
          </View>
        </View>
      )}

      {/* 4. Professional Summary Diff */}
      {summaryDiff.hasChanged && (
        <Card
          style={[styles.diffSectionCard, { backgroundColor: theme.colors.surface }]}
          testID="summary-diff-card"
        >
          <Typography variant="body" weight="semibold" style={styles.diffHeaderTitle}>
            Professional Summary Diff
          </Typography>

          <View style={styles.diffComparison}>
            {/* Original Summary */}
            <View
              style={[
                styles.diffSide,
                {
                  backgroundColor: theme.colors.scoreLow + '10',
                  borderColor: theme.colors.scoreLow + '30',
                },
              ]}
            >
              <View style={styles.diffBadgeRow}>
                <Chip
                  label="Original Summary"
                  variant="default"
                  style={styles.diffTagChip}
                />
              </View>
              <Typography variant="bodySm" color="secondary">
                {summaryDiff.origSummary}
              </Typography>
            </View>

            {/* Tailored Summary */}
            <View
              style={[
                styles.diffSide,
                {
                  backgroundColor: theme.colors.scoreHigh + '12',
                  borderColor: theme.colors.scoreHigh + '30',
                  marginTop: 8,
                },
              ]}
            >
              <View style={styles.diffBadgeRow}>
                <Chip
                  label="Tailored Summary"
                  variant="success"
                  leftIcon={<Icon name="Sparkles" size={12} color={theme.colors.scoreHigh} />}
                  style={styles.diffTagChip}
                />
              </View>
              <Typography variant="bodySm" weight="medium">
                {summaryDiff.tailoredSummary}
              </Typography>
            </View>
          </View>
        </Card>
      )}

      {/* 5. Role-Based Before/After Diffs */}
      <View style={styles.rolesSection}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionHeader}
        >
          EXPERIENCE BULLET POINT DIFFS
        </Typography>

        {experienceDiffs.map((exp) => (
          <Card
            key={exp.id}
            style={[styles.roleCard, { backgroundColor: theme.colors.surface }]}
            testID={`role-diff-${exp.id}`}
          >
            {/* Role Header */}
            <View style={styles.roleHeader}>
              <View style={styles.roleTitleCol}>
                <Typography variant="body" weight="bold">
                  {exp.position}
                </Typography>
                <Typography variant="bodySm" customColor={theme.colors.primary}>
                  {exp.company}
                </Typography>
              </View>
              {exp.startDate && (
                <Typography variant="caption" color="muted">
                  {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || ''}
                </Typography>
              )}
            </View>

            {/* Bullets List */}
            <View style={styles.bulletsList}>
              {exp.bullets.map((b, bIdx) => (
                <View
                  key={b.id || bIdx}
                  style={[
                    styles.bulletDiffItem,
                    { borderBottomColor: theme.colors.border },
                    bIdx === exp.bullets.length - 1 && styles.lastBulletItem,
                  ]}
                >
                  {b.isModified ? (
                    <View style={styles.diffPair}>
                      {/* Before / Original */}
                      {b.originalText && (
                        <View
                          style={[
                            styles.diffBox,
                            {
                              backgroundColor: theme.colors.surfaceElevated,
                              borderColor: theme.colors.border,
                            },
                          ]}
                        >
                          <View style={styles.diffBoxHeader}>
                            <View
                              style={[
                                styles.pillBadge,
                                { backgroundColor: theme.colors.border },
                              ]}
                            >
                              <Typography variant="caption" color="muted" weight="semibold">
                                Original
                              </Typography>
                            </View>
                          </View>
                          <Typography
                            variant="bodySm"
                            color="muted"
                            style={styles.originalTextStrikethrough}
                          >
                            {b.originalText}
                          </Typography>
                        </View>
                      )}

                      {/* After / Tailored */}
                      <View
                        style={[
                          styles.diffBox,
                          {
                            backgroundColor: theme.colors.scoreHigh + '10',
                            borderColor: theme.colors.scoreHigh + '40',
                            marginTop: b.originalText ? 6 : 0,
                          },
                        ]}
                      >
                        <View style={styles.diffBoxHeader}>
                          <View
                            style={[
                              styles.pillBadge,
                              { backgroundColor: theme.colors.scoreHigh + '25' },
                            ]}
                          >
                            <Typography
                              variant="caption"
                              customColor={theme.colors.scoreHigh}
                              weight="semibold"
                            >
                              Tailored
                            </Typography>
                          </View>
                        </View>
                        <Typography variant="bodySm" weight="medium">
                          {b.tailoredText}
                        </Typography>

                        {/* Matched keywords in this bullet */}
                        {b.keywordsMatched.length > 0 && (
                          <View style={styles.bulletKeywordsRow}>
                            {b.keywordsMatched.map((kw, kwIdx) => (
                              <Chip
                                key={kwIdx}
                                label={kw}
                                variant="success"
                                style={styles.bulletKeywordChip}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    /* Unchanged Bullet */
                    <View
                      style={[
                        styles.diffBox,
                        {
                          backgroundColor: theme.colors.surfaceElevated,
                          borderColor: theme.colors.border,
                        },
                      ]}
                    >
                      <View style={styles.diffBoxHeader}>
                        <View
                          style={[
                            styles.pillBadge,
                            { backgroundColor: theme.colors.border },
                          ]}
                        >
                          <Typography variant="caption" color="muted" weight="semibold">
                            Unchanged
                          </Typography>
                        </View>
                      </View>
                      <Typography variant="bodySm" color="secondary">
                        {b.tailoredText}
                      </Typography>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>

      {/* 6. Skills Prioritized */}
      {prioritizedSkills.length > 0 && (
        <Card
          style={[styles.skillsCard, { backgroundColor: theme.colors.surface }]}
          testID="prioritized-skills-card"
        >
          <View style={styles.cardHeader}>
            <Icon name="Target" size={18} color={theme.colors.primary} />
            <Typography variant="body" weight="semibold" style={styles.cardTitle}>
              Target Skills Highlighted in LaTeX
            </Typography>
          </View>
          <View style={styles.chipsWrap}>
            {prioritizedSkills.map((sk, idx) => (
              <Chip
                key={idx}
                label={sk.name}
                variant="primary"
                leftIcon={<Icon name="Sparkles" size={12} color={theme.colors.primary} />}
                style={styles.skillChip}
              />
            ))}
          </View>
        </Card>
      )}

      {/* 7. Action Footer */}
      <View style={styles.actionFooter}>
        {onResetToAi && (
          <Button
            title="Reset to AI Version"
            variant="outline"
            leftIcon={<Icon name="RotateCcw" size={16} color={theme.colors.textPrimary} />}
            onPress={onResetToAi}
            loading={isResetting}
            disabled={isResetting}
            style={styles.actionBtn}
            testID="btn-reset-to-ai"
          />
        )}

        {onEditContent && (
          <Button
            title="Edit Resume Content"
            variant="primary"
            rightIcon={<Icon name="Edit3" size={16} color="#FFFFFF" />}
            onPress={onEditContent}
            style={styles.actionBtn}
            testID="btn-edit-content-from-changes"
          />
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    marginLeft: 8,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
  },
  noteText: {
    flex: 1,
  },
  remediationBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  remediationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  remediationTitle: {
    marginLeft: 6,
  },
  remediationText: {
    marginTop: 2,
  },
  keywordsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordChip: {
    marginBottom: 4,
  },
  diffSectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  diffHeaderTitle: {
    marginBottom: 12,
  },
  diffComparison: {
    flexDirection: 'column',
  },
  diffSide: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffBadgeRow: {
    marginBottom: 6,
  },
  diffTagChip: {
    alignSelf: 'flex-start',
  },
  rolesSection: {
    marginBottom: 16,
  },
  roleCard: {
    padding: 16,
    marginBottom: 14,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e140',
    paddingBottom: 8,
  },
  roleTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  bulletsList: {
    gap: 12,
  },
  bulletDiffItem: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastBulletItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  diffPair: {
    gap: 6,
  },
  diffBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  originalTextStrikethrough: {
    lineHeight: 18,
  },
  bulletKeywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  bulletKeywordChip: {
    transform: [{ scale: 0.9 }],
  },
  skillsCard: {
    padding: 16,
    marginBottom: 20,
  },
  skillChip: {
    marginBottom: 4,
  },
  actionFooter: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    width: '100%',
  },
});
