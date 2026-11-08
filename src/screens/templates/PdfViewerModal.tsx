import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../../types/navigation';
import { useTheme } from '../../theme';
import { Icon } from '../../components/ui/Icon';
import { Typography } from '../../components/ui/Typography';
import { PdfViewer } from '../../components/pdf';

export const PdfViewerModal: React.FC<RootStackScreenProps<'PdfViewerModal'>> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const { url, title, base64 } = (route.params || {}) as {
    url?: string;
    title?: string;
    base64?: string;
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View
      testID="pdf-viewer-modal-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="Close PDF Viewer"
          accessibilityRole="button"
          onPress={handleClose}
          style={styles.closeBtn}
          testID="pdf-modal-close-button"
        >
          <Icon name="X" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Typography
            testID="pdf-modal-title"
            variant="h3"
            weight="semibold"
            numberOfLines={1}
            style={styles.title}
          >
            {title || 'Document Preview'}
          </Typography>
        </View>

        <View style={styles.rightPlaceholder} />
      </View>

      {/* PDF Canvas View */}
      <View style={styles.content}>
        <PdfViewer
          source={base64 ? { base64 } : url || ''}
          style={styles.viewer}
          showPageIndicator={true}
          showControls={true}
          testID="fullscreen-pdf-viewer"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  title: {
    textAlign: 'center',
  },
  rightPlaceholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  viewer: {
    flex: 1,
  },
});

