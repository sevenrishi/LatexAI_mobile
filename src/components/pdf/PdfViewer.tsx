import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { downloadPdfToCache, writeBase64PdfToCache } from './pdfDownloader';

export type PdfSource =
  | string
  | { uri?: string; base64?: string; cache?: boolean };

export interface PdfViewerProps {
  source: PdfSource;
  style?: StyleProp<ViewStyle>;
  initialPage?: number;
  showPageIndicator?: boolean;
  showControls?: boolean;
  enablePinchZoom?: boolean;
  onLoadComplete?: (numberOfPages: number, filePath: string) => void;
  onPageChanged?: (page: number, numberOfPages: number) => void;
  onError?: (error: Error) => void;
  testID?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  source,
  style,
  initialPage = 1,
  showPageIndicator = true,
  showControls = true,
  enablePinchZoom = true,
  onLoadComplete,
  onPageChanged,
  onError,
  testID = 'pdf-viewer',
}) => {
  const { theme } = useTheme();

  const isMountedRef = React.useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const sourceUri = typeof source === 'string' ? source : source?.uri;
  const sourceBase64 = typeof source === 'object' ? source?.base64 : undefined;

  const initialLocalPath = useMemo(() => {
    if (sourceUri && (sourceUri.startsWith('file://') || sourceUri.startsWith('/'))) {
      return sourceUri;
    }
    return null;
  }, [sourceUri]);

  const [localPath, setLocalPath] = useState<string | null>(initialLocalPath);
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialLocalPath && Boolean(sourceUri || sourceBase64)
  );
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const resolveSource = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (!sourceUri && !sourceBase64) {
      setLocalPath(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setDownloadProgress(0);

    try {
      let resolvedUri = '';

      if (sourceBase64) {
        resolvedUri = await writeBase64PdfToCache(sourceBase64);
      } else if (sourceUri) {
        if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
          resolvedUri = await downloadPdfToCache(sourceUri);
        } else if (
          sourceUri.startsWith('data:application/pdf;base64,') ||
          sourceUri.startsWith('JVBER')
        ) {
          resolvedUri = await writeBase64PdfToCache(sourceUri);
        } else {
          resolvedUri = sourceUri;
        }
      }

      if (isMountedRef.current) {
        setLocalPath(resolvedUri);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMsg = err?.message || 'Failed to load PDF document';
        setLoadError(errorMsg);
        onError?.(new Error(errorMsg));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [sourceUri, sourceBase64, onError]);

  const lastSourceRef = React.useRef<string | null>(null);
  const currentSourceKey = sourceUri || (sourceBase64 ? sourceBase64.substring(0, 64) : null);

  useEffect(() => {
    if (!currentSourceKey) {
      return;
    }
    if (initialLocalPath) {
      setLocalPath(initialLocalPath);
      setIsLoading(false);
      lastSourceRef.current = currentSourceKey;
      return;
    }
    if (lastSourceRef.current === currentSourceKey) {
      return;
    }
    lastSourceRef.current = currentSourceKey;
    resolveSource();
  }, [resolveSource, initialLocalPath, currentSourceKey]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleLoadComplete = useCallback(
    (numberOfPages: number, filePath: string) => {
      setIsLoading(false);
      setTotalPages(numberOfPages);
      onLoadComplete?.(numberOfPages, filePath);
    },
    [onLoadComplete]
  );

  const handlePageChanged = useCallback(
    (page: number, numberOfPages: number) => {
      setCurrentPage(page);
      setTotalPages(numberOfPages);
      onPageChanged?.(page, numberOfPages);
    },
    [onPageChanged]
  );

  const handlePdfError = useCallback(
    (error: object) => {
      const errorMsg = (error as any)?.message || 'PDF render error';
      setLoadError(errorMsg);
      onError?.(new Error(errorMsg));
    },
    [onError]
  );

  const pdfSource = useMemo(
    () => ({ uri: localPath || '', cache: true }),
    [localPath]
  );

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerContainer} testID={`${testID}-loading`}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Typography
            variant="body"
            color="secondary"
            style={styles.loadingText}
          >
            {downloadProgress > 0
              ? `Downloading PDF (${Math.round(downloadProgress * 100)}%)...`
              : 'Rendering document...'}
          </Typography>
        </View>
      )}

      {/* Error State */}
      {!isLoading && loadError && (
        <View style={styles.centerContainer} testID={`${testID}-error`}>
          <Icon name="AlertCircle" size={40} color={theme.colors.error} />
          <Typography
            variant="h3"
            weight="semibold"
            style={styles.errorTitle}
          >
            Unable to load PDF
          </Typography>
          <Typography
            variant="bodySm"
            color="secondary"
            style={styles.errorText}
          >
            {loadError}
          </Typography>
          <Button
            title="Retry"
            variant="secondary"
            size="sm"
            onPress={() => resolveSource()}
            style={styles.retryButton}
          />
        </View>
      )}

      {/* PDF Canvas */}
      {!isLoading && !loadError && localPath && (
        <Pdf
          {...({ testID: `${testID}-canvas` } as any)}
          source={pdfSource}
          page={currentPage}
          scale={scale}
          minScale={0.75}
          maxScale={3.0}
          enablePinchZoom={enablePinchZoom}
          horizontal={false}
          spacing={12}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={handlePdfError}
          style={styles.pdf}
        />
      )}

      {/* Floating Controls Overlay */}
      {!isLoading && !loadError && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Page Indicator */}
          {showPageIndicator && totalPages > 0 && (
            <View
              testID={`${testID}-page-indicator`}
              style={[
                styles.pageIndicator,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Typography variant="caption" weight="medium">
                Page {currentPage} of {totalPages}
              </Typography>
            </View>
          )}

          {/* Zoom Controls */}
          {showControls && (
            <View
              testID={`${testID}-controls`}
              style={[
                styles.controlsContainer,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <TouchableOpacity
                accessibilityLabel="Zoom Out"
                accessibilityRole="button"
                onPress={handleZoomOut}
                disabled={scale <= 0.75}
                style={styles.controlBtn}
                testID={`${testID}-zoom-out`}
              >
                <Icon
                  name="Minus"
                  size={18}
                  color={scale <= 0.75 ? theme.colors.textMuted : theme.colors.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Reset Zoom"
                accessibilityRole="button"
                onPress={handleResetZoom}
                style={styles.scaleBadge}
                testID={`${testID}-reset-zoom`}
              >
                <Typography variant="caption" weight="semibold">
                  {Math.round(scale * 100)}%
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Zoom In"
                accessibilityRole="button"
                onPress={handleZoomIn}
                disabled={scale >= 3.0}
                style={styles.controlBtn}
                testID={`${testID}-zoom-in`}
              >
                <Icon
                  name="Plus"
                  size={18}
                  color={scale >= 3.0 ? theme.colors.textMuted : theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
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
    marginTop: 12,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 100,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pageIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    gap: 4,
  },
  controlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  scaleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 46,
    alignItems: 'center',
  },
});

