import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import {
  Button,
  Card,
  Icon,
  TextField,
  Typography,
} from '../../components/ui';
import { RootStackParamList } from '../../types/navigation';
import { useProfile } from '../../features/profile/useProfile';
import { calculateProfileCompleteness } from '../../features/profile/profileCompleteness';
import {
  TemplateListItem,
  useTemplates,
} from '../../features/templates';
import { TemplatePickerSheet } from '../../screens/templates/TemplatePickerSheet';
import {
  useCreateGeneration,
  useGeneration,
  useParseJobUrl,
} from '../../features/generation/useGeneration';
import { ApiError } from '../../lib/errors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type InputMode = 'text' | 'url';

const MIN_JD_LENGTH = 50;
const URL_REGEX = /^https?:\/\/.+\..+/i;

/**
 * S-28 NewGeneration Screen
 *
 * MB-4.01: Segmented control for text and URL inputs.
 * MB-4.02: Job URL fetch input, loading states, fallback warnings redirecting blocked sites to text pasting.
 * MB-4.03: Wire job submission to POST /generate handling quota errors, incomplete profiles, and duplicate submission prevention.
 * MB-4.04: Support generation parameter pre-filling via fromGenerationId resume reuse options.
 */
export const NewGenerationScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // --- Route params (MB-4.04: fromGenerationId support) ---
  const fromGenerationId: string | undefined = route.params?.fromGenerationId;
  const { data: previousGeneration, isLoading: isLoadingPrevGen } = useGeneration(fromGenerationId);

  // --- Profile & Templates data ---
  const { data: profile } = useProfile();
  const { data: templates = [] } = useTemplates();
  const profileCompleteness = useMemo(
    () => calculateProfileCompleteness(profile),
    [profile],
  );

  // --- Input state ---
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateListItem | null>(null);

  // --- UI state ---
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // --- Mutations ---
  const parseUrlMutation = useParseJobUrl();
  const createGenerationMutation = useCreateGeneration();

  // Ref to track duplicate submission prevention (MB-4.03)
  const isSubmittingRef = useRef(false);

  // Track if prefilled from previous generation to avoid overwriting user edits
  const hasPrefilledRef = useRef(false);

  // --- Pre-fill default active template ---
  useEffect(() => {
    if (!selectedTemplate && templates.length > 0 && !fromGenerationId) {
      const activeTemplate = templates.find((t) => t.isActive);
      if (activeTemplate) {
        setSelectedTemplate(activeTemplate);
      } else {
        setSelectedTemplate(templates[0] || null);
      }
    }
  }, [templates, selectedTemplate, fromGenerationId]);

  // --- Pre-fill from previous generation (MB-4.04) ---
  useEffect(() => {
    if (previousGeneration && !hasPrefilledRef.current) {
      hasPrefilledRef.current = true;

      if (previousGeneration.jobDescriptionText) {
        setJobDescriptionText(previousGeneration.jobDescriptionText);
        setInputMode('text');
      } else if (previousGeneration.jobDescriptionUrl) {
        setJobUrl(previousGeneration.jobDescriptionUrl);
        setInputMode('url');
      }

      if (previousGeneration.templateId && templates.length > 0) {
        const matchingTemplate = templates.find((t) => t.id === previousGeneration.templateId);
        if (matchingTemplate) {
          setSelectedTemplate(matchingTemplate);
        }
      }
    }
  }, [previousGeneration, templates]);

  // Fallback to active template if templates load after previousGeneration
  useEffect(() => {
    if (previousGeneration && templates.length > 0 && !selectedTemplate) {
      const matchingTemplate = templates.find((t) => t.id === previousGeneration.templateId);
      if (matchingTemplate) {
        setSelectedTemplate(matchingTemplate);
      } else {
        const activeTemplate = templates.find((t) => t.isActive) || templates[0];
        if (activeTemplate) setSelectedTemplate(activeTemplate);
      }
    }
  }, [previousGeneration, templates, selectedTemplate]);

  // --- URL fetch handler (MB-4.02) ---
  const handleFetchUrl = useCallback(() => {
    if (!jobUrl.trim()) return;

    if (!URL_REGEX.test(jobUrl.trim())) {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid HTTP or HTTPS URL (e.g., https://careers.example.com/job/123).',
      );
      return;
    }

    Keyboard.dismiss();

    parseUrlMutation.mutate(jobUrl.trim(), {
      onSuccess: (data) => {
        if (data.success && data.jobDescriptionText) {
          // Auto-populate and switch to text mode
          setJobDescriptionText(data.jobDescriptionText);
          setInputMode('text');
        }
        if (data.warning) {
          Alert.alert('Notice', data.warning);
        }
      },
      onError: (error) => {
        const apiError = error as ApiError;
        if (apiError.code === 'URL_BLOCKED') {
          Alert.alert(
            'Site Protected',
            'This job board blocks automated access. Please copy the job description text and paste it directly.',
            [
              {
                text: 'Switch to Text',
                onPress: () => setInputMode('text'),
              },
              { text: 'OK', style: 'cancel' },
            ],
          );
        } else if (apiError.code === 'URL_FETCH_FAILED') {
          Alert.alert(
            'Failed to Fetch',
            'Could not retrieve the job posting. The page may require a login or have expired. Try pasting the text directly instead.',
            [
              {
                text: 'Switch to Text',
                onPress: () => setInputMode('text'),
              },
              { text: 'OK', style: 'cancel' },
            ],
          );
        } else {
          Alert.alert(
            'Fetch Error',
            apiError.message || 'Something went wrong fetching the job URL.',
          );
        }
      },
    });
  }, [jobUrl, parseUrlMutation]);

  // --- Validation ---
  const textValidationError = useMemo(() => {
    if (!hasAttemptedSubmit) return undefined;
    if (inputMode === 'text' && jobDescriptionText.trim().length < MIN_JD_LENGTH) {
      return `Job description must be at least ${MIN_JD_LENGTH} characters (${jobDescriptionText.trim().length}/${MIN_JD_LENGTH})`;
    }
    return undefined;
  }, [inputMode, jobDescriptionText, hasAttemptedSubmit]);

  const urlValidationError = useMemo(() => {
    if (!hasAttemptedSubmit) return undefined;
    if (inputMode === 'url' && !URL_REGEX.test(jobUrl.trim())) {
      return 'Enter a valid job posting URL';
    }
    return undefined;
  }, [inputMode, jobUrl, hasAttemptedSubmit]);

  const templateError = useMemo(() => {
    if (!hasAttemptedSubmit) return undefined;
    if (!selectedTemplate) {
      return 'Please select a resume template';
    }
    return undefined;
  }, [selectedTemplate, hasAttemptedSubmit]);

  const isProfileIncomplete = profileCompleteness.percent < 40;

  const canSubmit = useMemo(() => {
    if (!selectedTemplate) return false;
    if (inputMode === 'text' && jobDescriptionText.trim().length < MIN_JD_LENGTH) return false;
    if (inputMode === 'url' && !URL_REGEX.test(jobUrl.trim())) return false;
    return true;
  }, [selectedTemplate, inputMode, jobDescriptionText, jobUrl]);

  // --- Submit handler (MB-4.03) ---
  const handleSubmit = useCallback(() => {
    setHasAttemptedSubmit(true);

    if (!canSubmit || !selectedTemplate) return;

    // Prevent duplicate submissions (MB-4.03)
    if (isSubmittingRef.current || createGenerationMutation.isPending) return;
    isSubmittingRef.current = true;

    Keyboard.dismiss();

    createGenerationMutation.mutate(
      {
        jobDescriptionText: inputMode === 'text' ? jobDescriptionText.trim() : undefined,
        jobDescriptionUrl: inputMode === 'url' ? jobUrl.trim() : undefined,
        templateId: selectedTemplate.id,
        fromGenerationId: fromGenerationId || undefined,
        sourceGenerationId: fromGenerationId || undefined,
      },
      {
        onSuccess: (data) => {
          isSubmittingRef.current = false;
          navigation.navigate('GenerationProgress', {
            generationId: data.id,
          });
        },
        onError: (error) => {
          isSubmittingRef.current = false;
          const apiError = error as ApiError;

          if (apiError.code === 'QUOTA_EXCEEDED' || (apiError as any).code === 'RATE_LIMIT_EXCEEDED' || apiError.status === 429) {
            Alert.alert(
              'Quota Exceeded',
              'You have reached your daily generation limit. Please upgrade your subscription or try again tomorrow.',
            );
          } else if (apiError.code === 'PROFILE_INCOMPLETE') {
            Alert.alert(
              'Profile Incomplete',
              'Your profile needs more details before generating a resume. Please complete your profile with key work experience and skills.',
              [
                {
                  text: 'Go to Profile',
                  onPress: () =>
                    navigation.navigate('AppTabs', {
                      screen: 'ProfileTab',
                    } as any),
                },
                { text: 'Cancel', style: 'cancel' },
              ],
            );
          } else {
            Alert.alert(
              'Generation Failed',
              apiError.message || 'Something went wrong submitting your resume generation request.',
            );
          }
        },
      },
    );
  }, [
    canSubmit,
    selectedTemplate,
    inputMode,
    jobDescriptionText,
    jobUrl,
    fromGenerationId,
    createGenerationMutation,
    navigation,
  ]);

  // --- Template picker handlers ---
  const handleSelectTemplate = useCallback((template: TemplateListItem) => {
    setSelectedTemplate(template);
  }, []);

  const handlePreviewTemplate = useCallback(
    (templateId: string) => {
      setTemplatePickerVisible(false);
      navigation.navigate('TemplatePreview', {
        templateId,
        templateName: templates.find((t) => t.id === templateId)?.name,
      });
    },
    [navigation, templates],
  );

  // --- Segmented control (MB-4.01) ---
  const renderSegmentedControl = () => (
    <View
      style={[
        styles.segmentedControl,
        { backgroundColor: theme.colors.surfaceElevated, borderRadius: theme.radii.md },
      ]}
      testID="input-mode-segmented-control"
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.segment,
          inputMode === 'text' && [
            styles.segmentActive,
            { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm },
          ],
        ]}
        onPress={() => setInputMode('text')}
        accessibilityRole="tab"
        accessibilityState={{ selected: inputMode === 'text' }}
        accessibilityLabel="Paste text input tab"
        testID="segment-text"
      >
        <Icon
          name="FileText"
          size={16}
          color={inputMode === 'text' ? theme.colors.primary : theme.colors.textMuted}
        />
        <Typography
          variant="label"
          weight={inputMode === 'text' ? 'semibold' : 'regular'}
          color={inputMode === 'text' ? 'primary' : 'secondary'}
          style={styles.segmentLabel}
        >
          Paste Text
        </Typography>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.segment,
          inputMode === 'url' && [
            styles.segmentActive,
            { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm },
          ],
        ]}
        onPress={() => setInputMode('url')}
        accessibilityRole="tab"
        accessibilityState={{ selected: inputMode === 'url' }}
        accessibilityLabel="Job URL input tab"
        testID="segment-url"
      >
        <Icon
          name="Link"
          size={16}
          color={inputMode === 'url' ? theme.colors.primary : theme.colors.textMuted}
        />
        <Typography
          variant="label"
          weight={inputMode === 'url' ? 'semibold' : 'regular'}
          color={inputMode === 'url' ? 'primary' : 'secondary'}
          style={styles.segmentLabel}
        >
          Job URL
        </Typography>
      </TouchableOpacity>
    </View>
  );

  // --- Text input (MB-4.01) ---
  const renderTextInput = () => (
    <View testID="text-input-section">
      <Typography variant="label" weight="medium" color="secondary" style={styles.sectionLabel}>
        Job Description
      </Typography>
      <View
        style={[
          styles.textAreaContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: textValidationError ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        <TextInput
          testID="jd-text-input"
          value={jobDescriptionText}
          onChangeText={setJobDescriptionText}
          placeholder="Paste the full job description here (minimum 50 characters)..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.typography.fontFamilies.regular,
              fontSize: theme.typography.fontSizes.md,
            },
          ]}
          accessible={true}
          accessibilityLabel="Job description text input"
          accessibilityHint="Paste or type the job description text"
        />
      </View>
      <View style={styles.textMetaRow}>
        {textValidationError ? (
          <Typography variant="caption" color="error">
            {textValidationError}
          </Typography>
        ) : (
          <Typography variant="caption" color="muted">
            {jobDescriptionText.trim().length} characters (min {MIN_JD_LENGTH})
          </Typography>
        )}
      </View>
    </View>
  );

  // --- URL input (MB-4.02) ---
  const renderUrlInput = () => (
    <View testID="url-input-section">
      <Typography variant="label" weight="medium" color="secondary" style={styles.sectionLabel}>
        Job Posting URL
      </Typography>
      <View style={styles.urlRow}>
        <View style={styles.urlFieldWrapper}>
          <TextField
            testID="jd-url-input"
            value={jobUrl}
            onChangeText={setJobUrl}
            placeholder="https://careers.example.com/job/123"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleFetchUrl}
            error={urlValidationError}
            leftIcon={<Icon name="Globe" size={18} color={theme.colors.textMuted} />}
            clearable
            onClear={() => {
              setJobUrl('');
              parseUrlMutation.reset();
            }}
          />
        </View>
      </View>

      <Button
        testID="fetch-url-button"
        title={parseUrlMutation.isPending ? 'Fetching Job Description…' : 'Fetch Job Description'}
        variant="secondary"
        size="sm"
        leftIcon={
          parseUrlMutation.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Icon name="Download" size={16} color={theme.colors.textPrimary} />
          )
        }
        onPress={handleFetchUrl}
        disabled={!jobUrl.trim() || parseUrlMutation.isPending}
        loading={parseUrlMutation.isPending}
        style={styles.fetchButton}
      />

      {/* URL parse success feedback */}
      {parseUrlMutation.isSuccess && parseUrlMutation.data?.success && (
        <Card
          variant="outlined"
          style={[styles.urlSuccessCard, { borderColor: theme.colors.success }]}
          testID="url-parse-success"
        >
          <View style={styles.urlSuccessRow}>
            <Icon name="CheckCircle" size={18} color={theme.colors.success} />
            <View style={styles.urlSuccessText}>
              <Typography variant="bodySm" weight="semibold">
                {parseUrlMutation.data.jobTitle || 'Job description extracted'}
              </Typography>
              {parseUrlMutation.data.company && (
                <Typography variant="caption" color="secondary">
                  {parseUrlMutation.data.company}
                </Typography>
              )}
              <Typography variant="caption" color="muted">
                {parseUrlMutation.data.jobDescriptionText.length} characters parsed — switched to text input
              </Typography>
            </View>
          </View>
        </Card>
      )}

      {/* URL parse error fallback warning (MB-4.02) */}
      {parseUrlMutation.isError && (
        <Card
          variant="outlined"
          style={[styles.urlErrorCard, { borderColor: theme.colors.danger }]}
          testID="url-parse-error"
        >
          <View style={styles.urlErrorRow}>
            <Icon name="AlertTriangle" size={18} color={theme.colors.danger} />
            <View style={styles.urlErrorTextWrapper}>
              <Typography variant="bodySm" color="error" weight="semibold">
                {(parseUrlMutation.error as ApiError)?.code === 'URL_BLOCKED'
                  ? 'Anti-Bot Protected Site'
                  : 'Unable to Fetch Job Posting'}
              </Typography>
              <Typography variant="caption" color="secondary" style={styles.urlErrorSubtext}>
                {(parseUrlMutation.error as ApiError)?.code === 'URL_BLOCKED'
                  ? 'This job board blocks automated scrapers. Please switch to text and paste the job description directly.'
                  : 'Could not fetch this webpage. The posting may require login or may have expired. You can paste the text directly.'}
              </Typography>
            </View>
          </View>
          <Button
            title="Switch to Text Input"
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="FileText" size={16} color={theme.colors.primary} />}
            onPress={() => setInputMode('text')}
            style={styles.switchButton}
            testID="switch-to-text-button"
          />
        </Card>
      )}
    </View>
  );

  // --- Template selector section ---
  const renderTemplateSelector = () => (
    <View testID="template-selector-section">
      <Typography variant="label" weight="medium" color="secondary" style={styles.sectionLabel}>
        Resume Template
      </Typography>
      <TouchableOpacity
        activeOpacity={0.8}
        testID="template-selector-button"
        onPress={() => setTemplatePickerVisible(true)}
        style={[
          styles.templateSelectorRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: templateError ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radii.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          selectedTemplate
            ? `Selected template: ${selectedTemplate.name}. Tap to change.`
            : 'Select a resume template'
        }
      >
        <View style={styles.templateSelectorContent}>
          <Icon
            name="FileText"
            size={20}
            color={selectedTemplate ? theme.colors.primary : theme.colors.textMuted}
          />
          <View style={styles.templateSelectorText}>
            <Typography
              variant="body"
              weight={selectedTemplate ? 'semibold' : 'regular'}
              color={selectedTemplate ? undefined : 'muted'}
            >
              {selectedTemplate?.name || 'Choose a template…'}
            </Typography>
            {selectedTemplate?.category && (
              <Typography variant="caption" color="secondary">
                {selectedTemplate.category}
              </Typography>
            )}
          </View>
        </View>
        <Icon name="ChevronRight" size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>
      {templateError && (
        <Typography variant="caption" color="error" style={styles.errorCaption}>
          {templateError}
        </Typography>
      )}
    </View>
  );

  // --- Profile completeness warning (MB-4.03) ---
  const renderProfileWarning = () => {
    if (!isProfileIncomplete) return null;
    return (
      <Card
        variant="outlined"
        style={[styles.warningCard, { borderColor: theme.colors.warning }]}
        testID="profile-incomplete-warning"
      >
        <View style={styles.warningRow}>
          <Icon name="AlertTriangle" size={20} color={theme.colors.warning} />
          <View style={styles.warningText}>
            <Typography variant="bodySm" weight="semibold">
              Profile Incomplete ({profileCompleteness.percent}%)
            </Typography>
            <Typography variant="caption" color="secondary">
              A complete profile produces significantly better tailored resumes. We recommend completing
              your key sections first.
            </Typography>
          </View>
        </View>
        <Button
          title="Complete Profile"
          variant="ghost"
          size="sm"
          onPress={() =>
            navigation.navigate('AppTabs', {
              screen: 'ProfileTab',
            } as any)
          }
          style={styles.warningButton}
          testID="complete-profile-button"
        />
      </Card>
    );
  };

  // --- From Generation reuse banner (MB-4.04) ---
  const renderReuseBanner = () => {
    if (!fromGenerationId) return null;
    return (
      <Card
        variant="outlined"
        style={[styles.reuseBanner, { borderColor: theme.colors.info || theme.colors.primary }]}
        testID="reuse-generation-banner"
      >
        <View style={styles.reuseRow}>
          <Icon name="RefreshCw" size={18} color={theme.colors.info || theme.colors.primary} />
          <View style={styles.reuseTextWrapper}>
            <Typography variant="bodySm" weight="semibold">
              Re-generating from Previous Submission
            </Typography>
            <Typography variant="caption" color="secondary">
              {isLoadingPrevGen
                ? 'Loading previous parameters...'
                : 'Job description and template have been pre-filled from your previous generation.'}
            </Typography>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View
      testID="new-generation-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h2" weight="bold">
              New Generation
            </Typography>
            <Typography variant="bodySm" color="secondary" style={styles.subtitle}>
              Paste a job description or provide a job posting URL to tailor your resume.
            </Typography>
          </View>

          {renderReuseBanner()}
          {renderProfileWarning()}
          {renderSegmentedControl()}

          {inputMode === 'text' ? renderTextInput() : renderUrlInput()}

          <View style={styles.divider} />

          {renderTemplateSelector()}
        </ScrollView>

        {/* Sticky submit button */}
        <View
          style={[
            styles.submitBar,
            {
              backgroundColor: theme.colors.background,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Button
            testID="submit-generation-button"
            title={createGenerationMutation.isPending ? 'Generating…' : 'Generate Resume'}
            variant="primary"
            size="lg"
            leftIcon={
              createGenerationMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="Sparkles" size={20} color="#FFFFFF" />
              )
            }
            onPress={handleSubmit}
            disabled={createGenerationMutation.isPending}
            loading={createGenerationMutation.isPending}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Template Picker Bottom Sheet */}
      <TemplatePickerSheet
        visible={templatePickerVisible}
        onClose={() => setTemplatePickerVisible(false)}
        selectedTemplateId={selectedTemplate?.id}
        onSelectTemplate={handleSelectTemplate}
        onPreviewTemplate={handlePreviewTemplate}
        testID="generation-template-picker"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 6,
    lineHeight: 20,
  },

  // Segmented control (Touch targets >= 44pt)
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 44,
    gap: 6,
  },
  segmentActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentLabel: {
    marginLeft: 2,
  },

  // Section label
  sectionLabel: {
    marginBottom: 8,
  },

  // Text area
  textAreaContainer: {
    borderWidth: 1.5,
    minHeight: 200,
    padding: 4,
  },
  textArea: {
    flex: 1,
    minHeight: 192,
    padding: 12,
    lineHeight: 22,
  },
  textMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },

  // URL input
  urlRow: {
    marginBottom: 4,
  },
  urlFieldWrapper: {
    flex: 1,
  },
  fetchButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 12,
    minHeight: 44,
  },
  urlSuccessCard: {
    padding: 12,
    marginBottom: 8,
  },
  urlSuccessRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  urlSuccessText: {
    flex: 1,
    gap: 2,
  },
  urlErrorCard: {
    padding: 12,
    marginBottom: 8,
  },
  urlErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  urlErrorTextWrapper: {
    flex: 1,
    gap: 2,
  },
  urlErrorSubtext: {
    marginTop: 2,
    lineHeight: 16,
  },
  switchButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 20,
  },

  // Template selector
  templateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    padding: 14,
    minHeight: 56,
  },
  templateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  templateSelectorText: {
    flex: 1,
    gap: 2,
  },
  errorCaption: {
    marginTop: 4,
  },

  // Profile warning
  warningCard: {
    padding: 14,
    marginBottom: 16,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  warningText: {
    flex: 1,
    gap: 4,
  },
  warningButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  // Reuse banner
  reuseBanner: {
    padding: 12,
    marginBottom: 16,
  },
  reuseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reuseTextWrapper: {
    flex: 1,
    gap: 2,
  },

  // Submit bar
  submitBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
