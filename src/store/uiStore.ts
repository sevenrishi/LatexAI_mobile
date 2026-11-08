import { create } from 'zustand';
import { ThemeMode } from '../theme/ThemeContext';
import { ToastItem, ToastType } from '../components/feedback/Toast';

export interface UiState {
  themeMode: ThemeMode;
  isOffline: boolean;
  activeToast: ToastItem | null;
  isSessionExpiredModalVisible: boolean;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setOffline: (offline: boolean) => void;
  setSessionExpiredModalVisible: (visible: boolean) => void;
  showToast: (options: {
    type: ToastType;
    message: string;
    title?: string;
    duration?: number;
  }) => void;
  hideToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  themeMode: 'system',
  isOffline: false,
  activeToast: null,
  isSessionExpiredModalVisible: false,

  setThemeMode: (themeMode) => set({ themeMode }),

  setOffline: (isOffline) => set({ isOffline }),

  setSessionExpiredModalVisible: (isSessionExpiredModalVisible) =>
    set({ isSessionExpiredModalVisible }),

  showToast: ({ type, message, title, duration }) =>
    set({
      activeToast: {
        id: Date.now().toString(),
        type,
        message,
        title,
        duration,
      },
    }),

  hideToast: () => set({ activeToast: null }),
}));
