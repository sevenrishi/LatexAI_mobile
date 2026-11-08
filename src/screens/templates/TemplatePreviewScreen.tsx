import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Button, Card, Chip, Icon, Typography } from '../../components/ui';
import { PdfViewer } from '../../components/pdf';
import {
  useActivateTemplate,
  usePreviewTemplate,
  useTemplate,
} from '../../features/templates';
import { useProfile } from '../../features/profile/useProfile';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const TemplatePreviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();

  const { templateId, templateName } = route.params || {};

  const { data: template, isLoading: isTemplateLoading, error: templateError } =
    useTemplate(templateId);
  const { data: profile } = useProfile();

  const previewMutation = usePreviewTemplate(templateId);
  const activateMutation = useActivateTemplate();

  // Mode: Preview vs LaTeX source
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
  // Data source: sample data vs my profile
  const [dataSource, setDataSource] = useState<'sample' | 'profile'>('sample');
  // Copied flag for latex source
  const [copied, setCopied] = useState(false);

  const compiledRef = React.useRef<string | null>(null);
  const compileKey = `${templateId}_${dataSource}_${dataSource === 'profile' ? profile?.id || 'p' : 's'}`;

  // Compile preview on mount or when data source changes
  useEffect(() => {
    if (!templateId) return;
    if (compiledRef.current === compileKey) return;
    compiledRef.current = compileKey;

    if (dataSource === 'profile' && profile) {
      previewMutation.mutate({ profileData: profile as any });
    } else {
      previewMutation.mutate({});
    }
  }, [templateId, dataSource, compileKey, profile]);

  const handleActivate = () => {
    if (!templateId) return;
    activateMutation.mutate(templateId);
  };

  const handleFullscreen = () => {
    if (!previewMutation.data?.pdfBase64) return;
    navigation.navigate('PdfViewerModal', {
      base64: previewMutation.data.pdfBase64,
      title: `${template?.name || templateName || 'Template'} Preview`,
    });
  };

  const copyTimerRef = React.useRef<any>(null);
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyLatex = () => {
    if (!template?.latexCode) return;
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1000);
  };

  if (isTemplateLoading) {
    return (
      <View
        testID="template-preview-loading"
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Typography variant="body" color="secondary" style={styles.loadingText}>
          Loading template details...
        </Typography>
      </View>
    );
  }

  if (templateError || !template) {
    return (
      <View
        testID="template-preview-error"
        style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}
      >
        <Icon name="AlertCircle" size={48} color={theme.colors.error} />
        <Typography variant="h3" weight="semibold" style={styles.errorTitle}>
          Unable to load template
        </Typography>
        <Typography variant="body" color="secondary" style={styles.errorSubtitle}>
          {(templateError as any)?.message || 'Template could not be retrieved.'}
        </Typography>
        <Button
          title="Go Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  const isActivating =
    activateMutation.isPending && activateMutation.variables === templateId;

  return (
    <View
      testID="template-preview-screen"
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Segmented Tabs: Preview vs LaTeX Source */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          testID="tab-preview"
          onPress={() => setActiveTab('preview')}
          style={[
            styles.tabButton,
            activeTab === 'preview' && [
              styles.tabButtonActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
        >
          <Icon
            name="Eye"
            size={18}
            color={
              activeTab === 'preview'
                ? theme.colors.primary
                : theme.colors.textMuted
            }
          />
          <Typography
            variant="bodySm"
            weight={activeTab === 'preview' ? 'bold' : 'regular'}
            color={activeTab === 'preview' ? 'primary' : 'secondary'}
          >
            PDF Preview
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-source"
          onPress={() => setActiveTab('source')}
          style={[
            styles.tabButton,
            activeTab === 'source' && [
              styles.tabButtonActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
        >
          <Icon
            name="Code"
            size={18}
            color={
              activeTab === 'source'
                ? theme.colors.primary
                : theme.colors.textMuted
            }
          />
          <Typography
            variant="bodySm"
            weight={activeTab === 'source' ? 'bold' : 'regular'}
            color={activeTab === 'source' ? 'primary' : 'secondary'}
          >
            LaTeX Source
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Content depending on active tab */}
      {activeTab === 'preview' ? (
        <View style={styles.previewContainer}>
          {/* Controls Bar: Data Source Toggle & Fullscreen Button */}
          <View
            style={[
              styles.controlsBar,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.sourceToggle}>
              <TouchableOpacity
                testID="toggle-sample-data"
                onPress={() => setDataSource('sample')}
                style={[
                  styles.toggleBtn,
                  dataSource === 'sample' && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{
                    color:
                      dataSource === 'sample'
                        ? '#FFFFFF'
                        : theme.colors.textSecondary,
                  }}
                >
                  Sample Data
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                testID="toggle-profile-data"
                onPress={() => setDataSource('profile')}
                style={[
                  styles.toggleBtn,
                  dataSource === 'profile' && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{
                    color:
                      dataSource === 'profile'
                        ? '#FFFFFF'
                        : theme.colors.textSecondary,
                  }}
                >
                  My Profile
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.headerRightActions}>
              {previewMutation.data?.durationMs ? (
                <View
                  style={[
                    styles.metaPill,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  testID="compile-duration-pill"
                >
                  <Typography variant="caption" color="secondary">
                    ⚡ {previewMutation.data.durationMs}ms
                  </Typography>
                </View>
              ) : null}

              <TouchableOpacity
                testID="preview-fullscreen-button"
                accessibilityLabel="Fullscreen Preview"
                onPress={handleFullscreen}
                disabled={!previewMutation.data?.pdfBase64}
                style={styles.fullscreenIconBtn}
              >
                <Icon
                  name="Maximize2"
                  size={20}
                  color={
                    previewMutation.data?.pdfBase64
                      ? theme.colors.textPrimary
                      : theme.colors.textMuted
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Compilation Preview Body */}
          <View style={styles.canvasArea}>
            {previewMutation.isPending ? (
              <View
                style={styles.compilingContainer}
                testID="preview-compiling-indicator"
              >
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Typography
                  variant="body"
                  color="secondary"
                  style={styles.compilingText}
                >
                  Compiling LaTeX template with pdflatex...
                </Typography>
              </View>
            ) : previewMutation.error ? (
              <View
                style={styles.compileErrorContainer}
                testID="preview-compile-error"
              >
                <Icon name="AlertCircle" size={40} color={theme.colors.error} />
                <Typography
                  variant="h3"
                  weight="semibold"
                  style={styles.compileErrorTitle}
                >
                  Compilation Failed
                </Typography>
                <Typography
                  variant="bodySm"
                  color="secondary"
                  style={styles.compileErrorText}
                >
                  {previewMutation.error.message || 'Error executing pdflatex.'}
                </Typography>
                <Button
                  title="Retry Compilation"
                  variant="secondary"
                  size="sm"
                  onPress={() =>
                    previewMutation.mutate(
                      dataSource === 'profile' && profile
                        ? { profileData: profile as any }
                        : {}
                    )
                  }
                  style={styles.compileRetryBtn}
                />
              </View>
            ) : previewMutation.data?.pdfBase64 ? (
              <PdfViewer
                source={{ base64: previewMutation.data.pdfBase64 }}
                style={styles.pdfViewer}
                showPageIndicator={true}
                showControls={true}
                testID="template-inline-pdf-viewer"
              />
            ) : null}
          </View>
        </View>
      ) : (
        /* Tab 2: LaTeX Source Inspection */
        <ScrollView
          style={styles.sourceScroll}
          contentContainerStyle={styles.sourceContent}
          testID="template-source-container"
        >
          {/* Header info */}
          <Card variant="outlined" style={styles.sourceInfoCard}>
            <View style={styles.sourceInfoRow}>
              <Icon name="Info" size={20} color={theme.colors.primary} />
              <Typography
                variant="bodySm"
                color="secondary"
                style={styles.sourceInfoText}
              >
                Read-only inspection of template LaTeX macros. Sandboxed compiler
                escapes special characters automatically.
              </Typography>
            </View>
          </Card>

          {/* Placeholders chips */}
          {template.placeholders && template.placeholders.length > 0 && (
            <View style={styles.placeholdersSection}>
              <Typography
                variant="caption"
                weight="bold"
                color="secondary"
                style={styles.placeholdersTitle}
              >
                TEMPLATE PLACEHOLDERS
              </Typography>
              <View style={styles.placeholdersRow}>
                {template.placeholders.map((p) => (
                  <Chip
                    key={p}
                    label={`{{${p}}}`}
                    variant="default"
                    style={styles.placeholderChip}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Code block */}
          <View
            style={[
              styles.codeContainer,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.codeHeader}>
              <Typography variant="caption" weight="bold" color="secondary">
                LATEX CODE
              </Typography>
              <TouchableOpacity
                testID="copy-latex-button"
                onPress={handleCopyLatex}
                style={styles.copyBtn}
              >
                <Icon
                  name={copied ? 'Check' : 'Copy'}
                  size={16}
                  color={
                    copied ? theme.colors.success || '#0E9F6E' : theme.colors.primary
                  }
                />
                <Typography
                  variant="caption"
                  weight="semibold"
                  style={{
                    color:
                      copied
                        ? theme.colors.success || '#0E9F6E'
                        : theme.colors.primary,
                  }}
                >
                  {copied ? 'Copied' : 'Copy Code'}
                </Typography>
              </TouchableOpacity>
            </View>
            <Typography
              variant="caption"
              style={[styles.codeText, { color: theme.colors.textPrimary }]}
              testID="latex-code-text"
            >
              {template.latexCode}
            </Typography>
          </View>
        </ScrollView>
      )}

      {/* Bottom Bar: Action */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          title={template.isActive ? 'Active Template' : 'Set as Active Template'}
          variant={template.isActive ? 'ghost' : 'primary'}
          leftIcon={
            template.isActive ? (
              <Icon name="CheckCircle" size={18} color={theme.colors.textMuted} />
            ) : (
              <Icon name="Check" size={18} color="#FFFFFF" />
            )
          }
          disabled={template.isActive}
          loading={isActivating}
          onPress={handleActivate}
          style={styles.footerButton}
          testID="template-preview-activate-btn"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorTitle: {
    marginTop: 16,
  },
  errorSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  previewContainer: {
    flex: 1,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sourceToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fullscreenIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasArea: {
    flex: 1,
  },
  compilingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  compilingText: {
    marginTop: 12,
  },
  compileErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  compileErrorTitle: {
    marginTop: 12,
  },
  compileErrorText: {
    marginTop: 6,
    textAlign: 'center',
  },
  compileRetryBtn: {
    marginTop: 16,
  },
  pdfViewer: {
    flex: 1,
  },
  sourceScroll: {
    flex: 1,
  },
  sourceContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sourceInfoCard: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
  },
  sourceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceInfoText: {
    flex: 1,
    lineHeight: 18,
  },
  placeholdersSection: {
    marginBottom: 16,
  },
  placeholdersTitle: {
    marginBottom: 8,
  },
  placeholdersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placeholderChip: {
    marginBottom: 4,
  },
  codeContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    lineHeight: 20,
    fontSize: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    width: '100%',
  },
});
