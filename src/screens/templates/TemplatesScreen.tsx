import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
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
  TextField,
  Typography,
} from '../../components/ui';
import {
  TemplateListItem,
  useActivateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useTemplates,
} from '../../features/templates';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TemplatesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const { data: templates = [], isLoading, isRefetching, error, refetch } = useTemplates();
  const activateMutation = useActivateTemplate();
  const duplicateMutation = useDuplicateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Action sheet state
  const [actionSheetTemplate, setActionSheetTemplate] = useState<TemplateListItem | null>(null);
  // Delete confirm state
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<TemplateListItem | null>(null);

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    templates.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return ['All', ...Array.from(cats)];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        t.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.isActive);
  }, [templates]);

  const handlePreview = (template: TemplateListItem) => {
    setActionSheetTemplate(null);
    navigation.navigate('TemplatePreview', {
      templateId: template.id,
      templateName: template.name,
    });
  };

  const handleActivate = (templateId: string) => {
    setActionSheetTemplate(null);
    activateMutation.mutate(templateId);
  };

  const handleDuplicate = (template: TemplateListItem) => {
    setActionSheetTemplate(null);
    duplicateMutation.mutate({
      templateId: template.id,
      name: `Copy of ${template.name}`,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmTemplate) {
      deleteMutation.mutate(deleteConfirmTemplate.id);
      setDeleteConfirmTemplate(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Active template notification banner */}
      {activeTemplate && (
        <Card
          testID="active-template-banner"
          variant="outlined"
          style={[
            styles.activeBanner,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <View style={styles.bannerRow}>
            <View
              style={[
                styles.bannerIconWrapper,
                { backgroundColor: theme.colors.primaryLight || '#EEF2FF' },
              ]}
            >
              <Icon name="CheckCircle" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.bannerText}>
              <Typography variant="caption" color="secondary">
                CURRENT DEFAULT TEMPLATE
              </Typography>
              <Typography variant="body" weight="bold">
                {activeTemplate.name}
              </Typography>
            </View>
            <TouchableOpacity
              testID="active-banner-preview-button"
              onPress={() => handlePreview(activeTemplate)}
              style={styles.bannerPreviewBtn}
            >
              <Typography variant="caption" color="primary" weight="semibold">
                Preview
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Search Input */}
      <TextField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search templates..."
        leftIcon={<Icon name="Search" size={18} color={theme.colors.textMuted} />}
        clearable={true}
        onClear={() => setSearchQuery('')}
        containerStyle={styles.searchBar}
        testID="templates-search-input"
      />

      {/* Categories chips */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoriesList}
        renderItem={({ item }) => {
          const isSelected = selectedCategory === item;
          return (
            <Chip
              label={item}
              selected={isSelected}
              onPress={() => setSelectedCategory(item)}
              style={styles.categoryChip}
              testID={`category-chip-${item}`}
            />
          );
        }}
      />
    </View>
  );

  const renderTemplateCard = ({ item }: { item: TemplateListItem }) => {
    const isActivating =
      activateMutation.isPending && activateMutation.variables === item.id;

    return (
      <Card
        testID={`template-card-${item.id}`}
        variant="elevated"
        style={[
          styles.templateCard,
          item.isActive && { borderColor: theme.colors.primary, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <View style={styles.badgeRow}>
              {item.isActive && (
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: theme.colors.successSurface },
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.success }}
                  >
                    ACTIVE
                  </Typography>
                </View>
              )}
              {item.isSystem ? (
                <View
                  style={[
                    styles.systemBadge,
                    { backgroundColor: theme.colors.surfaceElevated },
                  ]}
                >
                  <Typography variant="caption" color="secondary">
                    System
                  </Typography>
                </View>
              ) : (
                <View
                  style={[
                    styles.systemBadge,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Typography variant="caption" color="primary">
                    Custom
                  </Typography>
                </View>
              )}
              {item.category && (
                <Typography variant="caption" color="secondary">
                  • {item.category}
                </Typography>
              )}
            </View>

            <Typography variant="h3" weight="semibold" style={styles.templateName}>
              {item.name}
            </Typography>
          </View>

          <TouchableOpacity
            testID={`template-menu-button-${item.id}`}
            accessibilityLabel={`Options for ${item.name}`}
            accessibilityRole="button"
            onPress={() => setActionSheetTemplate(item)}
            style={styles.moreButton}
          >
            <Icon name="MoreVertical" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {item.description ? (
          <Typography
            variant="bodySm"
            color="secondary"
            numberOfLines={2}
            style={styles.templateDescription}
          >
            {item.description}
          </Typography>
        ) : null}

        {/* Thumbnail or visual preview strip */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePreview(item)}
          style={[
            styles.previewPlaceholder,
            { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
          ]}
        >
          <Icon name="FileText" size={32} color={theme.colors.primary} />
          <Typography variant="caption" color="secondary" style={styles.previewTapText}>
            Tap to view sample & compiled preview
          </Typography>
        </TouchableOpacity>

        {/* Card Actions */}
        <View style={styles.cardActions}>
          <Button
            title="Preview"
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="Eye" size={16} color={theme.colors.textPrimary} />}
            onPress={() => handlePreview(item)}
            style={styles.actionBtn}
            testID={`template-preview-button-${item.id}`}
          />
          {!item.isActive ? (
            <Button
              title="Set as Active"
              variant="primary"
              size="sm"
              leftIcon={<Icon name="Check" size={16} color="#FFFFFF" />}
              loading={isActivating}
              onPress={() => handleActivate(item.id)}
              style={styles.actionBtn}
              testID={`template-activate-button-${item.id}`}
            />
          ) : (
            <Button
              title="Selected"
              variant="ghost"
              size="sm"
              leftIcon={<Icon name="CheckCircle" size={16} color={theme.colors.primary} />}
              disabled
              style={styles.actionBtn}
              testID={`template-active-label-${item.id}`}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer} testID="templates-empty-state">
      <Icon name="Search" size={48} color={theme.colors.textMuted} />
      <Typography variant="h3" weight="semibold" style={styles.emptyTitle}>
        No templates found
      </Typography>
      <Typography variant="body" color="secondary" style={styles.emptySubtitle}>
        Try adjusting your search terms or category filter.
      </Typography>
      <Button
        title="Reset Filters"
        variant="secondary"
        size="sm"
        onPress={() => {
          setSearchQuery('');
          setSelectedCategory('All');
        }}
        style={styles.resetButton}
      />
    </View>
  );

  return (
    <View
      testID="templates-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer} testID="templates-loading">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography variant="body" color="secondary" style={styles.loadingText}>
            Loading templates...
          </Typography>
        </View>
      ) : error ? (
        <View style={styles.errorContainer} testID="templates-error">
          <Icon name="AlertCircle" size={48} color={theme.colors.error} />
          <Typography variant="h3" weight="semibold" style={styles.errorTitle}>
            Failed to load templates
          </Typography>
          <Typography variant="body" color="secondary" style={styles.errorSubtitle}>
            {(error as any)?.message || 'Something went wrong fetching templates.'}
          </Typography>
          <Button
            title="Retry"
            variant="primary"
            onPress={() => {
              refetch();
            }}
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={renderTemplateCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {/* Template Actions Sheet */}
      <BottomSheet
        visible={actionSheetTemplate !== null}
        onClose={() => setActionSheetTemplate(null)}
        title={actionSheetTemplate?.name || 'Template Actions'}
      >
        <View style={styles.actionSheetContent} testID="template-action-sheet">
          <TouchableOpacity
            style={styles.actionSheetRow}
            onPress={() => actionSheetTemplate && handlePreview(actionSheetTemplate)}
            testID="action-sheet-preview"
          >
            <Icon name="Eye" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.actionSheetText}>
              Preview Template
            </Typography>
          </TouchableOpacity>

          {actionSheetTemplate && !actionSheetTemplate.isActive && (
            <TouchableOpacity
              style={styles.actionSheetRow}
              onPress={() => handleActivate(actionSheetTemplate.id)}
              testID="action-sheet-activate"
            >
              <Icon name="CheckCircle" size={20} color={theme.colors.primary} />
              <Typography variant="body" color="primary" style={styles.actionSheetText}>
                Set as Active Default
              </Typography>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionSheetRow}
            onPress={() => actionSheetTemplate && handleDuplicate(actionSheetTemplate)}
            testID="action-sheet-duplicate"
          >
            <Icon name="Copy" size={20} color={theme.colors.textPrimary} />
            <Typography variant="body" style={styles.actionSheetText}>
              Duplicate Template
            </Typography>
          </TouchableOpacity>

          {actionSheetTemplate && !actionSheetTemplate.isSystem && (
            <TouchableOpacity
              style={styles.actionSheetRow}
              onPress={() => {
                const target = actionSheetTemplate;
                setActionSheetTemplate(null);
                setDeleteConfirmTemplate(target);
              }}
              testID="action-sheet-delete"
            >
              <Icon name="Trash2" size={20} color={theme.colors.error} />
              <Typography variant="body" color="error" style={styles.actionSheetText}>
                Delete Custom Template
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteConfirmTemplate !== null}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirmTemplate?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmTemplate(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    marginTop: 16,
  },
  errorSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    minWidth: 140,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  activeBanner: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerPreviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchBar: {
    marginBottom: 12,
  },
  categoriesList: {
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  listContent: {
    paddingBottom: 32,
  },
  templateCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  templateName: {
    marginBottom: 4,
  },
  moreButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateDescription: {
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 18,
  },
  previewPlaceholder: {
    height: 110,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
  },
  previewTapText: {
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 20,
  },
  actionSheetContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  actionSheetText: {
    fontSize: 16,
  },
});
