import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';

import { useTheme } from '../../theme';
import { Button, Card, ConfirmDialog, Icon, Typography } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { api } from '../../lib/api';
import { RootStackParamList } from '../../types/navigation';
import { ensureCacheDirExists } from '../../components/pdf/pdfDownloader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DataPrivacyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore((state) => state.showToast);

  const { user, logout } = useAuthStore();

  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Typed Account Deletion states (MB-6.05)
  const [typedConfirmation, setTypedConfirmation] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const requiredConfirmationText = 'DELETE';
  const isDeleteConfirmed =
    typedConfirmation.trim().toUpperCase() === requiredConfirmationText ||
    typedConfirmation.trim().toLowerCase() === user?.email?.toLowerCase();

  // Handle Export Data (MB-6.05)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      showToast({ type: 'info', message: 'Preparing your data archive...' });
      const archive = await api.get<any>('/auth/export');

      // Save JSON file to cache and trigger share sheet
      const cacheDir = await ensureCacheDirExists();
      const filename = `latexai_export_${Date.now()}.json`;
      const filePath = `${cacheDir}/${filename}`;
      const jsonStr = JSON.stringify(archive, null, 2);

      await ReactNativeBlobUtil.fs.writeFile(filePath, jsonStr, 'utf8');

      const fileUri =
        Platform.OS === 'android' && !filePath.startsWith('file://')
          ? `file://${filePath}`
          : filePath;

      await Share.share({
        title: 'LatexAI Data Archive',
        url: fileUri,
        message: 'Here is your exported LatexAI account and resume data.',
      });

      showToast({
        type: 'success',
        title: 'Export Complete',
        message: 'Account data archive generated successfully.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: err?.message || 'Could not export user data archive.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Permanent Delete Account (MB-6.05)
  const handleExecuteDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    setIsDeleting(true);

    try {
      await api.delete('/auth/account');

      showToast({
        type: 'info',
        title: 'Account Deleted',
        message: 'Your account and all associated data have been permanently removed.',
      });

      await logout();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err?.message || 'Failed to delete account. Please try again.',
      });
      setIsDeleting(false);
    }
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="data-privacy-screen"
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
          testID="btn-privacy-back"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Typography variant="body" weight="bold" style={styles.headerTitle}>
          Data & Privacy
        </Typography>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Data Export */}
        <Typography variant="caption" weight="bold" color="secondary" style={styles.sectionHeader}>
          EXPORT ACCOUNT DATA
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <Typography variant="body" weight="semibold">
            Download JSON Data Archive
          </Typography>
          <Typography variant="caption" color="secondary" style={styles.cardDesc}>
            Request an export of all your tailored resumes, profile records, and ATS scoring audit logs in portable JSON format.
          </Typography>

          <Button
            title="Export My Data"
            variant="secondary"
            leftIcon={<Icon name="Download" size={16} color={theme.colors.textPrimary} />}
            onPress={handleExportData}
            loading={isExporting}
            testID="btn-export-data"
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Section 2: Account Deletion (MB-6.05) */}
        <Typography variant="caption" weight="bold" color="secondary" style={styles.sectionHeader}>
          DANGER ZONE
        </Typography>

        <Card
          variant="outlined"
          style={[styles.cardSection, { borderColor: theme.colors.scoreLow + '60' }]}
        >
          <View style={styles.dangerTitleRow}>
            <Icon name="AlertTriangle" size={18} color={theme.colors.scoreLow} />
            <Typography variant="body" weight="bold" customColor={theme.colors.scoreLow}>
              Delete Account
            </Typography>
          </View>

          <Typography variant="caption" color="secondary" style={styles.cardDesc}>
            Permanently delete your user account, stored resumes, compiled PDFs, and profile records. This action cannot be undone.
          </Typography>

          <Typography variant="caption" weight="semibold" style={styles.confirmPrompt}>
            To confirm deletion, type <Typography variant="caption" weight="bold">DELETE</Typography> or your email address ({user?.email}) below:
          </Typography>

          <TextInput
            value={typedConfirmation}
            onChangeText={setTypedConfirmation}
            placeholder='Type "DELETE" to confirm'
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
            style={[
              styles.typedInput,
              {
                color: theme.colors.textPrimary,
                borderColor: isDeleteConfirmed ? theme.colors.scoreLow : theme.colors.border,
                backgroundColor: theme.colors.surfaceElevated,
              },
            ]}
            testID="input-confirm-deletion"
          />

          <Button
            title="Permanently Delete Account"
            variant="destructive"
            onPress={() => setIsDeleteModalOpen(true)}
            disabled={!isDeleteConfirmed || isDeleting}
            loading={isDeleting}
            testID="btn-delete-account"
            style={{ marginTop: 12 }}
          />
        </Card>
      </ScrollView>

      {/* Final Safety Confirm Dialog */}
      <ConfirmDialog
        visible={isDeleteModalOpen}
        title="Final Confirmation"
        message="Are you absolutely certain? All your resume data, uploaded files, and templates will be irreversibly erased from our databases."
        confirmText="Yes, Delete My Account"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleExecuteDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    marginTop: 8,
  },
  cardSection: {
    padding: 16,
    borderRadius: 12,
  },
  cardDesc: {
    marginTop: 4,
    lineHeight: 18,
  },
  dangerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmPrompt: {
    marginTop: 14,
    marginBottom: 6,
  },
  typedInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});

