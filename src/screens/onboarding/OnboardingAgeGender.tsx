import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {GradientButton} from '../../components/ui/GradientButton';
import {ProgressBar} from '../../components/ui/ProgressBar';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {useOnboardingStore} from '../../stores/onboardingStore';
import type {OnboardingStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'OnboardingAgeGender'
>;

const GENDERS = [
  {value: 'man', label: 'Man', iconName: 'man-outline'},
  {value: 'woman', label: 'Woman', iconName: 'woman-outline'},
  {value: 'non_binary', label: 'Non Binary', iconName: 'male-female-outline'},
];

export const OnboardingAgeGender: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {age, gender, setAge, setGender} = useOnboardingStore();
  const [ageText, setAgeText] = useState(age ? String(age) : '');
  const [error, setError] = useState('');
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleAgeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAgeText(cleaned);
    setError('');
    if (cleaned) {
      const num = parseInt(cleaned, 10);
      if (num >= 18 && num <= 99) {
        setAge(num);
      }
    }
  };

  const handleNext = () => {
    const num = parseInt(ageText, 10);
    if (!ageText || isNaN(num)) {
      setError('Please enter your age');
      return;
    }
    if (num < 18) {
      setError('You must be at least 18 years old');
      return;
    }
    if (num > 99) {
      setError('Please enter a valid age');
      return;
    }
    if (!gender) {
      setError('Please select your gender');
      return;
    }
    setAge(num);
    navigation.navigate('OnboardingLocation');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          {/* Progress */}
          <ProgressBar progress={1 / 3} style={styles.progress} />
          <Text
            style={styles.stepLabel}
            accessibilityLabel="Step 1 of 3">
            Step 1 of 3
          </Text>

          {/* Age Section */}
          <Text style={styles.title}>How old are you?</Text>
          <Text style={styles.subtitle}>
            You must be at least 18 years old
          </Text>

          <View style={styles.card}>
            <View style={styles.ageInputRow}>
              <TextInput
                style={styles.ageInput}
                value={ageText}
                onChangeText={handleAgeChange}
                placeholder="25"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={2}
                accessibilityLabel="Enter your age"
                accessibilityHint="Must be between 18 and 99"
              />
              <Text style={styles.ageUnit}>years old</Text>
            </View>
            <Text style={styles.ageHelper}>Enter a number between 18 and 99</Text>
          </View>

          {/* Gender Section */}
          <Text style={styles.sectionTitle}>What's your gender?</Text>

          <View style={styles.genderRow}>
            {GENDERS.map(g => {
              const isSelected = gender === g.value;
              return (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => {
                    setGender(g.value);
                    setError('');
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={g.label}
                  accessibilityState={{selected: isSelected}}
                  style={styles.genderCardWrapper}>
                  {isSelected ? (
                    <LinearGradient
                      colors={[colors.gradient.start, colors.gradient.end]}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.genderCard}>
                      <View style={styles.genderIconCircle}>
                        <Icon
                          name={g.iconName}
                          size={24}
                          color={colors.white}
                        />
                      </View>
                      <Text
                        style={[styles.genderLabel, styles.genderLabelSelected]}>
                        {g.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[styles.genderCard, styles.genderCardUnselected]}>
                      <View
                        style={[
                          styles.genderIconCircle,
                          styles.genderIconCircleUnselected,
                        ]}>
                        <Icon
                          name={g.iconName}
                          size={24}
                          color={colors.textSecondary}
                        />
                      </View>
                      <Text style={styles.genderLabel}>{g.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <GradientButton
            title="Continue"
            onPress={handleNext}
            accessibilityLabel="Continue to next step"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.base,
    },
    progress: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    stepLabel: {
      ...typography.footnote,
      color: c.textTertiary,
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.largeTitle,
      color: c.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: c.textSecondary,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.title2,
      color: c.textPrimary,
      marginTop: spacing.xl,
      marginBottom: spacing.base,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      padding: spacing.base,
      borderWidth: 1,
      borderColor: c.borderGlass,
    },
    ageInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ageInput: {
      ...typography.largeTitle,
      color: c.textPrimary,
      width: 80,
      textAlign: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: c.separatorLight,
    },
    ageUnit: {
      ...typography.body,
      color: c.textSecondary,
      marginLeft: spacing.md,
    },
    ageHelper: {
      ...typography.footnote,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    genderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    genderCardWrapper: {
      flex: 1,
    },
    genderCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      borderRadius: borderRadius.md,
      minHeight: 110,
    },
    genderCardUnselected: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    genderIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.surfaceHover,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    genderIconCircleUnselected: {
      backgroundColor: c.fillTertiary,
    },
    genderLabel: {
      ...typography.subhead,
      fontWeight: '600',
      color: c.textPrimary,
    },
    genderLabelSelected: {
      color: c.white,
    },
    error: {
      ...typography.footnote,
      color: c.error,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.base,
    },
  });
