import React from 'react';
import {Text, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {shadows} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface AvatarProps {
  name: string;
  size?: number;
  style?: ViewStyle;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const AvatarInner: React.FC<AvatarProps> = ({name, size = 48, style}) => {
  const {colors} = useTheme();
  const fontSize = size * 0.38;

  return (
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.end]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[
        styles.avatar,
        shadows.sm,
        {width: size, height: size, borderRadius: size / 2},
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${name}'s avatar`}>
      <Text style={[styles.initials, {fontSize, color: colors.white}]}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

export const Avatar = React.memo(AvatarInner);

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
