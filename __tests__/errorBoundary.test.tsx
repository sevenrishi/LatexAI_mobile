import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../src/components/feedback/ErrorBoundary';
import { ThemeProvider } from '../src/theme';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test crash in child component');
  }
  return <Text>Normal Child Component</Text>;
};

describe('Global ErrorBoundary & S-41 ErrorFallback (MB-0.11)', () => {
  // Suppress console.error in test output for intentional render errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      </ThemeProvider>
    );

    expect(getByText('Normal Child Component')).toBeTruthy();
  });

  it('catches error and renders S-41 ErrorFallbackScreen', async () => {
    const { getByText } = await render(
      <ThemeProvider>
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      </ThemeProvider>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test crash in child component')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });
});
