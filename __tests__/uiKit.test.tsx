import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import {
  Button,
  TextField,
  Chip,
  ConfirmDialog,
  ScoreGauge,
  Typography,
} from '../src/components/ui';
import { ThemeProvider } from '../src/theme';

const renderWithTheme = async (ui: React.ReactElement) => {
  return await render(<ThemeProvider initialMode="light">{ui}</ThemeProvider>);
};

describe('Comprehensive UI Kit (MB-0.06)', () => {
  describe('Typography', () => {
    it('renders heading with header accessibility role', async () => {
      const { getByRole, getByText } = await renderWithTheme(
        <Typography variant="h1">Resume Architect</Typography>
      );
      expect(getByText('Resume Architect')).toBeTruthy();
      expect(getByRole('header')).toBeTruthy();
    });
  });

  describe('Button', () => {
    it('handles press events and accessibility roles', async () => {
      const onPressMock = jest.fn();
      const { getByRole, getByText } = await renderWithTheme(
        <Button title="Generate Resume" onPress={onPressMock} />
      );

      const button = getByRole('button');
      expect(button).toBeTruthy();
      expect(getByText('Generate Resume')).toBeTruthy();

      await fireEvent.press(button);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicator and disables press when loading', async () => {
      const onPressMock = jest.fn();
      const { getByRole, queryByText } = await renderWithTheme(
        <Button title="Compiling..." loading={true} onPress={onPressMock} />
      );

      const button = getByRole('button');
      await fireEvent.press(button);
      expect(onPressMock).not.toHaveBeenCalled();
      expect(queryByText('Compiling...')).toBeNull();
    });
  });

  describe('TextField', () => {
    it('updates text and displays label and helper text', async () => {
      const onChangeMock = jest.fn();
      const { getByPlaceholderText, getByText } = await renderWithTheme(
        <TextField
          label="Job Title"
          placeholder="e.g. Senior Software Engineer"
          helperText="Enter target job title"
          onChangeText={onChangeMock}
        />
      );

      expect(getByText('Job Title')).toBeTruthy();
      expect(getByText('Enter target job title')).toBeTruthy();

      const input = getByPlaceholderText('e.g. Senior Software Engineer');
      await fireEvent.changeText(input, 'Staff Engineer');
      expect(onChangeMock).toHaveBeenCalledWith('Staff Engineer');
    });

    it('displays error message when provided', async () => {
      const { getByText } = await renderWithTheme(
        <TextField
          label="Email"
          error="Invalid email address"
          value="invalid"
        />
      );
      expect(getByText('Invalid email address')).toBeTruthy();
    });
  });

  describe('Chip', () => {
    it('fires press callback and toggles selection mode', async () => {
      const onPressMock = jest.fn();
      const { getByRole } = await renderWithTheme(
        <Chip label="TypeScript" selected={true} onPress={onPressMock} />
      );

      const chip = getByRole('checkbox');
      await fireEvent.press(chip);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('handles removal callback', async () => {
      const onRemoveMock = jest.fn();
      const { getByLabelText } = await renderWithTheme(
        <Chip label="React Native" removable={true} onRemove={onRemoveMock} />
      );

      const removeBtn = getByLabelText('Remove React Native');
      await fireEvent.press(removeBtn);
      expect(onRemoveMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConfirmDialog', () => {
    it('renders modal and handles confirm and cancel', async () => {
      const onConfirmMock = jest.fn();
      const onCancelMock = jest.fn();

      const { getByText } = await renderWithTheme(
        <ConfirmDialog
          visible={true}
          title="Delete Resume"
          message="Are you sure you want to delete this resume?"
          onConfirm={onConfirmMock}
          onCancel={onCancelMock}
        />
      );

      expect(getByText('Delete Resume')).toBeTruthy();
      expect(getByText('Are you sure you want to delete this resume?')).toBeTruthy();

      await fireEvent.press(getByText('Cancel'));
      expect(onCancelMock).toHaveBeenCalledTimes(1);

      await fireEvent.press(getByText('Confirm'));
      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('ScoreGauge', () => {
    it('renders ATS score and accessibility information', async () => {
      const { getByText } = await renderWithTheme(
        <ScoreGauge score={88} label="ATS Match" />
      );

      expect(getByText('88')).toBeTruthy();
      expect(getByText('Strong Match')).toBeTruthy();
      expect(getByText('ATS Match')).toBeTruthy();
    });
  });
});
