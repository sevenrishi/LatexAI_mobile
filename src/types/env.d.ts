declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    APP_ENV?: 'development' | 'staging' | 'production' | 'test';
    ENABLE_MOCKS?: string;
    SENTRY_DSN?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
