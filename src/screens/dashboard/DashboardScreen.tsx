import React from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { Button, Card, Chip, Icon, ScoreGauge, Typography } from '../../components/ui';
import { OfflineBanner } from '../../components/feedback';
import { useDashboardSummary } from '../../features/dashboard';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, refetch, isRefetching } = useDashboardSummary();

  const metrics = data?.metrics || {
    totalResumes: 0,
    completedResumes: 0,
    failedResumes: 0,
    inProgressResumes: 0,
    averageAtsScore: 85,
  };

  const quotas = data?.quotas || {
    dailyLimit: 10,
    dailyUsed: 0,
    dailyRemaining: 10,
  };

  const avgScore = metrics.averageAtsScore ?? 85;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      testID="dashboard-screen"
    >
      <OfflineBanner onRetry={refetch} />

      {/* 1. Header Greeting & CTA */}
      <View style={styles.header}>
        <View style={styles.greetingCol}>
          <Typography variant="caption" color="secondary" weight="semibold">
            RESUME INTELLIGENCE
          </Typography>
          <Typography variant="h2" weight="bold">
            Hi, {user?.name?.split(' ')[0] || 'Engineer'}
          </Typography>
        </View>

        <Button
          title="New Resume"
          variant="primary"
          size="sm"
          leftIcon={<Icon name="Plus" size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate('NewGeneration', {})}
          testID="btn-dashboard-new-generation"
        />
      </View>

      {/* 2. Quota & ATS Score Gauge Card (MB-6.01) */}
      <Card variant="elevated" style={styles.gaugeCard}>
        <View style={styles.gaugeRow}>
          <View style={styles.gaugeLeft}>
            <Typography variant="caption" weight="bold" color="secondary">
              AVG ATS PERFORMANCE
            </Typography>
            <Typography variant="h1" weight="bold" customColor={theme.colors.primary}>
              {avgScore}
              <Typography variant="bodySm" color="secondary">
                /100
              </Typography>
            </Typography>
            <Typography variant="caption" color="muted">
              Based on {metrics.totalResumes || 1} tailored generations
            </Typography>
          </View>

          <ScoreGauge score={avgScore} size={90} strokeWidth={9} style={styles.gauge} />
        </View>

        <View style={[styles.quotaDivider, { backgroundColor: theme.colors.border }]} />

        {/* Quota Usage Meter */}
        <View style={styles.quotaRow}>
          <View style={styles.quotaInfo}>
            <Icon name="Zap" size={16} color={theme.colors.primary} />
            <Typography variant="bodySm" weight="medium">
              Daily Tailoring Quota
            </Typography>
          </View>
          <Typography variant="caption" weight="bold" customColor={theme.colors.primary}>
            {quotas.dailyRemaining} remaining ({quotas.dailyUsed}/{quotas.dailyLimit})
          </Typography>
        </View>
      </Card>

      {/* 3. Metrics Summary Strip */}
      <View style={styles.metricsGrid}>
        <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="FileText" size={20} color={theme.colors.primary} />
          <Typography variant="h3" weight="bold" style={styles.metricVal}>
            {metrics.totalResumes}
          </Typography>
          <Typography variant="caption" color="secondary">
            Total Tailored
          </Typography>
        </Card>

        <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="CheckCircle" size={20} color={theme.colors.scoreHigh} />
          <Typography variant="h3" weight="bold" style={styles.metricVal}>
            {metrics.completedResumes}
          </Typography>
          <Typography variant="caption" color="secondary">
            Compiled Ready
          </Typography>
        </Card>

        <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Icon name="Clock" size={20} color={theme.colors.scoreMedium} />
          <Typography variant="h3" weight="bold" style={styles.metricVal}>
            {metrics.inProgressResumes}
          </Typography>
          <Typography variant="caption" color="secondary">
            In Pipeline
          </Typography>
        </Card>
      </View>

      {/* 4. Quick Tools Bar */}
      <Typography variant="caption" weight="bold" color="secondary" style={styles.sectionTitle}>
        QUICK TOOL SHORTCUTS
      </Typography>

      <View style={styles.quickToolsRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('AtsChecker' as any)}
          style={[styles.toolCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          testID="btn-dashboard-ats-checker"
        >
          <View style={[styles.toolIcon, { backgroundColor: theme.colors.primaryLight + '20' }]}>
            <Icon name="Target" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.toolTexts}>
            <Typography variant="bodySm" weight="bold">
              Standalone ATS Checker
            </Typography>
            <Typography variant="caption" color="secondary">
              Upload external PDF for immediate scoring
            </Typography>
          </View>
          <Icon name="ChevronRight" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* 5. Recent Resumes List */}
      <View style={styles.recentSectionHeader}>
        <Typography variant="caption" weight="bold" color="secondary">
          RECENT TAILORED RESUMES
        </Typography>
        <TouchableOpacity
          onPress={() => navigation.navigate('AppTabs', { screen: 'HistoryTab' } as any)}
          testID="btn-dashboard-view-all-history"
        >
          <Typography variant="caption" weight="semibold" customColor={theme.colors.primary}>
            View All
          </Typography>
        </TouchableOpacity>
      </View>

      {isLoading && !data ? (
        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
      ) : data?.recentGenerations && data.recentGenerations.length > 0 ? (
        data.recentGenerations.slice(0, 3).map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate('Review', { generationId: item.id })}
            activeOpacity={0.7}
            testID={`dashboard-recent-${item.id}`}
          >
            <Card style={[styles.recentCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.recentCardRow}>
                <View style={styles.recentInfo}>
                  <Typography variant="bodySm" weight="bold" numberOfLines={1}>
                    {item.jobTitle}
                  </Typography>
                  <Typography variant="caption" color="secondary" numberOfLines={1}>
                    {item.company}
                  </Typography>
                </View>

                {item.atsScore !== null && (
                  <View
                    style={[
                      styles.scoreChip,
                      {
                        backgroundColor:
                          item.atsScore >= 75
                            ? theme.colors.scoreHigh + '20'
                            : theme.colors.scoreMedium + '20',
                      },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      weight="bold"
                      customColor={
                        item.atsScore >= 75 ? theme.colors.scoreHigh : theme.colors.scoreMedium
                      }
                    >
                      ATS {item.atsScore}
                    </Typography>
                  </View>
                )}

                <Icon name="ChevronRight" size={18} color={theme.colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.emptyRecentCard}>
          <Typography variant="bodySm" color="secondary">
            No resumes tailored yet. Tap "New Resume" to begin.
          </Typography>
        </Card>
      )}

      {/* 6. Top Industry Keywords */}
      {data?.topKeywords && data.topKeywords.length > 0 && (
        <View style={styles.keywordsSection}>
          <Typography variant="caption" weight="bold" color="secondary" style={styles.sectionTitle}>
            TOP MATCHED SKILLS
          </Typography>
          <View style={styles.keywordChips}>
            {data.topKeywords.slice(0, 8).map((kw) => (
              <Chip
                key={kw.keyword}
                label={`${kw.keyword} (${kw.count})`}
                variant="filter"
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingCol: {
    flex: 1,
  },
  gaugeCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeLeft: {
    flex: 1,
  },
  gauge: {
    marginLeft: 16,
  },
  quotaDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricVal: {
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 4,
  },
  quickToolsRow: {
    marginBottom: 18,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  toolIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTexts: {
    flex: 1,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentInfo: {
    flex: 1,
  },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyRecentCard: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
  },
  keywordsSection: {
    marginTop: 12,
  },
  keywordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
