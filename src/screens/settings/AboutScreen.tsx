import React from 'react';
import {
  Alert,
  Linking,
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
import { Card, Icon, Typography } from '../../components/ui';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AboutScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const handleOpenLegal = (type: 'terms' | 'privacy' | 'licenses') => {
    const titles = {
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      licenses: 'Open Source Licenses',
    };
    Alert.alert(
      titles[type],
      `LatexAI ensures confidentiality and privacy in accordance with GDPR and CCPA standards. For full disclosures, visit https://latexai.internal/legal/${type}.`
    );
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      testID="about-screen"
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
          testID="btn-about-back"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Typography variant="body" weight="bold" style={styles.headerTitle}>
          About LatexAI
        </Typography>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Hero */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: theme.colors.primaryLight + '25',
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Icon name="FileText" size={36} color={theme.colors.primary} />
          </View>

          <Typography variant="h2" weight="bold" style={styles.heroTitle}>
            LatexAI Mobile
          </Typography>
          <Typography variant="bodySm" color="secondary" style={styles.heroSub}>
            Autonomous AI Resume Tailoring & ATS Intelligence Engine
          </Typography>
        </View>

        {/* Metadata Card (MB-6.06) */}
        <Card variant="outlined" style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Typography variant="bodySm" color="secondary">
              Client Version
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              1.0.0 (Build 42)
            </Typography>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.metaRow}>
            <Typography variant="bodySm" color="secondary">
              LaTeX Engine
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              XeLaTeX 2026 Microservice
            </Typography>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.metaRow}>
            <Typography variant="bodySm" color="secondary">
              ATS Scoring Core
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              Weighted Deterministic v2.4
            </Typography>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.metaRow}>
            <Typography variant="bodySm" color="secondary">
              Framework
            </Typography>
            <Typography variant="bodySm" weight="semibold">
              React Native 0.87 (CLI)
            </Typography>
          </View>
        </Card>

        {/* Legal Links (MB-6.06) */}
        <Typography variant="caption" weight="bold" color="secondary" style={styles.sectionTitle}>
          LEGAL & COMPLIANCE
        </Typography>

        <Card variant="outlined" style={styles.linksCard}>
          <TouchableOpacity
            onPress={() => handleOpenLegal('terms')}
            style={styles.linkRow}
            testID="btn-legal-terms"
          >
            <Icon name="Shield" size={18} color={theme.colors.textPrimary} />
            <Typography variant="bodySm" weight="medium" style={styles.linkText}>
              Terms of Service
            </Typography>
            <Icon name="ExternalLink" size={14} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            onPress={() => handleOpenLegal('privacy')}
            style={styles.linkRow}
            testID="btn-legal-privacy"
          >
            <Icon name="Lock" size={18} color={theme.colors.textPrimary} />
            <Typography variant="bodySm" weight="medium" style={styles.linkText}>
              Privacy Policy
            </Typography>
            <Icon name="ExternalLink" size={14} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <TouchableOpacity
            onPress={() => handleOpenLegal('licenses')}
            style={styles.linkRow}
            testID="btn-legal-licenses"
          >
            <Icon name="FileCode" size={18} color={theme.colors.textPrimary} />
            <Typography variant="bodySm" weight="medium" style={styles.linkText}>
              Open Source Licenses
            </Typography>
            <Icon name="ExternalLink" size={14} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </Card>

        <View style={styles.footerNote}>
          <Typography variant="caption" color="muted" style={{ textAlign: 'center' }}>
            Built with Google DeepMind Advanced Agentic Systems
          </Typography>
        </View>
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
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    marginBottom: 4,
  },
  heroSub: {
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  metaCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  linksCard: {
    padding: 8,
    borderRadius: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  linkText: {
    flex: 1,
  },
  footerNote: {
    marginTop: 32,
    marginBottom: 16,
  },
});

