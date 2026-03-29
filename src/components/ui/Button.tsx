import React, {useRef, useCallback} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Animated,
} from 'react-native';
import {typography, borderRadius, MIN_TOUCH_TARGET} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'filled',
  loading = false,
  disabled = false,
  style,
  size = 'md',
  accessibilityLabel,
}) => {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const heightMap = {sm: MIN_TOUCH_TARGET, md: MIN_TOUCH_TARGET, lg: 52};
  const height = heightMap[size];

  const bgColor = {
    filled: disabled ? colors.disabled : colors.primary,
    outline: colors.transparent,
    ghost: colors.transparent,
    danger: colors.error,
  }[variant];

  const textColor = {
    filled: colors.white,
    outline: disabled ? colors.disabledText : colors.primary,
    ghost: disabled ? colors.disabledText : colors.primary,
    danger: colors.white,
  }[variant];

  const borderColor =
    variant === 'outline'
      ? disabled
        ? colors.disabled
        : colors.primary
      : 'transparent';

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{disabled: disabled || loading}}
        style={[
          styles.button,
          {
            height,
            minHeight: MIN_TOUCH_TARGET,
            backgroundColor: bgColor,
            borderColor,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            borderRadius: height / 2,
          },
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.text, {color: textColor}]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    ...typography.headline,
    fontWeight: '600',
  },
});
