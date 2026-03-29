import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {borderRadius, spacing, shadows} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({children, style, elevated = true}) => {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.card,
        {backgroundColor: colors.surface, borderColor: colors.borderGlass},
        elevated && shadows.soft,
        style,
      ]}
      accessibilityRole="summary">
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
  },
});
