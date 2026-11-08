import React, { useEffect } from 'react';
import { Platform, StatusBar, StatusBarProps } from 'react-native';
import { useTheme } from './ThemeContext';

export interface AppStatusBarProps extends Omit<StatusBarProps, 'barStyle'> {
  overrideBarStyle?: StatusBarProps['barStyle'];
  backgroundColor?: string;
}

export const AppStatusBar: React.FC<AppStatusBarProps> = ({
  overrideBarStyle,
  backgroundColor,
  ...props
}) => {
  const { isDark, theme } = useTheme();

  const barStyle: StatusBarProps['barStyle'] =
    overrideBarStyle || (isDark ? 'light-content' : 'dark-content');

  const bgColor = backgroundColor || theme.colors.background;

  useEffect(() => {
    if (Platform.OS === 'android' && bgColor) {
      (StatusBar as any).setBackgroundColor?.(bgColor, true);
    }
  }, [bgColor]);

  return (
    <StatusBar
      barStyle={barStyle}
      animated
      {...props}
    />
  );
};
