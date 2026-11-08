import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet, Button, Chip, Icon, Typography } from '../../components/ui';
import {
  TemplateListItem,
  useTemplates,
} from '../../features/templates';

export interface TemplatePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedTemplateId?: string;
  onSelectTemplate: (template: TemplateListItem) => void;
  onPreviewTemplate?: (templateId: string) => void;
  testID?: string;
}

export const TemplatePickerSheet: React.FC<TemplatePickerSheetProps> = ({
  visible,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  onPreviewTemplate,
  testID = 'template-picker-sheet',
}) => {
  const { theme } = useTheme();
  const { data: templates = [], isLoading, error } = useTemplates();

  const [currentSelectedId, setCurrentSelectedId] = useState<string | undefined>(
    selectedTemplateId
  );

  const selectedIdRef = React.useRef(selectedTemplateId);

  // Sync prop changes only when prop actually changes
  const prevSelectedIdRef = React.useRef(selectedTemplateId);
  React.useEffect(() => {
    if (selectedTemplateId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedTemplateId;
      selectedIdRef.current = selectedTemplateId;
      setCurrentSelectedId(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  const handleSelect = (template: TemplateListItem) => {
    selectedIdRef.current = template.id;
    setCurrentSelectedId(template.id);
  };

  const handleConfirm = () => {
    const targetId = selectedIdRef.current || currentSelectedId;
    const chosen = templates.find((t) => t.id === targetId);
    if (chosen) {
      onSelectTemplate(chosen);
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Resume Template"
    >
      <View style={styles.container} testID={testID}>
        {isLoading ? (
          <View style={styles.loadingContainer} testID={`${testID}-loading`}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Typography variant="bodySm" color="secondary" style={styles.loadingText}>
              Loading templates...
            </Typography>
          </View>
        ) : error ? (
          <View style={styles.errorContainer} testID={`${testID}-error`}>
            <Typography variant="bodySm" color="error">
              Failed to load available templates.
            </Typography>
          </View>
        ) : (
          <>
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.id === currentSelectedId;

                return (
                  <TouchableOpacity
                    testID={`template-picker-item-${item.id}`}
                    onPress={() => handleSelect(item)}
                    style={[
                      styles.itemRow,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                      isSelected && styles.itemRowSelected,
                    ]}
                  >
                    {/* Radio indicator */}
                    <View
                      style={[
                        styles.radioCircle,
                        { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                        isSelected && { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.radioInnerCircle} />
                      )}
                    </View>

                    {/* Details */}
                    <View style={styles.itemDetails}>
                      <View style={styles.titleRow}>
                        <Typography
                          variant="body"
                          weight="semibold"
                          style={styles.itemName}
                        >
                          {item.name}
                        </Typography>
                        {item.category && (
                          <Chip
                            label={item.category}
                            variant="default"
                            style={styles.chip}
                          />
                        )}
                      </View>
                      {item.description ? (
                        <Typography
                          variant="caption"
                          color="secondary"
                          numberOfLines={1}
                        >
                          {item.description}
                        </Typography>
                      ) : null}
                    </View>

                    {/* Quick Preview Icon Button */}
                    {onPreviewTemplate && (
                      <TouchableOpacity
                        testID={`template-picker-preview-${item.id}`}
                        accessibilityLabel={`Preview ${item.name}`}
                        onPress={() => onPreviewTemplate(item.id)}
                        style={styles.previewBtn}
                      >
                        <Icon name="Eye" size={18} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.footer}>
              <Button
                title="Confirm Selection"
                variant="primary"
                disabled={!currentSelectedId}
                onPress={handleConfirm}
                testID="template-picker-confirm-button"
              />
            </View>
          </>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: 460,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemRowSelected: {
    borderWidth: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  itemDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  itemName: {
    flexShrink: 1,
  },
  chip: {
    height: 22,
    paddingHorizontal: 6,
  },
  previewBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  footer: {
    marginTop: 12,
  },
});
