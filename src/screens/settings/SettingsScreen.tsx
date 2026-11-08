import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { ThemeMode } from '../../theme/ThemeContext';
import { Button, Card, ConfirmDialog, Icon, Typography } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { RootStackParamList } from '../../types/navigation';
import {
  checkBiometricsSupport,
  isBiometricsEnabled,
  setBiometricsEnabled,
  authenticateWithBiometrics,
  BiometryStatus,
} from '../../utils/biometrics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const { theme, mode, setThemeMode } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const showToast = useUiStore(state => state.showToast);

  const [biometryStatus, setBiometryStatus] = useState<BiometryStatus>({
    supported: false,
    biometryType: null,
  });
  const [biometricsActive, setBiometricsActive] = useState<boolean>(false);
  const [isLoadingBiometrics, setIsLoadingBiometrics] = useState<boolean>(true);
  const [isTogglingBiometrics, setIsTogglingBiometrics] = useState<boolean>(false);

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBiometricsState() {
      try {
        const [support, enabled] = await Promise.all([
          checkBiometricsSupport(),
          isBiometricsEnabled(),
        ]);

        if (isMounted) {
          setBiometryStatus(support);
          setBiometricsActive(enabled);
        }
      } catch (err) {
        console.warn('[SettingsScreen] Failed to load biometrics settings:', err);
      } finally {
        if (isMounted) {
          setIsLoadingBiometrics(false);
        }
      }
    }

    loadBiometricsState();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleBiometrics = async (nextValue: boolean) => {
    if (isTogglingBiometrics) return;
    setIsTogglingBiometrics(true);

    try {
      if (nextValue) {
        // Require verification to enable
        const promptLabel = biometryStatus.biometryType
          ? `Authenticate with ${biometryStatus.biometryType} to enable app lock`
          : 'Authenticate to enable biometric app lock';

        const authenticated = await authenticateWithBiometrics(promptLabel);
        if (!authenticated) {
          showToast({
            type: 'info',
            message: 'Biometric verification cancelled.',
          });
          setIsTogglingBiometrics(false);
          return;
        }

        const success = await setBiometricsEnabled(true);
        if (success) {
          setBiometricsActive(true);
          showToast({
            type: 'success',
            message: `${biometryStatus.biometryType || 'Biometric'} lock enabled`,
          });
        } else {
          showToast({
            type: 'error',
            message: 'Could not enable biometric lock.',
          });
        }
      } else {
        // Require verification to disable
        const promptLabel = biometryStatus.biometryType
          ? `Authenticate with ${biometryStatus.biometryType} to disable app lock`
          : 'Authenticate to disable biometric app lock';

        const authenticated = await authenticateWithBiometrics(promptLabel);
        if (!authenticated) {
          showToast({
            type: 'warning',
            message: 'Authentication required to disable biometric lock.',
          });
          setIsTogglingBiometrics(false);
          return;
        }

        const success = await setBiometricsEnabled(false);
        if (success) {
          setBiometricsActive(false);
          showToast({
            type: 'info',
            message: 'Biometric lock disabled.',
          });
        } else {
          showToast({
            type: 'error',
            message: 'Could not disable biometric lock.',
          });
        }
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Failed to update biometric lock preference',
      });
    } finally {
      setIsTogglingBiometrics(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLogoutDialogOpen(false);
    setIsLoggingOut(true);
    try {
      await logout();
      showToast({
        type: 'success',
        message: 'Signed out successfully.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Error signing out.',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userInitials = (user?.name || user?.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  const biometryTypeLabel = biometryStatus.biometryType || 'Biometrics';

  const themeOptions: { label: string; mode: ThemeMode; icon: any }[] = [
    { label: 'System', mode: 'system', icon: 'Smartphone' },
    { label: 'Light', mode: 'light', icon: 'Sun' },
    { label: 'Dark', mode: 'dark', icon: 'Moon' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      testID="settings-screen"
    >
      {/* User Info Header Card */}
      <Card variant="elevated" style={styles.userCard}>
        <View style={styles.userRow}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primaryLight + '35',
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Typography variant="h3" weight="bold" color="brand">
              {userInitials}
            </Typography>
          </View>

          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Typography variant="body" weight="bold" numberOfLines={1}>
                {user?.name || 'LatexAI Candidate'}
              </Typography>
              {user?.emailVerified && (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: theme.colors.success + '20' },
                  ]}
                >
                  <Icon name="Check" size={12} color={theme.colors.success} />
                  <Typography
                    variant="caption"
                    weight="medium"
                    style={{ color: theme.colors.success, marginLeft: 3 }}
                  >
                    Verified
                  </Typography>
                </View>
              )}
            </View>
            <Typography variant="bodySm" color="secondary" numberOfLines={1}>
              {user?.email || 'user@example.com'}
            </Typography>
          </View>
        </View>
      </Card>

      {/* Account Management Shortcuts (MB-6.03, MB-6.04) */}
      <View style={styles.section}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionTitle}
        >
          ACCOUNT & SECURITY
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <TouchableOpacity
            style={styles.menuNavRow}
            onPress={() => navigation.navigate('AccountManagement' as any)}
            testID="btn-settings-account"
          >
            <View style={styles.rowIconText}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="User" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Typography variant="body" weight="medium">
                  Account Management
                </Typography>
                <Typography variant="caption" color="secondary">
                  Personal profile and contact info
                </Typography>
              </View>
            </View>
            <Icon name="ChevronRight" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            style={styles.menuNavRow}
            onPress={() => navigation.navigate('ChangePassword' as any)}
            testID="btn-settings-change-password"
          >
            <View style={styles.rowIconText}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="Lock" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Typography variant="body" weight="medium">
                  Change Password
                </Typography>
                <Typography variant="caption" color="secondary">
                  Update account login credentials
                </Typography>
              </View>
            </View>
            <Icon name="ChevronRight" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Security & Biometrics Section */}
      <View style={styles.section}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionTitle}
        >
          SECURITY & PRIVACY
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <View style={styles.rowBetween}>
            <View style={styles.rowIconText}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="Fingerprint" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Typography variant="body" weight="medium">
                  {biometryTypeLabel} App Lock
                </Typography>
                <Typography variant="caption" color="secondary">
                  {biometryStatus.supported
                    ? `Require ${biometryTypeLabel} when opening LatexAI`
                    : 'Biometrics not available on this device'}
                </Typography>
              </View>
            </View>

            {isLoadingBiometrics ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Switch
                value={biometricsActive}
                onValueChange={handleToggleBiometrics}
                disabled={!biometryStatus.supported || isTogglingBiometrics}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.surface}
                testID="biometrics-toggle"
              />
            )}
          </View>
        </Card>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionTitle}
        >
          APPEARANCE
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <Typography variant="body" weight="medium" style={styles.appearanceLabel}>
            Theme Mode
          </Typography>

          <View style={styles.themeSelectorRow}>
            {themeOptions.map(opt => {
              const isSelected = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setThemeMode(opt.mode)}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight + '25'
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${opt.label} theme`}
                  accessibilityState={{ selected: isSelected }}
                  testID={`theme-option-${opt.mode}`}
                >
                  <Icon
                    name={opt.icon}
                    size={18}
                    color={
                      isSelected ? theme.colors.primary : theme.colors.textSecondary
                    }
                  />
                  <Typography
                    variant="bodySm"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                      marginTop: 6,
                    }}
                  >
                    {opt.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </View>

      {/* Data & Privacy Section (MB-6.05) */}
      <View style={styles.section}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionTitle}
        >
          DATA & PRIVACY
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <TouchableOpacity
            style={styles.menuNavRow}
            onPress={() => navigation.navigate('DataPrivacy' as any)}
            testID="btn-settings-privacy"
          >
            <View style={styles.rowIconText}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="Shield" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Typography variant="body" weight="medium">
                  Data Archive & Account Deletion
                </Typography>
                <Typography variant="caption" color="secondary">
                  Export JSON archive or request deletion
                </Typography>
              </View>
            </View>
            <Icon name="ChevronRight" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* About & Compliance Section (MB-6.06) */}
      <View style={styles.section}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionTitle}
        >
          APP & LEGAL
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <TouchableOpacity
            style={styles.menuNavRow}
            onPress={() => navigation.navigate('About' as any)}
            testID="btn-settings-about"
          >
            <View style={styles.rowIconText}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primaryLight + '20' },
                ]}
              >
                <Icon name="Info" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingTextGroup}>
                <Typography variant="body" weight="medium">
                  About LatexAI
                </Typography>
                <Typography variant="caption" color="secondary">
                  Version 1.0.0, XeLaTeX engine, Terms & Privacy
                </Typography>
              </View>
            </View>
            <Icon name="ChevronRight" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Account / Session Management */}
      <View style={styles.section}>
        <Typography
          variant="caption"
          weight="semibold"
          color="secondary"
          style={styles.sectionTitle}
        >
          ACCOUNT
        </Typography>

        <Card variant="outlined" style={styles.cardSection}>
          <Button
            title="Sign Out"
            variant="destructive"
            onPress={() => setIsLogoutDialogOpen(true)}
            loading={isLoggingOut}
            testID="sign-out-button"
            leftIcon={<Icon name="LogOut" size={18} color="#FFFFFF" />}
            fullWidth
          />
        </Card>
      </View>

      {/* App Info Footer */}
      <View style={styles.footer}>
        <Typography variant="caption" color="secondary" style={styles.footerText}>
          LatexAI Mobile v1.0.0
        </Typography>
        <Typography variant="caption" color="muted" style={styles.footerSubtext}>
          Bare React Native Community CLI • High Reliability Engine
        </Typography>
      </View>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        visible={isLogoutDialogOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? Your credentials and local cache will be cleared securely."
        confirmText="Sign Out"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    marginBottom: 24,
    padding: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardSection: {
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextGroup: {
    flex: 1,
  },
  menuNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  appearanceLabel: {
    marginBottom: 12,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    textAlign: 'center',
  },
  footerSubtext: {
    textAlign: 'center',
    marginTop: 4,
  },
});
