import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {GradientButton} from '../../components/ui/GradientButton';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {profileService} from '../../services/profile';
import {useAuthStore} from '../../stores/authStore';
import type {CityOut} from '../../types/api';

export const LocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const {profile} = useAuthStore();
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cities, setCities] = useState<CityOut[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCities, setLoadingCities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(
    profile?.location_id ?? null,
  );

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await profileService.getCities('Lebanon');
        const sorted = [...data].sort((a, b) => a.city.localeCompare(b.city));
        setCities(sorted);
      } catch {
        Alert.alert('Error', 'Failed to load cities');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const filteredCities = search.trim()
    ? cities.filter(c => c.city.toLowerCase().includes(search.toLowerCase()))
    : cities;

  const selectedCity = cities.find(c => c.id === selectedId);
  const hasChanged = selectedId !== profile?.location_id;

  const handleSave = async () => {
    if (!selectedId || !hasChanged) return;
    setSaving(true);
    try {
      const updated = await profileService.updateLocation({
        age: profile?.age ?? 18,
        location_id: selectedId,
      });
      useAuthStore.getState().setProfile(updated);
      queryClient.invalidateQueries({queryKey: ['profile']});
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}>
      {/* Current Location */}
      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>Current Location</Text>
        <View style={styles.currentValue}>
          <Icon name="location" size={18} color={colors.primary} />
          <Text style={styles.currentText}>
            {selectedCity?.city ?? profile?.location_label ?? 'Not set'}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search cities..."
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Search cities"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
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
            const isActive = item.id === selectedId;
            return (
              <TouchableOpacity
                style={styles.cityRow}
                onPress={() => setSelectedId(item.id)}
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
                    <Text style={styles.cityAdmin}>{item.admin_name}</Text>
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
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No cities found</Text>
          }
        />
      )}

      {/* Save Button */}
      <View style={styles.footer}>
        <GradientButton
          title="Save Location"
          onPress={handleSave}
          disabled={!hasChanged || saving}
          loading={saving}
          accessibilityLabel="Save location"
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
    currentCard: {
      backgroundColor: c.surface,
      marginHorizontal: spacing.base,
      marginTop: spacing.base,
      marginBottom: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.borderGlass,
      padding: spacing.base,
    },
    currentLabel: {
      ...typography.footnote,
      color: c.textSecondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    currentValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    currentText: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '600',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceInput,
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
      flex: 1,
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
    footer: {
      paddingHorizontal: spacing.base,
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.separatorLight,
    },
  });
