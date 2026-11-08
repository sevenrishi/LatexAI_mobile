import {
  parseParamString,
  parseDeepLink,
  handleAuthDeepLink,
  registerDeepLinkListener,
} from '../src/utils/deepLinks';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/authStore';
import { navigationRef } from '../src/app/navigation/navigationRef';
import { Linking } from 'react-native';

describe('Deep Link Parser & Handler (MB-1.02, MB-1.14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseParamString', () => {
    it('parses valid key-value query parameters', () => {
      const parsed = parseParamString('code=xyz123&type=recovery&email=user%40test.com');
      expect(parsed).toEqual({
        code: 'xyz123',
        type: 'recovery',
        email: 'user@test.com',
      });
    });

    it('handles leading ? or #', () => {
      const fromQuery = parseParamString('?code=123');
      const fromHash = parseParamString('#access_token=abc');
      expect(fromQuery.code).toBe('123');
      expect(fromHash.access_token).toBe('abc');
    });

    it('decodes plus signs as spaces', () => {
      const parsed = parseParamString('name=John+Doe&role=Software+Engineer');
      expect(parsed.name).toBe('John Doe');
      expect(parsed.role).toBe('Software Engineer');
    });

    it('returns empty object for empty or undefined input', () => {
      expect(parseParamString('')).toEqual({});
      expect(parseParamString(null as any)).toEqual({});
    });
  });

  describe('parseDeepLink', () => {
    it('identifies oauth_callback URLs with code query param', () => {
      const parsed = parseDeepLink('latexai://auth/callback?code=oauth_code_123');
      expect(parsed.type).toBe('oauth_callback');
      expect(parsed.queryParams.code).toBe('oauth_code_123');
    });

    it('identifies oauth_callback URLs with access_token in hash', () => {
      const parsed = parseDeepLink(
        'latexai://auth/callback#access_token=tok_123&refresh_token=tok_456'
      );
      expect(parsed.type).toBe('oauth_callback');
      expect(parsed.hashParams.access_token).toBe('tok_123');
      expect(parsed.hashParams.refresh_token).toBe('tok_456');
    });

    it('identifies reset_password URLs with recovery type in hash', () => {
      const parsed = parseDeepLink(
        'latexai://auth/reset-password#access_token=token_recovery&type=recovery'
      );
      expect(parsed.type).toBe('reset_password');
      expect(parsed.hashParams.access_token).toBe('token_recovery');
      expect(parsed.hashParams.type).toBe('recovery');
    });

    it('identifies reset-password path without hash', () => {
      const parsed = parseDeepLink('latexai://reset-password?code=code_recovery');
      expect(parsed.type).toBe('reset_password');
      expect(parsed.queryParams.code).toBe('code_recovery');
    });

    it('identifies verify_email URLs with signup type', () => {
      const parsed = parseDeepLink(
        'latexai://verify-email?token=verif_token_99&email=test%40latexai.com&type=signup'
      );
      expect(parsed.type).toBe('verify_email');
      expect(parsed.queryParams.token).toBe('verif_token_99');
      expect(parsed.queryParams.email).toBe('test@latexai.com');
    });

    it('identifies verify_email with auth/verify path', () => {
      const parsed = parseDeepLink('latexai://auth/verify?token=tok123');
      expect(parsed.type).toBe('verify_email');
    });

    it('identifies universal https links', () => {
      const parsed = parseDeepLink('https://app.latexai.com/templates');
      expect(parsed.type).toBe('navigate');
      expect(parsed.path).toBe('templates');
    });

    it('handles empty or non-string inputs safely', () => {
      const parsed = parseDeepLink('');
      expect(parsed.type).toBe('unknown');
      expect(parsed.path).toBe('');

      const nullParsed = parseDeepLink(null as any);
      expect(nullParsed.type).toBe('unknown');
    });
  });

  describe('handleAuthDeepLink', () => {
    it('exchanges OAuth code for session and calls initializeAuth', async () => {
      const mockSession = { access_token: 'at_123', refresh_token: 'rt_123' };
      jest
        .spyOn(supabase.auth, 'exchangeCodeForSession')
        .mockResolvedValue({ data: { session: mockSession as any, user: null as any }, error: null } as any);
      const initAuthSpy = jest
        .spyOn(useAuthStore.getState(), 'initializeAuth')
        .mockResolvedValue();

      const result = await handleAuthDeepLink(
        'latexai://auth/callback?code=oauth_code_xyz'
      );

      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('oauth_code_xyz');
      expect(initAuthSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.type).toBe('oauth_callback');
    });

    it('sets session when access_token and refresh_token are in hash fragment', async () => {
      const setSessionSpy = jest
        .spyOn(supabase.auth, 'setSession')
        .mockResolvedValue({ data: { session: {} as any, user: null as any }, error: null });
      const initAuthSpy = jest
        .spyOn(useAuthStore.getState(), 'initializeAuth')
        .mockResolvedValue();

      const result = await handleAuthDeepLink(
        'latexai://auth/callback#access_token=tok_access&refresh_token=tok_refresh'
      );

      expect(setSessionSpy).toHaveBeenCalledWith({
        access_token: 'tok_access',
        refresh_token: 'tok_refresh',
      });
      expect(initAuthSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('handles exchangeCodeForSession error cleanly', async () => {
      jest.spyOn(supabase.auth, 'exchangeCodeForSession').mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid exchange code' } as any,
      });

      const result = await handleAuthDeepLink(
        'latexai://auth/callback?code=bad_code'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid exchange code');
    });

    it('handles OAuth error parameters cleanly', async () => {
      const result = await handleAuthDeepLink(
        'latexai://auth/callback?error=access_denied&error_description=User+cancelled'
      );

      expect(result.success).toBe(false);
      expect(result.type).toBe('oauth_callback');
      expect(result.message).toContain('User cancelled');
    });

    it('routes to ResetPassword on recovery deep link with onNavigate callback', async () => {
      const mockNavigate = jest.fn();
      const result = await handleAuthDeepLink(
        'latexai://auth/reset-password#access_token=token_abc&type=recovery',
        mockNavigate
      );

      expect(mockNavigate).toHaveBeenCalledWith('ResetPassword', {
        token: 'token_abc',
        type: 'recovery',
      });
      expect(result.success).toBe(true);
      expect(result.type).toBe('reset_password');
    });

    it('routes to ResetPassword via navigationRef if onNavigate is omitted', async () => {
      jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
      const navSpy = jest.spyOn(navigationRef, 'navigate').mockImplementation(() => {});

      const result = await handleAuthDeepLink(
        'latexai://auth/reset-password?code=code_xyz'
      );

      expect(navSpy).toHaveBeenCalledWith('Auth', {
        screen: 'ResetPassword',
        params: { token: 'code_xyz', type: 'recovery' },
      });
      expect(result.success).toBe(true);
    });

    it('routes to VerifyEmail on email verification deep link', async () => {
      const mockNavigate = jest.fn();
      const result = await handleAuthDeepLink(
        'latexai://verify-email?token=token_xyz&email=candidate%40example.com',
        mockNavigate
      );

      expect(mockNavigate).toHaveBeenCalledWith('VerifyEmail', {
        email: 'candidate@example.com',
        token: 'token_xyz',
      });
      expect(result.success).toBe(true);
      expect(result.type).toBe('verify_email');
    });

    it('routes to VerifyEmail via navigationRef if onNavigate is omitted', async () => {
      jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
      const navSpy = jest.spyOn(navigationRef, 'navigate').mockImplementation(() => {});

      const result = await handleAuthDeepLink(
        'latexai://verify-email?token=tok_77&email=user%40test.com'
      );

      expect(navSpy).toHaveBeenCalledWith('Auth', {
        screen: 'VerifyEmail',
        params: { email: 'user@test.com', token: 'tok_77' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('registerDeepLinkListener', () => {
    it('attaches listener to Linking event and removes on unsubscribe', () => {
      const removeMock = jest.fn();
      jest.spyOn(Linking, 'addEventListener').mockReturnValue({ remove: removeMock } as any);
      jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);

      const unsubscribe = registerDeepLinkListener();

      expect(Linking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
      unsubscribe();
      expect(removeMock).toHaveBeenCalled();
    });
  });
});
