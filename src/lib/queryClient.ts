import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  focusManager,
  onlineManager,
  QueryClient,
} from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ApiError } from './errors';

// 1. Configure Online Manager with NetInfo
onlineManager.setEventListener(setOnline => {
  return NetInfo.addEventListener(state => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

// 2. Configure Focus Manager with AppState
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

AppState.addEventListener('change', onAppStateChange);

// 3. Create Persister
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'LATEX_AI_QUERY_CACHE',
  throttleTime: 1000,
});

// 4. Create QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          // Do not retry unauthorized, forbidden, or not found errors
          if (error.status === 401 || error.status === 403 || error.status === 404) {
            return false;
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
