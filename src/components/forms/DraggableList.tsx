import React from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { Typography } from '../ui/Typography';

export interface RenderDraggableItemProps<T> {
  item: T;
  index: number;
  moveUp: () => void;
  moveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export interface DraggableListProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (props: RenderDraggableItemProps<T>) => React.ReactElement;
  onReorder: (newData: T[]) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyComponent?: React.ReactElement;
  contentContainerStyle?: any;
}

export function DraggableList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  emptyTitle = 'No items yet',
  emptySubtitle = 'Tap the button below to add your first entry.',
  emptyComponent,
  contentContainerStyle,
}: DraggableListProps<T>) {
  const { theme } = useTheme();

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...data];
    const curr = copy[index];
    const prev = copy[index - 1];
    if (curr !== undefined && prev !== undefined) {
      copy[index - 1] = curr;
      copy[index] = prev;
      onReorder(copy);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= data.length - 1) return;
    const copy = [...data];
    const curr = copy[index];
    const next = copy[index + 1];
    if (curr !== undefined && next !== undefined) {
      copy[index + 1] = curr;
      copy[index] = next;
      onReorder(copy);
    }
  };

  if (data.length === 0) {
    if (emptyComponent) return emptyComponent;
    return (
      <View
        style={[
          styles.emptyBox,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Icon name="Inbox" size={36} color={theme.colors.textMuted} />
        <Typography variant="body" weight="semibold" style={styles.emptyTitle}>
          {emptyTitle}
        </Typography>
        <Typography variant="caption" color="secondary" style={styles.emptySub}>
          {emptySubtitle}
        </Typography>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      contentContainerStyle={[styles.listContainer, contentContainerStyle]}
      renderItem={({ item, index }) => {
        const isFirst = index === 0;
        const isLast = index === data.length - 1;

        return (
          <View
            style={[
              styles.itemContainer,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Accessible reorder handle */}
            <View style={styles.reorderHandleCol}>
              <TouchableOpacity
                disabled={isFirst}
                onPress={() => handleMoveUp(index)}
                style={[styles.arrowBtn, isFirst && styles.disabledArrow]}
                accessibilityRole="button"
                accessibilityLabel={`Move item ${index + 1} up`}
                testID={`draggable-move-up-${index}`}
              >
                <Icon
                  name="ChevronUp"
                  size={18}
                  color={isFirst ? theme.colors.textMuted : theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <Icon name="GripVertical" size={16} color={theme.colors.textMuted} />
              <TouchableOpacity
                disabled={isLast}
                onPress={() => handleMoveDown(index)}
                style={[styles.arrowBtn, isLast && styles.disabledArrow]}
                accessibilityRole="button"
                accessibilityLabel={`Move item ${index + 1} down`}
                testID={`draggable-move-down-${index}`}
              >
                <Icon
                  name="ChevronDown"
                  size={18}
                  color={isLast ? theme.colors.textMuted : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Custom item body */}
            <View style={styles.itemBody}>
              {renderItem({
                item,
                index,
                moveUp: () => handleMoveUp(index),
                moveDown: () => handleMoveDown(index),
                isFirst,
                isLast,
              })}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  reorderHandleCol: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#CBD5E130',
  },
  arrowBtn: {
    padding: 4,
    minHeight: 36,
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledArrow: {
    opacity: 0.25,
  },
  itemBody: {
    flex: 1,
    padding: 12,
  },
  emptyBox: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  emptyTitle: {
    marginTop: 12,
  },
  emptySub: {
    marginTop: 4,
    textAlign: 'center',
  },
});
