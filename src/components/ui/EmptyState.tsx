import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {IconCircle} from './IconCircle';
import {typography, spacing} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface EmptyStateProps {
  icon?: string;
  iconName?: string;
  title: string;
  message?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconName,
  title,
  message,
  children,
}) => {
  const {colors} = useTheme();
  return (
    <View style={styles.container} accessibilityRole="summary">
      {iconName ? (
        <IconCircle name={iconName} size={72} gradient iconSize={36} />
      ) : icon ? (
        <Text style={styles.icon} accessibilityElementsHidden>
          {icon}
        </Text>
      ) : null}
      <Text
        style={[styles.title, {color: colors.textPrimary}]}
        accessibilityRole="header">
        {title}
      </Text>
      {message && (
        <Text style={[styles.message, {color: colors.textSecondary}]}>
          {message}
        </Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.sm,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.base,
  },
  title: {
    ...typography.title3,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
});
