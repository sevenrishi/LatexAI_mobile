import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { MonthYearPickerSheet } from '../src/components/forms/MonthYearPickerSheet';
import { BulletListEditor } from '../src/components/forms/BulletListEditor';
import { ChipInput } from '../src/components/forms/ChipInput';
import { DraggableList } from '../src/components/forms/DraggableList';
import { UnsavedChangesDialog } from '../src/components/forms/useUnsavedChangesGuard';
import { Typography } from '../src/components/ui/Typography';
import { ThemeProvider } from '../src/theme';

const renderWithTheme = async (ui: React.ReactElement) => {
  return await render(<ThemeProvider initialMode="light">{ui}</ThemeProvider>);
};

describe('Profile Form Components (MB-2.02)', () => {
  describe('MonthYearPickerSheet', () => {
    it('renders month and year options and confirms selection', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      const { getByTestId, getByText } = await renderWithTheme(
        <MonthYearPickerSheet
          visible={true}
          value="2024-03"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );

      expect(getByText('Select Date')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByTestId('year-option-2023'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('month-option-08'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('picker-confirm-button'));
      });

      expect(onConfirm).toHaveBeenCalledWith('2023-08');
      expect(onClose).toHaveBeenCalled();
    });

    it('handles present toggle when allowPresent is true', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();

      const { getByTestId } = await renderWithTheme(
        <MonthYearPickerSheet
          visible={true}
          allowPresent={true}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );

      await act(async () => {
        fireEvent.press(getByTestId('picker-present-toggle'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('picker-confirm-button'));
      });

      expect(onConfirm).toHaveBeenCalledWith(null);
    });
  });

  describe('BulletListEditor', () => {
    it('allows adding, reordering, and deleting bullet points', async () => {
      const onChange = jest.fn();
      const initialBullets = ['First accomplishment', 'Second accomplishment'];

      const { getByTestId, getByText } = await renderWithTheme(
        <BulletListEditor
          bullets={initialBullets}
          onChange={onChange}
          maxBullets={5}
        />
      );

      expect(getByText('First accomplishment')).toBeTruthy();
      expect(getByText('Second accomplishment')).toBeTruthy();

      // Open new bullet input
      await act(async () => {
        fireEvent.press(getByTestId('add-bullet-btn'));
      });
      await act(async () => {
        fireEvent.changeText(
          getByTestId('new-bullet-input'),
          'Third high-impact bullet'
        );
      });
      await act(async () => {
        fireEvent.press(getByTestId('add-bullet-confirm-btn'));
      });

      expect(onChange).toHaveBeenCalledWith([
        ...initialBullets,
        'Third high-impact bullet',
      ]);

      // Move second bullet up
      await act(async () => {
        fireEvent.press(getByTestId('bullet-move-up-1'));
      });
      expect(onChange).toHaveBeenCalledWith([
        'Second accomplishment',
        'First accomplishment',
      ]);

      // Delete bullet
      await act(async () => {
        fireEvent.press(getByTestId('bullet-delete-0'));
      });
      expect(onChange).toHaveBeenCalledWith(['Second accomplishment']);
    });
  });

  describe('ChipInput', () => {
    it('adds single chip and removes existing chip', async () => {
      const onChange = jest.fn();
      const chips = ['TypeScript', 'React Native'];

      const { getByTestId, getByText, getByLabelText } = await renderWithTheme(
        <ChipInput chips={chips} onChange={onChange} />
      );

      expect(getByText('TypeScript')).toBeTruthy();
      expect(getByText('React Native')).toBeTruthy();

      // Add a chip
      await act(async () => {
        fireEvent.changeText(getByTestId('chip-text-input'), 'GraphQL');
      });
      await act(async () => {
        fireEvent.press(getByTestId('chip-add-submit-btn'));
      });

      expect(onChange).toHaveBeenCalledWith([
        'TypeScript',
        'React Native',
        'GraphQL',
      ]);

      // Remove a chip
      await act(async () => {
        fireEvent.press(getByLabelText('Remove TypeScript'));
      });
      expect(onChange).toHaveBeenCalledWith(['React Native']);
    });

    it('supports bulk add through modal', async () => {
      const onChange = jest.fn();
      const { getByTestId } = await renderWithTheme(
        <ChipInput chips={['Node.js']} onChange={onChange} />
      );

      await act(async () => {
        fireEvent.press(getByTestId('chip-input-bulk-add-btn'));
      });
      await act(async () => {
        fireEvent.changeText(
          getByTestId('bulk-add-text-input'),
          'Python, Go, Rust'
        );
      });
      await act(async () => {
        fireEvent.press(getByTestId('bulk-add-confirm-btn'));
      });

      expect(onChange).toHaveBeenCalledWith([
        'Node.js',
        'Python',
        'Go',
        'Rust',
      ]);
    });
  });

  describe('DraggableList', () => {
    it('renders list items and handles reordering up and down', async () => {
      const onReorder = jest.fn();
      const items = [
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
        { id: '3', title: 'Item 3' },
      ];

      const { getByTestId, getByText } = await renderWithTheme(
        <DraggableList
          data={items}
          keyExtractor={(item) => item.id}
          onReorder={onReorder}
          renderItem={({ item }) => (
            <Typography variant="body">{item.title}</Typography>
          )}
        />
      );

      expect(getByText('Item 1')).toBeTruthy();
      expect(getByText('Item 2')).toBeTruthy();

      // Move item 2 up
      await act(async () => {
        fireEvent.press(getByTestId('draggable-move-up-1'));
      });
      expect(onReorder).toHaveBeenCalledWith([
        { id: '2', title: 'Item 2' },
        { id: '1', title: 'Item 1' },
        { id: '3', title: 'Item 3' },
      ]);
    });
  });

  describe('UnsavedChangesDialog', () => {
    it('fires confirmation and cancel callbacks', async () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      const { getByText } = await renderWithTheme(
        <UnsavedChangesDialog
          visible={true}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      await act(async () => {
        fireEvent.press(getByText('Keep Editing'));
      });
      expect(onCancel).toHaveBeenCalled();

      await act(async () => {
        fireEvent.press(getByText('Discard'));
      });
      expect(onConfirm).toHaveBeenCalled();
    });
  });
});
