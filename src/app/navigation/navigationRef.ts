import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  }
}

export function resetRoot(state?: any) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot(state || { index: 0, routes: [{ name: 'Auth' }] });
  }
}
