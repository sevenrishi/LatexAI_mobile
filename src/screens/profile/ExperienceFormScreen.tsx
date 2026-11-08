import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Icon, TextField, Typography } from '../../components/ui';
import {
  BulletListEditor,
  MonthYearPickerSheet,
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '../../components/forms';
import {
  useCreateProfileItem,
  useProfile,
  useUpdateProfileItem,
} from '../../features/profile/useProfile';
import { ProfileStackParamList } from '../../types/navigation';
import { WorkExperience } from '../../types/user';

type ExperienceFormRouteProp = RouteProp<ProfileStackParamList, 'ExperienceForm'>;

export const ExperienceFormScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ExperienceFormRouteProp>();
  const experienceId = route.params?.experienceId;

  const { data: profile } = useProfile();
  const createItem = useCreateProfileItem<WorkExperience>('experience');
  const updateItem = useUpdateProfileItem<WorkExperience>('experience');

  const isEditing = Boolean(experienceId);

  // Form states
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState<string | null>('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);

  // Pickers & validation
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (experienceId && profile?.experience) {
      const existing = profile.experience.find((e) => e.id === experienceId);
      if (existing) {
        setCompany(existing.company || '');
        setPosition(existing.position || existing.title || '');
        setLocation(existing.location || '');
        setStartDate(existing.startDate || '');
        setEndDate(existing.endDate || null);
        setIsCurrent(Boolean(existing.isCurrent || existing.current));

        const extractedBullets = (existing.bullets || []).map((b) =>
          typeof b === 'string' ? b : b.text
        );
        setBullets(extractedBullets);
        setIsDirty(false);
      }
    }
  }, [experienceId, profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!company.trim()) {
      errs.company = 'Company name is required';
    }
    if (!position.trim()) {
      errs.position = 'Job title is required';
    }
    if (!startDate.trim() || !/^\d{4}-\d{2}$/.test(startDate)) {
      errs.startDate = 'Valid start date (YYYY-MM) is required';
    }
    if (!isCurrent) {
      if (!endDate || !/^\d{4}-\d{2}$/.test(endDate)) {
        errs.endDate = 'End date is required (or select Current)';
      } else if (startDate && endDate < startDate) {
        errs.endDate = 'End date cannot be earlier than start date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      company: company.trim(),
      position: position.trim(),
      title: position.trim(),
      location: location.trim() || undefined,
      startDate: startDate.trim(),
      endDate: isCurrent ? null : endDate?.trim() || null,
      isCurrent,
      current: isCurrent,
      bullets,
    };

    try {
      if (isEditing && experienceId) {
        await updateItem.mutateAsync({ id: experienceId, data: payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setIsDirty(false);
      navigation.goBack();
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save experience.' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        testID="experience-form-screen"
      >
        <Typography variant="h2" weight="bold">
          {isEditing ? 'Edit Work Experience' : 'Add Work Experience'}
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Detail your role, responsibilities, and quantified achievements.
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
            label="Company Name *"
            placeholder="e.g. Stripe, Airbnb, Google"
            value={company}
            onChangeText={(t) => {
              setCompany(t);
              setIsDirty(true);
            }}
            error={errors.company}
            testID="experience-company-input"
          />

          <TextField
            label="Job Title / Position *"
            placeholder="e.g. Senior Mobile Platform Engineer"
            value={position}
            onChangeText={(t) => {
              setPosition(t);
              setIsDirty(true);
            }}
            error={errors.position}
            testID="experience-position-input"
          />

          <TextField
            label="Location"
            placeholder="e.g. San Francisco, CA (or Remote)"
            value={location}
            onChangeText={(t) => {
              setLocation(t);
              setIsDirty(true);
            }}
            testID="experience-location-input"
          />
        </View>

        {/* Date Row */}
        <Typography variant="body" weight="semibold" style={styles.dateLabel}>
          Employment Period *
        </Typography>

        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <TouchableOpacity
              onPress={() => setActivePicker('start')}
              style={[
                styles.dateButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: errors.startDate
                    ? theme.colors.error
                    : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select start date"
              testID="experience-start-date-btn"
            >
              <Typography
                variant="caption"
                color={startDate ? 'primary' : 'secondary'}
                weight={startDate ? 'semibold' : 'regular'}
              >
                {startDate ? `From: ${startDate}` : 'Start Date (YYYY-MM)'}
              </Typography>
              <Icon name="Calendar" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
            {errors.startDate && (
              <Typography variant="caption" color="error" style={styles.fieldError}>
                {errors.startDate}
              </Typography>
            )}
          </View>

          <View style={styles.dateCol}>
            <TouchableOpacity
              disabled={isCurrent}
              onPress={() => setActivePicker('end')}
              style={[
                styles.dateButton,
                {
                  backgroundColor: isCurrent
                    ? `${theme.colors.textMuted}10`
                    : theme.colors.surfaceElevated,
                  borderColor: errors.endDate
                    ? theme.colors.danger
                    : theme.colors.border,
                  opacity: isCurrent ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select end date"
              testID="experience-end-date-btn"
            >
              <Typography
                variant="caption"
                color={isCurrent ? 'secondary' : endDate ? 'primary' : 'secondary'}
                weight={endDate && !isCurrent ? 'semibold' : 'regular'}
              >
                {isCurrent
                  ? 'Present'
                  : endDate
                  ? `To: ${endDate}`
                  : 'End Date (YYYY-MM)'}
              </Typography>
              <Icon name="Calendar" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
            {errors.endDate && (
              <Typography variant="caption" color="error" style={styles.fieldError}>
                {errors.endDate}
              </Typography>
            )}
          </View>
        </View>

        {/* Current Role Checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkboxRow}
          onPress={() => {
            const next = !isCurrent;
            setIsCurrent(next);
            if (next) setEndDate(null);
            setIsDirty(true);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCurrent }}
          testID="experience-current-checkbox"
        >
          <Icon
            name={isCurrent ? 'CheckSquare' : 'Square'}
            size={20}
            color={isCurrent ? theme.colors.primary : theme.colors.textMuted}
          />
          <Typography variant="body" style={styles.checkboxText}>
            I currently work in this role
          </Typography>
        </TouchableOpacity>

        {/* Bullet Points Editor */}
        <BulletListEditor
          bullets={bullets}
          onChange={(newBullets) => {
            setBullets(newBullets);
            setIsDirty(true);
          }}
          maxBullets={8}
          maxCharactersPerBullet={500}
          label="Key Accomplishments (Bullets)"
          placeholder="e.g., Reduced database query latency by 45% by introducing Redis caching layer."
        />

        <Button
          variant="primary"
          title={isEditing ? 'Save Changes' : 'Add Experience'}
          loading={createItem.isPending || updateItem.isPending}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-experience-btn"
        />

        {/* Date Pickers */}
        <MonthYearPickerSheet
          visible={activePicker === 'start'}
          value={startDate}
          title="Select Start Date"
          onConfirm={(val) => {
            if (val) setStartDate(val);
            setIsDirty(true);
          }}
          onClose={() => setActivePicker(null)}
        />

        <MonthYearPickerSheet
          visible={activePicker === 'end'}
          value={endDate}
          minDate={startDate}
          title="Select End Date"
          onConfirm={(val) => {
            setEndDate(val);
            setIsDirty(true);
          }}
          onClose={() => setActivePicker(null)}
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
  dateLabel: {
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  fieldError: {
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    minHeight: 44,
  },
  checkboxText: {
    marginLeft: 8,
  },
  saveBtn: {
    marginTop: 16,
  },
});
