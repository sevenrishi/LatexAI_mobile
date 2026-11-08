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
import { Certification } from '../../types/user';
import { isValidUrl } from '../../utils/validation';

type CertificationFormRouteProp = RouteProp<ProfileStackParamList, 'CertificationForm'>;

export const CertificationFormScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<CertificationFormRouteProp>();
  const certificationId = route.params?.certificationId;

  const { data: profile } = useProfile();
  const createItem = useCreateProfileItem<Certification>('certifications');
  const updateItem = useUpdateProfileItem<Certification>('certifications');

  const isEditing = Boolean(certificationId);

  // Form states
  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | null>('');
  const [doesNotExpire, setDoesNotExpire] = useState(false);
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');

  // Pickers & validation
  const [activePicker, setActivePicker] = useState<'issue' | 'expiry' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (certificationId && profile?.certifications) {
      const existing = profile.certifications.find((c) => c.id === certificationId);
      if (existing) {
        setName(existing.name || '');
        setIssuer(existing.issuer || '');
        setIssueDate(existing.issueDate || '');
        setExpiryDate(existing.expiryDate || null);
        setDoesNotExpire(Boolean(existing.doesNotExpire));
        setCredentialId(existing.credentialId || '');
        setCredentialUrl(existing.credentialUrl || existing.url || '');
        setIsDirty(false);
      }
    }
  }, [certificationId, profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Certification name is required';
    }
    if (!issuer.trim()) {
      errs.issuer = 'Issuing organization is required';
    }
    if (!issueDate.trim() || !/^\d{4}-\d{2}$/.test(issueDate)) {
      errs.issueDate = 'Valid issue date (YYYY-MM) is required';
    }
    if (!doesNotExpire) {
      if (expiryDate && !/^\d{4}-\d{2}$/.test(expiryDate)) {
        errs.expiryDate = 'Expiry date must be in YYYY-MM format';
      } else if (issueDate && expiryDate && expiryDate < issueDate) {
        errs.expiryDate = 'Expiry date cannot be earlier than issue date';
      }
    }
    if (credentialUrl.trim() && !isValidUrl(credentialUrl.trim())) {
      errs.credentialUrl = 'Please enter a valid credential verification URL';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      issuer: issuer.trim(),
      issueDate: issueDate.trim(),
      expiryDate: doesNotExpire ? null : expiryDate?.trim() || null,
      doesNotExpire,
      credentialId: credentialId.trim() || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
      url: credentialUrl.trim() || undefined,
    };

    try {
      if (isEditing && certificationId) {
        await updateItem.mutateAsync({ id: certificationId, data: payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      setIsDirty(false);
      navigation.goBack();
    } catch (e: any) {
      setErrors({ form: e.message || 'Failed to save certification.' });
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
        testID="certification-form-screen"
      >
        <Typography variant="h2" weight="bold">
          {isEditing ? 'Edit Certification' : 'Add Certification'}
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          Add industry certifications, credentials, and verification links.
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
            label="Certification Name *"
            placeholder="e.g. AWS Certified Solutions Architect – Professional"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setIsDirty(true);
            }}
            error={errors.name}
            testID="certification-name-input"
          />

          <TextField
            label="Issuing Organization *"
            placeholder="e.g. Amazon Web Services, Google Cloud, Cisco"
            value={issuer}
            onChangeText={(t) => {
              setIssuer(t);
              setIsDirty(true);
            }}
            error={errors.issuer}
            testID="certification-issuer-input"
          />
        </View>

        {/* Dates */}
        <Typography variant="body" weight="semibold" style={styles.dateLabel}>
          Validity Dates *
        </Typography>

        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <TouchableOpacity
              onPress={() => setActivePicker('issue')}
              style={[
                styles.dateButton,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: errors.issueDate
                    ? theme.colors.error
                    : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select issue date"
              testID="certification-issue-date-btn"
            >
              <Typography
                variant="caption"
                color={issueDate ? 'primary' : 'secondary'}
                weight={issueDate ? 'semibold' : 'regular'}
              >
                {issueDate ? `Issued: ${issueDate}` : 'Issue Date (YYYY-MM)'}
              </Typography>
              <Icon name="Calendar" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
            {errors.issueDate && (
              <Typography variant="caption" color="error" style={styles.fieldError}>
                {errors.issueDate}
              </Typography>
            )}
          </View>

          <View style={styles.dateCol}>
            <TouchableOpacity
              disabled={doesNotExpire}
              onPress={() => setActivePicker('expiry')}
              style={[
                styles.dateButton,
                {
                  backgroundColor: doesNotExpire
                    ? `${theme.colors.textMuted}10`
                    : theme.colors.surfaceElevated,
                  borderColor: errors.expiryDate
                    ? theme.colors.danger
                    : theme.colors.border,
                  opacity: doesNotExpire ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Select expiry date"
              testID="certification-expiry-date-btn"
            >
              <Typography
                variant="caption"
                color={
                  doesNotExpire
                    ? 'secondary'
                    : expiryDate
                    ? 'primary'
                    : 'secondary'
                }
                weight={expiryDate && !doesNotExpire ? 'semibold' : 'regular'}
              >
                {doesNotExpire
                  ? 'No Expiration'
                  : expiryDate
                  ? `Expires: ${expiryDate}`
                  : 'Expiry Date (YYYY-MM)'}
              </Typography>
              <Icon name="Calendar" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
            {errors.expiryDate && (
              <Typography variant="caption" color="error" style={styles.fieldError}>
                {errors.expiryDate}
              </Typography>
            )}
          </View>
        </View>

        {/* Does not expire toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkboxRow}
          onPress={() => {
            const next = !doesNotExpire;
            setDoesNotExpire(next);
            if (next) setExpiryDate(null);
            setIsDirty(true);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: doesNotExpire }}
          testID="certification-no-expire-checkbox"
        >
          <Icon
            name={doesNotExpire ? 'CheckSquare' : 'Square'}
            size={20}
            color={doesNotExpire ? theme.colors.primary : theme.colors.textMuted}
          />
          <Typography variant="body" style={styles.checkboxText}>
            This certification does not expire
          </Typography>
        </TouchableOpacity>

        {/* Credential ID and Link */}
        <View style={styles.formGroup}>
          <TextField
            label="Credential ID"
            placeholder="e.g. AWS-PSA-12345678"
            value={credentialId}
            onChangeText={(t) => {
              setCredentialId(t);
              setIsDirty(true);
            }}
            testID="certification-id-input"
          />

          <TextField
            label="Verification URL"
            placeholder="https://credly.com/badges/..."
            value={credentialUrl}
            onChangeText={(t) => {
              setCredentialUrl(t);
              setIsDirty(true);
            }}
            autoCapitalize="none"
            keyboardType="url"
            error={errors.credentialUrl}
            testID="certification-url-input"
          />
        </View>

        <Button
          variant="primary"
          title={isEditing ? 'Save Changes' : 'Add Certification'}
          loading={createItem.isPending || updateItem.isPending}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-certification-btn"
        />

        {/* Date Pickers */}
        <MonthYearPickerSheet
          visible={activePicker === 'issue'}
          value={issueDate}
          title="Select Issue Date"
          onConfirm={(val) => {
            if (val) setIssueDate(val);
            setIsDirty(true);
          }}
          onClose={() => setActivePicker(null)}
        />

        <MonthYearPickerSheet
          visible={activePicker === 'expiry'}
          value={expiryDate}
          minDate={issueDate}
          title="Select Expiry Date"
          onConfirm={(val) => {
            setExpiryDate(val);
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
