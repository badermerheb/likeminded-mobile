import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {shadows} from '../../theme';
import {authService} from '../../services/auth';
import type {AuthStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const FeatureItem: React.FC<{
  iconName: string;
  text: string;
  iconColor?: string;
  iconBg?: string;
  styles: ReturnType<typeof createStyles>;
}> = ({
  iconName,
  text,
  iconColor,
  iconBg,
  styles,
}) => (
  <View style={styles.featureCard}>
    <View style={[styles.featureIconContainer, iconBg ? {backgroundColor: iconBg} : null]}>
      <Icon name={iconName} size={22} color={iconColor} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [googleLoading, setGoogleLoading] = useState(false);
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (e: any) {
      const msg = e?.message || '';
      const code = e?.code || '';
      const isCancelled = msg.includes('canceled') || msg.includes('cancelled') || code === 'SIGN_IN_CANCELLED' || code === '12501';
      if (!isCancelled) {
        Alert.alert('Sign In Failed', msg || 'Could not sign in with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.screenBg}>
      <SafeAreaView style={styles.container}>
        {/* Top Content */}
        <View style={styles.content}>
          {/* Logo Image */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="LikeMinded logo"
            />
            <Text style={styles.logoText}>
              <Text style={styles.logoLike}>Like</Text>
              <Text style={styles.logoMinded}>Minded</Text>
            </Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>
            Connect through personality,{'\n'}not just profiles
          </Text>

          {/* Feature Cards */}
          <View style={styles.features}>
            <FeatureItem
              iconName="bulb-outline"
              text="Personality-based matching"
              iconColor={colors.primary}
              iconBg={colors.primaryMuted}
              styles={styles}
            />
            <FeatureItem
              iconName="chatbubbles-outline"
              text="Meaningful conversations"
              iconColor={colors.secondary}
              iconBg={colors.secondaryMuted}
              styles={styles}
            />
            <FeatureItem
              iconName="heart-outline"
              text="Deeper connections"
              iconColor={colors.accent}
              iconBg={colors.accentMuted}
              styles={styles}
            />
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create Account">
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google">
            <Icon name="logo-google" size={20} color={colors.textPrimary} />
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign In to existing account">
            <Text style={styles.signInLinkText}>
              Already have an account?{' '}
              <Text style={styles.signInLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  screenBg: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoImage: {
    width: 420,
    height: 160,
    marginBottom: spacing.xs,
  },
  logoText: {
    ...typography.largeTitle,
    fontSize: 42,
    color: c.white,
    letterSpacing: 0.5,
  },
  logoLike: {
    fontWeight: '300',
  },
  logoMinded: {
    fontWeight: '800',
  },
  tagline: {
    ...typography.title3,
    color: c.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
    marginBottom: spacing['2xl'],
  },
  features: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
    color: c.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  buttonsContainer: {
    paddingBottom: spacing.base,
    gap: spacing.md,
  },
  createAccountButton: {
    backgroundColor: c.primary,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowPrimary,
  },
  createAccountText: {
    ...typography.headline,
    color: c.white,
    fontWeight: '700',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderGlass,
    gap: spacing.sm,
  },
  googleButtonText: {
    ...typography.headline,
    color: c.textPrimary,
    fontWeight: '600',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  signInLinkText: {
    ...typography.body,
    color: c.textTertiary,
  },
  signInLinkBold: {
    fontWeight: '700',
    color: c.textSecondary,
  },
});
