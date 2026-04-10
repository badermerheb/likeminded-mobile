import React, {useCallback, useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import {Avatar} from '../../components/ui/Avatar';
import {GradientButton} from '../../components/ui/GradientButton';
import {LoadingSpinner} from '../../components/ui/LoadingSpinner';
import {ProgressBar} from '../../components/ui/ProgressBar';
import {IconCircle} from '../../components/ui/IconCircle';
import {MatchesSkeleton} from '../../components/ui/SkeletonScreens';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {useAuthStore} from '../../stores/authStore';
import {conversationsService} from '../../services/conversations';
import {matchingService} from '../../services/matching';
import {interestsService} from '../../services/interests';
import {photosService} from '../../services/photos';
import {kycService} from '../../services/kyc';
import {assessmentService} from '../../services/assessment';
import {eventsService} from '../../services/events';
import LinearGradient from 'react-native-linear-gradient';
import {formatRelativeTime, truncateText} from '../../utils/formatters';
import type {ConversationOut, MatchResult} from '../../types/api';
import type {MatchesStackParamList} from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<
  MatchesStackParamList,
  'MatchesHome'
>;

export const MatchesHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const {profile} = useAuthStore();
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [matchResult, setMatchResult] = useState<{conversationId: string} | null>(null);

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationsService.list,
    staleTime: 30 * 1000, // conversations change often — 30s
  });

  // Use backend matching/status endpoint - it checks events table for assessment_completed
  const matchingStatusQuery = useQuery({
    queryKey: ['matchingStatus'],
    queryFn: matchingService.getStatus,
    staleTime: 2 * 60 * 1000, // 2 min
  });

  const interestsQuery = useQuery({
    queryKey: ['myInterests'],
    queryFn: interestsService.getMyInterests,
    staleTime: 10 * 60 * 1000, // rarely changes — 10 min
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
    queryKey: ['traits'],
    queryFn: assessmentService.getTraits,
    staleTime: 10 * 60 * 1000,
  });

  // Only refetch conversations on focus (the data that actually changes)
  useFocusEffect(
    useCallback(() => {
      conversationsQuery.refetch();
    }, []),
  );

  const generateMutation = useMutation({
    mutationFn: matchingService.generateMatch,
    onSuccess: (data: MatchResult) => {
      queryClient.invalidateQueries({queryKey: ['conversations']});
      // Log match_shown event for admin visibility
      eventsService.track('match_shown', {
        properties: {status: data.status},
        ...(data.status === 'matched'
          ? {conversation_id: data.conversation_id}
          : {}),
      });
      if (data.status === 'matched') {
        setMatchResult({conversationId: data.conversation_id});
      } else if (data.status === 'no_match') {
        Alert.alert(
          'No Match Found',
          'No compatible matches available right now. Try again later!',
        );
      } else if (data.status === 'ineligible') {
        Alert.alert('Not Eligible', data.reason);
      }
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.detail || 'Failed to generate match.',
      );
    },
  });

  // Check requirements - prefer backend matching/status checks (uses events table)
  const statusChecks = (matchingStatusQuery.data as any)?.checks;
  const isVerified =
    statusChecks?.verified ?? (profile?.verified || kycQuery.data?.status === 'verified');
  const hasInterests = statusChecks?.has_interest ?? ((interestsQuery.data?.length ?? 0) > 0);
  const photosCount = statusChecks?.photos_count ??
    (photosQuery.data?.filter((p): p is string => !!p && p.length > 0).length ?? 0);
  const hasPhotos = statusChecks?.has_photos ?? (photosCount >= 3);
  // Use backend event-based check for assessment (checks events table for assessment_completed)
  const hasAssessment = statusChecks?.assessment_completed ??
    (traitsQuery.data?.some(t => t.score !== null && t.score !== undefined) ?? false);

  const isReady = isVerified && hasInterests && hasPhotos && hasAssessment;

  const conversations = conversationsQuery.data ?? [];
  const activeConversations = conversations.filter(
    (c: any) => c.status !== 'ended' && c.status !== 'closed',
  );
  const MAX_ACTIVE_CHATS = 3;
  const hasMaxChats = activeConversations.length >= MAX_ACTIVE_CHATS;

  // ── 24hr Cooldown (matching web logic) ──
  // Uses next_eligible_ts_utc from /matching/status (same as web)
  const [countdown, setCountdown] = useState('');
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const matchAllowed = !!(matchingStatusQuery.data as any)?.eligible;

  useEffect(() => {
    const statusData = matchingStatusQuery.data as any;
    const nextEligible = statusData?.next_eligible_ts_utc;
    const cooldownUntil = statusData?.cooldown_until;

    // Try next_eligible_ts_utc first (web pattern), then cooldown_until
    const rawTimestamp = nextEligible || cooldownUntil;
    if (!rawTimestamp) {
      setCountdown('');
      setIsOnCooldown(false);
      return;
    }

    const cooldownEnd = new Date(rawTimestamp).getTime();
    if (isNaN(cooldownEnd) || cooldownEnd <= Date.now()) {
      setCountdown('');
      setIsOnCooldown(false);
      return;
    }

    const calcRemaining = () => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCountdown('');
        setIsOnCooldown(false);
        return;
      }
      setIsOnCooldown(true);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    calcRemaining();
    const timer = setInterval(calcRemaining, 1000); // 1s tick like web
    return () => clearInterval(timer);
  }, [matchingStatusQuery.data]);

  // ── Match finding animation (rotating phrases like web) ──
  const MATCH_PHRASES = [
    {title: 'Curating your match...', sub: 'Warming up signals'},
    {title: 'Scanning compatibility...', sub: 'Personality, interests, intent'},
    {title: 'Ranking the best fit...', sub: 'Quality-first, not quantity'},
    {title: 'Finalizing...', sub: 'Creating your conversation thread'},
    {title: 'Almost there...', sub: 'One last pass for accuracy'},
  ];
  const [matchPhraseIndex, setMatchPhraseIndex] = useState(0);

  const heartScale = useSharedValue(1);

  useEffect(() => {
    if (generateMutation.isPending) {
      heartScale.value = withRepeat(
        withSequence(
          withTiming(1.3, {duration: 500}),
          withTiming(1, {duration: 500}),
        ),
        -1,
        false,
      );
      // Rotate phrases every 900ms (same as web)
      const phraseTimer = setInterval(() => {
        setMatchPhraseIndex(i => (i + 1) % MATCH_PHRASES.length);
      }, 900);
      return () => clearInterval(phraseTimer);
    } else {
      heartScale.value = withTiming(1, {duration: 200});
      setMatchPhraseIndex(0);
    }
  }, [generateMutation.isPending]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: heartScale.value}],
  }));

  const currentPhrase = MATCH_PHRASES[matchPhraseIndex];

  const onRefresh = () => {
    conversationsQuery.refetch();
  };

  // Count completed requirements for progress
  const completedCount = [isVerified, hasAssessment, hasInterests, hasPhotos].filter(Boolean).length;

  const renderConversation = ({item}: {item: ConversationOut}) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => {
        eventsService.track('match_opened', {
          conversation_id: item.id,
        });
        navigation.navigate('Conversation', {
          conversationId: item.id,
          partnerName: item.partnerName,
        });
      }}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${item.partnerName}${item.unread > 0 ? `, ${item.unread} unread messages` : ''}`}>
      <Avatar name={item.partnerName} size={52} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.partnerName} numberOfLines={1}>
            {item.partnerName}
          </Text>
          {item.lastAt && (
            <Text style={styles.time}>{formatRelativeTime(item.lastAt)}</Text>
          )}
        </View>
        <View style={styles.conversationBottom}>
          <Text
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}>
            {item.lastMessage
              ? truncateText(item.lastMessage, 40)
              : 'Start a conversation...'}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
        {/* Compatibility % removed for cleaner UI */}
      </View>
      <Icon
        name="chevron-forward"
        size={18}
        color={colors.textTertiary}
        style={{marginLeft: spacing.sm}}
      />
    </TouchableOpacity>
  );

  // ── Skeleton loading ──
  if (conversationsQuery.isLoading || matchingStatusQuery.isLoading) {
    return <MatchesSkeleton />;
  }

  // Locked State
  if (!isReady) {
    const requirements = [
      {
        key: 'verification',
        iconName: 'shield-checkmark',
        iconColor: colors.secondary,
        title: 'Account Verification',
        description: 'Verify your identity to build trust',
        completed: !!isVerified,
        onPress: !isVerified
          ? () => navigation.getParent()?.navigate('ProfileTab', {screen: 'Verification', initial: false})
          : undefined,
      },
      {
        key: 'assessment',
        iconName: 'chatbubble-ellipses',
        iconColor: colors.primary,
        title: 'Personality Assessment',
        description: 'Complete the assessment for better matches',
        completed: hasAssessment,
        onPress: !hasAssessment
          ? () => navigation.getParent()?.navigate('AssessmentTab', {screen: 'AssessmentHome'})
          : undefined,
      },
      {
        key: 'interests',
        iconName: 'heart',
        iconColor: colors.warning,
        title: 'Select Interests',
        description: 'Choose at least one interest',
        completed: hasInterests,
        onPress: !hasInterests
          ? () => navigation.getParent()?.navigate('ProfileTab', {screen: 'Interests', initial: false})
          : undefined,
      },
      {
        key: 'photos',
        iconName: 'images',
        iconColor: colors.info,
        title: 'Upload 3 Photos',
        description: `${photosCount}/3 photos uploaded`,
        completed: hasPhotos,
        onPress: !hasPhotos
          ? () => navigation.getParent()?.navigate('ProfileTab', {screen: 'Gallery', initial: false})
          : undefined,
      },
    ];

    return (
      <View style={styles.lockedContainer}>
        {/* Large Title */}
        <Text style={styles.largeTitle}>Matches</Text>
        <Text style={styles.lockedSubtitle}>
          Complete these steps to start matching
        </Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {completedCount} of 4 complete
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round((completedCount / 4) * 100)}%
            </Text>
          </View>
          <ProgressBar progress={completedCount / 4} height={8} />
        </View>

        {/* Requirements in grouped card */}
        <View style={styles.groupedCard}>
          {requirements.map((req, index) => {
            const isLast = index === requirements.length - 1;
            const row = (
              <View
                key={req.key}
                style={[
                  styles.reqRow,
                  !isLast && styles.reqRowBorder,
                ]}>
                <View
                  style={[
                    styles.reqIconCircle,
                    {
                      backgroundColor: req.completed
                        ? `${colors.success}15`
                        : `${req.iconColor}15`,
                    },
                  ]}>
                  <Icon
                    name={req.completed ? 'checkmark-circle' : req.iconName}
                    size={22}
                    color={req.completed ? colors.success : req.iconColor}
                  />
                </View>
                <View style={styles.reqContent}>
                  <Text
                    style={[
                      styles.reqTitle,
                      req.completed && styles.reqTitleCompleted,
                    ]}>
                    {req.title}
                  </Text>
                  <Text style={styles.reqDescription}>{req.description}</Text>
                </View>
                {req.completed ? (
                  <Icon name="checkmark-circle" size={22} color={colors.success} />
                ) : (
                  <Icon name="chevron-forward" size={20} color={colors.textTertiary} />
                )}
              </View>
            );

            if (req.onPress) {
              return (
                <TouchableOpacity
                  key={req.key}
                  onPress={req.onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${req.title}, ${req.completed ? 'completed' : 'not completed'}. ${req.description}`}>
                  {row}
                </TouchableOpacity>
              );
            }
            return row;
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Match finding animation overlay (rotating phrases like web) */}
      <Modal
        visible={generateMutation.isPending}
        transparent
        animationType="fade"
        statusBarTranslucent>
        <View style={styles.overlayContainer}>
          <View style={styles.overlayCard}>
            <Animated.View style={heartAnimatedStyle}>
              <Icon name="heart" size={56} color={colors.primary} />
            </Animated.View>
            <Text style={styles.overlayTitle}>{currentPhrase.title}</Text>
            <Text style={styles.overlaySubtitle}>{currentPhrase.sub}</Text>
            {/* Shimmer progress bar (like web) */}
            <View style={styles.overlayProgressTrack}>
              <Animated.View style={styles.overlayProgressFill} />
            </View>
            <Text style={styles.overlayHint}>This usually takes a few seconds.</Text>
          </View>
        </View>
      </Modal>

      {/* Match Found Modal */}
      <Modal
        visible={matchResult !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMatchResult(null)}>
        <View style={styles.overlayContainer}>
          <View style={styles.matchFoundCard}>
            <View style={styles.matchFoundIconCircle}>
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.matchFoundGradientCircle}>
                <Icon name="heart" size={40} color={colors.white} />
              </LinearGradient>
            </View>
            <Text style={styles.matchFoundTitle}>Match Found!</Text>
            <Text style={styles.matchFoundSubtitle}>
              You've been matched with someone compatible. Start chatting to get to know them!
            </Text>
            <TouchableOpacity
              style={styles.matchFoundBtn}
              activeOpacity={0.8}
              onPress={() => {
                const cid = matchResult?.conversationId;
                setMatchResult(null);
                if (cid) {
                  navigation.navigate('Conversation', {
                    conversationId: cid,
                    partnerName: 'Your Match',
                  });
                }
              }}>
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.matchFoundBtnGradient}>
                <Icon name="chatbubble-outline" size={18} color={colors.white} />
                <Text style={styles.matchFoundBtnText}>Start Chatting</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Matches</Text>
      </View>

      {/* Find Match Button */}
      <View style={styles.findMatchContainer}>
        <GradientButton
          title={hasMaxChats ? 'Chat Limit Reached' : isOnCooldown ? `Next match in ${countdown}` : 'Find a Match'}
          onPress={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
          disabled={isOnCooldown || hasMaxChats || !matchAllowed}
          size="large"
          accessibilityLabel={
            hasMaxChats
              ? 'Chat limit reached, maximum 3 active conversations'
              : isOnCooldown
              ? `Find a match, available in ${countdown}`
              : 'Find a new match'
          }
        />
        {isOnCooldown && !hasMaxChats && (
          <Text style={styles.cooldownText}>
            <Icon name="time-outline" size={13} color={colors.textTertiary} />{' '}
            Next match available in {countdown}
          </Text>
        )}
        {hasMaxChats && (
          <View>
            <Text style={styles.cooldownText}>
              <Icon name="chatbubbles-outline" size={13} color={colors.textTertiary} />{' '}
              You can have up to {MAX_ACTIVE_CHATS} active conversations
            </Text>
            <Text style={styles.cooldownHint}>
              End a conversation to be able to match again
            </Text>
          </View>
        )}
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={conversationsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconCircle
              name="chatbubbles-outline"
              size={72}
              gradient
              iconSize={36}
              accessibilityLabel="No conversations"
            />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Find a Match" to discover compatible people
            </Text>
          </View>
        }
      />
    </View>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: c.background,
  },
  largeTitle: {
    ...typography.largeTitle,
    color: c.textPrimary,
  },
  findMatchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: c.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separatorLight,
    minHeight: 72,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partnerName: {
    ...typography.headline,
    color: c.textPrimary,
    flex: 1,
  },
  time: {
    ...typography.caption1,
    color: c.textTertiary,
    marginLeft: spacing.sm,
  },
  conversationBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    ...typography.subhead,
    color: c.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: c.textPrimary,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
    backgroundColor: c.primary,
  },
  unreadText: {
    ...typography.caption2,
    color: c.white,
    fontWeight: '700',
  },
  compatibility: {
    ...typography.caption1,
    color: c.primary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.title3,
    color: c.textPrimary,
  },
  emptySubtitle: {
    ...typography.subhead,
    color: c.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Locked state
  lockedContainer: {
    flex: 1,
    backgroundColor: c.background,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },
  lockedSubtitle: {
    ...typography.subhead,
    color: c.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.footnote,
    color: c.textSecondary,
  },
  progressPercent: {
    ...typography.footnote,
    fontWeight: '600',
    color: c.primary,
  },
  // iOS Grouped Card
  groupedCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: 56,
  },
  reqRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separatorLight,
  },
  reqIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reqContent: {
    flex: 1,
  },
  reqTitle: {
    ...typography.body,
    fontWeight: '500',
    color: c.textPrimary,
  },
  reqTitleCompleted: {
    textDecorationLine: 'line-through',
    color: c.textTertiary,
  },
  reqDescription: {
    ...typography.footnote,
    color: c.textSecondary,
    marginTop: 1,
  },
  // Match finding overlay
  overlayContainer: {
    flex: 1,
    backgroundColor: c.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: c.surfaceSolid,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.borderGlass,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    minWidth: 260,
  },
  overlayTitle: {
    ...typography.title3,
    color: c.textPrimary,
    marginTop: spacing.md,
  },
  overlaySubtitle: {
    ...typography.subhead,
    color: c.textSecondary,
    marginTop: spacing.xs,
  },
  overlayProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: c.fillTertiary,
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  overlayProgressFill: {
    width: '33%',
    height: '100%',
    borderRadius: 3,
    backgroundColor: c.primary,
  },
  overlayHint: {
    ...typography.caption2,
    color: c.textTertiary,
    marginTop: spacing.sm,
  },
  // Cooldown
  cooldownText: {
    ...typography.footnote,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cooldownHint: {
    ...typography.caption1,
    color: c.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Match Found Modal
  matchFoundCard: {
    backgroundColor: c.surfaceSolid,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.borderGlass,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 340,
  },
  matchFoundIconCircle: {
    marginBottom: spacing.lg,
  },
  matchFoundGradientCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchFoundTitle: {
    ...typography.title1,
    color: c.textPrimary,
    marginBottom: spacing.sm,
  },
  matchFoundSubtitle: {
    ...typography.body,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  matchFoundBtn: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
  },
  matchFoundBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: spacing.sm,
  },
  matchFoundBtnText: {
    ...typography.headline,
    color: c.white,
    fontWeight: '700',
  },
});
