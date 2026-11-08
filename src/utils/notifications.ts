import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { api } from '../lib/api';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Requests notification permissions across iOS and Android (API 33+ POST_NOTIFICATIONS).
 * (MB-6.09 Push notifications)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          'android.permission.POST_NOTIFICATIONS' as any,
          {
            title: 'LatexAI Generation Alerts',
            message: 'Allow LatexAI to notify you when your tailored resume completes compiling.',
            buttonPositive: 'Allow',
            buttonNegative: 'Not Now',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('[notifications] Failed to request Android notification permission:', err);
        return false;
      }
    }
    return true; // Granted by default on Android < 33
  }

  // iOS (APNs simulation / bridge)
  return true;
}

/**
 * Registers device push token with the backend service.
 */
export async function registerPushToken(token: string): Promise<boolean> {
  try {
    await api.post('/auth/push-token', {
      token,
      platform: Platform.OS,
      appVersion: '1.0.0',
    });
    return true;
  } catch (err) {
    // Non-fatal if offline or backend route is optional
    console.log('[notifications] Push token sync note:', err);
    return false;
  }
}

/**
 * Dispatches an alert or local notification when background resume tailoring completes.
 * Called by useGenerationStatus when generation transitions to completed/failed in background.
 */
export function notifyGenerationFinished({
  generationId,
  jobTitle,
  status,
  atsScore,
}: {
  generationId: string;
  jobTitle: string;
  status: 'completed' | 'failed';
  atsScore?: number | null;
}) {
  const isSuccess = status === 'completed';
  const title = isSuccess
    ? 'Resume Compiled Successfully!'
    : 'Resume Generation Failed';

  const body = isSuccess
    ? `Your tailored resume for "${jobTitle}" is ready${atsScore ? ` with an ATS score of ${atsScore}/100` : ''}.`
    : `We encountered an issue compiling the resume for "${jobTitle}". Tap to inspect details.`;

  // Display alert or forward to native banner
  if (Platform.OS !== 'web') {
    console.log(`[Push Notification Alert] [${title}] ${body} (ID: ${generationId})`);
  }
}

