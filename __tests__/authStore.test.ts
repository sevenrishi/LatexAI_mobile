import { useAuthStore } from '../src/store/authStore';
import { supabase } from '../src/lib/supabase';
import { queryClient } from '../src/lib/queryClient';
import * as secureStorage from '../src/lib/secureStorage';
import * as biometricsUtils from '../src/utils/biometrics';
import * as navRef from '../src/app/navigation/navigationRef';
import { api } from '../src/lib/api';
import { User, UserSession } from '../src/types/user';

describe('Zustand Auth Store (MB-0.16, MB-1.11, MB-1.14)', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      isSplashFinished: false,
      isBiometricsLocked: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('updates state when setUser is called', () => {
    const mockUser: User = {
      id: 'usr_test',
      email: 'test@latexai.com',
      emailVerified: true,
      createdAt: '2026-01-01',
    };

    useAuthStore.getState().setUser(mockUser);

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('updates state when setSession is called', () => {
    const mockSession: UserSession = {
      accessToken: 'token_abc',
      refreshToken: 'refresh_xyz',
      expiresAt: 1234567890,
    };

    useAuthStore.getState().setSession(mockSession);

    expect(useAuthStore.getState().session).toEqual(mockSession);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  describe('logout flow (MB-1.11)', () => {
    it('executes complete logout clearing tokens, query caches, and resetting navigation', async () => {
      const signOutSpy = jest.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null } as any);
      const removeSecureSpy = jest.spyOn(secureStorage, 'removeSecureItem').mockResolvedValue();
      const clearQuerySpy = jest.spyOn(queryClient, 'clear');
      const resetRootSpy = jest.spyOn(navRef, 'resetRoot').mockImplementation(() => {});

      useAuthStore.setState({
        user: { id: 'usr_1', email: 'a@b.com', emailVerified: true, createdAt: '' },
        session: { accessToken: 'token_123', refreshToken: 'refresh_123', expiresAt: 9999 },
        isAuthenticated: true,
        isOnboarded: true,
        isBiometricsLocked: false,
      });

      await useAuthStore.getState().logout();

      expect(signOutSpy).toHaveBeenCalled();
      expect(removeSecureSpy).toHaveBeenCalledWith('sb_supabase.auth.token');
      expect(clearQuerySpy).toHaveBeenCalled();
      expect(resetRootSpy).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Auth' }],
      });

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isOnboarded).toBe(false);
      expect(useAuthStore.getState().isBiometricsLocked).toBe(false);
      expect(useAuthStore.getState().isSplashFinished).toBe(true);
    });

    it('continues clearing local state and caches even if Supabase signOut errors', async () => {
      jest.spyOn(supabase.auth, 'signOut').mockRejectedValue(new Error('Network error'));
      const removeSecureSpy = jest.spyOn(secureStorage, 'removeSecureItem').mockResolvedValue();
      const clearQuerySpy = jest.spyOn(queryClient, 'clear');

      useAuthStore.setState({
        user: { id: 'usr_2', email: 'b@b.com', emailVerified: true, createdAt: '' },
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(removeSecureSpy).toHaveBeenCalled();
      expect(clearQuerySpy).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('unlockWithBiometrics', () => {
    it('sets isBiometricsLocked to false when biometric authentication succeeds', async () => {
      jest.spyOn(biometricsUtils, 'authenticateWithBiometrics').mockResolvedValue(true);
      useAuthStore.setState({ isBiometricsLocked: true });

      const success = await useAuthStore.getState().unlockWithBiometrics();

      expect(success).toBe(true);
      expect(useAuthStore.getState().isBiometricsLocked).toBe(false);
    });

    it('keeps isBiometricsLocked true when biometric authentication fails', async () => {
      jest.spyOn(biometricsUtils, 'authenticateWithBiometrics').mockResolvedValue(false);
      useAuthStore.setState({ isBiometricsLocked: true });

      const success = await useAuthStore.getState().unlockWithBiometrics();

      expect(success).toBe(false);
      expect(useAuthStore.getState().isBiometricsLocked).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('calls backend endpoint, updates user metadata, and marks isOnboarded true', async () => {
      const apiPostSpy = jest.spyOn(api, 'post').mockResolvedValue({ success: true } as any);
      const updateUserSpy = jest.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
        data: { user: {} as any },
        error: null,
      });

      const onboardingData = {
        targetRole: 'Senior Frontend Engineer',
        industry: 'Tech',
        experienceLevel: 'Senior',
        goals: ['ATS optimization'],
      };

      await useAuthStore.getState().completeOnboarding(onboardingData);

      expect(apiPostSpy).toHaveBeenCalledWith('/auth/onboarding/complete', onboardingData);
      expect(updateUserSpy).toHaveBeenCalledWith({
        data: {
          onboarded: true,
          onboardingData,
        },
      });
      expect(useAuthStore.getState().isOnboarded).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('initializeAuth', () => {
    it('restores authenticated user session and checks biometric lock', async () => {
      jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: {
          session: {
            access_token: 'at_live',
            refresh_token: 'rt_live',
            expires_at: 1800000000,
            user: {
              id: 'user_live_1',
              email: 'candidate@latexai.com',
              created_at: '2026-01-01T00:00:00Z',
              email_confirmed_at: '2026-01-01T00:00:00Z',
              user_metadata: {
                full_name: 'Alex Rivera',
                onboarded: true,
              },
            } as any,
          } as any,
        },
        error: null,
      });

      jest.spyOn(biometricsUtils, 'isBiometricsEnabled').mockResolvedValue(true);

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isOnboarded).toBe(true);
      expect(useAuthStore.getState().isBiometricsLocked).toBe(true);
      expect(useAuthStore.getState().user?.name).toBe('Alex Rivera');
      expect(useAuthStore.getState().session?.accessToken).toBe('at_live');
    });

    it('sets unauthenticated state when getSession returns no session', async () => {
      jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
    });
  });
});
