import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
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
  BottomSheet,
  Button,
  Card,
  Icon,
  Typography,
} from '../../components/ui';
import { RootStackParamList } from '../../types/navigation';
import {
  computeGenerationStages,
  useCancelGeneration,
  useGeneration,
  useGenerationStatus,
  useRetryGeneration,
} from '../../features/generation';
import { GenerationStatus, GenerationStepInfo } from '../../features/generation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ROTATING_TIPS = [
  'Quantified achievements (e.g. "reduced latency by 35%") score 40% higher on ATS screens.',
  'Our XeLaTeX compiler guarantees single-column, cleanly parsed sections that ATS readers love.',
  'We match the target job keywords and technical terminology directly in your experience bullets.',
  'Impact action verbs like "Spearheaded", "Architected", and "Accelerated" maximize hiring manager interest.',
  'Tailoring resumes to specific job descriptions increases interview callbacks by up to 3x.',
  'You will be able to review, edit bullet points, and re-render the PDF once generation completes.',
];

const TIP_INTERVAL_MS = 6500;
const AUTO_ADVANCE_DELAY_MS = 900;

/**
 * S-29 GenerationProgress Screen
 *
 * MB-4.05: Status polling hook with background throttling and foreground resume triggers.
 * MB-4.06: Vertical status stepper, elapsed timer, rotating user tips, and failure recovery cards.
 * MB-4.07: Back-press confirmation sheets for background generations and cancellation controls.
 */
export const GenerationProgressScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const generationId: string = route.params?.generationId || '';

  // --- API data hooks ---
  const { data: generationDetail } = useGeneration(generationId);
  const {
    data: statusData,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch,
  } = useGenerationStatus(generationId, {
    enabled: Boolean(generationId),
    pollInterval: 2500,
    backgroundPollInterval: 15000,
  });

  const cancelMutation = useCancelGeneration();
  const retryMutation = useRetryGeneration();

  // --- Current status & progress ---
  const currentStatus: GenerationStatus = useMemo(() => {
    if (statusData?.status) return statusData.status;
    if (generationDetail?.status) return (generationDetail.status.toLowerCase() as GenerationStatus);
    return 'queued';
  }, [statusData?.status, generationDetail?.status]);

  const rawProgress = statusData?.progress ?? 0;

  // Auto-calculated progress fallback based on status
  const displayProgress = useMemo(() => {
    if (currentStatus === 'completed') return 100;
    if (currentStatus === 'scoring') return Math.max(rawProgress, 90);
    if (currentStatus === 'compiling' || currentStatus === 'rendering') {
      return Math.max(rawProgress, 75);
    }
    if (currentStatus === 'tailoring') return Math.max(rawProgress, 50);
    if (currentStatus === 'analyzing') return Math.max(rawProgress, 30);
    if (currentStatus === 'parsing_jd' || currentStatus === 'extracting') {
      return Math.max(rawProgress, 15);
    }
    return Math.max(rawProgress, 10);
  }, [currentStatus, rawProgress]);

  const isTerminal =
    currentStatus === 'completed' ||
    currentStatus === 'failed' ||
    currentStatus === 'cancelled';

  // --- Stepper stages ---
  const stepperSteps: GenerationStepInfo[] = useMemo(() => {
    return computeGenerationStages(currentStatus, displayProgress);
  }, [currentStatus, displayProgress]);

  // --- Elapsed timer ---
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isTerminal) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTerminal]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // --- Rotating tips ---
  const [tipIndex, setTipIndex] = useState(0);
  const tipFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTerminal) return;

    const tipTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipFadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(tipFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      setTipIndex((prev) => (prev + 1) % ROTATING_TIPS.length);
    }, TIP_INTERVAL_MS);

    return () => clearInterval(tipTimer);
  }, [isTerminal, tipFadeAnim]);

  // --- Auto-advance when completed ---
  const hasAutoAdvancedRef = useRef(false);

  useEffect(() => {
    if (currentStatus === 'completed' && !hasAutoAdvancedRef.current) {
      hasAutoAdvancedRef.current = true;
      const timeout = setTimeout(() => {
        navigation.replace('Review', { generationId });
      }, AUTO_ADVANCE_DELAY_MS);

      return () => clearTimeout(timeout);
    }
  }, [currentStatus, generationId, navigation]);

  // --- Back navigation confirmation sheet (MB-4.07) ---
  const [isBackSheetVisible, setIsBackSheetVisible] = useState(false);

  const handleRequestBack = useCallback(() => {
    if (isTerminal) {
      navigation.goBack();
      return true;
    }
    // Generation in progress: open back confirmation sheet
    setIsBackSheetVisible(true);
    return true;
  }, [isTerminal, navigation]);

  // Hardware back press on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleRequestBack
    );
    return () => backHandler.remove();
  }, [handleRequestBack]);

  const handleKeepInBackground = useCallback(() => {
    setIsBackSheetVisible(false);
    // Navigate back to Dashboard or previous screen while keeping generation running
    navigation.navigate('AppTabs', { screen: 'DashboardTab' });
  }, [navigation]);

  const handleConfirmCancel = useCallback(() => {
    if (!generationId) {
      setIsBackSheetVisible(false);
      navigation.goBack();
      return;
    }

    cancelMutation.mutate(generationId, {
      onSettled: () => {
        setIsBackSheetVisible(false);
      },
    });
  }, [cancelMutation, generationId]);

  const handleRetry = useCallback(() => {
    if (!generationId) return;
    hasAutoAdvancedRef.current = false;
    setElapsedSeconds(0);
    retryMutation.mutate(generationId, {
      onSuccess: () => {
        refetch();
      },
    });
  }, [generationId, retryMutation, refetch]);

  const handleEditJobDescription = useCallback(() => {
    navigation.navigate('NewGeneration', { fromGenerationId: generationId });
  }, [navigation, generationId]);

  // Target job title & company subtitle
  const jobTitle = generationDetail?.jobTitle || 'Target Role';
  const company = generationDetail?.company || generationDetail?.companyName || '';

  // Get active step headline
  const activeStep = stepperSteps.find((s) => s.state === 'in_progress') || stepperSteps[0];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      testID="generation-progress-screen"
    >
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={handleRequestBack}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Back or dismiss generation screen"
          testID="btn-close-progress"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="X" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Typography variant="body" weight="bold" numberOfLines={1}>
            {currentStatus === 'completed'
              ? 'Resume Ready'
              : currentStatus === 'failed'
              ? 'Generation Failed'
              : 'Tailoring Resume'}
          </Typography>
          {(jobTitle || company) ? (
            <Typography variant="caption" color="secondary" numberOfLines={1}>
              {company ? `${jobTitle} • ${company}` : jobTitle}
            </Typography>
          ) : null}
        </View>

        {!isTerminal && (
          <TouchableOpacity
            onPress={() => setIsBackSheetVisible(true)}
            style={styles.cancelHeaderButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel ongoing generation"
            testID="btn-header-cancel"
          >
            <Typography variant="label" color="error">
              Cancel
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Status Hero Card */}
        <Card
          variant="elevated"
          style={[styles.heroCard, { backgroundColor: theme.colors.surfaceElevated }]}
        >
          {/* Circular / Progress Indicator */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroProgressLeft}>
              <Typography variant="h2" weight="bold" color="primary">
                {displayProgress}%
              </Typography>
              <Typography variant="caption" color="secondary">
                {currentStatus === 'completed'
                  ? 'Completed'
                  : currentStatus === 'failed'
                  ? 'Stopped'
                  : 'Progress'}
              </Typography>
            </View>

            {/* Elapsed Timer */}
            <View style={[styles.timerBadge, { backgroundColor: theme.colors.surface }]}>
              <Icon name="Clock" size={14} color={theme.colors.primary} />
              <Typography
                variant="label"
                weight="bold"
                color="primary"
                style={styles.timerText}
                testID="elapsed-timer"
              >
                {formattedTimer}
              </Typography>
            </View>
          </View>

          {/* Progress Bar */}
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
                  backgroundColor:
                    currentStatus === 'failed'
                      ? theme.colors.error
                      : currentStatus === 'completed'
                      ? theme.colors.success
                      : theme.colors.primary,
                  width: `${displayProgress}%`,
                },
              ]}
              testID="progress-bar-fill"
            />
          </View>

          {/* Current Stage Headline */}
          <View style={styles.stageStatusContainer}>
            {!isTerminal && (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={styles.stageSpinner}
              />
            )}
            <Typography
              variant="body"
              weight="semibold"
              color="primary"
              style={styles.stageHeadline}
              testID="stage-headline"
            >
              {currentStatus === 'completed'
                ? 'Resume successfully tailored and compiled!'
                : currentStatus === 'failed'
                ? 'Generation stopped due to an error'
                : currentStatus === 'cancelled'
                ? 'Generation was cancelled'
                : activeStep?.title || 'Processing your resume...'}
            </Typography>
          </View>
        </Card>

        {/* Failure Recovery Card (MB-4.06) */}
        {currentStatus === 'failed' && (
          <Card
            variant="outlined"
            style={[
              styles.recoveryCard,
              {
                backgroundColor: theme.colors.error + '10',
                borderColor: theme.colors.error,
              },
            ]}
            testID="failure-recovery-card"
          >
            <View style={styles.recoveryHeader}>
              <View
                style={[
                  styles.errorIconContainer,
                  { backgroundColor: theme.colors.error + '25' },
                ]}
              >
                <Icon name="AlertTriangle" size={22} color={theme.colors.error} />
              </View>
              <View style={styles.recoveryHeaderText}>
                <Typography variant="body" weight="bold" color="error">
                  Generation Interrupted
                </Typography>
                <Typography variant="bodySm" color="secondary">
                  {statusData?.errorMessage ||
                    generationDetail?.failureReason ||
                    'The resume tailoring engine encountered a temporary issue while processing.'}
                </Typography>
              </View>
            </View>

            <View style={styles.recoveryActions}>
              <Button
                title={retryMutation.isPending ? 'Retrying...' : 'Retry Generation'}
                variant="primary"
                size="md"
                loading={retryMutation.isPending}
                onPress={handleRetry}
                leftIcon={<Icon name="RefreshCw" size={16} color="#FFFFFF" />}
                testID="btn-retry-generation"
                style={styles.recoveryButton}
              />
              <Button
                title="Edit Job Description"
                variant="outline"
                size="md"
                onPress={handleEditJobDescription}
                leftIcon={<Icon name="FileEdit" size={16} color={theme.colors.textPrimary} />}
                testID="btn-edit-job-desc"
                style={styles.recoveryButton}
              />
            </View>
          </Card>
        )}

        {/* Cancelled Card */}
        {currentStatus === 'cancelled' && (
          <Card
            variant="outlined"
            style={[
              styles.recoveryCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
            testID="cancelled-card"
          >
            <View style={styles.recoveryHeader}>
              <View
                style={[
                  styles.errorIconContainer,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <Icon name="X" size={20} color={theme.colors.textMuted} />
              </View>
              <View style={styles.recoveryHeaderText}>
                <Typography variant="body" weight="bold">
                  Generation Cancelled
                </Typography>
                <Typography variant="bodySm" color="secondary">
                  This generation was stopped before completion. You can restart or return home.
                </Typography>
              </View>
            </View>

            <View style={styles.recoveryActions}>
              <Button
                title="Restart Generation"
                variant="primary"
                size="md"
                loading={retryMutation.isPending}
                onPress={handleRetry}
                testID="btn-restart-generation"
                style={styles.recoveryButton}
              />
              <Button
                title="Return to Dashboard"
                variant="outline"
                size="md"
                onPress={() => navigation.navigate('AppTabs', { screen: 'DashboardTab' })}
                testID="btn-return-dashboard"
                style={styles.recoveryButton}
              />
            </View>
          </Card>
        )}

        {/* Vertical Status Stepper (MB-4.06) */}
        <View style={styles.stepperContainer} testID="vertical-status-stepper">
          <Typography
            variant="label"
            weight="bold"
            color="secondary"
            style={styles.stepperSectionHeader}
          >
            TAILORING PIPELINE
          </Typography>

          {stepperSteps.map((step, index) => {
            const isLast = index === stepperSteps.length - 1;
            const isCompleted = step.state === 'completed';
            const isInProgress = step.state === 'in_progress';
            const isFailedStep = step.state === 'failed';

            return (
              <View key={step.id} style={styles.stepRow} testID={`step-row-${step.id}`}>
                {/* Stepper column: icon + connecting line */}
                <View style={styles.stepIndicatorColumn}>
                  <View
                    style={[
                      styles.stepIconWrapper,
                      isCompleted && {
                        backgroundColor: theme.colors.success,
                        borderColor: theme.colors.success,
                      },
                      isInProgress && {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      },
                      isFailedStep && {
                        backgroundColor: theme.colors.error,
                        borderColor: theme.colors.error,
                      },
                      !isCompleted &&
                        !isInProgress &&
                        !isFailedStep && {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                    ]}
                  >
                    {isCompleted ? (
                      <Icon name="Check" size={14} color="#FFFFFF" strokeWidth={3} />
                    ) : isInProgress ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : isFailedStep ? (
                      <Icon name="AlertCircle" size={14} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <View
                        style={[
                          styles.pendingDot,
                          { backgroundColor: theme.colors.textMuted },
                        ]}
                      />
                    )}
                  </View>

                  {!isLast && (
                    <View
                      style={[
                        styles.stepConnector,
                        {
                          backgroundColor: isCompleted
                            ? theme.colors.success
                            : theme.colors.border,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Step Text Details */}
                <View style={styles.stepDetailsColumn}>
                  <Typography
                    variant="body"
                    weight={isInProgress || isCompleted ? 'bold' : 'regular'}
                    color={
                      isFailedStep
                        ? 'error'
                        : isInProgress
                        ? 'primary'
                        : isCompleted
                        ? 'primary'
                        : 'secondary'
                    }
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={isInProgress ? 'primary' : 'secondary'}
                    style={styles.stepDescription}
                  >
                    {step.description}
                  </Typography>
                </View>
              </View>
            );
          })}
        </View>

        {/* Rotating User Tips (MB-4.06) */}
        {!isTerminal && (
          <Animated.View style={{ opacity: tipFadeAnim }}>
            <Card
              variant="outlined"
              style={[
                styles.tipCard,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
              testID="rotating-tip-card"
            >
              <View style={styles.tipHeader}>
                <Icon name="Sparkles" size={16} color={theme.colors.primary} />
                <Typography
                  variant="label"
                  weight="bold"
                  color="primary"
                  style={styles.tipLabel}
                >
                  PRO TIP #{tipIndex + 1}
                </Typography>
              </View>
              <Typography
                variant="bodySm"
                color="secondary"
                style={styles.tipBody}
                testID="tip-text"
              >
                {ROTATING_TIPS[tipIndex]}
              </Typography>

              {/* Tip Dots Indicator */}
              <View style={styles.tipDotsRow}>
                {ROTATING_TIPS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.tipDot,
                      {
                        backgroundColor:
                          i === tipIndex
                            ? theme.colors.primary
                            : theme.colors.border,
                        width: i === tipIndex ? 16 : 6,
                      },
                    ]}
                  />
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Completed manual action button fallback */}
        {currentStatus === 'completed' && (
          <View style={styles.completedActions} testID="completed-actions">
            <Button
              title="View Tailored Resume"
              variant="primary"
              size="lg"
              onPress={() => navigation.replace('Review', { generationId })}
              rightIcon={<Icon name="ArrowRight" size={18} color="#FFFFFF" />}
              testID="btn-view-resume"
            />
          </View>
        )}
      </ScrollView>

      {/* Back / Background Confirmation Sheet (MB-4.07) */}
      <BottomSheet
        visible={isBackSheetVisible}
        onClose={() => setIsBackSheetVisible(false)}
        title="Generation in Progress"
        snapPoints={[0.5]}
      >
        <View style={styles.sheetContent} testID="back-confirmation-sheet">
          <Typography variant="body" color="secondary" style={styles.sheetBody}>
            Your resume is actively being analyzed and tailored by the AI engine. What would you like to do?
          </Typography>

          <View style={styles.sheetButtons}>
            <Button
              title="Keep Running in Background"
              variant="primary"
              size="lg"
              onPress={handleKeepInBackground}
              leftIcon={<Icon name="Clock" size={18} color="#FFFFFF" />}
              testID="btn-keep-in-background"
              style={styles.sheetButton}
            />

            <Button
              title={cancelMutation.isPending ? 'Cancelling...' : 'Cancel Generation'}
              variant="destructive"
              size="lg"
              loading={cancelMutation.isPending}
              onPress={handleConfirmCancel}
              leftIcon={<Icon name="X" size={18} color="#FFFFFF" />}
              testID="btn-confirm-cancel-generation"
              style={styles.sheetButton}
            />

            <Button
              title="Stay on Screen"
              variant="ghost"
              size="md"
              onPress={() => setIsBackSheetVisible(false)}
              testID="btn-stay-on-screen"
              style={styles.sheetButton}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  cancelHeaderButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 18,
    marginBottom: 16,
    borderRadius: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroProgressLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  timerText: {
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageSpinner: {
    marginRight: 8,
  },
  stageHeadline: {
    flex: 1,
  },
  recoveryCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 14,
  },
  recoveryHeader: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
  },
  errorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryHeaderText: {
    flex: 1,
    gap: 4,
  },
  recoveryActions: {
    flexDirection: 'column',
    gap: 10,
  },
  recoveryButton: {
    width: '100%',
  },
  stepperContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  stepperSectionHeader: {
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 56,
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  stepIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
  },
  stepDetailsColumn: {
    flex: 1,
    paddingBottom: 16,
  },
  stepDescription: {
    marginTop: 2,
    lineHeight: 18,
  },
  tipCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipLabel: {
    letterSpacing: 0.5,
  },
  tipBody: {
    lineHeight: 20,
    marginBottom: 10,
  },
  tipDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipDot: {
    height: 4,
    borderRadius: 2,
  },
  completedActions: {
    marginTop: 8,
  },
  sheetContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  sheetBody: {
    lineHeight: 22,
    marginBottom: 20,
  },
  sheetButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  sheetButton: {
    width: '100%',
  },
});
