import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme';
import { Button, Card, Icon, Typography } from '../../../components/ui';
import { PdfViewer } from '../../../components/pdf/PdfViewer';

export interface InlinePdfViewerProps {
  pdfUrl?: string | null;
  isOutOfDate?: boolean;
  isRerendering?: boolean;
  onRerender?: () => void;
  onFullscreen?: () => void;
  onReload?: () => void;
  testID?: string;
}

export const InlinePdfViewer: React.FC<InlinePdfViewerProps> = ({
  pdfUrl,
  isOutOfDate = false,
  isRerendering = false,
  onRerender,
  onFullscreen,
  onReload,
  testID = 'inline-pdf-viewer',
}) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  return (
    <View style={styles.container} testID={testID}>
      {/* Out-of-date banner overlay */}
      {isOutOfDate && (
        <Card
          style={[
            styles.outOfDateBanner,
            {
              backgroundColor: theme.colors.scoreMedium + '18',
              borderColor: theme.colors.scoreMedium,
            },
          ]}
          testID="out-of-date-banner"
        >
          <View style={styles.bannerRow}>
            <View style={styles.bannerIconWrapper}>
              <Icon
                name="AlertTriangle"
                size={20}
                color={theme.colors.scoreMedium}
              />
            </View>
            <View style={styles.bannerTextWrapper}>
              <Typography variant="bodySm" weight="semibold">
                Content Modified
              </Typography>
              <Typography variant="caption" color="secondary">
                PDF preview is out of date with your latest edits.
              </Typography>
            </View>
            {onRerender && (
              <Button
                title={isRerendering ? 'Compiling...' : 'Re-render'}
                variant="primary"
                size="sm"
                loading={isRerendering}
                disabled={isRerendering}
                onPress={onRerender}
                testID="btn-rerender-pdf"
              />
            )}
          </View>
        </Card>
      )}

      {/* PDF Controls / Status Strip */}
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.toolbarLeft}>
          <Typography variant="caption" color="secondary">
            Page {currentPage} of {totalPages}
          </Typography>
        </View>

        <View style={styles.toolbarRight}>
          {onReload && (
            <TouchableOpacity
              onPress={onReload}
              style={[
                styles.iconButton,
                { backgroundColor: theme.colors.surface },
              ]}
              accessibilityLabel="Reload PDF"
              testID="btn-reload-pdf"
            >
              <Icon name="RefreshCw" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {onFullscreen && (
            <TouchableOpacity
              onPress={onFullscreen}
              style={[
                styles.iconButton,
                { backgroundColor: theme.colors.surface },
              ]}
              accessibilityLabel="Fullscreen PDF Preview"
              testID="btn-fullscreen-pdf"
            >
              <Icon name="Maximize2" size={16} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* PDF Viewer / Container */}
      <View
        style={[
          styles.pdfContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {pdfUrl ? (
          <PdfViewer
            source={{ uri: pdfUrl }}
            style={styles.pdfViewer}
            showControls={false}
            showPageIndicator={false}
            onPageChanged={(page, numPages) => {
              setCurrentPage(page);
              setTotalPages(numPages);
            }}
            onLoadComplete={(numPages) => {
              setTotalPages(numPages);
            }}
            testID="review-pdf-viewer"
          />
        ) : (
          <View style={styles.emptyPdfState} testID="empty-pdf-state">
            <Icon
              name="FileText"
              size={48}
              color={theme.colors.textMuted}
            />
            <Typography
              variant="body"
              weight="medium"
              color="secondary"
              style={styles.emptyTitle}
            >
              Resume PDF Not Available
            </Typography>
            <Typography
              variant="caption"
              color="muted"
              align="center"
              style={styles.emptySubtitle}
            >
              The compiled PDF preview could not be loaded. Tap re-render to compile.
            </Typography>
            {onRerender && (
              <Button
                title="Compile Resume"
                variant="outline"
                size="sm"
                onPress={onRerender}
                loading={isRerendering}
                style={styles.compileButton}
              />
            )}
          </View>
        )}

        {/* Re-rendering loading overlay */}
        {isRerendering && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: theme.colors.background + 'D9' },
            ]}
            testID="rerendering-overlay"
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Typography
              variant="bodySm"
              weight="semibold"
              style={styles.overlayText}
            >
              Compiling XeLaTeX PDF...
            </Typography>
            <Typography variant="caption" color="muted">
              Formatting layout and calculating page budget
            </Typography>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 460,
  },
  outOfDateBanner: {
    marginBottom: 10,
    borderWidth: 1,
    padding: 12,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconWrapper: {
    marginRight: 10,
  },
  bannerTextWrapper: {
    flex: 1,
    marginRight: 8,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfContainer: {
    flex: 1,
    minHeight: 400,
    borderWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  pdfViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  emptyPdfState: {
    flex: 1,
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 12,
  },
  emptySubtitle: {
    marginTop: 6,
    maxWidth: 280,
  },
  compileButton: {
    marginTop: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  overlayText: {
    marginTop: 12,
    marginBottom: 4,
  },
});
