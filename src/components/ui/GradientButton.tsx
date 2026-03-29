import React, {useRef, useCallback} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import {typography, MIN_TOUCH_TARGET} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'sm' | 'md' | 'lg' | 'large';
  variant?: 'filled' | 'outline';
  accessibilityLabel?: string;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'lg',
  variant = 'filled',
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

  const heightMap: Record<string, number> = {
    small: MIN_TOUCH_TARGET,
    sm: MIN_TOUCH_TARGET,
    md: 48,
    lg: 56,
    large: 56,
  };
  const height = heightMap[size] || 56;

  const label = accessibilityLabel || title;

  // Outline variant
  if (variant === 'outline') {
    return (
      <Animated.View style={{transform: [{scale: scaleAnim}]}}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled || loading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{disabled: disabled || loading}}
          style={[{minHeight: MIN_TOUCH_TARGET}, style]}>
          <View
            style={[
              styles.btnInner,
              {
                height,
                borderRadius: height / 2,
                borderWidth: 1.5,
                borderColor: disabled ? colors.disabled : colors.primary,
                backgroundColor: 'transparent',
              },
            ]}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text
                style={[styles.text, {color: colors.primary}, textStyle]}>
                {title}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{disabled: disabled || loading}}
        style={[{minHeight: MIN_TOUCH_TARGET}, style]}>
        <View
          style={[
            styles.btnInner,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: disabled ? colors.disabled : colors.primary,
            },
          ]}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.text, {color: colors.white}, textStyle]}>
              {title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btnInner: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  text: {
    ...typography.headline,
    fontWeight: '600',
  },
});
