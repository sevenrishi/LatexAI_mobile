import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
import { OfflineBanner } from '../../components/feedback';
import { RootStackParamList } from '../../types/navigation';
import {
  HistoryResumeItem,
  useDeleteResume,
  useHistoryResumes,
} from '../../features/history';
import {
  downloadResumePdfToDevice,
  downloadResumeTexToDevice,
  shareResumePdf,
  shareResumeTex,
} from '../../utils/shareUtils';
import { useUiStore } from '../../store/uiStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const showToast = useUiStore((state) => state.showToast);

  // Search & Filter state
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected item for overflow action sheet (MB-5.08)
  const [selectedResume, setSelectedResume] = useState<HistoryResumeItem | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

  // Queries & Mutations
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHistoryResumes({
    search: searchText,
    status: statusFilter,
  });

  const deleteMutation = useDeleteResume();

  // Flattened items from all pages
  const items = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data]);

  const handleOpenActions = (resume: HistoryResumeItem) => {
    setSelectedResume(resume);
    setIsActionSheetOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedResume) return;
    const targetId = selectedResume.id;
    setIsDeleteConfirmOpen(false);

    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'Resume Deleted',
          message: 'The tailored resume has been removed.',
        });
        setSelectedResume(null);
      },
      onError: (err: any) => {
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: err?.message || 'Could not delete resume record.',
        });
      },
    });
  };

  const renderStatusPill = (status: string) => {
    let color = theme.colors.textMuted;
    let label = status;

    if (status === 'completed') {
      color = theme.colors.scoreHigh;
      label = 'Ready';
    } else if (status === 'failed') {
      color = theme.colors.scoreLow;
      label = 'Failed';
    } else if (['queued', 'analyzing', 'tailoring', 'compiling', 'rendering'].includes(status)) {
      color = theme.colors.scoreMedium;
      label = 'In Progress';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '15', borderColor: color + '40' }]}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Typography variant="caption" weight="medium" customColor={color}>
          {label}
        </Typography>
      </View>
    );
  };

  const renderItem = ({ item }: { item: HistoryResumeItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <Card
        style={[styles.resumeCard, { backgroundColor: theme.colors.surface }]}
        testID={`history-item-${item.id}`}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Review', { generationId: item.id })}
          style={styles.cardMainTouch}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleCol}>
              <Typography variant="body" weight="bold" numberOfLines={1}>
                {item.jobTitle}
              </Typography>
              <Typography variant="bodySm" customColor={theme.colors.primary} numberOfLines={1}>
                {item.company}
              </Typography>
            </View>

            {/* Overflow Menu Button (MB-5.08) */}
            <TouchableOpacity
              onPress={() => handleOpenActions(item)}
              style={styles.overflowBtn}
              testID={`btn-history-overflow-${item.id}`}
              accessibilityLabel="Resume actions"
            >
              <Icon name="MoreVertical" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.cardFooterLeft}>
              {renderStatusPill(item.status)}
              <Typography variant="caption" color="muted">
                {formattedDate}
              </Typography>
            </View>

            {item.atsScore != null && (
              <View
                style={[
                  styles.atsPill,
                  {
                    backgroundColor:
                      item.atsScore >= 75
                        ? theme.colors.scoreHigh + '20'
                        : theme.colors.scoreMedium + '20',
                    borderColor:
                      item.atsScore >= 75
                        ? theme.colors.scoreHigh
                        : theme.colors.scoreMedium,
                  },
                ]}
              >
                <Icon
                  name="Target"
                  size={12}
                  color={
                    item.atsScore >= 75 ? theme.colors.scoreHigh : theme.colors.scoreMedium
                  }
                />
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
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const filterOptions = [
    { id: 'all', label: 'All Resumes' },
    { id: 'completed', label: 'Completed' },
    { id: 'tailoring', label: 'In Progress' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="history-screen"
    >
      <OfflineBanner onRetry={refetch} />

      {/* 1. Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="Search" size={18} color={theme.colors.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by job title or company..."
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            testID="input-history-search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} testID="btn-clear-search">
              <Icon name="X" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Filter Chips (MB-6.02) */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const isSelected = statusFilter === item.id;
            return (
              <Chip
                label={item.label}
                selected={isSelected}
                onPress={() => setStatusFilter(item.id)}
                testID={`filter-chip-${item.id}`}
              />
            );
          }}
        />
      </View>

      {/* 3. Resume List with Infinite Scrolling */}
      {isLoading && items.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography variant="bodySm" color="secondary" style={{ marginTop: 12 }}>
            Loading resume history...
          </Typography>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Icon name="Folder" size={36} color={theme.colors.textMuted} />
              <Typography variant="body" weight="semibold" style={{ marginTop: 12 }}>
                No Resumes Found
              </Typography>
              <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
                {searchText
                  ? 'No resumes match your current search criteria.'
                  : 'Tailor your first resume to view it in your history.'}
              </Typography>
            </Card>
          }
          testID="history-flat-list"
        />
      )}

      {/* 4. History Overflow Action Sheet (MB-5.08) */}
      <BottomSheet
        visible={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title={selectedResume?.jobTitle || 'Resume Actions'}
      >
        {selectedResume && (
          <View style={styles.sheetActionsList}>
            {/* View / Review */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                setIsActionSheetOpen(false);
                navigation.navigate('Review', { generationId: selectedResume.id });
              }}
              testID="sheet-action-review"
            >
              <Icon name="Eye" size={20} color={theme.colors.primary} />
              <Typography variant="body" style={styles.sheetActionLabel}>
                Review & Edit Resume
              </Typography>
            </TouchableOpacity>

            {/* ATS Match Report */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                setIsActionSheetOpen(false);
                navigation.navigate('AtsReport', { generationId: selectedResume.id });
              }}
              testID="sheet-action-ats"
            >
              <Icon name="Target" size={20} color={theme.colors.scoreHigh} />
              <Typography variant="body" style={styles.sheetActionLabel}>
                View ATS Score Audit
              </Typography>
            </TouchableOpacity>

            {/* Reuse in New Generation (MB-4.04, MB-5.08) */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                setIsActionSheetOpen(false);
                navigation.navigate('NewGeneration', { fromGenerationId: selectedResume.id });
              }}
              testID="sheet-action-reuse"
            >
              <Icon name="Copy" size={20} color={theme.colors.textPrimary} />
              <Typography variant="body" style={styles.sheetActionLabel}>
                Reuse for New Application
              </Typography>
            </TouchableOpacity>

            {/* Share PDF (MB-5.07) */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={async () => {
                setIsActionSheetOpen(false);
                try {
                  await shareResumePdf(selectedResume.id, `${selectedResume.jobTitle} Resume`);
                } catch (err: any) {
                  showToast({ type: 'error', message: err?.message || 'Failed to share PDF.' });
                }
              }}
              testID="sheet-action-share-pdf"
            >
              <Icon name="Share2" size={20} color={theme.colors.textPrimary} />
              <Typography variant="body" style={styles.sheetActionLabel}>
                Share PDF Document
              </Typography>
            </TouchableOpacity>

            {/* Share LaTeX (MB-5.07) */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={async () => {
                setIsActionSheetOpen(false);
                try {
                  await shareResumeTex(selectedResume.id, `${selectedResume.jobTitle} LaTeX`);
                } catch (err: any) {
                  showToast({ type: 'error', message: err?.message || 'Failed to share LaTeX.' });
                }
              }}
              testID="sheet-action-share-tex"
            >
              <Icon name="Code" size={20} color={theme.colors.textPrimary} />
              <Typography variant="body" style={styles.sheetActionLabel}>
                Share LaTeX Source (.tex)
              </Typography>
            </TouchableOpacity>

            {/* Save PDF to Downloads (MB-5.07) */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={async () => {
                setIsActionSheetOpen(false);
                try {
                  const res = await downloadResumePdfToDevice(selectedResume.id);
                  if (res.success) {
                    showToast({ type: 'success', message: 'PDF saved to device storage.' });
                  }
                } catch (err: any) {
                  showToast({ type: 'error', message: err?.message || 'Failed to save PDF.' });
                }
              }}
              testID="sheet-action-save-pdf"
            >
              <Icon name="Download" size={20} color={theme.colors.textPrimary} />
              <Typography variant="body" style={styles.sheetActionLabel}>
                Save PDF to Storage
              </Typography>
            </TouchableOpacity>

            {/* Delete Resume */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => {
                setIsActionSheetOpen(false);
                setIsDeleteConfirmOpen(true);
              }}
              testID="sheet-action-delete"
            >
              <Icon name="Trash2" size={20} color={theme.colors.scoreLow} />
              <Typography
                variant="body"
                customColor={theme.colors.scoreLow}
                style={styles.sheetActionLabel}
              >
                Delete Resume
              </Typography>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={isDeleteConfirmOpen}
        title="Delete Tailored Resume?"
        message={`Are you sure you want to permanently delete "${selectedResume?.jobTitle}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  filterScroll: {
    paddingBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resumeCard: {
    borderRadius: 12,
    marginBottom: 10,
    padding: 0,
    overflow: 'hidden',
  },
  cardMainTouch: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  overflowBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  atsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 20,
  },
  sheetActionsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 4,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  sheetActionLabel: {
    flex: 1,
    fontSize: 15,
  },
});
