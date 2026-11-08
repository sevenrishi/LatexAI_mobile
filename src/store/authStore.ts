import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { api, setOnUnauthorized } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { removeSecureItem } from '../lib/secureStorage';
import { isBiometricsEnabled, authenticateWithBiometrics } from '../utils/biometrics';
import { useUiStore } from './uiStore';
import { resetRoot } from '../app/navigation/navigationRef';
import { User, UserSession } from '../types/user';

export interface OnboardingData {
  targetRole?: string;
  industry?: string;
  experienceLevel?: string;
  goals?: string[];
  preferredTemplate?: string;
}

export interface AuthState {
  user: User | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  isSplashFinished: boolean;
  isBiometricsLocked: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: UserSession | null) => void;
  setOnboarded: (isOnboarded: boolean) => void;
  setSplashFinished: (isSplashFinished: boolean) => void;
  setError: (error: string | null) => void;
  setBiometricsLocked: (locked: boolean) => void;
  unlockWithBiometrics: () => Promise<boolean>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  loginDemoUser: () => Promise<boolean>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Register global 401 callback with api client
  setOnUnauthorized(() => {
    useUiStore.getState().setSessionExpiredModalVisible(true);
  });

  return {
    user: null,
    session: null,
    isAuthenticated: false,
    isOnboarded: false,
    isLoading: true,
    isSplashFinished: false,
    isBiometricsLocked: false,
    error: null,

    setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

    setSession: (session) =>
      set({ session, isAuthenticated: Boolean(session) }),

    setOnboarded: (isOnboarded) => set({ isOnboarded }),

    setSplashFinished: (isSplashFinished) => set({ isSplashFinished }),

    setError: (error) => set({ error }),

    setBiometricsLocked: (isBiometricsLocked) => set({ isBiometricsLocked }),

    unlockWithBiometrics: async () => {
      const authenticated = await authenticateWithBiometrics('Unlock LatexAI');
      if (authenticated) {
        set({ isBiometricsLocked: false });
        return true;
      }
      return false;
    },

    completeOnboarding: async (data: OnboardingData) => {
      try {
        set({ isLoading: true, error: null });

        // Call backend POST /auth/onboarding/complete
        try {
          await api.post('/auth/onboarding/complete', data);
        } catch (apiErr) {
          console.warn('[authStore] Backend /auth/onboarding/complete notification error (continuing):', apiErr);
        }

        // Persist onboarded state to Supabase user metadata
        try {
          await supabase.auth.updateUser({
            data: {
              onboarded: true,
              onboardingData: data,
            },
          });
        } catch {}

        set({ isOnboarded: true, isLoading: false });
      } catch (err: any) {
        set({ isLoading: false, error: err.message || 'Failed to complete onboarding' });
        throw err;
      }
    },

    loginDemoUser: async () => {
      try {
        set({ isLoading: true, error: null });
        const res = await api.post<{ user: any; session: any }>('/auth/demo', {}, { skipAuth: true });
        if (res?.user && res?.session) {
          const user: User = {
            id: res.user.id,
            email: res.user.email,
            name: res.user.user_metadata?.full_name || 'Alex Rivera',
            avatarUrl: res.user.user_metadata?.avatar_url,
            emailVerified: true,
            createdAt: res.user.created_at,
          };
          const session: UserSession = {
            accessToken: res.session.access_token,
            refreshToken: res.session.refresh_token,
            expiresAt: res.session.expires_in ? Date.now() + res.session.expires_in * 1000 : 0,
          };
          set({
            user,
            session,
            isAuthenticated: true,
            isOnboarded: true,
            isSplashFinished: true,
            isLoading: false,
          });
          return true;
        }
        set({ isLoading: false });
        return false;
      } catch (err: any) {
        set({ isLoading: false, error: err.message || 'Demo login failed' });
        return false;
      }
    },

    logout: async () => {
      try {
        set({ isLoading: true });
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[authStore] Error during signOut:', err);
      } finally {
        // Clear secure keychain tokens
        try {
          await removeSecureItem('sb_supabase.auth.token');
        } catch {}

        // Clear TanStack query caches
        try {
          queryClient.clear();
        } catch {}

        // Reset navigation stack to Auth
        try {
          resetRoot({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        } catch (navErr) {
          console.warn('[authStore] Navigation resetRoot warning:', navErr);
        }

        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
          isSplashFinished: true,
          isBiometricsLocked: false,
          error: null,
        });
      }
    },

    initializeAuth: async () => {
      try {
        set({ isLoading: true, error: null });

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          set({ isLoading: false, error: error.message });
          return;
        }

        if (data?.session) {
          const sbUser = data.session.user;
          const user: User = {
            id: sbUser.id,
            email: sbUser.email || '',
            name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0],
            avatarUrl: sbUser.user_metadata?.avatar_url,
            emailVerified: Boolean(sbUser.email_confirmed_at),
            createdAt: sbUser.created_at,
          };

          const session: UserSession = {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at || 0,
          };

          // Onboarding status flag from user metadata or profile
          const isOnboarded = Boolean(sbUser.user_metadata?.onboarded);

          // Check if biometrics lock is enabled
          const bioEnabled = await isBiometricsEnabled();

          set({
            user,
            session,
            isAuthenticated: true,
            isOnboarded,
            isBiometricsLocked: bioEnabled,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isOnboarded: false,
            isBiometricsLocked: false,
            isLoading: false,
          });
        }
      } catch (err: any) {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: err.message || 'Failed to initialize authentication',
        });
      }
    },
  };
});
