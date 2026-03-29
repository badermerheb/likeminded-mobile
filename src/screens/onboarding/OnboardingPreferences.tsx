import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView, LayoutChangeEvent} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MultiSlider, {MarkerProps, LabelProps} from '@ptomasroos/react-native-multi-slider';
import LinearGradient from 'react-native-linear-gradient';
import {GradientButton} from '../../components/ui/GradientButton';
import {ProgressBar} from '../../components/ui/ProgressBar';
import {Chip} from '../../components/ui/Chip';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {useOnboardingStore} from '../../stores/onboardingStore';
import {useAuthStore} from '../../stores/authStore';
import {profileService} from '../../services/profile';
import type {OnboardingIn} from '../../types/api';

/** Custom thumb marker — gradient circle with white border */
const CustomMarker: React.FC<MarkerProps & {colors: ThemeColors}> = ({pressed, colors}) => {
  const mStyles = useMemo(() => createMarkerStyles(colors), [colors]);
  return (
    <View style={[mStyles.thumb, pressed && mStyles.thumbPressed]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={mStyles.thumbGradient}
      />
    </View>
  );
};

/** Floating labels above the age range slider */
const AgeLabel: React.FC<LabelProps & {colors: ThemeColors}> = ({oneMarkerValue, twoMarkerValue, oneMarkerLeftPosition, twoMarkerLeftPosition, colors}) => {
  const mStyles = useMemo(() => createMarkerStyles(colors), [colors]);
  return (
    <View style={mStyles.labelRow}>
      <View style={[mStyles.labelBubble, {left: oneMarkerLeftPosition - 20}]}>
        <Text style={mStyles.labelText}>{oneMarkerValue}</Text>
      </View>
      <View style={[mStyles.labelBubble, {left: twoMarkerLeftPosition - 20}]}>
        <Text style={mStyles.labelText}>{twoMarkerValue}</Text>
      </View>
    </View>
  );
};

/** Floating label above the distance slider */
const DistanceLabel: React.FC<LabelProps & {colors: ThemeColors}> = ({oneMarkerValue, oneMarkerLeftPosition, colors}) => {
  const mStyles = useMemo(() => createMarkerStyles(colors), [colors]);
  return (
    <View style={mStyles.labelRow}>
      <View style={[mStyles.labelBubble, mStyles.labelBubbleWide, {left: oneMarkerLeftPosition - 28}]}>
        <Text style={mStyles.labelText}>{oneMarkerValue} km</Text>
      </View>
    </View>
  );
};

const createMarkerStyles = (c: ThemeColors) =>
  StyleSheet.create({
    thumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      overflow: 'hidden',
      shadowColor: c.primary,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    thumbPressed: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    thumbGradient: {
      flex: 1,
    },
    labelRow: {
      position: 'relative',
      height: 32,
    },
    labelBubble: {
      position: 'absolute',
      top: 0,
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      minWidth: 40,
      alignItems: 'center',
    },
    labelBubbleWide: {
      minWidth: 56,
    },
    labelText: {
      ...typography.caption1,
      color: c.white,
      fontWeight: '700',
      textAlign: 'center',
    },
  });

const GENDER_PREFS = [
  {value: 'man', label: 'Men'},
  {value: 'woman', label: 'Women'},
  {value: null, label: 'Everyone'},
];

export const OnboardingPreferences: React.FC = () => {
  const store = useOnboardingStore();
  const {setProfile, setOnboarded} = useAuthStore();
  const [loading, setLoading] = useState(false);
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Layout-based slider length instead of Dimensions
  const [sliderLength, setSliderLength] = useState(280);

  // Local state for visual feedback during drag
  const [localAgeRange, setLocalAgeRange] = useState<[number, number]>([
    store.preferredMinAge,
    store.preferredMaxAge,
  ]);
  const [localDistance, setLocalDistance] = useState(store.preferredMaxDistanceKm);

  const handleSliderContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    // Subtract padding for the slider
    const computed = width - spacing.base * 2;
    if (computed > 0) {
      setSliderLength(computed);
    }
  }, []);

  const handleComplete = async () => {
    if (!store.age || !store.gender) {
      Alert.alert('Missing Info', 'Please go back and complete all fields.');
      return;
    }

    setLoading(true);
    try {
      const data: OnboardingIn = {
        age: store.age,
        gender: store.gender,
        location_id: store.locationId,
        preferred_min_age: store.preferredMinAge,
        preferred_max_age: store.preferredMaxAge,
        preferred_gender: store.preferredGender,
        preferred_max_distance_km: store.preferredMaxDistanceKm,
      };
      const profile = await profileService.completeOnboarding(data);
      setProfile(profile);
      setOnboarded(true);
      store.reset();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Could not save preferences. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Visual feedback during drag (local state only)
  const handleValuesChange = useCallback((values: number[]) => {
    setLocalAgeRange([values[0], values[1]]);
  }, []);

  // Commit to store on drag end
  const handleValuesChangeFinish = useCallback(
    (values: number[]) => {
      setLocalAgeRange([values[0], values[1]]);
      store.setPreferredMinAge(values[0]);
      store.setPreferredMaxAge(values[1]);
    },
    [store],
  );

  // Visual feedback during distance drag
  const handleDistanceChange = useCallback((vals: number[]) => {
    setLocalDistance(Math.round(vals[0]));
  }, []);

  // Commit distance on drag end
  const handleDistanceComplete = useCallback(
    (vals: number[]) => {
      const rounded = Math.round(vals[0]);
      setLocalDistance(rounded);
      store.setPreferredMaxDistanceKm(rounded);
    },
    [store],
  );

  // Wrap sub-component renderers to pass colors
  const renderCustomMarkerLeft = useCallback(
    (props: MarkerProps) => <CustomMarker {...props} colors={colors} />,
    [colors],
  );
  const renderCustomMarkerRight = useCallback(
    (props: MarkerProps) => <CustomMarker {...props} colors={colors} />,
    [colors],
  );
  const renderCustomMarker = useCallback(
    (props: MarkerProps) => <CustomMarker {...props} colors={colors} />,
    [colors],
  );
  const renderAgeLabel = useCallback(
    (props: LabelProps) => <AgeLabel {...props} colors={colors} />,
    [colors],
  );
  const renderDistanceLabel = useCallback(
    (props: LabelProps) => <DistanceLabel {...props} colors={colors} />,
    [colors],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <ProgressBar progress={1} style={styles.progress} />
        <Text
          style={styles.stepLabel}
          accessibilityLabel="Step 3 of 3">
          Step 3 of 3
        </Text>

        {/* Header */}
        <Text style={styles.title}>Your preferences</Text>
        <Text style={styles.subtitle}>
          Tell us who you'd like to meet
        </Text>

        {/* Age Range Section */}
        <Text style={styles.sectionHeader}>AGE RANGE</Text>
        <View style={styles.card} onLayout={handleSliderContainerLayout}>
          <Text style={styles.valueDisplay}>
            {localAgeRange[0]} — {localAgeRange[1]}
          </Text>
          <View style={styles.sliderContainer}>
            <MultiSlider
              values={[localAgeRange[0], localAgeRange[1]]}
              min={18}
              max={99}
              step={1}
              sliderLength={sliderLength > 0 ? sliderLength : 280}
              enabledTwo
              snapped
              isMarkersSeparated
              onValuesChange={handleValuesChange}
              onValuesChangeFinish={handleValuesChangeFinish}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.multiSliderContainer}
              trackStyle={styles.track}
              customMarkerLeft={renderCustomMarkerLeft}
              customMarkerRight={renderCustomMarkerRight}
              enableLabel
              customLabel={renderAgeLabel}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>18</Text>
            <Text style={styles.sliderLabelText}>99</Text>
          </View>
        </View>

        {/* Gender Preference Section */}
        <Text style={styles.sectionHeader}>INTERESTED IN</Text>
        <View style={styles.cardFlat}>
          <View style={styles.chipRow}>
            {GENDER_PREFS.map(g => (
              <Chip
                key={g.label}
                label={g.label}
                selected={store.preferredGender === g.value}
                onPress={() => store.setPreferredGender(g.value)}
              />
            ))}
          </View>
        </View>

        {/* Distance Section */}
        <Text style={styles.sectionHeader}>MAXIMUM DISTANCE</Text>
        <View style={styles.card}>
          <Text style={styles.valueDisplay}>
            {localDistance} km
          </Text>
          <View style={styles.sliderContainer}>
            <MultiSlider
              values={[localDistance]}
              min={5}
              max={200}
              step={5}
              sliderLength={sliderLength > 0 ? sliderLength : 280}
              snapped
              onValuesChange={handleDistanceChange}
              onValuesChangeFinish={handleDistanceComplete}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.multiSliderContainer}
              trackStyle={styles.track}
              customMarker={renderCustomMarker}
              enableLabel
              customLabel={renderDistanceLabel}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>5 km</Text>
            <Text style={styles.sliderLabelText}>200 km</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Get Started"
          onPress={handleComplete}
          loading={loading}
          accessibilityLabel="Complete onboarding and get started"
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.xl,
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
    sectionHeader: {
      ...typography.footnote,
      color: c.textTertiary,
      fontWeight: '500',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.base,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      padding: spacing.base,
      paddingTop: spacing.base,
    },
    cardFlat: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      padding: spacing.base,
    },
    valueDisplay: {
      ...typography.title2,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    sliderContainer: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    multiSliderContainer: {
      alignSelf: 'center',
    },
    track: {
      height: 4,
      borderRadius: 2,
    },
    selectedTrack: {
      backgroundColor: c.primary,
    },
    unselectedTrack: {
      backgroundColor: c.separatorLight,
    },
    sliderLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    sliderLabelText: {
      ...typography.footnote,
      color: c.textTertiary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    footer: {
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.base,
    },
  });
