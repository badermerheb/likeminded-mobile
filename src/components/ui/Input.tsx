import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {typography, spacing, borderRadius} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  rightIcon,
  isPassword,
  value,
  ...props
}) => {
  const {colors} = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showClear =
    !isPassword && !rightIcon && value && value.length > 0 && focused;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, {color: colors.textPrimary}]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: colors.separatorLight,
            backgroundColor: colors.fill,
          },
          focused && {
            borderColor: colors.borderFocus,
            backgroundColor: colors.surfaceInput,
          },
          error ? {borderColor: colors.error} : null,
        ]}>
        <TextInput
          style={[styles.input, {color: colors.textPrimary}]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          autoComplete={isPassword ? 'off' : props.autoComplete}
          value={value}
          accessibilityLabel={label}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          {...props}
          secureTextEntry={isPassword ? !showPassword : false}
        />
        {showClear && (
          <TouchableOpacity
            onPress={() => props.onChangeText?.('')}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Clear text">
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? 'Hide password' : 'Show password'
            }>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        {rightIcon}
      </View>
      {error && (
        <Text style={[styles.errorText, {color: colors.error}]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.subhead,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  errorText: {
    ...typography.caption1,
    marginTop: spacing.xs,
  },
});
