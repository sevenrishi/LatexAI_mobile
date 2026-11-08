import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Typography } from '../ui/Typography';

export interface ChipInputProps {
  chips: string[];
  onChange: (chips: string[]) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  maxChips?: number;
  allowBulkAdd?: boolean;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  chips,
  onChange,
  label = 'Tags / Skills',
  placeholder = 'Add a skill (press Enter or comma)...',
  helperText,
  error,
  maxChips = 50,
  allowBulkAdd = true,
}) => {
  const { theme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (chips.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setInputText('');
      return;
    }
    if (chips.length >= maxChips) return;
    onChange([...chips, trimmed]);
    setInputText('');
  };

  const handleInputChange = (text: string) => {
    if (text.includes(',') || text.includes('\n')) {
      const parts = text.split(/,|\n/);
      const newItems = parts
        .map((p) => p.trim())
        .filter(
          (p) =>
            p.length > 0 &&
            !chips.some((c) => c.toLowerCase() === p.toLowerCase())
        );
      if (newItems.length > 0) {
        onChange([...chips, ...newItems].slice(0, maxChips));
      }
      setInputText('');
    } else {
      setInputText(text);
    }
  };

  const removeChip = (index: number) => {
    const updated = chips.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleBulkSubmit = () => {
    const parsed = bulkText
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 0 &&
          !chips.some((c) => c.toLowerCase() === s.toLowerCase())
      );
    if (parsed.length > 0) {
      onChange([...chips, ...parsed].slice(0, maxChips));
    }
    setBulkText('');
    setBulkModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Typography variant="body" weight="semibold">
          {label}
        </Typography>
        <View style={styles.topRightActions}>
          <Typography variant="caption" color="secondary">
            {chips.length}/{maxChips}
          </Typography>
          {allowBulkAdd && (
            <TouchableOpacity
              onPress={() => setBulkModalVisible(true)}
              style={styles.bulkBtn}
              accessibilityRole="button"
              accessibilityLabel="Bulk add skills"
              testID="chip-input-bulk-add-btn"
            >
              <Typography variant="caption" color="primary" weight="bold">
                Bulk Add
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Existing Chips Flow */}
      <View style={styles.chipsContainer}>
        {chips.map((chip, index) => (
          <View key={`${chip}-${index}`} testID={`chip-item-${index}`}>
            <Chip
              label={chip}
              variant="filter"
              removable
              onRemove={() => removeChip(index)}
            />
          </View>
        ))}
      </View>

      {/* Input row */}
      {chips.length < maxChips && (
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: error ? theme.colors.danger : theme.colors.border,
            },
          ]}
        >
          <TextInput
            value={inputText}
            onChangeText={handleInputChange}
            onSubmitEditing={() => addChip(inputText)}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { color: theme.colors.textPrimary }]}
            returnKeyType="done"
            testID="chip-text-input"
          />
          <TouchableOpacity
            onPress={() => addChip(inputText)}
            disabled={!inputText.trim()}
            style={[
              styles.addBtn,
              !inputText.trim() && styles.disabledAddBtn,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add skill"
            testID="chip-add-submit-btn"
          >
            <Icon
              name="Plus"
              size={20}
              color={inputText.trim() ? theme.colors.primary : theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <Typography variant="caption" color="error" style={styles.helperText}>
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="caption" color="secondary" style={styles.helperText}>
          {helperText}
        </Typography>
      ) : null}

      {/* Bulk Add Modal */}
      <Modal
        visible={bulkModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBulkModalVisible(false)}
        testID="bulk-add-modal"
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Typography variant="h3" weight="bold">
                Bulk Add Skills
              </Typography>
              <TouchableOpacity
                onPress={() => setBulkModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="X" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Typography variant="caption" color="secondary" style={styles.bulkNotice}>
              Paste multiple skills separated by commas or line breaks.
            </Typography>

            <TextInput
              multiline
              value={bulkText}
              onChangeText={setBulkText}
              placeholder="e.g. TypeScript, React Native, GraphQL, AWS, Docker, Microservices"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.bulkTextArea,
                {
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                },
              ]}
              testID="bulk-add-text-input"
            />

            <View style={styles.modalFooter}>
              <Button
                variant="outline"
                title="Cancel"
                onPress={() => setBulkModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                variant="primary"
                title="Add All"
                disabled={!bulkText.trim()}
                onPress={handleBulkSubmit}
                style={styles.modalBtn}
                testID="bulk-add-confirm-btn"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  addBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledAddBtn: {
    opacity: 0.4,
  },
  helperText: {
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCloseBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkNotice: {
    marginBottom: 12,
  },
  bulkTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
