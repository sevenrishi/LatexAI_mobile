import { env } from '../config/env';
import { ApiError, ApiErrorCode } from './errors';
import { supabase } from './supabase';

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const setOnUnauthorized = (handler: UnauthorizedHandler): void => {
  unauthorizedHandler = handler;
};

let mockHandler: ((path: string, options?: RequestOptions) => Promise<unknown | null>) | null = null;

export const registerMockHandler = (
  handler: (path: string, options?: RequestOptions) => Promise<unknown | null>
): void => {
  mockHandler = handler;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    } catch {}
    try {
      const { useAuthStore } = require('../store/authStore');
      return useAuthStore.getState()?.session?.accessToken || null;
    } catch {
      return null;
    }
  }

  private async refreshSession(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        return null;
      }
      return data.session.access_token;
    } catch {
      return null;
    }
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  public async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    isRetry = false
  ): Promise<T> {
    // If mock handler is registered and mocks are enabled, try mock interceptor first
    if (env.enableMocks && mockHandler) {
      const mockResult = await mockHandler(endpoint, options);
      if (mockResult !== null) {
        return mockResult as T;
      }
    }

    const {
      timeoutMs = 15000,
      skipAuth = false,
      params,
      headers: customHeaders = {},
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    if (!skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // 401 Interceptor: attempt refresh once
      if (response.status === 401 && !isRetry && !skipAuth) {
        const refreshedToken = await this.refreshSession();
        if (refreshedToken) {
          return this.request<T>(endpoint, options, true);
        } else {
          unauthorizedHandler?.();
          throw new ApiError(
            'Session expired. Please log in again.',
            'UNAUTHORIZED',
            401
          );
        }
      }

      // Handle empty body / 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      let json: ApiEnvelope<T>;
      try {
        json = await response.json();
      } catch {
        if (!response.ok) {
          throw ApiError.fromStatus(response.status);
        }
        return undefined as unknown as T;
      }

      // Backend API Envelope Check: { success: true, data: T }
      if (response.ok) {
        if (json && typeof json === 'object' && 'success' in json) {
          if (json.success) {
            return json.data as T;
          } else if (json.error) {
            throw new ApiError(
              json.error.message || 'API error',
              json.error.code || 'UNKNOWN_ERROR',
              response.status,
              json.error.details
            );
          }
        }
        // Direct payload fallback
        return json as unknown as T;
      }

      // Non-ok response handling
      if (json && json.error) {
        throw new ApiError(
          json.error.message || 'Request failed',
          json.error.code || 'UNKNOWN_ERROR',
          response.status,
          json.error.details
        );
      }

      throw ApiError.fromStatus(response.status);
    } catch (err: any) {
      clearTimeout(timer);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new ApiError('Request timed out.', 'TIMEOUT', 504);
      }

      throw new ApiError(
        err.message || 'Network request failed.',
        'NETWORK_ERROR',
        0
      );
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async upload<T>(
    endpoint: string,
    formData: FormData,
    options: Omit<RequestOptions, 'body'> = {}
  ): Promise<T> {
    const { headers = {}, ...restOptions } = options;
    const customHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    };
    // Let fetch calculate multipart boundary header automatically
    delete customHeaders['Content-Type'];

    return this.request<T>(endpoint, {
      ...restOptions,
      method: 'POST',
      body: formData,
      headers: customHeaders,
    });
  }
}

export const api = new ApiClient(env.apiBaseUrl);
