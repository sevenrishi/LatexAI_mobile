import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { navigationRef } from '../app/navigation/navigationRef';

export type DeepLinkType =
  | 'oauth_callback'
  | 'reset_password'
  | 'verify_email'
  | 'navigate'
  | 'unknown';

export interface ParsedDeepLink {
  type: DeepLinkType;
  path: string;
  queryParams: Record<string, string>;
  hashParams: Record<string, string>;
  rawUrl: string;
}

/**
 * Parses query or hash parameters string into key-value map.
 * Example: "code=123&type=recovery" -> { code: "123", type: "recovery" }
 */
export const parseParamString = (paramString: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!paramString) return result;

  const clean = paramString.replace(/^[?#]/, '');
  const pairs = clean.split('&');

  for (const pair of pairs) {
    if (!pair) continue;
    const [key, value] = pair.split('=');
    if (key) {
      try {
        const decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
        const decodedValue = decodeURIComponent((value || '').replace(/\+/g, ' '));
        result[decodedKey] = decodedValue;
      } catch {
        result[key] = value || '';
      }
    }
  }

  return result;
};

/**
 * Parses a deep link URL into structured data.
 */
export const parseDeepLink = (url: string): ParsedDeepLink => {
  if (!url || typeof url !== 'string') {
    return {
      type: 'unknown',
      path: '',
      queryParams: {},
      hashParams: {},
      rawUrl: url || '',
    };
  }

  // Remove scheme prefix (latexai:// or https://app.latexai.com/ or https://app.latexai.com)
  let rest = url;
  if (rest.startsWith('latexai://')) {
    rest = rest.slice('latexai://'.length);
  } else if (rest.startsWith('https://app.latexai.com/')) {
    rest = rest.slice('https://app.latexai.com/'.length);
  } else if (rest.startsWith('https://app.latexai.com')) {
    rest = rest.slice('https://app.latexai.com'.length);
  }

  // Separate hash fragment
  let hashString = '';
  const hashIndex = rest.indexOf('#');
  if (hashIndex !== -1) {
    hashString = rest.slice(hashIndex + 1);
    rest = rest.slice(0, hashIndex);
  }

  // Separate query params
  let queryString = '';
  const queryIndex = rest.indexOf('?');
  if (queryIndex !== -1) {
    queryString = rest.slice(queryIndex + 1);
    rest = rest.slice(0, queryIndex);
  }

  // Clean path (remove leading/trailing slashes)
  const path = rest.replace(/^\/+|\/+$/g, '');
  const queryParams = parseParamString(queryString);
  const hashParams = parseParamString(hashString);

  // Determine DeepLinkType
  const allParams = { ...queryParams, ...hashParams };
  let type: DeepLinkType = 'unknown';

  if (
    allParams.type === 'recovery' ||
    path === 'auth/reset-password' ||
    path === 'reset-password' ||
    Boolean(allParams.reset_token)
  ) {
    type = 'reset_password';
  } else if (
    allParams.type === 'signup' ||
    allParams.type === 'email_change' ||
    path === 'verify-email' ||
    path === 'auth/verify'
  ) {
    type = 'verify_email';
  } else if (
    path === 'auth/callback' ||
    Boolean(queryParams.code) ||
    Boolean(hashParams.access_token)
  ) {
    type = 'oauth_callback';
  } else if (path.length > 0) {
    type = 'navigate';
  }

  return {
    type,
    path,
    queryParams,
    hashParams,
    rawUrl: url,
  };
};

/**
 * Handles incoming auth deep links (OAuth callback, password recovery).
 * Returns status result.
 */
export const handleAuthDeepLink = async (
  url: string,
  onNavigate?: (screen: string, params?: Record<string, any>) => void
): Promise<{ success: boolean; type: DeepLinkType; message?: string }> => {
  const parsed = parseDeepLink(url);

  try {
    if (parsed.type === 'oauth_callback') {
      const oauthError =
        parsed.queryParams.error_description ||
        parsed.queryParams.error ||
        parsed.hashParams.error_description ||
        parsed.hashParams.error;

      if (oauthError) {
        return { success: false, type: parsed.type, message: oauthError };
      }

      const code = parsed.queryParams.code;
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          return { success: false, type: parsed.type, message: error.message };
        }
        if (data.session) {
          await useAuthStore.getState().initializeAuth();
          return { success: true, type: parsed.type };
        }
      }

      // Or if access_token in hash
      const accessToken = parsed.hashParams.access_token;
      const refreshToken = parsed.hashParams.refresh_token;
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          return { success: false, type: parsed.type, message: error.message };
        }
        await useAuthStore.getState().initializeAuth();
        return { success: true, type: parsed.type };
      }
    }

    if (parsed.type === 'reset_password') {
      const token =
        parsed.queryParams.token ||
        parsed.hashParams.access_token ||
        parsed.queryParams.code;

      if (onNavigate) {
        onNavigate('ResetPassword', { token, type: 'recovery' });
      } else if (navigationRef.isReady()) {
        (navigationRef as any).navigate('Auth', {
          screen: 'ResetPassword',
          params: { token, type: 'recovery' },
        });
      }
      return { success: true, type: parsed.type };
    }

    if (parsed.type === 'verify_email') {
      const token = parsed.queryParams.token || parsed.queryParams.code;
      const email = parsed.queryParams.email || '';

      if (onNavigate) {
        onNavigate('VerifyEmail', { email, token });
      } else if (navigationRef.isReady()) {
        (navigationRef as any).navigate('Auth', {
          screen: 'VerifyEmail',
          params: { email, token },
        });
      }
      return { success: true, type: parsed.type };
    }

    return { success: true, type: parsed.type };
  } catch (err: any) {
    return {
      success: false,
      type: parsed.type,
      message: err.message || 'Failed to process deep link',
    };
  }
};

/**
 * Registers global deep linking event listener
 */
export const registerDeepLinkListener = (
  onNavigate?: (screen: string, params?: Record<string, any>) => void
): (() => void) => {
  const handleUrl = ({ url }: { url: string }) => {
    if (url) {
      handleAuthDeepLink(url, onNavigate);
    }
  };

  const subscription = Linking.addEventListener('url', handleUrl);

  // Check initial URL
  Linking.getInitialURL().then(initialUrl => {
    if (initialUrl) {
      handleAuthDeepLink(initialUrl, onNavigate);
    }
  });

  return () => {
    subscription.remove();
  };
};
