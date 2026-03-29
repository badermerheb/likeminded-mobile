import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {GradientButton} from '../../components/ui/GradientButton';
import {ProgressBar} from '../../components/ui/ProgressBar';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {useOnboardingStore} from '../../stores/onboardingStore';
import {profileService} from '../../services/profile';
import type {CityOut} from '../../types/api';
import type {OnboardingStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'OnboardingLocation'
>;

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export const OnboardingLocation: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {country, locationId, setLocationId, setLocation} =
    useOnboardingStore();
  const [cities, setCities] = useState<CityOut[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await profileService.getCities(country);
        const sorted = [...data].sort((a, b) =>
          a.city.localeCompare(b.city),
        );
        setCities(sorted);
      } catch {
        setError('Failed to load cities');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [country]);

  const filteredCities = search.trim()
    ? cities.filter(c =>
        c.city.toLowerCase().includes(search.toLowerCase()),
      )
    : cities;

  const selectedCity = cities.find(c => c.id === locationId);

  const handleSelectCity = (city: CityOut) => {
    setLocationId(city.id);
    setLocation(city.id, city.city);
    setError('');
    setSearch('');
    setShowModal(false);
  };

  const handleNext = () => {
    if (!locationId) {
      setError('Please select your city');
      return;
    }
    navigation.navigate('OnboardingPreferences');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Progress */}
        <ProgressBar progress={2 / 3} style={styles.progress} />
        <Text
          style={styles.stepLabel}
          accessibilityLabel="Step 2 of 3">
          Step 2 of 3
        </Text>

        {/* Header */}
        <Text style={styles.title}>Where are you located?</Text>
        <Text style={styles.subtitle}>
          We'll use this to find matches near you
        </Text>

        {/* Location Card */}
        <View style={styles.card}>
          {/* Country Row */}
          <View style={styles.cardRow}>
            <Text style={styles.cardRowLabel}>Country</Text>
            <View style={styles.cardRowValue}>
              <Icon name="location-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.cardRowText}>{country}</Text>
            </View>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* City Row */}
          <TouchableOpacity
            style={styles.cardRow}
            onPress={() => setShowModal(true)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={
              selectedCity
                ? `City: ${selectedCity.city}. Tap to change.`
                : 'Select your city'
            }>
            <Text style={styles.cardRowLabel}>City</Text>
            <View style={styles.cardRowValue}>
              <Text
                style={[
                  styles.cardRowText,
                  !selectedCity && styles.cardRowPlaceholder,
                ]}>
                {selectedCity ? selectedCity.city : 'Select your city'}
              </Text>
              <Icon
                name="chevron-forward"
                size={18}
                color={colors.textTertiary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        {/* City Selection Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalSafeArea} edges={['bottom']}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderSpacer} />
                  <Text style={styles.modalTitle}>Select City</Text>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityRole="button"
                    accessibilityLabel="Done">
                    <Text style={styles.modalDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Icon
                    name="search"
                    size={18}
                    color={colors.textTertiary}
                  />
                  <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search cities..."
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                    accessibilityLabel="Search cities"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearch('')}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search">
                      <Icon
                        name="close-circle"
                        size={18}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* City List */}
                {loadingCities ? (
                  <ActivityIndicator
                    color={colors.primary}
                    style={styles.loadingIndicator}
                  />
                ) : (
                  <FlatList
                    data={filteredCities}
                    keyExtractor={item => String(item.id)}
                    showsVerticalScrollIndicator={false}
                    style={styles.cityList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({item}) => {
                      const isActive = item.id === locationId;
                      return (
                        <TouchableOpacity
                          style={styles.cityRow}
                          onPress={() => handleSelectCity(item)}
                          activeOpacity={0.6}
                          accessibilityRole="radio"
                          accessibilityLabel={item.city}
                          accessibilityState={{selected: isActive}}>
                          <View style={styles.cityInfo}>
                            <Text
                              style={[
                                styles.cityName,
                                isActive && styles.cityNameActive,
                              ]}>
                              {item.city}
                            </Text>
                            {item.admin_name && (
                              <Text style={styles.cityAdmin}>
                                {item.admin_name}
                              </Text>
                            )}
                          </View>
                          {isActive && (
                            <Icon
                              name="checkmark-circle"
                              size={22}
                              color={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                    ItemSeparatorComponent={() => (
                      <View style={styles.listSeparator} />
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>No cities found</Text>
                    }
                  />
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>

      <View style={styles.footer}>
        <GradientButton
          title="Continue"
          onPress={handleNext}
          disabled={!locationId}
          accessibilityLabel="Continue to next step"
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
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borderGlass,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      minHeight: 44,
      paddingVertical: spacing.md,
    },
    cardRowLabel: {
      ...typography.body,
      color: c.textPrimary,
    },
    cardRowValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    countryIcon: {
      marginRight: 0,
    },
    cardRowText: {
      ...typography.body,
      color: c.textSecondary,
    },
    cardRowPlaceholder: {
      color: c.textTertiary,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separatorLight,
      marginLeft: spacing.base,
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

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    modalSafeArea: {
      maxHeight: SCREEN_HEIGHT * 0.8,
    },
    modalContent: {
      backgroundColor: c.surfaceSolid,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      maxHeight: SCREEN_HEIGHT * 0.8,
      paddingBottom: spacing.base,
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.separatorLight,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.sm,
    },
    modalHeaderSpacer: {
      width: 50,
    },
    modalTitle: {
      ...typography.headline,
      color: c.textPrimary,
      textAlign: 'center',
      flex: 1,
    },
    modalDoneText: {
      ...typography.body,
      color: c.primary,
      fontWeight: '600',
      width: 50,
      textAlign: 'right',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.fillTertiary,
      marginHorizontal: spacing.base,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.sm,
      height: 44,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: c.textPrimary,
      padding: 0,
    },
    loadingIndicator: {
      marginTop: spacing.xl,
    },
    cityList: {
      marginTop: spacing.sm,
    },
    cityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.base,
      minHeight: 44,
    },
    cityInfo: {
      flex: 1,
    },
    cityName: {
      ...typography.body,
      color: c.textPrimary,
    },
    cityNameActive: {
      color: c.primary,
      fontWeight: '600',
    },
    cityAdmin: {
      ...typography.footnote,
      color: c.textTertiary,
      marginTop: 2,
    },
    listSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separatorLight,
      marginLeft: spacing.base,
    },
    emptyText: {
      ...typography.body,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
