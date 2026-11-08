import 'react-native-url-polyfill/auto';
import { AppState, AppStateStatus } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { SupabaseStorageAdapter } from './secureStorage';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: SupabaseStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

/**
 * Sync Supabase token auto-refresh with the native AppState.
 * When the app is active, token auto-refresh is enabled.
 * When the app enters background, refresh is paused to save battery and network.
 */
export const initSupabaseAppStateListener = (): (() => void) => {
  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => {
    subscription.remove();
  };
};
