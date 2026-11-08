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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { Button, Card, Icon, TextField, Typography } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { api } from '../../lib/api';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AccountManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const showToast = useUiStore((state) => state.showToast);

  const { user, setUser } = useAuthStore();

  const [fullName, setFullName] = useState<string>(user?.name || '');
  const [headline, setHeadline] = useState<string>(user?.headline || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const isEmailVerified = Boolean(user?.emailVerified);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await api.patch<any>('/auth/me', {
        fullName: fullName.trim(),
        headline: headline.trim(),
      });

      if (user) {
        setUser({
          ...user,
          name: fullName.trim() || user.name,
          headline: headline.trim(),
        });
      }

      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your account details have been saved.',
      });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Failed to update account profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="account-management-screen"
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
          testID="btn-account-back"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Typography variant="body" weight="bold" style={styles.headerTitle}>
          Account Management
        </Typography>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Email & Status */}
        <Card variant="outlined" style={styles.cardSection}>
          <Typography variant="caption" weight="bold" color="secondary" style={styles.fieldLabel}>
            EMAIL ADDRESS
          </Typography>
          <View style={styles.emailRow}>
            <Typography variant="body" weight="medium">
              {user?.email || 'user@example.com'}
            </Typography>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isEmailVerified
                    ? theme.colors.scoreHigh + '20'
                    : theme.colors.scoreMedium + '20',
                },
              ]}
            >
              <Icon
                name={isEmailVerified ? 'Check' : 'AlertCircle'}
                size={12}
                color={isEmailVerified ? theme.colors.scoreHigh : theme.colors.scoreMedium}
              />
              <Typography
                variant="caption"
                weight="bold"
                customColor={isEmailVerified ? theme.colors.scoreHigh : theme.colors.scoreMedium}
              >
                {isEmailVerified ? 'Verified' : 'Unverified'}
              </Typography>
            </View>
          </View>
        </Card>

        {/* Profile Inputs */}
        <Card variant="outlined" style={styles.cardSection}>
          <TextField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Alex Johnson"
            testID="input-account-name"
          />

          <TextField
            label="Professional Headline"
            value={headline}
            onChangeText={setHeadline}
            placeholder="e.g. Senior Backend Systems Engineer"
            testID="input-account-headline"
            containerStyle={{ marginTop: 12 }}
          />
        </Card>

        {/* Security Shortcut */}
        <Card variant="outlined" style={styles.cardSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChangePassword' as any)}
            style={styles.shortcutRow}
            testID="btn-account-change-password"
          >
            <View style={styles.shortcutIconCol}>
              <Icon name="Lock" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.shortcutTextCol}>
              <Typography variant="body" weight="medium">
                Change Password
              </Typography>
              <Typography variant="caption" color="secondary">
                Update account login credentials
              </Typography>
            </View>
            <Icon name="ChevronRight" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        <Button
          title="Save Changes"
          variant="primary"
          onPress={handleSaveProfile}
          loading={isSaving}
          testID="btn-account-save"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
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
    gap: 16,
  },
  cardSection: {
    padding: 16,
    borderRadius: 12,
  },
  fieldLabel: {
    marginBottom: 6,
  },
  emailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutIconCol: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTextCol: {
    flex: 1,
  },
});
