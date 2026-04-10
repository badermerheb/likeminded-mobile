import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeContext';

export const ThemeToggleHeader: React.FC = () => {
  const {isDark, toggleTheme, colors} = useTheme();
  return (
    <TouchableOpacity
      onPress={toggleTheme}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
      style={styles.headerButton}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <Icon
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={colors.textPrimary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerButton: {
    padding: 6,
    marginRight: 4,
  },
});
