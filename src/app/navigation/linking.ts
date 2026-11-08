import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['latexai://', 'https://app.latexai.com'],
  config: {
    screens: {
      Splash: 'splash',
      Auth: {
        screens: {
          Splash: 'auth/splash',
          Welcome: 'welcome',
          Login: 'login',
          Signup: 'signup',
          VerifyEmail: 'verify-email',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'auth/reset-password',
        },
      },
      VerifyEmail: 'verify-email-gate',
      Onboarding: {
        screens: {
          OnboardingWelcome: 'onboarding',
          OnboardingRole: 'onboarding/role',
          OnboardingGoals: 'onboarding/goals',
        },
      },
      AppTabs: {
        screens: {
          DashboardTab: 'dashboard',
          ProfileTab: 'profile',
          TemplatesTab: 'templates',
          HistoryTab: 'history',
          SettingsTab: 'settings',
        },
      },
      NewGeneration: 'generate',
      GenerationProgress: 'generation/:generationId',
      Review: 'review/:generationId',
      EditContent: 'edit/:generationId',
      AtsReport: 'ats/:generationId',
      PdfViewerModal: 'pdf',
      ImportResume: 'import',
      ImportReview: 'import-review/:importId',
      ErrorFallback: 'error',
    },
  },
};
