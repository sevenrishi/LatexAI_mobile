import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Button, Card, Icon, Typography } from '../../components/ui';
import {
  UnsavedChangesDialog,
  useUnsavedChangesGuard,
} from '../../components/forms';
import { useProfile, useUpdateProfileRoot } from '../../features/profile/useProfile';

const MAX_SUMMARY_CHARS = 2000;
const MIN_RECOMMENDED_CHARS = 50;

export const SummaryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfileRoot();

  const [summary, setSummary] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setSummary(profile.summary || '');
      setIsDirty(false);
    }
  }, [profile]);

  const { dialogProps } = useUnsavedChangesGuard({ isDirty });

  const charCount = summary.length;
  const isNearLimit = charCount > MAX_SUMMARY_CHARS * 0.9;
  const isOverLimit = charCount > MAX_SUMMARY_CHARS;

  const handleSave = async () => {
    if (isOverLimit) {
      setError(`Summary cannot exceed ${MAX_SUMMARY_CHARS} characters.`);
      return;
    }

    try {
      setError(null);
      await updateProfile.mutateAsync({ summary: summary.trim() });
      setIsDirty(false);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message || 'Failed to save summary.');
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
        testID="summary-editor-screen"
      >
        <Typography variant="h2" weight="bold">
          Professional Summary
        </Typography>
        <Typography variant="body" color="secondary" style={styles.subtitle}>
          A succinct elevator pitch detailing your experience, strengths, and career focus.
        </Typography>

        {/* ATS Tips Card */}
        <Card variant="elevated" style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="Sparkles" size={18} color={theme.colors.primary} />
            <Typography
              variant="body"
              weight="bold"
              color="primary"
              style={styles.tipsTitle}
            >
              ATS & Recruiter Tips
            </Typography>
          </View>
          <Typography variant="caption" color="secondary" style={styles.tipItem}>
            • Aim for 3–5 high-impact sentences (100–300 words).
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.tipItem}>
            • Quantify achievements (e.g. &quot;scaled platform to 10M users&quot;, &quot;cut latency 40%&quot;).
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.tipItem}>
            • AI tailoring dynamically adapts this summary to align with target job descriptions.
          </Typography>
        </Card>

        {error && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: `${theme.colors.error}20` },
            ]}
          >
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          </View>
        )}

        {/* Editor Box */}
        <View
          style={[
            styles.editorContainer,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: isOverLimit
                ? theme.colors.error
                : isNearLimit
                ? theme.colors.warning
                : theme.colors.border,
            },
          ]}
        >
          <TextInput
            multiline
            value={summary}
            onChangeText={(t) => {
              setSummary(t);
              setIsDirty(true);
            }}
            placeholder="Write your professional summary here..."
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.textInput, { color: theme.colors.textPrimary }]}
            testID="summary-text-input"
          />

          <View style={styles.counterRow}>
            <Typography
              variant="caption"
              color={
                charCount < MIN_RECOMMENDED_CHARS
                  ? 'secondary'
                  : 'success'
              }
            >
              {charCount < MIN_RECOMMENDED_CHARS
                ? `Minimum recommended: ${MIN_RECOMMENDED_CHARS} chars`
                : 'Good length'}
            </Typography>
            <Typography
              variant="caption"
              weight="semibold"
              color={isOverLimit ? 'error' : isNearLimit ? 'warning' : 'secondary'}
            >
              {charCount}/{MAX_SUMMARY_CHARS}
            </Typography>
          </View>
        </View>

        <Button
          variant="primary"
          title="Save Summary"
          loading={updateProfile.isPending}
          disabled={isOverLimit}
          onPress={handleSave}
          style={styles.saveBtn}
          testID="save-summary-btn"
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
    marginBottom: 16,
  },
  tipsCard: {
    padding: 14,
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    marginLeft: 8,
  },
  tipItem: {
    lineHeight: 18,
    marginTop: 2,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  editorContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 220,
    marginBottom: 24,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 180,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E130',
    paddingTop: 10,
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 8,
  },
});

