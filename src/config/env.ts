import Config from 'react-native-config';

declare const process: { env: Record<string, string | undefined> };

export interface AppConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appEnv: 'development' | 'staging' | 'production' | 'test';
  enableMocks: boolean;
  sentryDsn?: string;
}

const resolveEnv = (): AppConfig => {
  const isTest = process.env.NODE_ENV === 'test';

  const apiBaseUrl =
    Config?.API_BASE_URL || process.env.API_BASE_URL || 'https://latexai.onrender.com/api/v1';

  const supabaseUrl =
    Config?.SUPABASE_URL || process.env.SUPABASE_URL || '';

  const supabaseAnonKey =
    Config?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const appEnv =
    (Config?.APP_ENV as AppConfig['appEnv']) ||
    (isTest ? 'test' : 'development');

  const enableMocks =
    Config?.ENABLE_MOCKS === 'true' ||
    process.env.ENABLE_MOCKS === 'true';

  const sentryDsn = Config?.SENTRY_DSN || undefined;

  return {
    apiBaseUrl,
    supabaseUrl,
    supabaseAnonKey,
    appEnv,
    enableMocks,
    sentryDsn,
  };
};

export const env: AppConfig = resolveEnv();
