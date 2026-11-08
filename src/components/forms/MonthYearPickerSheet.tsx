import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Typography } from '../ui/Typography';

const MONTHS = [
  { label: 'Jan', value: '01', fullName: 'January' },
  { label: 'Feb', value: '02', fullName: 'February' },
  { label: 'Mar', value: '03', fullName: 'March' },
  { label: 'Apr', value: '04', fullName: 'April' },
  { label: 'May', value: '05', fullName: 'May' },
  { label: 'Jun', value: '06', fullName: 'June' },
  { label: 'Jul', value: '07', fullName: 'July' },
  { label: 'Aug', value: '08', fullName: 'August' },
  { label: 'Sep', value: '09', fullName: 'September' },
  { label: 'Oct', value: '10', fullName: 'October' },
  { label: 'Nov', value: '11', fullName: 'November' },
  { label: 'Dec', value: '12', fullName: 'December' },
];

export interface MonthYearPickerSheetProps {
  visible: boolean;
  value?: string | null; // 'YYYY-MM' or null
  minDate?: string; // 'YYYY-MM'
  maxDate?: string; // 'YYYY-MM'
  allowPresent?: boolean;
  title?: string;
  onConfirm: (val: string | null) => void;
  onClose: () => void;
}

export const MonthYearPickerSheet: React.FC<MonthYearPickerSheetProps> = ({
  visible,
  value,
  minDate,
  maxDate,
  allowPresent = false,
  title = 'Select Date',
  onConfirm,
  onClose,
}) => {
  const { theme } = useTheme();

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear + 10; y >= 1970; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // Initial selection
  const parsed = useMemo(() => {
    if (value && /^\d{4}-\d{2}$/.test(value)) {
      const parts = value.split('-');
      const y = parts[0] ? parseInt(parts[0], 10) : currentYear;
      const m = parts[1] || '01';
      return { year: y, month: m, isPresent: false };
    }
    return {
      year: currentYear,
      month: String(new Date().getMonth() + 1).padStart(2, '0'),
      isPresent: Boolean(value === null && allowPresent),
    };
  }, [value, currentYear, allowPresent]);

  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(parsed.month || '01');
  const [isPresent, setIsPresent] = useState<boolean>(Boolean(parsed.isPresent));

  // Sync state when modal becomes visible or value prop changes
  React.useEffect(() => {
    if (visible) {
      if (value && /^\d{4}-\d{2}$/.test(value)) {
        const parts = value.split('-');
        setSelectedYear(parts[0] ? parseInt(parts[0], 10) : currentYear);
        setSelectedMonth(parts[1] || '01');
        setIsPresent(false);
      } else {
        setSelectedYear(currentYear);
        setSelectedMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
        setIsPresent(Boolean(value === null && allowPresent));
      }
    }
  }, [visible, value, allowPresent, currentYear]);

  const isMonthDisabled = (monthVal: string) => {
    const currentVal = `${selectedYear}-${monthVal}`;
    if (minDate && currentVal < minDate) return true;
    if (maxDate && currentVal > maxDate) return true;
    return false;
  };

  const handleConfirm = () => {
    if (isPresent) {
      onConfirm(null);
    } else {
      onConfirm(`${selectedYear}-${selectedMonth}`);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="month-year-picker-modal"
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h3" weight="bold">
              {title}
            </Typography>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close picker"
              style={styles.closeBtn}
            >
              <Icon name="X" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Present option toggle if allowed */}
          {allowPresent && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.presentRow,
                {
                  borderColor: isPresent ? theme.colors.primary : theme.colors.border,
                  backgroundColor: isPresent
                    ? `${theme.colors.primary}15`
                    : 'transparent',
                },
              ]}
              onPress={() => setIsPresent(!isPresent)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isPresent }}
              testID="picker-present-toggle"
            >
              <Icon
                name={isPresent ? 'CheckCircle2' : 'Circle'}
                size={20}
                color={isPresent ? theme.colors.primary : theme.colors.textMuted}
              />
              <Typography
                variant="body"
                weight={isPresent ? 'bold' : 'regular'}
                style={styles.presentText}
              >
                Present / Currently working or studying here
              </Typography>
            </TouchableOpacity>
          )}

          {!isPresent && (
            <View style={styles.pickerBody}>
              {/* Year Selector */}
              <View style={styles.columnSection}>
                <Typography variant="caption" weight="semibold" color="secondary" style={styles.colTitle}>
                  YEAR
                </Typography>
                <View
                  style={[
                    styles.yearListContainer,
                    { borderColor: theme.colors.border },
                  ]}
                >
                  <FlatList
                    data={years}
                    keyExtractor={(item) => String(item)}
                    showsVerticalScrollIndicator
                    initialNumToRender={15}
                    renderItem={({ item }) => {
                      const isSelected = item === selectedYear;
                      return (
                        <TouchableOpacity
                          style={[
                            styles.yearItem,
                            isSelected && {
                              backgroundColor: theme.colors.primary,
                            },
                          ]}
                          onPress={() => setSelectedYear(item)}
                          accessibilityRole="button"
                          testID={`year-option-${item}`}
                        >
                          <Typography
                            variant="body"
                            weight={isSelected ? 'bold' : 'regular'}
                            style={{
                              color: isSelected ? '#FFFFFF' : theme.colors.textPrimary,
                            }}
                          >
                            {item}
                          </Typography>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </View>

              {/* Month Selector */}
              <View style={styles.columnSection}>
                <Typography variant="caption" weight="semibold" color="secondary" style={styles.colTitle}>
                  MONTH
                </Typography>
                <View style={styles.monthsGrid}>
                  {MONTHS.map((m) => {
                    const isSelected = m.value === selectedMonth;
                    const disabled = isMonthDisabled(m.value);
                    return (
                      <TouchableOpacity
                        key={m.value}
                        disabled={disabled}
                        style={[
                          styles.monthItem,
                          isSelected && {
                            backgroundColor: theme.colors.primary,
                          },
                          disabled && styles.disabledItem,
                        ]}
                        onPress={() => setSelectedMonth(m.value)}
                        accessibilityRole="button"
                        testID={`month-option-${m.value}`}
                      >
                        <Typography
                          variant="caption"
                          weight={isSelected ? 'bold' : 'medium'}
                          style={{
                            color: isSelected
                              ? '#FFFFFF'
                              : disabled
                              ? theme.colors.textMuted
                              : theme.colors.textPrimary,
                          }}
                        >
                          {m.label}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              title="Cancel"
              onPress={onClose}
              style={styles.actionBtn}
            />
            <Button
              variant="primary"
              title="Confirm"
              onPress={handleConfirm}
              style={styles.actionBtn}
              testID="picker-confirm-button"
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    minHeight: 48,
  },
  presentText: {
    marginLeft: 10,
    flex: 1,
  },
  pickerBody: {
    flexDirection: 'row',
    height: 240,
    marginBottom: 20,
    gap: 16,
  },
  columnSection: {
    flex: 1,
  },
  colTitle: {
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  yearListContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  yearItem: {
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  monthsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '30%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledItem: {
    opacity: 0.3,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
