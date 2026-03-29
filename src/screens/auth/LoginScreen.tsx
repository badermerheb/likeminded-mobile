import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {Input} from '../../components/ui/Input';
import {GradientButton} from '../../components/ui/GradientButton';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {authService} from '../../services/auth';
import type {AuthStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const validate = (): boolean => {
    const newErrors: {email?: string; password?: string} = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.signIn({email: email.trim(), password});
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error?.message || 'Invalid email or password. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <Text
            style={styles.headerTitle}
            accessibilityRole="header">
            Welcome Back
          </Text>
          <Text style={styles.headerSubtitle}>Sign in to continue</Text>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              autoCapitalize="none"
              error={errors.email}
              accessibilityLabel="Email address"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              textContentType="password"
              isPassword
              error={errors.password}
              accessibilityLabel="Password"
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              accessibilityRole="button"
              accessibilityLabel="Forgot Password">
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <GradientButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
            style={styles.submitButton}
            accessibilityLabel="Sign In"
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              accessibilityLabel="Create Account">
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.largeTitle,
    color: c.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: c.textSecondary,
    marginBottom: spacing.xl,
  },
  formCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    ...typography.subhead,
    color: c.textLink,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: c.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: c.primary,
    fontWeight: '600',
  },
});
