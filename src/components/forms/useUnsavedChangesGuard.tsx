import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function useUnsavedChangesGuard({
  isDirty,
  title = 'Discard unsaved changes?',
  message = 'You have unsaved changes. Are you sure you want to discard them and leave?',
  confirmText = 'Discard',
  cancelText = 'Keep Editing',
}: UseUnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) {
        return;
      }

      e.preventDefault();
      setPendingAction(e.data.action);
      setShowDiscardDialog(true);
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  const confirmDiscard = () => {
    setShowDiscardDialog(false);
    if (pendingAction) {
      navigation.dispatch(pendingAction);
    }
  };

  const cancelDiscard = () => {
    setShowDiscardDialog(false);
    setPendingAction(null);
  };

  const dialogProps = {
    visible: showDiscardDialog,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive: true,
    onConfirm: confirmDiscard,
    onCancel: cancelDiscard,
  };

  return {
    showDiscardDialog,
    confirmDiscard,
    cancelDiscard,
    dialogProps,
  };
}

export const UnsavedChangesDialog: React.FC<{
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}> = ({
  visible,
  onConfirm,
  onCancel,
  title = 'Discard unsaved changes?',
  message = 'You have unsaved changes. Are you sure you want to discard them and leave?',
}) => {
  return (
    <ConfirmDialog
      visible={visible}
      title={title}
      message={message}
      confirmText="Discard"
      cancelText="Keep Editing"
      isDestructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

