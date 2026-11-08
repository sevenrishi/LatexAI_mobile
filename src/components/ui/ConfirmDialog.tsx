import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Typography } from './Typography';
import { Button } from './Button';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  style?: ViewStyle;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog"
        />

        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
              ...theme.shadows.lg,
            },
            style,
          ]}
          accessible={true}
          accessibilityRole="alertdialog"
          accessibilityLabel={title}
          accessibilityViewIsModal={true}
        >
          <Typography variant="h3" weight="bold" style={styles.title}>
            {title}
          </Typography>

          <Typography
            variant="body"
            color="secondary"
            style={styles.message}
          >
            {message}
          </Typography>

          <View style={styles.buttonRow}>
            <Button
              title={cancelText}
              variant="outline"
              size="sm"
              onPress={onCancel}
              style={styles.cancelBtn}
              testID="confirm-dialog-cancel-button"
            />
            <Button
              title={confirmText}
              variant={isDestructive ? 'destructive' : 'primary'}
              size="sm"
              onPress={onConfirm}
              style={styles.confirmBtn}
              testID="confirm-dialog-confirm-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 20,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    minWidth: 88,
  },
  confirmBtn: {
    minWidth: 88,
  },
});
