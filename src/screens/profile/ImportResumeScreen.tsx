import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from '@react-native-documents/picker';
import { useTheme } from '../../theme';
import { Button, Card, Icon, Typography } from '../../components/ui';
import { useImportResume } from '../../features/profile/useProfile';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

type ParsingStep = 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'done';

export const ImportResumeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const importResume = useImportResume();

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    type?: string;
  } | null>(null);

  const [parsingStep, setParsingStep] = useState<ParsingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePickDocument = async () => {
    try {
      setErrorMessage(null);
      const res = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.docx,
          DocumentPicker.types.doc,
        ],
      });

      if (res && res.length > 0) {
        const file = res[0];
        if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
          setErrorMessage('File size exceeds 5MB limit. Please select a smaller resume.');
          return;
        }

        setSelectedFile({
          uri: file.uri,
          name: file.name || 'resume.pdf',
          size: file.size ?? undefined,
          type: file.type || 'application/pdf',
        });
      }
    } catch (err: any) {
      if (
        !DocumentPicker.isErrorWithCode(err) ||
        err.code !== DocumentPicker.errorCodes.OPERATION_CANCELED
      ) {
        setErrorMessage(err.message || 'Failed to select document.');
      }
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;

    setErrorMessage(null);
    setParsingStep('uploading');

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type || 'application/pdf',
      } as any);

      // Transition animation simulation while backend processes
      const stepTimer1 = setTimeout(() => setParsingStep('extracting'), 600);
      const stepTimer2 = setTimeout(() => setParsingStep('analyzing'), 1400);

      const draft = await importResume.mutateAsync(formData);

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setParsingStep('done');

      // Navigate to ImportReview screen with draft
      navigation.navigate('ImportReview', {
        importId: draft.importId,
        draft,
      });
    } catch (err: any) {
      setParsingStep('idle');
      setErrorMessage(
        err.message || 'Failed to parse resume. Please check your network or try another file.'
      );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const isProcessing = parsingStep !== 'idle' && parsingStep !== 'done';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      testID="import-resume-screen"
    >
      <Typography variant="h2" weight="bold">
        Import Resume
      </Typography>
      <Typography variant="body" color="secondary" style={styles.subtitle}>
        Upload your existing resume to automatically extract your contact info, experience, education, skills, and projects.
      </Typography>

      {/* Upload Drop Zone / Picker Card */}
      <TouchableOpacity
        disabled={isProcessing}
        onPress={handlePickDocument}
        activeOpacity={0.8}
        style={[
          styles.dropZone,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: selectedFile ? theme.colors.primary : theme.colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Pick resume document"
        testID="pick-resume-file-btn"
      >
        <View
          style={[
            styles.uploadIconCircle,
            { backgroundColor: selectedFile ? `${theme.colors.primary}20` : `${theme.colors.textMuted}20` },
          ]}
        >
          <Icon
            name={selectedFile ? 'FileCheck' : 'UploadCloud'}
            size={32}
            color={selectedFile ? theme.colors.primary : theme.colors.textSecondary}
          />
        </View>

        {selectedFile ? (
          <View style={styles.fileSelectedWrap}>
            <Typography variant="body" weight="bold" color="primary">
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.fileMeta}>
              {formatFileSize(selectedFile.size)} • Tap to change file
            </Typography>
          </View>
        ) : (
          <View style={styles.promptWrap}>
            <Typography variant="body" weight="semibold">
              Select PDF or DOCX file
            </Typography>
            <Typography variant="caption" color="secondary" style={styles.dropZoneSub}>
              Maximum file size: 5MB
            </Typography>
          </View>
        )}
      </TouchableOpacity>

      {errorMessage && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: `${theme.colors.error}20` },
          ]}
        >
          <Icon name="AlertCircle" size={18} color={theme.colors.error} />
          <Typography variant="caption" color="error" style={styles.errorText}>
            {errorMessage}
          </Typography>
        </View>
      )}

      {/* Parsing progress stepper */}
      {isProcessing && (
        <Card variant="elevated" style={styles.progressCard}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <View style={styles.progressTextWrap}>
            <Typography variant="body" weight="semibold">
              {parsingStep === 'uploading'
                ? 'Uploading resume file...'
                : parsingStep === 'extracting'
                ? 'Extracting text and structure...'
                : 'AI analyzing work history & skills...'}
            </Typography>
            <Typography variant="caption" color="secondary">
              This usually takes 3 to 6 seconds.
            </Typography>
          </View>
        </Card>
      )}

      {/* Privacy notice card */}
      <Card variant="elevated" style={styles.privacyCard}>
        <View style={styles.privacyHeader}>
          <Icon name="ShieldCheck" size={18} color={theme.colors.primary} />
          <Typography
            variant="body"
            weight="semibold"
            color="primary"
            style={styles.privacyTitle}
          >
            Private & Secure
          </Typography>
        </View>
        <Typography variant="caption" color="secondary" style={styles.privacyText}>
          Your resume is securely parsed in a sandbox and will never be shared or used to train third-party public models. You will be able to review and confirm all fields before they are saved.
        </Typography>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsWrap}>
        <Button
          variant="primary"
          title={isProcessing ? 'Processing Resume...' : 'Parse & Review'}
          disabled={!selectedFile || isProcessing}
          loading={isProcessing}
          onPress={handleUploadAndParse}
          testID="upload-and-parse-btn"
        />
        <Button
          variant="outline"
          title="Cancel"
          disabled={isProcessing}
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 24,
  },
  dropZone: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 180,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  promptWrap: {
    alignItems: 'center',
  },
  dropZoneSub: {
    marginTop: 4,
  },
  fileSelectedWrap: {
    alignItems: 'center',
  },
  fileMeta: {
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  progressTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  privacyCard: {
    padding: 16,
    marginBottom: 24,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  privacyTitle: {
    marginLeft: 8,
  },
  privacyText: {
    lineHeight: 18,
  },
  actionsWrap: {
    gap: 12,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
