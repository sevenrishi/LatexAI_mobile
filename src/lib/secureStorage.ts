import * as Keychain from 'react-native-keychain';

// In-memory fallback for testing or non-native environments
const memoryFallback = new Map<string, string>();

const isKeychainAvailable = async (): Promise<boolean> => {
  try {
    return typeof Keychain.setGenericPassword === 'function';
  } catch {
    return false;
  }
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const available = await isKeychainAvailable();
    if (!available) {
      return memoryFallback.get(key) || null;
    }
    const result = await Keychain.getGenericPassword({ service: key });
    if (result && typeof result !== 'boolean') {
      return result.password;
    }
    return memoryFallback.get(key) || null;
  } catch (error) {
    console.warn(`[secureStorage] Failed to get key ${key}:`, error);
    return memoryFallback.get(key) || null;
  }
};

export const setSecureItem = async (
  key: string,
  value: string
): Promise<void> => {
  try {
    const available = await isKeychainAvailable();
    if (!available) {
      memoryFallback.set(key, value);
      return;
    }
    await Keychain.setGenericPassword(key, value, { service: key });
  } catch (error) {
    console.warn(`[secureStorage] Failed to set key ${key}:`, error);
    memoryFallback.set(key, value);
  }
};

export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    const available = await isKeychainAvailable();
    if (!available) {
      memoryFallback.delete(key);
      return;
    }
    await Keychain.resetGenericPassword({ service: key });
    memoryFallback.delete(key);
  } catch (error) {
    console.warn(`[secureStorage] Failed to remove key ${key}:`, error);
    memoryFallback.delete(key);
  }
};

/**
 * Supabase-compatible storage adapter wrapping Keychain secure storage.
 */
export const SupabaseStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return getSecureItem(`sb_${key}`);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    return setSecureItem(`sb_${key}`, value);
  },
  removeItem: async (key: string): Promise<void> => {
    return removeSecureItem(`sb_${key}`);
  },
};
