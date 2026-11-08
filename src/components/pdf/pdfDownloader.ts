import ReactNativeBlobUtil from 'react-native-blob-util';
import { supabase } from '../../lib/supabase';

export interface DownloadPdfOptions {
  filename?: string;
  authToken?: string;
  forceRefresh?: boolean;
}

const PDF_CACHE_SUBDIR = 'pdf_cache';

const getCacheDirectory = (): string => {
  const baseDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
  return `${baseDir}/${PDF_CACHE_SUBDIR}`;
};

const sanitizeFilename = (rawName: string): string => {
  const sanitized = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
};

const generateFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length > 0) {
      return sanitizeFilename(lastPart);
    }
  } catch {
    // URL parsing failed or custom format
  }

  // Fallback hash-like representation from URL length and characters
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return `cached_pdf_${Math.abs(hash)}.pdf`;
};

/**
 * Ensures the PDF cache directory exists.
 */
export const ensureCacheDirExists = async (): Promise<string> => {
  const dir = getCacheDirectory();
  const exists = await ReactNativeBlobUtil.fs.exists(dir);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(dir);
  }
  return dir;
};

/**
 * Streams a signed URL or remote PDF into local cache.
 * Returns local file path.
 */
export const downloadPdfToCache = async (
  url: string,
  options: DownloadPdfOptions = {}
): Promise<string> => {
  // If already a local file path
  if (url.startsWith('file://') || url.startsWith('/')) {
    return url;
  }

  const cacheDir = await ensureCacheDirExists();
  const filename = options.filename ? sanitizeFilename(options.filename) : generateFilenameFromUrl(url);
  const targetPath = `${cacheDir}/${filename}`;

  // Check if file is already cached and valid
  if (!options.forceRefresh) {
    const fileExists = await ReactNativeBlobUtil.fs.exists(targetPath);
    if (fileExists) {
      try {
        const stat = await ReactNativeBlobUtil.fs.stat(targetPath);
        if (Number(stat.size) > 0) {
          return targetPath;
        }
      } catch {
        // Continue to download if stat failed
      }
    }
  }

  // Obtain authorization token if not explicitly provided
  let token = options.authToken;
  if (!token) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || undefined;
    } catch {
      // Continue without token (e.g. public/signed CDN URLs)
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/pdf',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: targetPath,
    }).fetch('GET', url, headers);

    const status = res.info().status;
    if (status < 200 || status >= 300) {
      // Cleanup partial file
      await ReactNativeBlobUtil.fs.unlink(targetPath).catch(() => {});
      throw new Error(`PDF download failed with HTTP status ${status}`);
    }

    return targetPath;
  } catch (error: any) {
    // Cleanup on error
    await ReactNativeBlobUtil.fs.unlink(targetPath).catch(() => {});
    throw new Error(error?.message || 'Failed to download PDF to cache');
  }
};

/**
 * Writes base64-encoded PDF data to a local cache file.
 * Returns local file path.
 */
export const writeBase64PdfToCache = async (
  base64Data: string,
  filename = `preview_${Date.now()}.pdf`
): Promise<string> => {
  const cacheDir = await ensureCacheDirExists();
  const safeName = sanitizeFilename(filename);
  const targetPath = `${cacheDir}/${safeName}`;

  // Clean existing
  const exists = await ReactNativeBlobUtil.fs.exists(targetPath);
  if (exists) {
    await ReactNativeBlobUtil.fs.unlink(targetPath).catch(() => {});
  }

  // Strip possible data URI prefix (e.g. "data:application/pdf;base64,")
  const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');

  await ReactNativeBlobUtil.fs.writeFile(targetPath, cleanBase64, 'base64');
  return targetPath;
};

/**
 * Clears cached PDF files.
 */
export const clearPdfCache = async (): Promise<void> => {
  const cacheDir = getCacheDirectory();
  const exists = await ReactNativeBlobUtil.fs.exists(cacheDir);
  if (exists) {
    await ReactNativeBlobUtil.fs.unlink(cacheDir).catch(() => {});
  }
};

