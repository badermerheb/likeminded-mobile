import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {Chip} from '../../components/ui/Chip';
import {GradientButton} from '../../components/ui/GradientButton';
import {LoadingSpinner} from '../../components/ui/LoadingSpinner';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {interestsService} from '../../services/interests';
import type {InterestOut} from '../../types/api';

export const InterestsScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setSearch(text);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const allInterestsQuery = useQuery({
    queryKey: ['allInterests'],
    queryFn: interestsService.getAllInterests,
  });

  const myInterestsQuery = useQuery({
    queryKey: ['myInterests'],
    queryFn: interestsService.getMyInterests,
  });

  useEffect(() => {
    if (myInterestsQuery.data) {
      const names = new Set(myInterestsQuery.data.map(i => i.name));
      setSelectedNames(names);
      setSavedNames(new Set(names));
    }
  }, [myInterestsQuery.data]);

  const isDirty = useMemo(() => {
    if (selectedNames.size !== savedNames.size) return true;
    for (const name of selectedNames) {
      if (!savedNames.has(name)) return true;
    }
    return false;
  }, [selectedNames, savedNames]);

  const categories = useMemo(() => {
    if (!allInterestsQuery.data) return [];
    const cats = new Set(allInterestsQuery.data.map(i => i.category || 'Other'));
    return Array.from(cats).sort();
  }, [allInterestsQuery.data]);

  const filteredInterests = useMemo(() => {
    if (!allInterestsQuery.data) return [];
    let filtered = allInterestsQuery.data;
    if (activeCategory) {
      filtered = filtered.filter(
        i => (i.category || 'Other') === activeCategory,
      );
    }
    if (search.trim()) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return filtered;
  }, [allInterestsQuery.data, activeCategory, search]);

  const saveMutation = useMutation({
    mutationFn: () =>
      interestsService.updateMyInterests(
        Array.from(selectedNames).map(name => ({name})),
      ),
    onSuccess: () => {
      setSavedNames(new Set(selectedNames));
      queryClient.invalidateQueries({queryKey: ['myInterests']});
      Alert.alert('Saved', 'Your interests have been updated.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save interests.');
    },
  });

  const toggleInterest = (name: string) => {
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  if (allInterestsQuery.isLoading) {
    return <LoadingSpinner fullScreen message="Loading interests..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon
              name="search"
              size={18}
              color={colors.textTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={handleSearchChange}
              placeholder="Search interests..."
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Search interests"
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput('');
                  setSearch('');
                  if (searchTimerRef.current) {
                    clearTimeout(searchTimerRef.current);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Icon name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}>
          <TouchableOpacity
            onPress={() => setActiveCategory(null)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Show all categories"
            accessibilityState={{selected: !activeCategory}}>
            {!activeCategory ? (
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.categoryTab}>
                <Text style={styles.categoryTextActive}>All</Text>
              </LinearGradient>
            ) : (
              <View style={styles.categoryTabInactive}>
                <Text style={styles.categoryText}>All</Text>
              </View>
            )}
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${cat}`}
              accessibilityState={{selected: activeCategory === cat}}>
              {activeCategory === cat ? (
                <LinearGradient
                  colors={[colors.gradient.start, colors.gradient.end]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.categoryTab}>
                  <Text style={styles.categoryTextActive}>{cat}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.categoryTabInactive}>
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Count */}
        <Text style={styles.countText}>
          {selectedNames.size} interest{selectedNames.size !== 1 ? 's' : ''}{' '}
          selected
        </Text>

        {/* Interests Grid */}
        <ScrollView
          style={styles.interestsList}
          showsVerticalScrollIndicator={false}>
          <View style={styles.chipCard}>
            <View style={styles.chipGrid}>
              {filteredInterests.map(interest => (
                <Chip
                  key={interest.id}
                  label={interest.name}
                  selected={selectedNames.has(interest.name)}
                  onPress={() => toggleInterest(interest.name)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <GradientButton
            title={`Save ${selectedNames.size} Interest${selectedNames.size !== 1 ? 's' : ''}`}
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={selectedNames.size === 0 || !isDirty}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.fill,
    borderRadius: borderRadius.sm,
    height: 44,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: c.textPrimary,
    height: 44,
    padding: 0,
  },
  categoryScroll: {
    maxHeight: 52,
  },
  categoryContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabInactive: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: c.surfaceTertiary,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    ...typography.subhead,
    color: c.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    ...typography.subhead,
    color: c.white,
    fontWeight: '600',
  },
  countText: {
    ...typography.footnote,
    color: c.textTertiary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
  },
  interestsList: {
    flex: 1,
    paddingHorizontal: spacing.base,
  },
  chipCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    padding: spacing.base,
    backgroundColor: c.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separatorLight,
  },
});
