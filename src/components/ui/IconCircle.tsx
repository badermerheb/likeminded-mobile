import React from 'react';
import {View, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeContext';

interface IconCircleProps {
  name: string;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  gradient?: boolean;
  accessibilityLabel?: string;
}

export const IconCircle: React.FC<IconCircleProps> = ({
  name,
  size = 44,
  iconSize,
  color,
  backgroundColor,
  gradient = false,
  accessibilityLabel,
}) => {
  const {colors} = useTheme();
  const iconColor = color ?? colors.white;
  const bgColor = backgroundColor ?? colors.primary;
  const computedIconSize = iconSize ?? size * 0.5;
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.circle, circleStyle]}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}>
        <Icon name={name} size={computedIconSize} color={iconColor} />
      </LinearGradient>
    );
  }

  return (
    <View
      style={[styles.circle, circleStyle, {backgroundColor: bgColor}]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      <Icon name={name} size={computedIconSize} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
