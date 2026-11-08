import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Splash?: undefined;
  Welcome: undefined;
  Login: { email?: string } | undefined;
  Signup: undefined;
  VerifyEmail: { email: string; token?: string };
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingRole: undefined;
  OnboardingGoals:
    | {
        targetRole?: string;
        industry?: string;
        experienceLevel?: string;
      }
    | undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ContactInfo: undefined;
  SummaryEdit: undefined;
  ExperienceList: undefined;
  ExperienceForm: { experienceId?: string } | undefined;
  EducationList: undefined;
  EducationForm: { educationId?: string } | undefined;
  SkillsEdit: undefined;
  CertificationsList: undefined;
  CertificationForm: { certificationId?: string } | undefined;
  ProjectsList: undefined;
  ProjectForm: { projectId?: string } | undefined;
  ImportResume: undefined;
  ImportReview: { importId: string; draft?: any };
};

export type AppTabParamList = {
  DashboardTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
  TemplatesTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  VerifyEmail: { email: string; token?: string };
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  AppTabs: NavigatorScreenParams<AppTabParamList>;
  NewGeneration: { fromGenerationId?: string };
  GenerationProgress: { generationId: string };
  Review: { generationId: string };
  EditContent: { generationId: string };
  AtsReport: { generationId: string };
  AccountManagement: undefined;
  ChangePassword: undefined;
  DataPrivacy: undefined;
  About: undefined;
  AtsChecker: undefined;
  PdfViewerModal: { url?: string; title?: string; base64?: string };
  TemplatePreview: { templateId: string; templateName?: string };
  ImportResume: undefined;
  ImportReview: { importId: string; draft?: any };
  ErrorFallback: { error?: Error; onReset?: () => void };
  ContactInfo: undefined;
  SummaryEdit: undefined;
  ExperienceList: undefined;
  ExperienceForm: { experienceId?: string } | undefined;
  EducationList: undefined;
  EducationForm: { educationId?: string } | undefined;
  SkillsEdit: undefined;
  CertificationsList: undefined;
  CertificationForm: { certificationId?: string } | undefined;
  ProjectsList: undefined;
  ProjectForm: { projectId?: string } | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingStackScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;

export type AppTabProps<T extends keyof AppTabParamList> =
  BottomTabScreenProps<AppTabParamList, T>;
