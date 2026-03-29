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
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {GradientButton} from '../../components/ui/GradientButton';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {supabase} from '../../services/supabase';
import {authService} from '../../services/auth';
import type {AuthStackParamList} from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>;

export const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<Props['navigation']>();
  const route = useRoute<Props['route']>();
  const {email} = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
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

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const {error: verifyErr} = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (verifyErr) throw verifyErr;
      setSuccess(true);
      // Auth state change listener in RootNavigator will pick up the session
    } catch (e: any) {
      setError(e?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authService.resendConfirmation(email);
    } catch (e: any) {
      setError(e?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Icon name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Email Verified!</Text>
          <Text style={styles.successSubtitle}>
            Your account is ready. Setting up your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon name="mail-outline" size={32} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.headerTitle} accessibilityRole="header">
            Verify Your Email
          </Text>
          <Text style={styles.headerSubtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          {/* OTP Input */}
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

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <GradientButton
            title="Verify Email"
            onPress={handleVerify}
            loading={loading}
            disabled={otp.join('').length !== 6}
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resending}
            accessibilityRole="button"
            accessibilityLabel="Resend verification code">
            <Text style={styles.resendText}>
              {resending ? 'Sending...' : "Didn't receive the code? Resend"}
            </Text>
          </TouchableOpacity>
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
    marginBottom: spacing['2xl'],
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: {
    color: c.primary,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  submitButton: {
    marginTop: spacing.xl,
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
    paddingHorizontal: spacing.lg,
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
