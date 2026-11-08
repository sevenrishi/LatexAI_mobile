import { api, setOnUnauthorized } from '../src/lib/api';
import { supabase } from '../src/lib/supabase';

// Mock global fetch
const originalFetch = globalThis.fetch;

describe('API Client Wrapper & Errors (MB-0.14)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('unwraps envelope on success', async () => {
    const mockData = { id: 'usr_123', name: 'Alex' };
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: mockData }),
    });

    const result = await api.get('/profile');
    expect(result).toEqual(mockData);
  });

  it('throws typed ApiError on envelope failure', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Job title is required',
        },
      }),
    });

    await expect(api.post('/generate', {})).rejects.toThrow('Job title is required');
  });

  it('handles 401 response and triggers unauthorized callback when refresh fails', async () => {
    const unauthorizedMock = jest.fn();
    setOnUnauthorized(unauthorizedMock);

    // Mock refreshSession failing
    jest.spyOn(supabase.auth, 'refreshSession').mockResolvedValue({
      data: { session: null, user: null },
      error: new Error('Refresh failed') as any,
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token expired' },
      }),
    });

    await expect(api.get('/auth/me')).rejects.toThrow('Session expired');
    expect(unauthorizedMock).toHaveBeenCalled();
  });
});
