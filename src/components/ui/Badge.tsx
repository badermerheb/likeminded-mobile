import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {typography, borderRadius, spacing} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface BadgeProps {
  text?: string;
  label?: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  label,
  variant = 'default',
  style,
}) => {
  const {colors} = useTheme();
  const displayText = label || text || '';

  const colorMap = {
    success: {bg: colors.successLight, text: colors.success},
    warning: {bg: colors.warningLight, text: colors.warning},
    error: {bg: colors.errorLight, text: colors.error},
    info: {bg: colors.infoLight, text: colors.info},
    default: {bg: colors.surfaceTertiary, text: colors.textSecondary},
  };

  const c = colorMap[variant];

  return (
    <View
      style={[styles.badge, {backgroundColor: c.bg}, style]}
      accessibilityRole="text"
      accessibilityLabel={displayText}>
      <Text style={[styles.text, {color: c.text}]}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.caption1,
    fontWeight: '600',
  },
});
