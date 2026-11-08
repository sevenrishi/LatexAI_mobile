import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { OnboardingWelcomeScreen } from './OnboardingWelcomeScreen';
import { OnboardingRoleScreen } from './OnboardingRoleScreen';
import { OnboardingGoalsScreen } from './OnboardingGoalsScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="OnboardingWelcome"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen
        name="OnboardingWelcome"
        component={OnboardingWelcomeScreen}
      />
      <Stack.Screen
        name="OnboardingRole"
        component={OnboardingRoleScreen}
      />
      <Stack.Screen
        name="OnboardingGoals"
        component={OnboardingGoalsScreen}
      />
    </Stack.Navigator>
  );
};
