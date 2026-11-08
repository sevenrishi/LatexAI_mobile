import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  onPress,
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
        };
      case 'flat':
        return {
          backgroundColor: theme.colors.surface,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.borderSubtle,
          borderWidth: 1,
          ...theme.shadows.sm,
        };
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.xs,
    ...getVariantStyles(),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.9, backgroundColor: theme.colors.surfacePressed },
          style,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessible={true}
      accessibilityRole="none"
      style={[cardStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardHeader: React.FC<ViewProps> = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.header,
        { borderBottomColor: theme.colors.divider, marginBottom: theme.spacing.sm },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardBody: React.FC<ViewProps> = ({ style, children, ...props }) => {
  return (
    <View style={[styles.body, style]} {...props}>
      {children}
    </View>
  );
};

export const CardFooter: React.FC<ViewProps> = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.footer,
        { borderTopColor: theme.colors.divider, marginTop: theme.spacing.md },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
  },
  body: {
    flexGrow: 1,
  },
  footer: {
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
