import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../theme/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  style,
}) => {
  const {colors} = useTheme();
  const clampedProgress = Math.min(100, Math.max(0, progress * 100));
  const progressPercent = Math.round(clampedProgress);

  return (
    <View
      style={[
        styles.track,
        {height, borderRadius: height / 2, backgroundColor: colors.fillTertiary},
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progressPercent,
      }}
      accessibilityLabel={`Progress: ${progressPercent}%`}>
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{x: 0, y: 1}}
        end={{x: 1, y: 0}}
        style={[
          styles.fill,
          {width: `${clampedProgress}%`, borderRadius: height / 2},
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
