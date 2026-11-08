import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AppTabParamList,
  AuthStackParamList,
  RootStackParamList,
} from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../theme';
import { Icon } from '../../components/ui/Icon';
import {
  ForgotPasswordScreen,
  LoginScreen,
  ResetPasswordScreen,
  SignupScreen,
  SplashScreen,
  VerifyEmailScreen,
  WelcomeScreen,
} from '../../screens/auth';
import { OnboardingNavigator } from '../../screens/onboarding';
import {
  DashboardScreen,
  HistoryScreen,
  ProfileNavigator,
  SettingsScreen,
  TemplatesScreen,
} from '../../screens/TabScreens';
import {
  CertificationFormScreen,
  CertificationsListScreen,
  ContactInfoScreen,
  EducationFormScreen,
  EducationListScreen,
  ExperienceFormScreen,
  ExperienceListScreen,
  ImportResumeScreen,
  ImportReviewScreen,
  ProjectFormScreen,
  ProjectsListScreen,
  SkillsScreen,
  SummaryScreen,
} from '../../screens/profile';
import {
  PdfViewerModal,
  TemplatePreviewScreen,
} from '../../screens/templates';
import {
  AtsReportScreen,
  EditContentScreen,
  GenerationProgressScreen,
  NewGenerationScreen,
  ReviewScreen,
} from '../../screens/generate';
import { ErrorFallbackScreen } from '../../screens/system/ErrorFallbackScreen';
import {
  AboutScreen,
  AccountManagementScreen,
  ChangePasswordScreen,
  DataPrivacyScreen,
} from '../../screens/settings';
import { AtsCheckerScreen } from '../../screens/tools';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen as any} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen as any} />
      <AuthStack.Screen name="Splash" component={SplashScreen} />
    </AuthStack.Navigator>
  );
};

const AuthenticatedVerifyEmailGate: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const user = useAuthStore((state) => state.user);
  return (
    <VerifyEmailScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          email: user?.email || route?.params?.email || '',
          ...route?.params,
        },
      }}
    />
  );
};

const DashboardIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="LayoutDashboard" size={size} color={color} />
);
const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="User" size={size} color={color} />
);
const TemplatesIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="FileText" size={size} color={color} />
);
const HistoryIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="History" size={size} color={color} />
);
const SettingsIcon = ({ color, size }: { color: string; size: number }) => (
  <Icon name="Settings" size={size} color={color} />
);

export const TabNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.surfaceElevated,
        },
        headerTintColor: theme.colors.textPrimary,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceElevated,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: DashboardIcon }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ProfileIcon,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="TemplatesTab"
        component={TemplatesScreen}
        options={{ title: 'Templates', tabBarIcon: TemplatesIcon }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ title: 'History', tabBarIcon: HistoryIcon }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: SettingsIcon }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const {
    isAuthenticated,
    user,
    isOnboarded,
    isSplashFinished,
  } = useAuthStore();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isSplashFinished ? (
        <RootStack.Screen name="Splash" component={SplashScreen} />
      ) : !isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : user && user.emailVerified === false ? (
        <RootStack.Screen
          name="VerifyEmail"
          component={AuthenticatedVerifyEmailGate as any}
        />
      ) : !isOnboarded ? (
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <RootStack.Screen name="AppTabs" component={TabNavigator} />
      )}
      <RootStack.Screen
        name="ImportResume"
        component={ImportResumeScreen}
        options={{ headerShown: true, title: 'Import Resume' }}
      />
      <RootStack.Screen
        name="ImportReview"
        component={ImportReviewScreen as any}
        options={{ headerShown: true, title: 'Review Import' }}
      />
      <RootStack.Screen
        name="ContactInfo"
        component={ContactInfoScreen}
        options={{ headerShown: true, title: 'Contact Information' }}
      />
      <RootStack.Screen
        name="SummaryEdit"
        component={SummaryScreen}
        options={{ headerShown: true, title: 'Professional Summary' }}
      />
      <RootStack.Screen
        name="ExperienceList"
        component={ExperienceListScreen}
        options={{ headerShown: true, title: 'Work Experience' }}
      />
      <RootStack.Screen
        name="ExperienceForm"
        component={ExperienceFormScreen}
        options={{ headerShown: true, title: 'Experience' }}
      />
      <RootStack.Screen
        name="EducationList"
        component={EducationListScreen}
        options={{ headerShown: true, title: 'Education' }}
      />
      <RootStack.Screen
        name="EducationForm"
        component={EducationFormScreen}
        options={{ headerShown: true, title: 'Education' }}
      />
      <RootStack.Screen
        name="SkillsEdit"
        component={SkillsScreen}
        options={{ headerShown: true, title: 'Skills' }}
      />
      <RootStack.Screen
        name="CertificationsList"
        component={CertificationsListScreen}
        options={{ headerShown: true, title: 'Certifications' }}
      />
      <RootStack.Screen
        name="CertificationForm"
        component={CertificationFormScreen}
        options={{ headerShown: true, title: 'Certification' }}
      />
      <RootStack.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{ headerShown: true, title: 'Key Projects' }}
      />
      <RootStack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={{ headerShown: true, title: 'Project' }}
      />
      <RootStack.Screen
        name="TemplatePreview"
        component={TemplatePreviewScreen}
        options={{ headerShown: true, title: 'Template Preview' }}
      />
      <RootStack.Screen
        name="NewGeneration"
        component={NewGenerationScreen}
        options={{ headerShown: true, title: 'New Generation' }}
      />
      <RootStack.Screen
        name="GenerationProgress"
        component={GenerationProgressScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <RootStack.Screen
        name="Review"
        component={ReviewScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="EditContent"
        component={EditContentScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AtsReport"
        component={AtsReportScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AccountManagement"
        component={AccountManagementScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="DataPrivacy"
        component={DataPrivacyScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="About"
        component={AboutScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AtsChecker"
        component={AtsCheckerScreen as any}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="PdfViewerModal"
        component={PdfViewerModal as any}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <RootStack.Screen
        name="ErrorFallback"
        component={ErrorFallbackScreen as any}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
};
