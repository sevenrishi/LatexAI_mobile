import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, ConfirmDialog, Icon, Typography } from '../../components/ui';
import { DraggableList } from '../../components/forms';
import {
  useDeleteProfileItem,
  useProfile,
  useReorderProfileSection,
} from '../../features/profile/useProfile';
import { Education } from '../../types/user';

export const EducationListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: profile } = useProfile();
  const deleteItem = useDeleteProfileItem('education');
  const reorderSection = useReorderProfileSection('education');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const educationList = profile?.education || [];

  const handleReorder = (newItems: Education[]) => {
    const orderedIds = newItems.map((e) => e.id);
    reorderSection.mutate(orderedIds);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatPeriod = (edu: Education) => {
    const start = edu.startDate || '';
    const end = edu.current ? 'Present' : edu.endDate || '';
    return `${start} – ${end}`;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="education-list-screen"
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Typography variant="h2" weight="bold">
            Education
          </Typography>
          <Typography variant="caption" color="secondary">
            Manage your degrees, colleges, and academic honors.
          </Typography>
        </View>
        <Button
          variant="primary"
          size="sm"
          title="Add Degree"
          leftIcon={<Icon name="Plus" size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate('EducationForm')}
          testID="add-education-btn"
        />
      </View>

      <DraggableList<Education>
        data={educationList}
        keyExtractor={(item) => item.id}
        onReorder={handleReorder}
        emptyTitle="No education history yet"
        emptySubtitle="Add your university, college, or bootcamp qualifications."
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <View style={styles.educationCardBody}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleWrap}>
                  <Typography variant="body" weight="bold">
                    {item.institution}
                  </Typography>
                  <Typography variant="caption" weight="semibold" color="primary">
                    {item.degree}
                    {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}
                  </Typography>
                </View>

                {/* Edit & Delete actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('EducationForm', {
                        educationId: item.id,
                      })
                    }
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Edit education"
                    testID={`edit-education-${item.id}`}
                  >
                    <Icon
                      name="Edit3"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteId(item.id)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Delete education"
                    testID={`delete-education-${item.id}`}
                  >
                    <Icon name="Trash2" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Typography variant="caption" color="secondary">
                  {formatPeriod(item)}
                  {item.location ? ` • ${item.location}` : ''}
                </Typography>
                {item.gpa ? (
                  <Typography variant="caption" weight="medium">
                    GPA: {item.gpa}
                  </Typography>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ConfirmDialog
        visible={Boolean(deleteId)}
        title="Delete Education?"
        message="Are you sure you want to remove this academic entry?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  educationCardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

