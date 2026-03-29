import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {typography, borderRadius, spacing, MIN_TOUCH_TARGET} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
}) => {
  const {colors} = useTheme();

  if (selected) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{selected: true}}
        style={[{minHeight: MIN_TOUCH_TARGET, justifyContent: 'center'}, style]}>
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.chip}>
          <Text style={[styles.text, {color: colors.white}]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected: false}}
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceTertiary,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: MIN_TOUCH_TARGET,
          justifyContent: 'center',
        },
        style,
      ]}>
      <Text style={[styles.text, {color: colors.textSecondary}]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.footnote,
    fontWeight: '500',
    textAlign: 'center',
  },
});
