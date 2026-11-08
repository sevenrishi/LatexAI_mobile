import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Chip,
  ConfirmDialog,
  Icon,
  Typography,
} from '../../components/ui';
import { RootStackParamList } from '../../types/navigation';
import {
  useGeneration,
  useRerenderGeneration,
  useResetTailoredContent,
} from '../../features/generation';
import { useUiStore } from '../../store/uiStore';
import { InlinePdfViewer } from './components/InlinePdfViewer';
import { ChangesTab } from './components/ChangesTab';
import {
  downloadResumePdfToDevice,
  downloadResumeTexToDevice,
  shareResumePdf,
  shareResumeTex,
} from '../../utils/shareUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ReviewActiveTab = 'preview' | 'changes' | 'jobDescription';

export const ReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore((state) => state.showToast);

  const generationId: string = route.params?.generationId || '';

  // Data queries & mutations
  const {
    data: generation,
    isLoading: isGenLoading,
    refetch: refetchGeneration,
  } = useGeneration(generationId);

  const rerenderMutation = useRerenderGeneration();
  const resetMutation = useResetTailoredContent();

  // Local UI states
  const [activeTab, setActiveTab] = useState<ReviewActiveTab>('preview');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  const jobTitle = generation?.jobTitle || 'Resume';
  const companyName = generation?.companyName || generation?.company || 'Target Role';
  const atsScore = generation?.atsScore ?? 88;
  const isOutOfDate = Boolean(generation?.isOutOfDate);
  const pdfUrl = generation?.pdfUrl || null;
  const pageCount = generation?.pageCount ?? 1;
  const targetPageCount = generation?.targetPageCount ?? 1;

  const scoreBadgeColor = useMemo(() => {
    if (atsScore >= 75) return theme.colors.scoreHigh;
    if (atsScore >= 50) return theme.colors.scoreMedium;
    return theme.colors.scoreLow;
  }, [atsScore, theme]);

  // Handle re-render PDF
  const handleRerender = () => {
    rerenderMutation.mutate(generationId, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'PDF Re-rendered',
          message: 'Resume compiled successfully with your latest edits.',
        });
        refetchGeneration();
      },
      onError: (err: any) => {
        showToast({
          type: 'error',
          title: 'Compilation Failed',
          message: err?.message || 'Failed to re-render resume PDF.',
        });
      },
    });
  };

  // Handle reset to AI version
  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    resetMutation.mutate(generationId, {
      onSuccess: () => {
        showToast({
          type: 'info',
          title: 'Reset Completed',
          message: 'Resume restored to original AI-generated content.',
        });
        refetchGeneration();
      },
      onError: (err: any) => {
        showToast({
          type: 'error',
          title: 'Reset Failed',
          message: err?.message || 'Failed to reset tailored content.',
        });
      },
    });
  };

  // Fullscreen PDF navigation
  const handleFullscreenPdf = () => {
    if (pdfUrl) {
      navigation.navigate('PdfViewerModal', {
        url: pdfUrl,
        title: `${jobTitle} Resume`,
      });
    } else {
      showToast({
        type: 'warning',
        message: 'No PDF available for fullscreen preview.',
      });
    }
  };

  // Cross-platform Share & Download handlers (MB-5.07)
  const handleSharePdf = async () => {
    setIsMenuOpen(false);
    try {
      await shareResumePdf(generationId, `${jobTitle} Resume`);
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Failed to share PDF.' });
    }
  };

  const handleShareTex = async () => {
    setIsMenuOpen(false);
    try {
      await shareResumeTex(generationId, `${jobTitle} LaTeX Source`);
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Failed to share LaTeX source.' });
    }
  };

  const handleDownloadPdf = async () => {
    setIsMenuOpen(false);
    try {
      showToast({ type: 'info', message: 'Saving PDF to device...' });
      const res = await downloadResumePdfToDevice(generationId);
      if (res.success) {
        showToast({ type: 'success', message: 'PDF saved to device storage.' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Failed to save PDF.' });
    }
  };

  const handleDownloadTex = async () => {
    setIsMenuOpen(false);
    try {
      showToast({ type: 'info', message: 'Saving LaTeX source to device...' });
      const res = await downloadResumeTexToDevice(generationId);
      if (res.success) {
        showToast({ type: 'success', message: 'LaTeX source (.tex) saved.' });
      }
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Failed to save LaTeX source.' });
    }
  };

  if (isGenLoading && !generation) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography variant="bodySm" color="secondary" style={styles.loadingText}>
          Loading resume preview...
        </Typography>
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="review-screen"
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
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
          accessibilityLabel="Back"
          testID="btn-review-back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Typography variant="body" weight="bold" numberOfLines={1}>
            {jobTitle}
          </Typography>
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {companyName}
          </Typography>
        </View>

        {/* ATS Score Header Shortcut Pill */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AtsReport', { generationId })}
          style={[
            styles.headerAtsPill,
            { backgroundColor: scoreBadgeColor + '20', borderColor: scoreBadgeColor },
          ]}
          accessibilityLabel={`ATS Score: ${atsScore}`}
          testID="btn-header-ats-shortcut"
        >
          <Icon name="Target" size={14} color={scoreBadgeColor} />
          <Typography
            variant="caption"
            weight="bold"
            customColor={scoreBadgeColor}
            style={styles.headerAtsText}
          >
            {atsScore}
          </Typography>
        </TouchableOpacity>

        {/* Edit Content Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('EditContent', { generationId })}
          style={styles.headerIconButton}
          accessibilityLabel="Edit Resume Content"
          testID="btn-header-edit-content"
        >
          <Icon name="Edit3" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* More Actions Menu */}
        <TouchableOpacity
          onPress={() => setIsMenuOpen(true)}
          style={styles.headerIconButton}
          accessibilityLabel="More Options"
          testID="btn-review-menu"
        >
          <Icon name="MoreVertical" size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* 2. Summary Strip (MB-5.01) */}
      <View
        style={[
          styles.summaryStrip,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderBottomColor: theme.colors.border,
          },
        ]}
        testID="review-summary-strip"
      >
        <View style={styles.summaryStripRow}>
          {/* ATS Score Badge - tap navigates to AtsReport */}
          <TouchableOpacity
            onPress={() => navigation.navigate('AtsReport', { generationId })}
            style={[
              styles.atsScoreBadge,
              { backgroundColor: scoreBadgeColor + '18', borderColor: scoreBadgeColor },
            ]}
            testID="btn-summary-ats-badge"
          >
            <Typography variant="caption" weight="bold" customColor={scoreBadgeColor}>
              ATS: {atsScore}/100
            </Typography>
            <Icon name="ChevronRight" size={12} color={scoreBadgeColor} />
          </TouchableOpacity>

          {/* Page Budget Pill */}
          <View
            style={[
              styles.stripBadge,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Icon name="File" size={12} color={theme.colors.textMuted} />
            <Typography variant="caption" color="secondary" style={styles.badgeText}>
              {pageCount} of {targetPageCount} {pageCount === 1 ? 'Page' : 'Pages'}
            </Typography>
          </View>

          {/* Freshness Status Pill */}
          <View
            style={[
              styles.stripBadge,
              {
                backgroundColor: isOutOfDate
                  ? theme.colors.scoreMedium + '15'
                  : theme.colors.scoreHigh + '15',
                borderColor: isOutOfDate
                  ? theme.colors.scoreMedium + '40'
                  : theme.colors.scoreHigh + '40',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOutOfDate
                    ? theme.colors.scoreMedium
                    : theme.colors.scoreHigh,
                },
              ]}
            />
            <Typography
              variant="caption"
              weight="semibold"
              customColor={
                isOutOfDate ? theme.colors.scoreMedium : theme.colors.scoreHigh
              }
            >
              {isOutOfDate ? 'Modified' : 'Compiled'}
            </Typography>
          </View>
        </View>

        {/* Quick action bar */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AtsReport', { generationId })}
            style={[styles.quickActionBtn, { backgroundColor: theme.colors.surface }]}
            testID="btn-quick-ats"
          >
            <Icon name="Target" size={14} color={theme.colors.primary} />
            <Typography variant="caption" weight="semibold" customColor={theme.colors.primary}>
              ATS Report
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('EditContent', { generationId })}
            style={[styles.quickActionBtn, { backgroundColor: theme.colors.surface }]}
            testID="btn-quick-edit"
          >
            <Icon name="Edit3" size={14} color={theme.colors.textPrimary} />
            <Typography variant="caption" weight="semibold">
              Edit Content
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleFullscreenPdf}
            style={[styles.quickActionBtn, { backgroundColor: theme.colors.surface }]}
            testID="btn-quick-fullscreen"
          >
            <Icon name="Maximize2" size={14} color={theme.colors.textPrimary} />
            <Typography variant="caption" weight="semibold">
              Fullscreen
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Segmented Tab Switcher */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('preview')}
          style={[
            styles.tabItem,
            activeTab === 'preview' && [
              styles.tabItemActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          testID="tab-btn-preview"
        >
          <Icon
            name="Eye"
            size={16}
            color={
              activeTab === 'preview'
                ? theme.colors.primary
                : theme.colors.textMuted
            }
          />
          <Typography
            variant="bodySm"
            weight={activeTab === 'preview' ? 'bold' : 'regular'}
            customColor={
              activeTab === 'preview'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
            style={styles.tabText}
          >
            PDF Preview
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('changes')}
          style={[
            styles.tabItem,
            activeTab === 'changes' && [
              styles.tabItemActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          testID="tab-btn-changes"
        >
          <Icon
            name="GitCommit"
            size={16}
            color={
              activeTab === 'changes'
                ? theme.colors.primary
                : theme.colors.textMuted
            }
          />
          <Typography
            variant="bodySm"
            weight={activeTab === 'changes' ? 'bold' : 'regular'}
            customColor={
              activeTab === 'changes'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
            style={styles.tabText}
          >
            Changes
          </Typography>
          {generation?.changeSummary && (
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: theme.colors.primaryMuted },
              ]}
            >
              <Typography
                variant="caption"
                weight="bold"
                customColor={theme.colors.primary}
              >
                {generation.changeSummary.bulletsModified || 4}
              </Typography>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('jobDescription')}
          style={[
            styles.tabItem,
            activeTab === 'jobDescription' && [
              styles.tabItemActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          testID="tab-btn-jd"
        >
          <Icon
            name="Briefcase"
            size={16}
            color={
              activeTab === 'jobDescription'
                ? theme.colors.primary
                : theme.colors.textMuted
            }
          />
          <Typography
            variant="bodySm"
            weight={activeTab === 'jobDescription' ? 'bold' : 'regular'}
            customColor={
              activeTab === 'jobDescription'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
            style={styles.tabText}
          >
            Job Details
          </Typography>
        </TouchableOpacity>
      </View>

      {/* 4. Tab Content Area */}
      <View style={styles.tabBody}>
        {activeTab === 'preview' && (
          <View style={styles.tabPane}>
            <InlinePdfViewer
              pdfUrl={pdfUrl}
              isOutOfDate={isOutOfDate}
              isRerendering={rerenderMutation.isPending}
              onRerender={handleRerender}
              onFullscreen={handleFullscreenPdf}
              onReload={refetchGeneration}
              testID="review-inline-pdf-viewer"
            />
          </View>
        )}

        {activeTab === 'changes' && (
          <ChangesTab
            changeSummary={generation?.changeSummary}
            tailoredContent={generation?.tailoredContent}
            originalTailoredContent={generation?.originalTailoredContent}
            onResetToAi={() => setIsResetConfirmOpen(true)}
            onEditContent={() => navigation.navigate('EditContent', { generationId })}
            isResetting={resetMutation.isPending}
            testID="review-changes-tab"
          />
        )}

        {activeTab === 'jobDescription' && (
          <ScrollView
            style={styles.jdScrollView}
            contentContainerStyle={styles.jdScrollContent}
            showsVerticalScrollIndicator={false}
            testID="review-jd-tab"
          >
            <Card
              style={[styles.jdCard, { backgroundColor: theme.colors.surface }]}
            >
              <Typography variant="h3" weight="bold">
                {generation?.jobTitle || 'Target Position'}
              </Typography>
              <Typography
                variant="bodySm"
                customColor={theme.colors.primary}
                style={styles.jdCompany}
              >
                {generation?.companyName || generation?.company || 'Company'}
              </Typography>

              {generation?.jobUrl && (
                <View style={styles.jdUrlRow}>
                  <Icon name="Globe" size={14} color={theme.colors.textMuted} />
                  <Typography
                    variant="caption"
                    color="muted"
                    numberOfLines={1}
                    style={styles.jdUrlText}
                  >
                    {generation.jobUrl}
                  </Typography>
                </View>
              )}

              <View
                style={[
                  styles.jdDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              <Typography
                variant="caption"
                weight="semibold"
                color="secondary"
                style={styles.jdSectionLabel}
              >
                JOB POSTING TEXT
              </Typography>

              <Typography variant="bodySm" style={styles.jdBodyText}>
                {generation?.jobDescriptionText ||
                  'No job description text provided for this generation.'}
              </Typography>
            </Card>
          </ScrollView>
        )}
      </View>

      {/* 5. More Options BottomSheet */}
      <BottomSheet
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Resume Actions"
      >
        <View style={styles.sheetActionsList}>
          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={() => {
              setIsMenuOpen(false);
              navigation.navigate('AtsReport', { generationId });
            }}
            testID="menu-action-ats"
          >
            <Icon name="Target" size={20} color={theme.colors.primary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              View ATS Match Report
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={() => {
              setIsMenuOpen(false);
              navigation.navigate('EditContent', { generationId });
            }}
            testID="menu-action-edit"
          >
            <Icon name="Edit3" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Edit Resume Content
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={() => {
              setIsMenuOpen(false);
              handleFullscreenPdf();
            }}
            testID="menu-action-fullscreen"
          >
            <Icon name="Maximize2" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Fullscreen PDF Viewer
            </Typography>
          </TouchableOpacity>

          {/* Share PDF (MB-5.07) */}
          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={handleSharePdf}
            testID="menu-action-share-pdf"
          >
            <Icon name="Share2" size={20} color={theme.colors.primary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Share PDF Resume
            </Typography>
          </TouchableOpacity>

          {/* Share LaTeX (MB-5.07) */}
          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={handleShareTex}
            testID="menu-action-share-tex"
          >
            <Icon name="Code" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Share LaTeX Source (.tex)
            </Typography>
          </TouchableOpacity>

          {/* Save PDF to Device (MB-5.07) */}
          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={handleDownloadPdf}
            testID="menu-action-download-pdf"
          >
            <Icon name="Download" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Save PDF to Downloads
            </Typography>
          </TouchableOpacity>

          {/* Save LaTeX to Device (MB-5.07) */}
          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={handleDownloadTex}
            testID="menu-action-download-tex"
          >
            <Icon name="FileCode" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Save LaTeX (.tex) to Device
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={() => {
              setIsMenuOpen(false);
              handleRerender();
            }}
            testID="menu-action-rerender"
          >
            <Icon name="RefreshCw" size={20} color={theme.colors.scoreHigh} />
            <Typography variant="body" style={styles.sheetActionLabel}>
              Re-render PDF
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetActionItem}
            onPress={() => {
              setIsMenuOpen(false);
              setIsResetConfirmOpen(true);
            }}
            testID="menu-action-reset"
          >
            <Icon name="RotateCcw" size={20} color={theme.colors.scoreLow} />
            <Typography
              variant="body"
              customColor={theme.colors.scoreLow}
              style={styles.sheetActionLabel}
            >
              Reset to Original AI Version
            </Typography>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* 6. Confirm Reset Dialog */}
      <ConfirmDialog
        visible={isResetConfirmOpen}
        title="Reset Tailored Resume?"
        message="This will discard all manual bullet and summary edits and revert to the original AI-tailored resume."
        confirmText="Reset Content"
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
    marginHorizontal: 4,
  },
  headerAtsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    marginRight: 4,
  },
  headerAtsText: {
    fontSize: 12,
  },
  summaryStrip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  atsScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  stripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontSize: 13,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBody: {
    flex: 1,
  },
  tabPane: {
    flex: 1,
    padding: 12,
  },
  jdScrollView: {
    flex: 1,
  },
  jdScrollContent: {
    padding: 16,
  },
  jdCard: {
    padding: 16,
  },
  jdCompany: {
    marginTop: 2,
  },
  jdUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  jdUrlText: {
    flex: 1,
  },
  jdDivider: {
    height: 1,
    marginVertical: 16,
  },
  jdSectionLabel: {
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  jdBodyText: {
    lineHeight: 22,
  },
  sheetActionsList: {
    paddingVertical: 8,
    gap: 4,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 12,
  },
  sheetActionLabel: {
    marginLeft: 4,
  },
});
