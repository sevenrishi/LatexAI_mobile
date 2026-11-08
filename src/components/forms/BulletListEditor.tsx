import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Typography } from '../ui/Typography';

export interface BulletListEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  maxBullets?: number;
  maxCharactersPerBullet?: number;
  label?: string;
  placeholder?: string;
  error?: string;
}

export const BulletListEditor: React.FC<BulletListEditorProps> = ({
  bullets,
  onChange,
  maxBullets = 8,
  maxCharactersPerBullet = 500,
  label = 'Key Accomplishments & Bullet Points',
  placeholder = 'e.g., Architected real-time streaming pipeline processing 50M+ events/day with 99.99% uptime.',
  error,
}) => {
  const { theme } = useTheme();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');
  const [newBulletText, setNewBulletText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddBullet = () => {
    const trimmed = newBulletText.trim();
    if (!trimmed) return;
    if (trimmed.length > maxCharactersPerBullet) return;
    onChange([...bullets, trimmed]);
    setNewBulletText('');
    setIsAdding(false);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setDraftText(bullets[index] || '');
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      handleDelete(index);
    } else {
      const updated = [...bullets];
      updated[index] = trimmed;
      onChange(updated);
    }
    setEditingIndex(null);
    setDraftText('');
  };

  const handleDelete = (index: number) => {
    const updated = bullets.filter((_, i) => i !== index);
    onChange(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraftText('');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...bullets];
    const curr = updated[index];
    const prev = updated[index - 1];
    if (curr !== undefined && prev !== undefined) {
      updated[index - 1] = curr;
      updated[index] = prev;
      onChange(updated);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= bullets.length - 1) return;
    const updated = [...bullets];
    const curr = updated[index];
    const next = updated[index + 1];
    if (curr !== undefined && next !== undefined) {
      updated[index + 1] = curr;
      updated[index] = next;
      onChange(updated);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Typography variant="body" weight="semibold">
          {label}
        </Typography>
        <Typography variant="caption" color="secondary">
          {bullets.length}/{maxBullets}
        </Typography>
      </View>

      {error ? (
        <Typography variant="caption" color="error" style={styles.errorText}>
          {error}
        </Typography>
      ) : null}

      {/* Bullets List */}
      {bullets.map((bullet, index) => {
        const isEditing = editingIndex === index;

        if (isEditing) {
          const charCount = draftText.length;
          const isOverLimit = charCount > maxCharactersPerBullet;

          return (
            <View
              key={`editing-${index}`}
              style={[
                styles.editBox,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: isOverLimit ? theme.colors.danger : theme.colors.primary,
                },
              ]}
            >
              <TextInput
                multiline
                value={draftText}
                onChangeText={setDraftText}
                placeholder="Edit bullet point..."
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.textArea, { color: theme.colors.textPrimary }]}
                testID={`bullet-input-${index}`}
              />
              <View style={styles.editFooter}>
                <Typography
                  variant="caption"
                  color={isOverLimit ? 'error' : 'secondary'}
                >
                  {charCount}/{maxCharactersPerBullet}
                </Typography>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    onPress={() => setEditingIndex(null)}
                    style={styles.textBtn}
                  >
                    <Typography variant="caption" color="secondary">
                      Cancel
                    </Typography>
                  </TouchableOpacity>
                  <Button
                    title="Save"
                    size="sm"
                    disabled={isOverLimit || !draftText.trim()}
                    onPress={() => handleSaveEdit(index)}
                    testID={`bullet-save-${index}`}
                  />
                </View>
              </View>
            </View>
          );
        }

        return (
          <View
            key={`bullet-${index}`}
            style={[
              styles.bulletRow,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.bulletDot}>
              <Typography variant="body" color="primary" weight="bold">
                •
              </Typography>
            </View>
            <Typography
              variant="body"
              style={[styles.bulletContent, { color: theme.colors.textPrimary }]}
            >
              {bullet}
            </Typography>

            {/* Actions: Reorder, Edit, Delete */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
                style={[styles.iconBtn, index === 0 && styles.disabledIcon]}
                accessibilityRole="button"
                accessibilityLabel="Move up"
                testID={`bullet-move-up-${index}`}
              >
                <Icon
                  name="ChevronUp"
                  size={18}
                  color={index === 0 ? theme.colors.textMuted : theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMoveDown(index)}
                disabled={index === bullets.length - 1}
                style={[
                  styles.iconBtn,
                  index === bullets.length - 1 && styles.disabledIcon,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Move down"
                testID={`bullet-move-down-${index}`}
              >
                <Icon
                  name="ChevronDown"
                  size={18}
                  color={
                    index === bullets.length - 1
                      ? theme.colors.textMuted
                      : theme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleStartEdit(index)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit bullet"
                testID={`bullet-edit-${index}`}
              >
                <Icon name="Edit3" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(index)}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Delete bullet"
                testID={`bullet-delete-${index}`}
              >
                <Icon name="Trash2" size={16} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Add New Bullet Form */}
      {isAdding ? (
        <View
          style={[
            styles.editBox,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor:
                newBulletText.length > maxCharactersPerBullet
                  ? theme.colors.danger
                  : theme.colors.primary,
            },
          ]}
        >
          <TextInput
            multiline
            value={newBulletText}
            onChangeText={setNewBulletText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.textArea, { color: theme.colors.textPrimary }]}
            testID="new-bullet-input"
            autoFocus
          />
          <View style={styles.editFooter}>
            <Typography
              variant="caption"
              color={
                newBulletText.length > maxCharactersPerBullet
                  ? 'error'
                  : 'secondary'
              }
            >
              {newBulletText.length}/{maxCharactersPerBullet}
            </Typography>
            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={() => {
                  setIsAdding(false);
                  setNewBulletText('');
                }}
                style={styles.textBtn}
              >
                <Typography variant="caption" color="secondary">
                  Cancel
                </Typography>
              </TouchableOpacity>
              <Button
                title="Add Bullet"
                size="sm"
                disabled={
                  !newBulletText.trim() ||
                  newBulletText.length > maxCharactersPerBullet
                }
                onPress={handleAddBullet}
                testID="add-bullet-confirm-btn"
              />
            </View>
          </View>
        </View>
      ) : bullets.length < maxBullets ? (
        <TouchableOpacity
          onPress={() => setIsAdding(true)}
          style={[styles.addBtn, { borderColor: theme.colors.primary }]}
          testID="add-bullet-btn"
        >
          <Icon name="Plus" size={18} color={theme.colors.primary} />
          <Typography
            variant="body"
            weight="semibold"
            color="primary"
            style={styles.addBtnText}
          >
            Add Bullet Point
          </Typography>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  bulletDot: {
    marginRight: 6,
    marginTop: -2,
  },
  bulletContent: {
    flex: 1,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledIcon: {
    opacity: 0.3,
  },
  editBox: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  editFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E140',
    paddingTop: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
    minHeight: 48,
  },
  addBtnText: {
    marginLeft: 8,
  },
});
