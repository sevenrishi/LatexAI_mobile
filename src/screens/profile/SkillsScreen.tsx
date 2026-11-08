import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Card, Icon, TextField, Typography } from '../../components/ui';
import {
  ChipInput,
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '../../components/forms';
import {
  useBulkAddSkills,
  useProfile,
  useUpdateSkillsCategories,
} from '../../features/profile/useProfile';
import { SkillCategory } from '../../types/user';

const DEFAULT_CATEGORIES = [
  'Languages',
  'Frameworks & Libraries',
  'Cloud & DevOps',
  'Databases & Storage',
  'Tools & Architecture',
];

export const SkillsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { data: profile } = useProfile();
  const updateSkills = useUpdateSkillsCategories();
  const bulkAdd = useBulkAddSkills();

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // New Category Modal
  const [newCatModalVisible, setNewCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Bulk Add Modal
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('');

  useEffect(() => {
    if (profile?.skills) {
      if (profile.skills.length > 0) {
        setCategories(profile.skills);
      } else {
        // Initialize with default category template if empty
        setCategories(DEFAULT_CATEGORIES.map((c) => ({ category: c, skills: [] })));
      }
      setIsDirty(false);
    }
  }, [profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const handleUpdateCategorySkills = (catIndex: number, newSkills: string[]) => {
    const updated = [...categories];
    const cat = updated[catIndex];
    if (!cat) return;
    cat.skills = newSkills;
    setCategories(updated);
    setIsDirty(true);
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.category.toLowerCase() === trimmed.toLowerCase())) {
      setNewCatModalVisible(false);
      setNewCatName('');
      return;
    }

    setCategories([...categories, { category: trimmed, skills: [] }]);
    setNewCatName('');
    setNewCatModalVisible(false);
    setIsDirty(true);
  };

  const handleDeleteCategory = (catIndex: number) => {
    setCategories(categories.filter((_, i) => i !== catIndex));
    setIsDirty(true);
  };

  const handleBulkAddSubmit = async () => {
    const parsed = bulkText
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsed.length === 0) return;

    const targetCat = selectedBulkCategory || categories[0]?.category || 'Other';

    const catIndex = categories.findIndex(
      (c) => c.category.toLowerCase() === targetCat.toLowerCase()
    );

    if (catIndex >= 0 && categories[catIndex]) {
      const existing = categories[catIndex].skills;
      const combined = [
        ...existing,
        ...parsed.filter(
          (p) => !existing.some((e) => e.toLowerCase() === p.toLowerCase())
        ),
      ];
      handleUpdateCategorySkills(catIndex, combined);
    } else {
      setCategories([...categories, { category: targetCat, skills: parsed }]);
      setIsDirty(true);
    }

    setBulkText('');
    setBulkModalVisible(false);
  };

  const handleSave = async () => {
    try {
      await updateSkills.mutateAsync(categories);
      setIsDirty(false);
      navigation.goBack();
    } catch {
      // Handled by query mutation error
    }
  };

  const totalSkillsCount = categories.reduce(
    (acc, c) => acc + (c.skills?.length || 0),
    0
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        testID="skills-screen"
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Typography variant="h2" weight="bold">
              Skills & Tech Stack
            </Typography>
            <Typography variant="caption" color="secondary">
              {totalSkillsCount} total skills across {categories.length} categories.
            </Typography>
          </View>

          <Button
            variant="outline"
            size="sm"
            title="Bulk Add"
            leftIcon={<Icon name="FilePlus2" size={16} color={theme.colors.primary} />}
            onPress={() => {
              setSelectedBulkCategory(categories[0]?.category || 'Languages');
              setBulkModalVisible(true);
            }}
            testID="open-bulk-add-modal-btn"
          />
        </View>

        {/* Categories list */}
        {categories.map((cat, catIdx) => (
          <Card
            key={`${cat.category}-${catIdx}`}
            variant="elevated"
            style={styles.categoryCard}
          >
            <View style={styles.cardHeader}>
              <Typography variant="body" weight="bold" color="primary">
                {cat.category}
              </Typography>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(catIdx)}
                style={styles.deleteCatBtn}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${cat.category} category`}
                testID={`delete-category-${catIdx}`}
              >
                <Icon name="Trash2" size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ChipInput
              chips={cat.skills || []}
              onChange={(newSkills) => handleUpdateCategorySkills(catIdx, newSkills)}
              placeholder={`Add skill in ${cat.category}...`}
              allowBulkAdd={false}
            />
          </Card>
        ))}

        {/* Add Category Button */}
        <TouchableOpacity
          onPress={() => setNewCatModalVisible(true)}
          style={[
            styles.addCategoryBtn,
            { borderColor: theme.colors.border },
          ]}
          accessibilityRole="button"
          testID="add-new-category-btn"
        >
          <Icon name="Plus" size={18} color={theme.colors.primary} />
          <Typography
            variant="body"
            weight="semibold"
            color="primary"
            style={styles.addCategoryText}
          >
            Add New Category
          </Typography>
        </TouchableOpacity>

        {/* Save button */}
        <Button
          variant="primary"
          title="Save Skills"
          loading={updateSkills.isPending}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-skills-btn"
        />

        {/* Add Category Modal */}
        <Modal
          visible={newCatModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setNewCatModalVisible(false)}
          testID="add-category-modal"
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Typography variant="h3" weight="bold">
                Add Skill Category
              </Typography>
              <Typography
                variant="caption"
                color="secondary"
                style={styles.modalSub}
              >
                Enter a category name to group related skills (e.g., Soft Skills, AI & ML).
              </Typography>

              <TextField
                label="Category Name"
                placeholder="e.g. AI & Machine Learning"
                value={newCatName}
                onChangeText={setNewCatName}
                testID="new-category-name-input"
              />

              <View style={styles.modalBtnRow}>
                <Button
                  variant="outline"
                  size="sm"
                  title="Cancel"
                  onPress={() => setNewCatModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  title="Create"
                  disabled={!newCatName.trim()}
                  onPress={handleAddCategory}
                  style={{ flex: 1 }}
                  testID="confirm-add-category-btn"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Bulk Add Modal */}
        <Modal
          visible={bulkModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBulkModalVisible(false)}
          testID="skills-bulk-modal"
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  maxHeight: '85%',
                },
              ]}
            >
              <View style={styles.bulkModalHeader}>
                <Typography variant="h3" weight="bold">
                  Bulk Add Skills
                </Typography>
                <TouchableOpacity
                  onPress={() => setBulkModalVisible(false)}
                  style={styles.closeIconBtn}
                >
                  <Icon name="X" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Typography variant="caption" color="secondary" style={styles.modalSub}>
                Paste comma- or newline-delimited skills to import them in bulk.
              </Typography>

              {/* Category picker pills */}
              <Typography variant="caption" weight="semibold" style={{ marginBottom: 6 }}>
                Target Category:
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.catPillsScroll}
              >
                {categories.map((c) => {
                  const isSelected =
                    (selectedBulkCategory || categories[0]?.category) === c.category;
                  return (
                    <TouchableOpacity
                      key={c.category}
                      onPress={() => setSelectedBulkCategory(c.category)}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceElevated,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      testID={`bulk-category-pill-${c.category}`}
                    >
                      <Typography
                        variant="caption"
                        weight={isSelected ? 'bold' : 'regular'}
                        style={{
                          color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                        }}
                      >
                        {c.category}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TextInput
                multiline
                value={bulkText}
                onChangeText={setBulkText}
                placeholder="e.g. React Native, TypeScript, TailwindCSS, Jest, Redux Toolkit"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.bulkInput,
                  {
                    color: theme.colors.textPrimary,
                    borderColor: theme.colors.border,
                  },
                ]}
                testID="bulk-skills-text-input"
              />

              <View style={styles.modalBtnRow}>
                <Button
                  variant="outline"
                  title="Cancel"
                  onPress={() => setBulkModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  title="Add to Category"
                  disabled={!bulkText.trim()}
                  onPress={handleBulkAddSubmit}
                  style={{ flex: 1 }}
                  testID="confirm-bulk-skills-btn"
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <UnsavedChangesDialog {...dialogProps} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  categoryCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteCatBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    marginVertical: 12,
    minHeight: 48,
  },
  addCategoryText: {
    marginLeft: 8,
  },
  saveBtn: {
    marginTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  modalSub: {
    marginTop: 4,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  bulkModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeIconBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  bulkInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
