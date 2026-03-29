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
import {ProgressBar} from '../../components/ui/ProgressBar';
import {eventsService} from '../../services/events';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {authService} from '../../services/auth';
import type {AuthStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState(0);
  const signupStartedRef = React.useRef(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const steps = ['Your Name', 'Your Email', 'Create Password'];
  const progress = (step + 1) / steps.length;

  const stepTitles = [
    "What's your name?",
    "What's your email?",
    'Create a password',
  ];

  const stepSubtitles = [
    "This is how you'll appear to your matches",
    "We'll use this to sign you in",
    'Must be at least 8 characters',
  ];

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!fullName.trim()) newErrors.fullName = 'Name is required';
      else if (fullName.trim().length < 2)
        newErrors.fullName = 'Name must be at least 2 characters';
    } else if (step === 1) {
      if (!email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email))
        newErrors.email = 'Enter a valid email';
    } else if (step === 2) {
      if (!password) newErrors.password = 'Password is required';
      else if (password.length < 8)
        newErrors.password = 'Password must be at least 8 characters';
      if (password !== confirmPassword)
        newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step < steps.length - 1) {
      // Fire signup_started once when user completes step 0 (name)
      if (step === 0 && !signupStartedRef.current) {
        signupStartedRef.current = true;
        eventsService.track('signup_started', {
          properties: {source: 'register_screen'},
        });
      }

      // Check if email already exists before proceeding
      if (step === 1) {
        setLoading(true);
        try {
          const {exists, provider} = await authService.checkEmail(email.trim());
          if (exists) {
            if (provider === 'google') {
              setErrors({email: 'This email is linked to a Google account. Use "Sign in with Google" instead.'});
            } else {
              setErrors({email: 'This email is already registered. Try signing in instead.'});
            }
            setLoading(false);
            return;
          }
        } catch {
          // If check fails, allow user to proceed — signup will catch duplicates
        } finally {
          setLoading(false);
        }
      }

      setStep(step + 1);
      return;
    }

    // Final step - register
    setLoading(true);
    try {
      await authService.signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      eventsService.track('signup_completed', {
        properties: {source: 'register_screen'},
      });
      // Supabase sends confirmation OTP via custom SMTP automatically
      navigation.navigate('EmailVerification', {email: email.trim()});
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      let userMsg = error?.message || 'Could not create account. Please try again.';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        userMsg = 'This email is already registered. Try signing in instead.';
        setStep(1);
        setErrors({email: userMsg});
        setLoading(false);
        return;
      }
      if (msg.includes('security purposes') || msg.includes('request this after')) {
        userMsg = 'Too many attempts. Please wait a moment and try again.';
      }
      Alert.alert(
        'Registration Failed',
        userMsg,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    } else {
      navigation.goBack();
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.formCard}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              textContentType="name"
              autoComplete="name"
              autoFocus
              error={errors.fullName}
              accessibilityLabel="Full name"
            />
          </View>
        );
      case 1:
        return (
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
              autoFocus
              error={errors.email}
              accessibilityLabel="Email address"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.formCard}>
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              textContentType="newPassword"
              isPassword
              error={errors.password}
              accessibilityLabel="Password"
            />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              textContentType="newPassword"
              isPassword
              error={errors.confirmPassword}
              accessibilityLabel="Confirm password"
            />
          </View>
        );
      default:
        return null;
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
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            accessibilityRole="button"
            accessibilityLabel={step > 0 ? 'Go to previous step' : 'Go back'}>
            <Icon name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Step Indicator */}
          <Text style={styles.stepIndicator}>
            Step {step + 1} of {steps.length}
          </Text>

          {/* Progress Bar */}
          <ProgressBar progress={progress} style={styles.progress} />

          {/* Step Title */}
          <Text
            style={styles.stepTitle}
            accessibilityRole="header">
            {stepTitles[step]}
          </Text>
          <Text style={styles.stepSubtitle}>{stepSubtitles[step]}</Text>

          {/* Step Content in Card */}
          <View style={styles.stepContent}>{renderStepContent()}</View>

          {/* Continue / Create Account Button */}
          <GradientButton
            title={step === steps.length - 1 ? 'Create Account' : 'Continue'}
            onPress={handleNext}
            loading={loading}
            style={styles.nextButton}
            accessibilityLabel={
              step === steps.length - 1 ? 'Create Account' : 'Continue to next step'
            }
          />

          {/* Footer - only on first step */}
          {step === 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Sign In">
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
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
  stepIndicator: {
    ...typography.footnote,
    color: c.textTertiary,
    marginBottom: spacing.sm,
  },
  progress: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    ...typography.largeTitle,
    color: c.textPrimary,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body,
    color: c.textSecondary,
    marginBottom: spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  formCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  nextButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
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
