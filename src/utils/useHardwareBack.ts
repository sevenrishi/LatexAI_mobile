import { useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Custom hook to handle Android hardware back button presses.
 * @param handler Function returning true to prevent default back behavior, or false to allow it.
 * @param enabled Whether the back handler is active.
 */
export const useHardwareBack = (
  handler: () => boolean,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return handler();
      }
    );

    return () => {
      subscription.remove();
    };
  }, [handler, enabled]);
};
