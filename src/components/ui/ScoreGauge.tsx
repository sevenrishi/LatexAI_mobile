import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../../theme';
import { Typography } from './Typography';

export interface ScoreGaugeProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 140,
  strokeWidth = 12,
  showLabel = true,
  label = 'ATS Score',
  style,
}) => {
  const { theme } = useTheme();

  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  // SVG Geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalizedScore) / 100;

  const getScoreColor = (): string => {
    if (normalizedScore >= 75) return theme.colors.scoreHigh;
    if (normalizedScore >= 50) return theme.colors.scoreMedium;
    return theme.colors.scoreLow;
  };

  const getScoreTierText = (): string => {
    if (normalizedScore >= 75) return 'Strong Match';
    if (normalizedScore >= 50) return 'Moderate Match';
    return 'Needs Optimization';
  };

  const scoreColor = getScoreColor();
  const tierText = getScoreTierText();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[styles.gaugeWrapper, { width: size, height: size }]}
      >
        <Svg
          width={size}
          height={size}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: normalizedScore }}
          accessibilityLabel={`${label}: ${normalizedScore} percent. ${tierText}.`}
        >
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background Track Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground Score Arc */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </G>
        </Svg>

        {/* Center Score Text */}
        <View style={styles.centerTextContainer}>
          <Typography
            variant="h1"
            weight="bold"
            customColor={scoreColor}
            style={styles.scoreText}
          >
            {String(normalizedScore)}
          </Typography>
          <Typography variant="caption" color="muted" style={styles.percentText}>
            / 100
          </Typography>
        </View>
      </View>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Typography variant="bodySm" weight="semibold" customColor={scoreColor}>
            {tierText}
          </Typography>
          <Typography variant="caption" color="muted">
            {label}
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 32,
    lineHeight: 38,
  },
  percentText: {
    marginTop: -2,
  },
  labelContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
});
