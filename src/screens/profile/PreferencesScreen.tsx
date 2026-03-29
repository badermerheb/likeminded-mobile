import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert, LayoutChangeEvent, Animated, TouchableOpacity, Modal} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import MultiSlider, {MarkerProps, LabelProps} from '@ptomasroos/react-native-multi-slider';
import LinearGradient from 'react-native-linear-gradient';
import {GradientButton} from '../../components/ui/GradientButton';
import {Chip} from '../../components/ui/Chip';
import {LoadingSpinner} from '../../components/ui/LoadingSpinner';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {profileService} from '../../services/profile';
import type {MatchPreferencesIn} from '../../types/api';

const GENDER_OPTIONS = [
  {value: 'man', label: 'Men'},
  {value: 'woman', label: 'Women'},
  {value: null, label: 'Everyone'},
];

export const PreferencesScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mStyles = useMemo(() => createMarkerStyles(colors), [colors]);
  const queryClient = useQueryClient();

  /** Custom thumb marker — gradient circle with white border */
  const CustomMarker: React.FC<MarkerProps> = useCallback(({pressed}) => (
    <View style={[mStyles.thumb, pressed && mStyles.thumbPressed]}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={mStyles.thumbGradient}
      />
    </View>
  ), [colors, mStyles]);

  /** Floating labels above the age range slider */
  const AgeLabel: React.FC<LabelProps> = useCallback(({oneMarkerValue, twoMarkerValue, oneMarkerLeftPosition, twoMarkerLeftPosition}) => (
    <View style={mStyles.labelRow}>
      <View style={[mStyles.labelBubble, {left: oneMarkerLeftPosition - 20}]}>
        <Text style={mStyles.labelText}>{oneMarkerValue}</Text>
      </View>
      <View style={[mStyles.labelBubble, {left: twoMarkerLeftPosition - 20}]}>
        <Text style={mStyles.labelText}>{twoMarkerValue}</Text>
      </View>
    </View>
  ), [mStyles]);

  /** Floating label above the distance slider */
  const DistanceLabel: React.FC<LabelProps> = useCallback(({oneMarkerValue, oneMarkerLeftPosition}) => (
    <View style={mStyles.labelRow}>
      <View style={[mStyles.labelBubble, mStyles.labelBubbleWide, {left: oneMarkerLeftPosition - 28}]}>
        <Text style={mStyles.labelText}>{oneMarkerValue} km</Text>
      </View>
    </View>
  ), [mStyles]);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getMe,
  });

  // Original values from server (for dirty check)
  const [origMinAge, setOrigMinAge] = useState(18);
  const [origMaxAge, setOrigMaxAge] = useState(35);
  const [origGender, setOrigGender] = useState<string | null>(null);
  const [origDistance, setOrigDistance] = useState(75);

  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(35);
  const [prefGender, setPrefGender] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState(75);

  // Local state for smooth visual feedback during drag
  const [localMinAge, setLocalMinAge] = useState(18);
  const [localMaxAge, setLocalMaxAge] = useState(35);
  const [localDistance, setLocalDistance] = useState(75);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Layout-based slider length instead of hardcoded value
  const [sliderLength, setSliderLength] = useState(280);

  // Check if user changed anything
  const hasChanges = useMemo(() => {
    return (
      minAge !== origMinAge ||
      maxAge !== origMaxAge ||
      prefGender !== origGender ||
      maxDistance !== origDistance
    );
  }, [minAge, maxAge, prefGender, maxDistance, origMinAge, origMaxAge, origGender, origDistance]);

  useEffect(() => {
    if (profileQuery.data) {
      const p = profileQuery.data;
      const min = p.preferred_min_age ?? 18;
      const max = p.preferred_max_age ?? 35;
      const dist = p.preferred_max_distance_km ?? 75;
      const gender = p.preferred_gender;
      setMinAge(min);
      setMaxAge(max);
      setPrefGender(gender);
      setMaxDistance(dist);
      setLocalMinAge(min);
      setLocalMaxAge(max);
      setLocalDistance(dist);
      // Store originals for dirty check
      setOrigMinAge(min);
      setOrigMaxAge(max);
      setOrigGender(gender);
      setOrigDistance(dist);
    }
  }, [profileQuery.data]);

  const showToast = useCallback((type: 'success' | 'error') => {
    setToastType(type);
    setToastVisible(true);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {toValue: 0, duration: 300, useNativeDriver: true}),
    ]).start(() => setToastVisible(false));
  }, [toastOpacity]);

  const handleSliderContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    const computed = width - spacing.base * 2;
    if (computed > 0) {
      setSliderLength(computed);
    }
  }, []);

  // Visual feedback during age drag (local state only)
  const handleAgeValuesChange = useCallback((values: number[]) => {
    setLocalMinAge(values[0]);
    setLocalMaxAge(values[1]);
  }, []);

  // Commit age values on drag end
  const handleAgeValuesChangeFinish = useCallback((values: number[]) => {
    setLocalMinAge(values[0]);
    setLocalMaxAge(values[1]);
    setMinAge(values[0]);
    setMaxAge(values[1]);
  }, []);

  // Visual feedback during distance drag (local state only)
  const handleDistanceChange = useCallback((vals: number[]) => {
    setLocalDistance(Math.round(vals[0]));
  }, []);

  // Commit distance on drag end
  const handleDistanceComplete = useCallback((vals: number[]) => {
    const rounded = Math.round(vals[0]);
    setLocalDistance(rounded);
    setMaxDistance(rounded);
  }, []);

  const prefsMutation = useMutation({
    mutationFn: (data: MatchPreferencesIn) =>
      profileService.updatePreferences(data),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['profile']}),
  });

  const handleSave = async () => {
    try {
      await prefsMutation.mutateAsync({
        preferred_min_age: minAge,
        preferred_max_age: maxAge,
        preferred_gender: prefGender,
        preferred_max_distance_km: maxDistance,
      });
      // Update originals so button disables again
      setOrigMinAge(minAge);
      setOrigMaxAge(maxAge);
      setOrigGender(prefGender);
      setOrigDistance(maxDistance);
      showToast('success');
    } catch {
      showToast('error');
    }
  };

  if (profileQuery.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        {/* Age Range Section */}
        <Text style={styles.sectionHeader}>AGE RANGE</Text>
        <View style={styles.card} onLayout={handleSliderContainerLayout}>
          <Text
            style={styles.valueDisplay}
            accessibilityLabel={`Age range: ${localMinAge} to ${localMaxAge}`}>
            {localMinAge} — {localMaxAge}
          </Text>
          <View style={styles.sliderContainer}>
            <MultiSlider
              values={[localMinAge, localMaxAge]}
              min={18}
              max={99}
              step={1}
              sliderLength={sliderLength > 0 ? sliderLength : 280}
              enabledTwo
              snapped
              isMarkersSeparated
              onValuesChange={handleAgeValuesChange}
              onValuesChangeFinish={handleAgeValuesChangeFinish}
              selectedStyle={styles.selectedTrack}
              unselectedStyle={styles.unselectedTrack}
              containerStyle={styles.multiSliderContainer}
              trackStyle={styles.track}
              customMarkerLeft={CustomMarker}
              customMarkerRight={CustomMarker}
              enableLabel
              customLabel={AgeLabel}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>18</Text>
            <Text style={styles.sliderLabel}>99</Text>
          </View>
        </View>

        {/* Gender Section */}
        <Text style={styles.sectionHeader}>INTERESTED IN</Text>
        <View style={styles.card}>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map(g => (
              <Chip
                key={g.label}
                label={g.label}
                selected={prefGender === g.value}
                onPress={() => setPrefGender(g.value)}
              />
            ))}
          </View>
        </View>

        {/* Distance Section */}
        <Text style={styles.sectionHeader}>MAXIMUM DISTANCE</Text>
        <View style={styles.card}>
          <Text
            style={styles.valueDisplay}
            accessibilityLabel={`Maximum distance: ${localDistance} kilometers`}>
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
              customMarker={CustomMarker}
              enableLabel
              customLabel={DistanceLabel}
            />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>5 km</Text>
            <Text style={styles.sliderLabel}>200 km</Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <GradientButton
            title="Save Preferences"
            onPress={handleSave}
            loading={prefsMutation.isPending}
            disabled={!hasChanges}
          />
        </View>
      </ScrollView>

      {/* Toast notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            toastType === 'success' ? styles.toastSuccess : styles.toastError,
            {opacity: toastOpacity},
          ]}
          pointerEvents="none">
          <Icon
            name={toastType === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={22}
            color={colors.white}
          />
          <Text style={styles.toastText}>
            {toastType === 'success'
              ? 'Preferences saved successfully'
              : 'Failed to save preferences'}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const createMarkerStyles = (c: ThemeColors) => StyleSheet.create({
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  contentContainer: {
    paddingBottom: spacing['2xl'],
  },
  sectionHeader: {
    ...typography.footnote,
    color: c.textSecondary,
    textTransform: 'uppercase',
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  card: {
    backgroundColor: c.surface,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
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
  sliderLabel: {
    ...typography.caption1,
    color: c.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  saveContainer: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.base,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: c.success,
  },
  toastError: {
    backgroundColor: c.error,
  },
  toastText: {
    ...typography.subhead,
    color: c.white,
    fontWeight: '600',
    flex: 1,
  },
});
