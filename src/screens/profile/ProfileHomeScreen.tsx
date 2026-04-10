import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, {Polygon, Line, Circle, Text as SvgText} from 'react-native-svg';
import {Avatar} from '../../components/ui/Avatar';
import {Badge} from '../../components/ui/Badge';
import {ProfileSkeleton} from '../../components/ui/SkeletonScreens';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {useAuthStore} from '../../stores/authStore';
import {profileService} from '../../services/profile';
import {interestsService} from '../../services/interests';
import {photosService} from '../../services/photos';
import {kycService} from '../../services/kyc';
import {assessmentService} from '../../services/assessment';
import type {ProfileStackParamList} from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authService} from '../../services/auth';
import {useChatStore} from '../../stores/chatStore';
import {useOnboardingStore} from '../../stores/onboardingStore';
import {notificationService} from '../../services/notifications';
import {api} from '../../services/api';

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ProfileHome'
>;

const MenuItem: React.FC<{
  title: string;
  iconName: string;
  iconBg: string;
  onPress: () => void;
  colors: ThemeColors;
  menuStyles: ReturnType<typeof createStyles>;
}> = ({title, iconName, iconBg, onPress, colors, menuStyles}) => (
  <TouchableOpacity
    style={menuStyles.menuItem}
    onPress={onPress}
    activeOpacity={0.6}
    accessibilityRole="button"
    accessibilityLabel={title}>
    <View style={[menuStyles.menuIconCircle, {backgroundColor: iconBg}]}>
      <Icon name={iconName} size={20} color={colors.white} />
    </View>
    <Text style={menuStyles.menuTitle}>{title}</Text>
    <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
  </TouchableOpacity>
);

export const ProfileHomeScreen: React.FC = () => {
  const {colors, isDark, toggleTheme} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NavigationProp>();
  const {profile, setProfile} = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getMe,
    staleTime: 2 * 60 * 1000, // 2 min
  });

  const interestsQuery = useQuery({
    queryKey: ['myInterests'],
    queryFn: interestsService.getMyInterests,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  const photosQuery = useQuery({
    queryKey: ['myPhotos'],
    queryFn: photosService.getMyPhotos,
    staleTime: 10 * 60 * 1000,
  });

  const kycQuery = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
    staleTime: 10 * 60 * 1000,
  });

  const traitsQuery = useQuery({
    queryKey: ['preferredTraits'],
    queryFn: assessmentService.getPreferredTraits,
    staleTime: 10 * 60 * 1000,
  });

  // Only refetch profile on focus — other data rarely changes
  useFocusEffect(
    useCallback(() => {
      profileQuery.refetch();
    }, []),
  );

  const onRefresh = () => {
    profileQuery.refetch();
    interestsQuery.refetch();
    photosQuery.refetch();
    kycQuery.refetch();
    traitsQuery.refetch(); // preferredTraits
  };

  const currentProfile = profileQuery.data || profile;
  const interestsCount = interestsQuery.data?.length ?? 0;
  const photosCount =
    photosQuery.data?.filter((p): p is string => !!p && p.length > 0).length ??
    0;
  const kycStatus = kycQuery.data?.status ?? 'unverified';
  const traitScores =
    traitsQuery.data?.filter(t => t.score !== null && t.score !== undefined) ??
    [];

  const kycVariant =
    kycStatus === 'verified'
      ? 'success'
      : kycStatus === 'pending'
        ? 'warning'
        : 'error';

  const queryClient = useQueryClient();

  // Memoize radar chart — heavy SVG math only recomputes when traitScores or colors change
  const radarChart = useMemo(() => {
    if (traitScores.length === 0) return null;

    const n = traitScores.length;
    const SIZE = 400;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const RADIUS = 85;
    const LABEL_RADIUS = RADIUS + 28;
    const GRID_LEVELS = 4;

    const getPoint = (i: number, value: number) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x: CX + Math.cos(angle) * RADIUS * value,
        y: CY + Math.sin(angle) * RADIUS * value,
      };
    };

    const dataPoints = traitScores.map((t, i) => {
      const val = Math.max(t.score ?? 0, 0.05);
      return getPoint(i, val);
    });
    const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    const gridPolygons = Array.from({length: GRID_LEVELS}, (_, level) => {
      const frac = (level + 1) / GRID_LEVELS;
      return Array.from({length: n}, (__, i) => {
        const p = getPoint(i, frac);
        return `${p.x},${p.y}`;
      }).join(' ');
    });

    const SHORT_NAMES: Record<string, string> = {
      'Warmth / Compassion': 'Warmth',
      'Honesty-Humility': 'Honesty',
      'Attachment Anxiety': 'Attach. Anxiety',
      'Attachment Avoidance': 'Attach. Avoidance',
      'Openness — Aesthetic / Experiential': 'Openness',
      'Repair Orientation': 'Repair Orient.',
      'Autonomy / Boundary Respect': 'Autonomy',
      'Communication Clarity / Directness': 'Communication',
      'Reliability / Dependability in Dyad': 'Reliability',
      'Exclusivity Preference': 'Exclusivity',
    };

    const labels = traitScores.map((t, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const x = CX + cosA * LABEL_RADIUS;
      const y = CY + sinA * LABEL_RADIUS;
      const score = Math.round((t.score ?? 0) * 100);
      const shortName = SHORT_NAMES[t.name] || (t.name.length > 16 ? t.name.slice(0, 14) + '…' : t.name);
      let anchor: 'start' | 'middle' | 'end' = 'middle';
      if (cosA > 0.3) anchor = 'start';
      else if (cosA < -0.3) anchor = 'end';
      const clampedX = Math.max(55, Math.min(SIZE - 55, x));
      return {x: clampedX, y, shortName, score, anchor};
    });

    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PREFERRED PERSONALITY</Text>
        <Text style={styles.sectionSubheader}>
          What you're looking for in a partner
        </Text>
        <View style={styles.radarCard}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {gridPolygons.map((pts, idx) => (
              <Polygon key={`grid-${idx}`} points={pts} fill="none" stroke={colors.separator} strokeWidth={1} />
            ))}
            {traitScores.map((_, i) => {
              const p = getPoint(i, 1);
              return <Line key={`axis-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={colors.separatorLight} strokeWidth={1} />;
            })}
            <Polygon points={dataPolygon} fill={colors.primaryMuted} stroke={colors.primary} strokeWidth={2} />
            {dataPoints.map((p, i) => (
              <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3.5} fill={colors.primary} />
            ))}
            {labels.map((l, i) => (
              <React.Fragment key={`label-${i}`}>
                <SvgText x={l.x} y={l.y - 4} fill={colors.textSecondary} fontSize={10} fontWeight="400" textAnchor={l.anchor}>{l.shortName}</SvgText>
                <SvgText x={l.x} y={l.y + 10} fill={colors.primary} fontSize={11} fontWeight="700" textAnchor={l.anchor}>{l.score}</SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>
      </View>
    );
  }, [traitScores, colors, styles]);

  const handleSignOut = async () => {
    // Unregister FCM token before signing out
    await notificationService.unregisterToken().catch(() => {});
    // Clear cached API token
    api.clearTokenCache();
    // Sign out from Supabase (clears session token)
    await authService.signOut();
    // Clear all cached server data
    queryClient.clear();
    // Clear Zustand stores
    useAuthStore.getState().logout();
    useChatStore.getState().clear();
    useOnboardingStore.getState().reset();
    // Clear all AsyncStorage (Supabase session, any cached data)
    await AsyncStorage.clear();
  };

  // Show skeleton only on initial load (not refetch)
  if (profileQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          {/* Gradient accent line at top */}
          <LinearGradient
            colors={[colors.gradient.end, colors.gradient.start]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientAccent}
          />

          <Avatar name={currentProfile?.full_name || 'User'} size={88} />
          <Text
            style={styles.name}
            accessibilityRole="header"
            accessibilityLabel={`Profile name: ${currentProfile?.full_name}`}>
            {currentProfile?.full_name}
          </Text>

          {/* Info Chips Row */}
          <View style={styles.chipsRow}>
            {currentProfile?.age != null && (
              <View
                style={styles.infoChip}
                accessibilityLabel={`Age: ${currentProfile.age}`}>
                <Icon
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.chipText}>{currentProfile.age} yrs</Text>
              </View>
            )}
            {currentProfile?.gender != null && (
              <View
                style={styles.infoChip}
                accessibilityLabel={`Gender: ${currentProfile.gender}`}>
                <Icon
                  name="person-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.chipText}>{currentProfile.gender}</Text>
              </View>
            )}
            {currentProfile?.location_label != null && (
              <View
                style={styles.infoChip}
                accessibilityLabel={`Location: ${currentProfile.location_label}`}>
                <Icon
                  name="location-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.chipText}>
                  {currentProfile.location_label}
                </Text>
              </View>
            )}
          </View>

          <Badge
            label={
              kycStatus === 'verified'
                ? 'Verified'
                : kycStatus === 'pending'
                  ? 'Pending'
                  : 'Unverified'
            }
            variant={kycVariant}
            style={styles.badge}
          />
        </View>

        {/* Menu Section */}
        <View style={styles.menuCard}>
          <MenuItem
            title="My Location"
            iconName="location-outline"
            iconBg="#FF9500"
            onPress={() => navigation.navigate('Location')}
            colors={colors}
            menuStyles={styles}
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            title="Match Preferences"
            iconName="heart-outline"
            iconBg="#FF6B8A"
            onPress={() => navigation.navigate('Preferences')}
            colors={colors}
            menuStyles={styles}
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            title="My Interests"
            iconName="sparkles-outline"
            iconBg="#8B5CF6"
            onPress={() => navigation.navigate('Interests')}
            colors={colors}
            menuStyles={styles}
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            title="My Photos"
            iconName="images-outline"
            iconBg="#007AFF"
            onPress={() => navigation.navigate('Gallery')}
            colors={colors}
            menuStyles={styles}
          />
          <View style={styles.menuSeparator} />
          <MenuItem
            title="Verification"
            iconName="shield-checkmark-outline"
            iconBg="#34C759"
            onPress={() => navigation.navigate('Verification')}
            colors={colors}
            menuStyles={styles}
          />
        </View>

        {/* Preferred Personality — Radar Chart */}
        {radarChart}

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>APPEARANCE</Text>
          <View style={styles.accountCard}>
            <TouchableOpacity
              style={styles.accountRow}
              onPress={toggleTheme}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
              <View style={styles.accountIconCircle}>
                <Icon
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.accountRowText}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
              <Icon
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.accountCard}>
            <TouchableOpacity
              style={styles.accountRow}
              onPress={handleSignOut}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Sign out of your account">
              <View style={styles.accountIconCircle}>
                <Icon name="log-out-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.accountRowText}>Sign Out</Text>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.menuSeparator} />
            <TouchableOpacity
              style={styles.accountRow}
              onPress={() => navigation.navigate('DeleteAccount')}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Delete your account">
              <View style={styles.accountIconCircle}>
                <Icon name="trash-outline" size={20} color={colors.error} />
              </View>
              <Text style={[styles.accountRowText, {color: colors.error}]}>
                Delete Account
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
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
  contentContainer: {
    paddingBottom: spacing['2xl'],
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: c.surface,
    paddingTop: spacing.xl + 3,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: c.borderGlass,
    overflow: 'hidden',
  },
  gradientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  name: {
    ...typography.title1,
    color: c.textPrimary,
    marginTop: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.fillTertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  chipText: {
    ...typography.footnote,
    color: c.textSecondary,
  },
  badge: {
    marginTop: spacing.md,
  },
  menuCard: {
    backgroundColor: c.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: c.borderGlass,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  menuIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTitle: {
    ...typography.body,
    color: c.textPrimary,
    flex: 1,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.separatorLight,
    marginLeft: 58,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    ...typography.footnote,
    color: c.textSecondary,
    textTransform: 'uppercase',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  sectionSubheader: {
    ...typography.caption1,
    color: c.textTertiary,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  radarCard: {
    backgroundColor: c.surface,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: c.borderGlass,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  accountCard: {
    backgroundColor: c.surface,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: c.borderGlass,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  accountIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: c.fillTertiary,
  },
  accountRowText: {
    ...typography.body,
    color: c.textPrimary,
    flex: 1,
  },
});
