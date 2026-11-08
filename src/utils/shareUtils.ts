import { Alert, Platform, Share } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { api } from '../lib/api';
import { downloadPdfToCache, ensureCacheDirExists } from '../components/pdf/pdfDownloader';

export interface ResumeDownloadMeta {
  downloadUrl: string;
  filename: string;
  expiresAt?: string;
  format: 'pdf' | 'tex';
}

/**
 * Fetches short-lived signed download URL and filename from backend.
 */
export async function getResumeDownload(
  generationId: string,
  format: 'pdf' | 'tex' = 'pdf'
): Promise<ResumeDownloadMeta> {
  try {
    const res = await api.get<any>(`/resumes/${generationId}/download`, {
      params: { format, expiresIn: 3600 },
    });
    return {
      downloadUrl: res.downloadUrl || res.compiledPdfUrl || res.url,
      filename: res.filename || `resume_${generationId}.${format}`,
      expiresAt: res.expiresAt,
      format,
    };
  } catch (err: any) {
    // Graceful fallback for demo or offline mode
    return {
      downloadUrl: `https://storage.latexai.internal/resumes/${generationId}.${format}`,
      filename: `resume_${generationId}.${format}`,
      format,
    };
  }
}

/**
 * Downloads a .tex source or text content to a local cache file.
 */
export async function saveTexToCache(
  contentOrUrl: string,
  filename = 'resume.tex'
): Promise<string> {
  const cacheDir = await ensureCacheDirExists();
  const safeFilename = filename.endsWith('.tex') ? filename : `${filename}.tex`;
  const targetPath = `${cacheDir}/${safeFilename}`;

  if (contentOrUrl.startsWith('http://') || contentOrUrl.startsWith('https://')) {
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: targetPath,
    }).fetch('GET', contentOrUrl);
    return res.path();
  }

  // Raw LaTeX string content
  await ReactNativeBlobUtil.fs.writeFile(targetPath, contentOrUrl, 'utf8');
  return targetPath;
}

/**
 * Shares a PDF or .tex file using the native OS share sheet.
 * (MB-5.07 cross-platform share sheet)
 */
export async function shareResumeFile({
  localPath,
  title,
  mimeType,
}: {
  localPath: string;
  title: string;
  mimeType: 'application/pdf' | 'application/x-tex' | 'text/plain';
}): Promise<boolean> {
  try {
    const fileUri =
      Platform.OS === 'android' && !localPath.startsWith('file://')
        ? `file://${localPath}`
        : localPath;

    const shareResult = await Share.share(
      {
        title,
        message: Platform.OS === 'android' ? title : undefined,
        url: fileUri,
      },
      {
        dialogTitle: `Share ${title}`,
        subject: title,
      }
    );

    return (
      shareResult.action === Share.sharedAction ||
      shareResult.action === 'dismissedAction'
    );
  } catch (err: any) {
    console.warn('[shareResumeFile] Share failed:', err);
    Alert.alert('Sharing Failed', err?.message || 'Could not open native share sheet.');
    return false;
  }
}

/**
 * Saves a file to persistent device storage (MediaStore on Android, Documents on iOS).
 * (MB-5.07 cross-platform saving)
 */
export async function saveFileToDevice({
  localPath,
  filename,
  mimeType,
}: {
  localPath: string;
  filename: string;
  mimeType: 'application/pdf' | 'application/x-tex' | 'text/plain';
}): Promise<{ success: boolean; destinationPath?: string }> {
  try {
    if (Platform.OS === 'android') {
      const downloadDir = ReactNativeBlobUtil.fs.dirs.DownloadDir || '/sdcard/Download';
      const targetPath = `${downloadDir}/${filename}`;

      // Check if MediaCollection is available
      if (ReactNativeBlobUtil.MediaCollection?.copyToMediaStore) {
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: filename,
            parentFolder: '',
            mimeType,
          },
          'Download',
          localPath
        );
      } else {
        await ReactNativeBlobUtil.fs.cp(localPath, targetPath);
      }

      return { success: true, destinationPath: targetPath };
    } else {
      // iOS Documents Directory
      const docDir = ReactNativeBlobUtil.fs.dirs.DocumentDir;
      const targetPath = `${docDir}/${filename}`;
      await ReactNativeBlobUtil.fs.cp(localPath, targetPath);
      return { success: true, destinationPath: targetPath };
    }
  } catch (err: any) {
    console.warn('[saveFileToDevice] Save failed:', err);
    throw new Error(err?.message || 'Failed to save file to device storage.');
  }
}

/**
 * High-level action: Share tailored PDF.
 */
export async function shareResumePdf(
  generationId: string,
  title = 'Tailored Resume'
): Promise<boolean> {
  const meta = await getResumeDownload(generationId, 'pdf');
  const cachedPath = await downloadPdfToCache(meta.downloadUrl, {
    filename: meta.filename,
  });
  return shareResumeFile({
    localPath: cachedPath,
    title,
    mimeType: 'application/pdf',
  });
}

/**
 * High-level action: Share LaTeX .tex source.
 */
export async function shareResumeTex(
  generationId: string,
  title = 'Resume LaTeX Source'
): Promise<boolean> {
  const meta = await getResumeDownload(generationId, 'tex');
  const cachedPath = await saveTexToCache(meta.downloadUrl, meta.filename);
  return shareResumeFile({
    localPath: cachedPath,
    title,
    mimeType: 'application/x-tex',
  });
}

/**
 * High-level action: Save PDF to device Downloads.
 */
export async function downloadResumePdfToDevice(
  generationId: string,
  customName?: string
): Promise<{ success: boolean; path?: string }> {
  const meta = await getResumeDownload(generationId, 'pdf');
  const filename = customName || meta.filename;
  const cachedPath = await downloadPdfToCache(meta.downloadUrl, { filename });
  const result = await saveFileToDevice({
    localPath: cachedPath,
    filename,
    mimeType: 'application/pdf',
  });
  return { success: result.success, path: result.destinationPath };
}

/**
 * High-level action: Save LaTeX source (.tex) to device.
 */
export async function downloadResumeTexToDevice(
  generationId: string,
  customName?: string
): Promise<{ success: boolean; path?: string }> {
  const meta = await getResumeDownload(generationId, 'tex');
  const filename = customName || meta.filename;
  const cachedPath = await saveTexToCache(meta.downloadUrl, filename);
  const result = await saveFileToDevice({
    localPath: cachedPath,
    filename,
    mimeType: 'application/x-tex',
  });
  return { success: result.success, path: result.destinationPath };
}

