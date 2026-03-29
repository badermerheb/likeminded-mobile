import React, {useEffect} from 'react';
import {ViewStyle, StyleProp} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {useTheme} from '../../theme/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const {colors} = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1.0, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityRole="none"
      accessibilityLabel="Loading"
      style={[
        {
          width: width as number,
          height: height as number,
          borderRadius,
          backgroundColor: colors.skeleton,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};
