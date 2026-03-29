import React, {useMemo, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
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
import {spacing, borderRadius} from '../../theme/spacing';
import {supabase} from '../../services/supabase';
import {authService} from '../../services/auth';
import type {AuthStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'otp' | 'success';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [googleEmail, setGoogleEmail] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    setGoogleEmail(false);
    try {
      // Check if this email exists and how it was registered
      const {exists, provider} = await authService.checkEmail(email.trim());
      if (!exists) {
        setError('No account found with this email address.');
        setLoading(false);
        return;
      }
      if (provider === 'google') {
        setGoogleEmail(true);
        setLoading(false);
        return;
      }

      await authService.resetPassword(email.trim());
      setStep('otp');
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleResetPassword = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Verify OTP and get session
      const {error: verifyErr} = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'recovery',
      });
      if (verifyErr) throw verifyErr;

      // Update password
      const {error: updateErr} = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      // Sign out so user can sign in fresh
      await supabase.auth.signOut();
      setStep('success');
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password. Please try again.');
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
            onPress={() => {
              if (step === 'otp') {
                setStep('email');
                setOtp(['', '', '', '', '', '']);
                setError('');
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {step === 'email' && (
            <>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Icon name="lock-open-outline" size={32} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.headerTitle} accessibilityRole="header">
                Reset Password
              </Text>
              <Text style={styles.headerSubtitle}>
                Enter your email and we'll send you a code to reset your password.
              </Text>

              <View style={styles.formCard}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); setGoogleEmail(false); }}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  error={error || undefined}
                  accessibilityLabel="Email address"
                />
              </View>

              {googleEmail && (
                <View style={styles.googleBanner}>
                  <Icon name="logo-google" size={20} color={colors.warning} />
                  <Text style={styles.googleBannerText}>
                    This email is linked to a Google account. You cannot reset the password for it. Please use "Sign in with Google" to access your account.
                  </Text>
                </View>
              )}

              <GradientButton
                title="Send Reset Code"
                onPress={handleSendReset}
                loading={loading}
                disabled={!email.trim()}
                style={styles.submitButton}
              />

              {googleEmail && (
                <TouchableOpacity
                  style={styles.googleSignInLink}
                  onPress={() => navigation.navigate('Welcome')}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to sign in with Google">
                  <Text style={styles.googleSignInLinkText}>
                    Go to Sign In with Google
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Icon name="mail-outline" size={32} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.headerTitle} accessibilityRole="header">
                Check Your Email
              </Text>
              <Text style={styles.headerSubtitle}>
                We sent a 6-digit code to {email}. Enter it below with your new password.
              </Text>

              {/* OTP Input */}
              <Text style={styles.otpLabel}>Verification Code</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { otpRefs.current[i] = ref; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={v => handleOtpChange(v, i)}
                    onKeyPress={({nativeEvent}) => handleOtpKeyPress(nativeEvent.key, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    accessibilityLabel={`Digit ${i + 1}`}
                  />
                ))}
              </View>

              {/* New password fields */}
              <View style={styles.formCard}>
                <Input
                  label="New Password"
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); setError(''); }}
                  placeholder="Enter new password"
                  textContentType="newPassword"
                  isPassword
                  accessibilityLabel="New password"
                />
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                  placeholder="Confirm new password"
                  textContentType="newPassword"
                  isPassword
                  accessibilityLabel="Confirm new password"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <GradientButton
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                disabled={otp.join('').length !== 6 || !newPassword}
                style={styles.submitButton}
              />

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleSendReset}
                accessibilityRole="button"
                accessibilityLabel="Resend code">
                <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Icon name="checkmark-circle" size={56} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Updated</Text>
              <Text style={styles.successSubtitle}>
                Your password has been reset successfully. You can now sign in with your new password.
              </Text>
              <GradientButton
                title="Back to Sign In"
                onPress={() => navigation.navigate('Login')}
                style={styles.submitButton}
              />
            </View>
          )}
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.largeTitle,
    color: c.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.body,
    color: c.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  otpLabel: {
    ...typography.subhead,
    color: c.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surface,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: c.textPrimary,
  },
  otpBoxFilled: {
    borderColor: c.primary,
    backgroundColor: c.primaryMuted,
  },
  errorText: {
    ...typography.footnote,
    color: c.error,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  resendText: {
    ...typography.subhead,
    color: c.textLink,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  googleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,159,10,0.12)',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginTop: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.25)',
  },
  googleBannerText: {
    ...typography.subhead,
    color: c.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  googleSignInLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  googleSignInLinkText: {
    ...typography.body,
    color: c.primary,
    fontWeight: '600',
  },
  successIconCircle: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.title1,
    color: c.textPrimary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.body,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
