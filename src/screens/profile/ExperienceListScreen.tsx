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
import { WorkExperience } from '../../types/user';

export const ExperienceListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: profile } = useProfile();
  const deleteItem = useDeleteProfileItem('experience');
  const reorderSection = useReorderProfileSection('experience');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const experiences = profile?.experience || [];

  const handleReorder = (newItems: WorkExperience[]) => {
    const orderedIds = newItems.map((e) => e.id);
    reorderSection.mutate(orderedIds);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatPeriod = (exp: WorkExperience) => {
    const start = exp.startDate || '';
    const end = exp.isCurrent || exp.current ? 'Present' : exp.endDate || '';
    return `${start} – ${end}`;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="experience-list-screen"
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Typography variant="h2" weight="bold">
            Work Experience
          </Typography>
          <Typography variant="caption" color="secondary">
            Drag or use arrows to reorder your career chronology.
          </Typography>
        </View>
        <Button
          variant="primary"
          size="sm"
          title="Add Role"
          leftIcon={<Icon name="Plus" size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate('ExperienceForm')}
          testID="add-experience-btn"
        />
      </View>

      <DraggableList<WorkExperience>
        data={experiences}
        keyExtractor={(item) => item.id}
        onReorder={handleReorder}
        emptyTitle="No experience listed yet"
        emptySubtitle="Add your past or current roles to build your work history."
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const roleTitle = item.title || item.position || 'Untitled Role';
          const bulletsCount = item.bullets?.length || 0;

          return (
            <View style={styles.experienceCardBody}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleWrap}>
                  <Typography variant="body" weight="bold">
                    {roleTitle}
                  </Typography>
                  <Typography variant="caption" weight="medium" color="primary">
                    {item.company}
                  </Typography>
                </View>

                {/* Edit & Delete quick buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ExperienceForm', {
                        experienceId: item.id,
                      })
                    }
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Edit experience"
                    testID={`edit-experience-${item.id}`}
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
                    accessibilityLabel="Delete experience"
                    testID={`delete-experience-${item.id}`}
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
                <Typography variant="caption" color="secondary">
                  {bulletsCount} bullet{bulletsCount === 1 ? '' : 's'}
                </Typography>
              </View>
            </View>
          );
        }}
      />

      <ConfirmDialog
        visible={Boolean(deleteId)}
        title="Delete Experience?"
        message="Are you sure you want to delete this work experience? This cannot be undone."
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
  experienceCardBody: {
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

