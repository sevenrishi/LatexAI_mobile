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
import { Education } from '../../types/user';

type EducationFormRouteProp = RouteProp<ProfileStackParamList, 'EducationForm'>;

export const EducationFormScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<EducationFormRouteProp>();
  const educationId = route.params?.educationId;

  const { data: profile } = useProfile();
  const createItem = useCreateProfileItem<Education>('education');
  const updateItem = useUpdateProfileItem<Education>('education');

  const isEditing = Boolean(educationId);

  // Form states
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState<string | null>('');
  const [current, setCurrent] = useState(false);
  const [gpa, setGpa] = useState('');
  const [honors, setHonors] = useState('');

  // Pickers & validation
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (educationId && profile?.education) {
      const existing = profile.education.find((e) => e.id === educationId);
      if (existing) {
        setInstitution(existing.institution || '');
        setDegree(existing.degree || '');
        setFieldOfStudy(existing.fieldOfStudy || '');
        setLocation(existing.location || '');
        setStartDate(existing.startDate || '');
        setEndDate(existing.endDate || null);
        setCurrent(Boolean(existing.current));
        setGpa(existing.gpa || '');
        setHonors(existing.honors || '');
        setIsDirty(false);
      }
    }
  }, [educationId, profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!institution.trim()) {
      errs.institution = 'Institution name is required';
    }
    if (!degree.trim()) {
      errs.degree = 'Degree is required (e.g. B.S., M.S., Ph.D.)';
    }
    if (!startDate.trim() || !/^\d{4}-\d{2}$/.test(startDate)) {
      errs.startDate = 'Valid start date (YYYY-MM) is required';
    }
    if (!current) {
      if (endDate && !/^\d{4}-\d{2}$/.test(endDate)) {
        errs.endDate = 'End date must be in YYYY-MM format';
      } else if (startDate && endDate && endDate < startDate) {
        errs.endDate = 'End date cannot be earlier than start date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      institution: institution.trim(),
      degree: degree.trim(),
      fieldOfStudy: fieldOfStudy.trim() || undefined,
      location: location.trim() || undefined,
      startDate: startDate.trim(),
      endDate: current ? null : endDate?.trim() || null,
      current,
      gpa: gpa.trim() || undefined,
      honors: honors.trim() || undefined,
    };

    try {
      if (isEditing && educationId) {
        await updateItem.mutateAsync({ id: educationId, data: payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setIsDirty(false);
      navigation.goBack();
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save education.' });
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
        testID="education-form-screen"
      >
        <Typography variant="h2" weight="bold">
          {isEditing ? 'Edit Education' : 'Add Education'}
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Add university degrees, colleges, certificates, or bootcamps.
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
            label="Institution / University *"
            placeholder="e.g. UC Berkeley, Stanford University"
            value={institution}
            onChangeText={(t) => {
              setInstitution(t);
              setIsDirty(true);
            }}
            error={errors.institution}
            testID="education-institution-input"
          />

          <TextField
            label="Degree *"
            placeholder="e.g. Bachelor of Science, Master of Engineering"
            value={degree}
            onChangeText={(t) => {
              setDegree(t);
              setIsDirty(true);
            }}
            error={errors.degree}
            testID="education-degree-input"
          />

          <TextField
            label="Field of Study"
            placeholder="e.g. Computer Science, Electrical Engineering"
            value={fieldOfStudy}
            onChangeText={(t) => {
              setFieldOfStudy(t);
              setIsDirty(true);
            }}
            testID="education-field-input"
          />

          <TextField
            label="Location"
            placeholder="e.g. Berkeley, CA"
            value={location}
            onChangeText={(t) => {
              setLocation(t);
              setIsDirty(true);
            }}
            testID="education-location-input"
          />
        </View>

        {/* Dates */}
        <Typography variant="body" weight="semibold" style={styles.dateLabel}>
          Attendance Period *
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
              testID="education-start-date-btn"
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
              disabled={current}
              onPress={() => setActivePicker('end')}
              style={[
                styles.dateButton,
                {
                  backgroundColor: current
                    ? `${theme.colors.textMuted}10`
                    : theme.colors.surfaceElevated,
                  borderColor: errors.endDate
                    ? theme.colors.danger
                    : theme.colors.border,
                  opacity: current ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select graduation date"
              testID="education-end-date-btn"
            >
              <Typography
                variant="caption"
                color={current ? 'secondary' : endDate ? 'primary' : 'secondary'}
                weight={endDate && !current ? 'semibold' : 'regular'}
              >
                {current
                  ? 'Currently Enrolled'
                  : endDate
                  ? `Graduation: ${endDate}`
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

        {/* Current enrolled checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkboxRow}
          onPress={() => {
            const next = !current;
            setCurrent(next);
            if (next) setEndDate(null);
            setIsDirty(true);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: current }}
          testID="education-current-checkbox"
        >
          <Icon
            name={current ? 'CheckSquare' : 'Square'}
            size={20}
            color={current ? theme.colors.primary : theme.colors.textMuted}
          />
          <Typography variant="body" style={styles.checkboxText}>
            I am currently studying here
          </Typography>
        </TouchableOpacity>

        {/* Honors & GPA */}
        <View style={styles.formGroup}>
          <TextField
            label="GPA"
            placeholder="e.g. 3.86 / 4.0"
            value={gpa}
            onChangeText={(t) => {
              setGpa(t);
              setIsDirty(true);
            }}
            testID="education-gpa-input"
          />

          <TextField
            label="Honors & Extracurriculars"
            placeholder="e.g. Magna Cum Laude, Dean's Honor Roll"
            value={honors}
            onChangeText={(t) => {
              setHonors(t);
              setIsDirty(true);
            }}
            testID="education-honors-input"
          />
        </View>

        <Button
          variant="primary"
          title={isEditing ? 'Save Changes' : 'Add Degree'}
          loading={createItem.isPending || updateItem.isPending}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-education-btn"
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
          title="Select Graduation Date"
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
