import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, TextField, Typography } from '../../components/ui';
import {
  ChipInput,
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '../../components/forms';
import {
  useCreateProfileItem,
  useProfile,
  useUpdateProfileItem,
} from '../../features/profile/useProfile';
import { ProfileStackParamList } from '../../types/navigation';
import { Project } from '../../types/user';
import { isValidUrl } from '../../utils/validation';

type ProjectFormRouteProp = RouteProp<ProfileStackParamList, 'ProjectForm'>;

const MAX_DESCRIPTION_CHARS = 1000;

export const ProjectFormScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ProjectFormRouteProp>();
  const projectId = route.params?.projectId;

  const { data: profile } = useProfile();
  const createItem = useCreateProfileItem<Project>('projects');
  const updateItem = useUpdateProfileItem<Project>('projects');

  const isEditing = Boolean(projectId);

  // Form states
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [liveUrl, setLiveUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  // Errors & dirty state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (projectId && profile?.projects) {
      const existing = profile.projects.find((p) => p.id === projectId);
      if (existing) {
        setTitle(existing.name || existing.title || '');
        setRole(existing.role || '');
        setDescription(existing.description || '');
        setTechnologies(existing.technologies || existing.techStack || []);
        setLiveUrl(existing.liveUrl || '');
        setRepoUrl(existing.repoUrl || existing.url || '');
        setIsDirty(false);
      }
    }
  }, [projectId, profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Project title is required';
    }
    if (!description.trim()) {
      errs.description = 'Project description is required';
    } else if (description.trim().length < 5) {
      errs.description = 'Description must be at least 5 characters';
    } else if (description.trim().length > MAX_DESCRIPTION_CHARS) {
      errs.description = `Description exceeds ${MAX_DESCRIPTION_CHARS} characters`;
    }
    if (liveUrl.trim() && !isValidUrl(liveUrl.trim())) {
      errs.liveUrl = 'Please enter a valid live demo URL';
    }
    if (repoUrl.trim() && !isValidUrl(repoUrl.trim())) {
      errs.repoUrl = 'Please enter a valid code repository URL';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      name: title.trim(),
      title: title.trim(),
      role: role.trim() || undefined,
      description: description.trim(),
      technologies,
      techStack: technologies,
      liveUrl: liveUrl.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
      url: repoUrl.trim() || liveUrl.trim() || undefined,
    };

    try {
      if (isEditing && projectId) {
        await updateItem.mutateAsync({ id: projectId, data: payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setIsDirty(false);
      navigation.goBack();
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save project.' });
    }
  };

  const descLength = description.length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        testID="project-form-screen"
      >
        <Typography variant="h2" weight="bold">
          {isEditing ? 'Edit Project' : 'Add Project'}
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Highlight architecture, metrics, and technologies used.
        </Typography>

        {errors.form && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: `${theme.colors.error}20` },
            ]}
          >
            <Typography variant="caption" color="error">
              {errors.form}
            </Typography>
          </View>
        )}

        <View style={styles.formGroup}>
          <TextField
            label="Project Title *"
            placeholder="e.g. Distributed Consensus Engine"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setIsDirty(true);
            }}
            error={errors.title}
            testID="project-title-input"
          />

          <TextField
            label="Role in Project"
            placeholder="e.g. Creator & Lead Architect"
            value={role}
            onChangeText={(t) => {
              setRole(t);
              setIsDirty(true);
            }}
            testID="project-role-input"
          />
        </View>

        {/* Description Editor */}
        <Typography variant="body" weight="semibold" style={styles.fieldLabel}>
          Description *
        </Typography>

        <View
          style={[
            styles.descContainer,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: errors.description
                ? theme.colors.error
                : theme.colors.border,
            },
          ]}
        >
          <TextInput
            multiline
            value={description}
            onChangeText={(t) => {
              setDescription(t);
              setIsDirty(true);
            }}
            placeholder="Describe what the project does, key challenges solved, and quantified performance outcomes..."
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.descInput, { color: theme.colors.textPrimary }]}
            testID="project-description-input"
          />
          <View style={styles.descFooter}>
            {errors.description ? (
              <Typography variant="caption" color="error">
                {errors.description}
              </Typography>
            ) : <View />}
            <Typography
              variant="caption"
              color={descLength > MAX_DESCRIPTION_CHARS ? 'error' : 'secondary'}
            >
              {descLength}/{MAX_DESCRIPTION_CHARS}
            </Typography>
          </View>
        </View>

        {/* Tech Stack Chips */}
        <ChipInput
          label="Technologies & Libraries"
          placeholder="e.g. Rust, Docker, gRPC, React Native"
          chips={technologies}
          onChange={(newTechs) => {
            setTechnologies(newTechs);
            setIsDirty(true);
          }}
        />

        {/* Links */}
        <View style={styles.formGroup}>
          <TextField
            label="Live Application URL"
            placeholder="https://..."
            value={liveUrl}
            onChangeText={(t) => {
              setLiveUrl(t);
              setIsDirty(true);
            }}
            autoCapitalize="none"
            keyboardType="url"
            error={errors.liveUrl}
            testID="project-live-url-input"
          />

          <TextField
            label="Source Code / Repository URL"
            placeholder="https://github.com/..."
            value={repoUrl}
            onChangeText={(t) => {
              setRepoUrl(t);
              setIsDirty(true);
            }}
            autoCapitalize="none"
            keyboardType="url"
            error={errors.repoUrl}
            testID="project-repo-url-input"
          />
        </View>

        <Button
          variant="primary"
          title={isEditing ? 'Save Changes' : 'Add Project'}
          loading={createItem.isPending || updateItem.isPending}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-project-btn"
        />
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
  subtitle: {
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  formGroup: {
    gap: 12,
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  descContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 140,
    marginBottom: 16,
  },
  descInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  descFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E130',
    paddingTop: 8,
    marginTop: 6,
  },
  saveBtn: {
    marginTop: 16,
  },
});

