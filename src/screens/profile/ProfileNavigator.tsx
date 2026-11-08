import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types/navigation';
import { useTheme } from '../../theme';
import { ProfileHomeScreen } from './ProfileHomeScreen';
import { ContactInfoScreen } from './ContactInfoScreen';
import { SummaryScreen } from './SummaryScreen';
import { ExperienceListScreen } from './ExperienceListScreen';
import { ExperienceFormScreen } from './ExperienceFormScreen';
import { EducationListScreen } from './EducationListScreen';
import { EducationFormScreen } from './EducationFormScreen';
import { SkillsScreen } from './SkillsScreen';
import { CertificationsListScreen } from './CertificationsListScreen';
import { CertificationFormScreen } from './CertificationFormScreen';
import { ProjectsListScreen } from './ProjectsListScreen';
import { ProjectFormScreen } from './ProjectFormScreen';
import { ImportResumeScreen } from './ImportResumeScreen';
import { ImportReviewScreen } from './ImportReviewScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ProfileHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surfaceElevated,
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactInfo"
        component={ContactInfoScreen}
        options={{ title: 'Contact Info' }}
      />
      <Stack.Screen
        name="SummaryEdit"
        component={SummaryScreen}
        options={{ title: 'Summary' }}
      />
      <Stack.Screen
        name="ExperienceList"
        component={ExperienceListScreen}
        options={{ title: 'Work Experience' }}
      />
      <Stack.Screen
        name="ExperienceForm"
        component={ExperienceFormScreen}
        options={{ title: 'Experience' }}
      />
      <Stack.Screen
        name="EducationList"
        component={EducationListScreen}
        options={{ title: 'Education' }}
      />
      <Stack.Screen
        name="EducationForm"
        component={EducationFormScreen}
        options={{ title: 'Education' }}
      />
      <Stack.Screen
        name="SkillsEdit"
        component={SkillsScreen}
        options={{ title: 'Skills' }}
      />
      <Stack.Screen
        name="CertificationsList"
        component={CertificationsListScreen}
        options={{ title: 'Certifications' }}
      />
      <Stack.Screen
        name="CertificationForm"
        component={CertificationFormScreen}
        options={{ title: 'Certification' }}
      />
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{ title: 'Projects' }}
      />
      <Stack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={{ title: 'Project' }}
      />
      <Stack.Screen
        name="ImportResume"
        component={ImportResumeScreen}
        options={{ title: 'Import Resume' }}
      />
      <Stack.Screen
        name="ImportReview"
        component={ImportReviewScreen as any}
        options={{ title: 'Review Import' }}
      />
    </Stack.Navigator>
  );
};

