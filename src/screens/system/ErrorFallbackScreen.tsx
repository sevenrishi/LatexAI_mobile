import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Button, Card, Icon, Typography } from '../../components/ui';

export interface ErrorFallbackScreenProps {
  error?: Error | null;
  onReset?: () => void;
}

export const ErrorFallbackScreen: React.FC<ErrorFallbackScreenProps> = ({
  error,
  onReset,
}) => {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.colors.dangerSurface },
            ]}
          >
            <Icon
              name="AlertOctagon"
              size={48}
              color={theme.colors.danger}
            />
          </View>
        </View>

        <Typography
          variant="h1"
          weight="bold"
          align="center"
          style={styles.title}
        >
          Something went wrong
        </Typography>

        <Typography
          variant="body"
          color="secondary"
          align="center"
          style={styles.description}
        >
          An unexpected error occurred. Our team has been notified. You can try
          reloading the current view or restarting the application.
        </Typography>

        {error && (
          <Card variant="outlined" style={styles.errorCard}>
            <View style={styles.errorHeaderRow}>
              <Typography variant="bodySm" weight="semibold" color="error">
                {error.name || 'Application Error'}
              </Typography>
              <Button
                title={showDetails ? 'Hide details' : 'Show details'}
                variant="ghost"
                size="sm"
                onPress={() => setShowDetails(prev => !prev)}
              />
            </View>

            <Typography variant="bodySm" color="secondary">
              {error.message || 'Unknown runtime error'}
            </Typography>

            {showDetails && error.stack && (
              <View
                style={[
                  styles.stackContainer,
                  { backgroundColor: theme.colors.surfacePressed },
                ]}
              >
                <Typography variant="code" color="muted">
                  {error.stack}
                </Typography>
              </View>
            )}
          </Card>
        )}

        <View style={styles.actionRow}>
          <Button
            title="Try Again"
            variant="primary"
            size="md"
            onPress={onReset}
            fullWidth
            style={styles.primaryBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 12,
  },
  description: {
    maxWidth: 320,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorCard: {
    width: '100%',
    marginBottom: 24,
  },
  errorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stackContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    maxHeight: 180,
  },
  actionRow: {
    width: '100%',
    maxWidth: 320,
  },
  primaryBtn: {
    marginBottom: 12,
  },
});
