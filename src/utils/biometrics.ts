import * as Keychain from 'react-native-keychain';
import { getSecureItem, setSecureItem, removeSecureItem } from '../lib/secureStorage';

const BIOMETRICS_ENABLED_KEY = 'latexai_biometrics_enabled';
const BIOMETRIC_CREDENTIAL_SERVICE = 'latexai_biometric_auth';

export interface BiometryStatus {
  supported: boolean;
  biometryType: 'FaceID' | 'TouchID' | 'Fingerprint' | 'Biometrics' | null;
}

export const checkBiometricsSupport = async (): Promise<BiometryStatus> => {
  try {
    if (typeof Keychain.getSupportedBiometryType !== 'function') {
      return { supported: false, biometryType: null };
    }
    const biometryType = await Keychain.getSupportedBiometryType();
    if (!biometryType) {
      return { supported: false, biometryType: null };
    }

    let friendlyType: BiometryStatus['biometryType'] = 'Biometrics';
    if (biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      friendlyType = 'FaceID';
    } else if (biometryType === Keychain.BIOMETRY_TYPE.TOUCH_ID) {
      friendlyType = 'TouchID';
    } else if (biometryType === Keychain.BIOMETRY_TYPE.FINGERPRINT) {
      friendlyType = 'Fingerprint';
    }

    return { supported: true, biometryType: friendlyType };
  } catch (error) {
    console.warn('[biometrics] checkBiometricsSupport error:', error);
    return { supported: false, biometryType: null };
  }
};

export const isBiometricsEnabled = async (): Promise<boolean> => {
  try {
    const value = await getSecureItem(BIOMETRICS_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

export const setBiometricsEnabled = async (enabled: boolean): Promise<boolean> => {
  try {
    if (enabled) {
      // Store dummy biometric token
      if (typeof Keychain.setGenericPassword === 'function') {
        await Keychain.setGenericPassword('biometric_user', 'biometric_active_token', {
          service: BIOMETRIC_CREDENTIAL_SERVICE,
          accessControl: (Keychain as any).ACCESS_CONTROL?.BIOMETRY_ANY,
          accessible: (Keychain as any).ACCESSIBLE?.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      }
      await setSecureItem(BIOMETRICS_ENABLED_KEY, 'true');
    } else {
      await removeSecureItem(BIOMETRICS_ENABLED_KEY);
      if (typeof Keychain.resetGenericPassword === 'function') {
        await Keychain.resetGenericPassword({ service: BIOMETRIC_CREDENTIAL_SERVICE });
      }
    }
    return true;
  } catch (error) {
    console.warn('[biometrics] setBiometricsEnabled error:', error);
    return false;
  }
};

export const authenticateWithBiometrics = async (
  promptMessage = 'Authenticate to access LatexAI'
): Promise<boolean> => {
  try {
    if (typeof Keychain.getGenericPassword !== 'function') {
      return true; // Fallback in non-native / testing environments
    }

    const creds = await Keychain.getGenericPassword({
      service: BIOMETRIC_CREDENTIAL_SERVICE,
      authenticationPrompt: {
        title: promptMessage,
      },
    });

    return Boolean(creds);
  } catch (error) {
    console.warn('[biometrics] authenticateWithBiometrics failed:', error);
    return false;
  }
};
