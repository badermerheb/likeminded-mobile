import React from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {typography, spacing} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  fullScreen = false,
}) => {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.container,
        fullScreen && [styles.fullScreen, {backgroundColor: colors.background}],
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.message, {color: colors.textSecondary}]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    ...typography.subhead,
    marginTop: spacing.md,
  },
});
