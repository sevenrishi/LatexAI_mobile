import React, { useState } from 'react';
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Chip, ConfirmDialog, Icon, Typography } from '../../components/ui';
import { DraggableList } from '../../components/forms';
import {
  useDeleteProfileItem,
  useProfile,
  useReorderProfileSection,
} from '../../features/profile/useProfile';
import { Project } from '../../types/user';

export const ProjectsListScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { data: profile } = useProfile();
  const deleteItem = useDeleteProfileItem('projects');
  const reorderSection = useReorderProfileSection('projects');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const projects = profile?.projects || [];

  const handleReorder = (newItems: Project[]) => {
    const orderedIds = newItems.map((p) => p.id);
    reorderSection.mutate(orderedIds);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="projects-list-screen"
    >
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Typography variant="h2" weight="bold">
            Key Projects
          </Typography>
          <Typography variant="caption" color="secondary">
            Showcase open-source, startup, or enterprise side projects.
          </Typography>
        </View>
        <Button
          variant="primary"
          size="sm"
          title="Add Project"
          leftIcon={<Icon name="Plus" size={16} color="#FFFFFF" />}
          onPress={() => navigation.navigate('ProjectForm')}
          testID="add-project-btn"
        />
      </View>

      <DraggableList<Project>
        data={projects}
        keyExtractor={(item) => item.id}
        onReorder={handleReorder}
        emptyTitle="No projects added yet"
        emptySubtitle="Highlight apps, libraries, or system architectures you've created."
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const title = item.name || item.title || 'Untitled Project';
          const techs = item.technologies || item.techStack || [];

          return (
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <View style={styles.titleWrap}>
                  <Typography variant="body" weight="bold">
                    {title}
                  </Typography>
                  {item.role ? (
                    <Typography variant="caption" color="primary" weight="medium">
                      {item.role}
                    </Typography>
                  ) : null}
                </View>

                {/* Edit & Delete actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('ProjectForm', {
                        projectId: item.id,
                      })
                    }
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Edit project"
                    testID={`edit-project-${item.id}`}
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
                    accessibilityLabel="Delete project"
                    testID={`delete-project-${item.id}`}
                  >
                    <Icon name="Trash2" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Typography
                variant="body"
                color="secondary"
                numberOfLines={3}
                style={styles.description}
              >
                {item.description}
              </Typography>

              {/* Technologies chips */}
              {techs.length > 0 && (
                <View style={styles.techRow}>
                  {techs.slice(0, 5).map((t, idx) => (
                    <Chip key={`${t}-${idx}`} label={t} variant="filter" />
                  ))}
                  {techs.length > 5 && (
                    <Typography variant="caption" color="secondary" style={styles.moreTech}>
                      +{techs.length - 5} more
                    </Typography>
                  )}
                </View>
              )}

              {/* Links */}
              <View style={styles.linksRow}>
                {item.liveUrl ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.liveUrl!)}
                    style={styles.linkItem}
                  >
                    <Icon name="ExternalLink" size={12} color={theme.colors.primary} />
                    <Typography variant="caption" color="primary" weight="medium">
                      Live App
                    </Typography>
                  </TouchableOpacity>
                ) : null}
                {item.repoUrl || item.url ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.repoUrl || item.url!)}
                    style={styles.linkItem}
                  >
                    <Icon name="FolderGit2" size={12} color={theme.colors.primary} />
                    <Typography variant="caption" color="primary" weight="medium">
                      Source Code
                    </Typography>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      <ConfirmDialog
        visible={Boolean(deleteId)}
        title="Delete Project?"
        message="Are you sure you want to remove this project from your profile?"
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
  cardBody: {
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
  description: {
    marginTop: 8,
    lineHeight: 20,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  moreTech: {
    marginLeft: 4,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
