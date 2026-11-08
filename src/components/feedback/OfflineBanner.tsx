import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../theme';
import { Icon, Typography } from '../ui';

export interface OfflineBannerProps {
  onRetry?: () => void;
  style?: any;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry, style }) => {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((state) => {
      setIsOffline(state.isConnected === false);
    });

    // Event listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.scoreMedium + '20',
          borderColor: theme.colors.scoreMedium + '50',
        },
        style,
      ]}
      testID="offline-banner"
      accessibilityRole="alert"
    >
      <View style={styles.leftRow}>
        <Icon name="WifiOff" size={16} color={theme.colors.scoreMedium} />
        <Typography
          variant="caption"
          weight="medium"
          customColor={theme.colors.scoreMedium}
          style={styles.bannerText}
        >
          Offline mode: Viewing cached records. Reconnect to generate or sync.
        </Typography>
      </View>

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryBtn, { backgroundColor: theme.colors.surface }]}
          testID="btn-offline-retry"
          accessibilityLabel="Retry network connection"
        >
          <Icon name="RefreshCw" size={12} color={theme.colors.textPrimary} />
          <Typography variant="caption" weight="semibold">
            Retry
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 8,
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
});

