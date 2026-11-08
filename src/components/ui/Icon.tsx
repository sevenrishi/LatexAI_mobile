import React from 'react';
import { View, ViewStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { useTheme } from '../../theme';

export type IconName = keyof typeof LucideIcons;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: ViewStyle;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  strokeWidth = 2,
  style,
  accessible = true,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.textPrimary;

  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<any>>
  )[name];

  if (!IconComponent) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  return (
    <View
      style={style}
      accessible={accessible}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || `${String(name)} icon`}
    >
      <IconComponent
        size={size}
        color={iconColor}
        strokeWidth={strokeWidth}
      />
    </View>
  );
};
