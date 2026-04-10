import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
  Modal,
  Animated as RNAnimated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {ConversationSkeleton} from '../../components/ui/SkeletonScreens';
import {conversationsService} from '../../services/conversations';
import {reportsService} from '../../services/reports';
import {eventsService} from '../../services/events';
import {conversationWS} from '../../services/websocket';
import type {WsEvent} from '../../services/websocket';
import {formatMessageTime, formatChatDate} from '../../utils/formatters';
import type {MessageOut} from '../../types/api';
import type {MatchesStackParamList} from '../../types/navigation';
import {supabase} from '../../services/supabase';

type Props = NativeStackScreenProps<MatchesStackParamList, 'Conversation'>;

export const ConversationScreen: React.FC = () => {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Props['navigation']>();
  const {conversationId, partnerName} = route.params;
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{type: 'saved' | 'unlocked'} | null>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const localMessagesRef = useRef<MessageOut[]>([]);
  const meIdRef = useRef<string | null>(null);
  const [meIdReady, setMeIdReady] = useState(false);
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      const uid = data.user?.id ?? null;
      meIdRef.current = uid;
      setMeIdReady(true);
    });
  }, []);

  // Fetch messages (initial load)
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsService.getMessages(conversationId),
  });

  // Keep localMessagesRef in sync with query data
  useEffect(() => {
    if (messagesQuery.data) {
      localMessagesRef.current = messagesQuery.data;
    }
  }, [messagesQuery.data]);

  // Feedback status — only poll if not yet answered
  const feedbackQuery = useQuery({
    queryKey: ['feedback', conversationId],
    queryFn: () => conversationsService.getFeedbackStatus(conversationId),
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: (query) => {
      // Stop polling once user has answered
      if (query.state.data?.already_answered) return false;
      return 5 * 60 * 1000; // check every 5 min instead of 60s
    },
  });

  // Handle incoming WebSocket events
  const handleWsEvent = useCallback(
    (evt: WsEvent) => {
      if (evt.type === 'message-new') {
        const d = evt.data;
        const currentMeId = meIdRef.current;
        const role: 'me' | 'them' =
          currentMeId && d.sender_user_id === currentMeId ? 'me' : 'them';

        const newMsg: MessageOut = {
          id: d.id,
          role,
          text: d.content_text,
          ts: Math.floor(new Date(d.created_at).getTime() / 1000),
          kind: 'text',
        };

        // Update query cache with new message (dedup by id)
        queryClient.setQueryData<MessageOut[]>(
          ['messages', conversationId],
          old => {
            const existing = old ?? localMessagesRef.current;
            // Remove temp messages if this is our own message coming back
            if (role === 'me') {
              const withoutTemp = existing.filter(
                m => !m.id.startsWith('temp-'),
              );
              if (withoutTemp.some(m => m.id === d.id)) return withoutTemp;
              return [...withoutTemp, newMsg];
            }
            if (existing.some(m => m.id === d.id)) return existing;
            return [...existing, newMsg];
          },
        );
        queryClient.invalidateQueries({queryKey: ['conversations']});
      } else if (evt.type === 'photos-unlocked') {
        // Could navigate to photos or show alert
      } else if (evt.type === 'ended') {
        queryClient.invalidateQueries({queryKey: ['conversations']});
        Alert.alert('Conversation Ended', 'This conversation has been ended.');
        navigation.goBack();
      }
    },
    [conversationId, queryClient, navigation],
  );

  // Connect WebSocket when screen is focused
  useFocusEffect(
    useCallback(() => {
      conversationsService.markRead(conversationId).catch(() => {});

      // Connect WebSocket
      conversationWS
        .connect(conversationId, handleWsEvent)
        .then(() => setWsConnected(true))
        .catch(() => setWsConnected(false));

      // Poll as fallback only when WS is disconnected (30s instead of 10s)
      pollInterval.current = setInterval(() => {
        if (!conversationWS.isConnected()) {
          messagesQuery.refetch();
        }
      }, 30000);

      return () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        conversationWS.disconnect();
        setWsConnected(false);
      };
    }, [conversationId]),
  );

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic local message
    const tempId = `temp-${Date.now()}`;
    const tempMsg: MessageOut = {
      id: tempId,
      role: 'me',
      text,
      ts: Math.floor(Date.now() / 1000),
      kind: 'text',
    };

    queryClient.setQueryData<MessageOut[]>(
      ['messages', conversationId],
      old => [...(old ?? []), tempMsg],
    );

    // Send via WebSocket (like the web app does)
    if (conversationWS.isConnected()) {
      conversationWS.sendText(text);
      setSending(false);
      // Track event
      eventsService.track('message_sent', {
        conversation_id: conversationId,
      });
    } else {
      // Fallback to REST API
      conversationsService
        .sendMessage(conversationId, {text})
        .then(newMsg => {
          // Replace temp with real message
          queryClient.setQueryData<MessageOut[]>(
            ['messages', conversationId],
            old =>
              (old ?? []).map(m => (m.id === tempId ? newMsg : m)),
          );
          queryClient.invalidateQueries({queryKey: ['conversations']});
          eventsService.track('message_sent', {
            conversation_id: conversationId,
            message_id: newMsg?.id,
          });
        })
        .catch((error: any) => {
          // Remove temp message on failure
          queryClient.setQueryData<MessageOut[]>(
            ['messages', conversationId],
            old => (old ?? []).filter(m => m.id !== tempId),
          );
          const msg = error?.message || 'Could not send message.';
          Alert.alert('Send Failed', msg);
        })
        .finally(() => setSending(false));
    }
  }, [inputText, sending, conversationId, queryClient]);

  // End conversation
  const endMutation = useMutation({
    mutationFn: () => conversationsService.endConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['conversations']});
      navigation.goBack();
    },
  });

  // Submit feedback
  const feedbackMutation = useMutation({
    mutationFn: (response: boolean) =>
      conversationsService.submitFeedback(conversationId, {response}),
    onSuccess: data => {
      queryClient.invalidateQueries({queryKey: ['feedback', conversationId]});
      if (data.photos_unlocked) {
        setFeedbackModal({type: 'unlocked'});
      } else if (data.saved) {
        setFeedbackModal({type: 'saved'});
      }
    },
  });

  const handleActions = () => {
    const options = ['End Conversation', 'Report User', 'View Photos', 'Cancel'];
    const destructiveIndex = 0;
    const cancelIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex},
        index => handleActionSelect(index),
      );
    } else {
      setShowActionSheet(true);
    }
  };

  const handleActionSelect = (index: number) => {
    if (index === 0) {
      Alert.alert('End Conversation', 'Are you sure?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'End', style: 'destructive', onPress: () => endMutation.mutate()},
      ]);
    } else if (index === 1) {
      handleReport();
    } else if (index === 2) {
      navigation.navigate('MatchPhotos', {conversationId, partnerName});
    }
  };

  const handleReport = () => {
    const reasons = [
      'spam',
      'harassment',
      'scam',
      'hate',
      'sexual',
      'impersonation',
      'other',
    ] as const;

    Alert.alert('Report User', 'Select a reason', [
      ...reasons.map(reason => ({
        text: reason.charAt(0).toUpperCase() + reason.slice(1),
        onPress: () => {
          reportsService
            .create({conversation_id: conversationId, reason})
            .then(() => Alert.alert('Reported', 'Your report has been submitted.'))
            .catch(() => Alert.alert('Error', 'Failed to submit report.'));
        },
      })),
      {text: 'Cancel', style: 'cancel' as const},
    ]);
  };

  // Set header button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MatchPhotos', {conversationId, partnerName})}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="View photos">
            <Icon name="images-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleActions}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="Conversation actions">
            <Icon name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, colors]);

  // ── Normalize thread (ported from web normalizeThread) ──
  // Keep only the FIRST system message. Dedup by id.
  const rawMessages = messagesQuery.data ?? [];
  const uniqueMessages = (() => {
    const seenIds = new Set<string>();
    let keptFirstSystem = false;
    const out: MessageOut[] = [];
    for (const m of rawMessages) {
      if (!m) continue;
      const id = String(m.id ?? '');
      const role = String(m.role ?? '');
      // 1) Dedup by id
      if (id && seenIds.has(id)) continue;
      if (id) seenIds.add(id);
      // 2) Keep only the first system message (eliminates duplicate intros)
      if (role === 'system') {
        if (keptFirstSystem) continue;
        keptFirstSystem = true;
      }
      out.push(m);
    }
    return out;
  })();
  const messages = uniqueMessages;
  const shouldPrompt = feedbackQuery.data?.should_prompt && !feedbackQuery.data?.already_answered;
  const alreadyAnswered = feedbackQuery.data?.already_answered === true;
  const myResponse = feedbackQuery.data?.my_response;
  const photosUnlocked = feedbackQuery.data?.photos_unlocked === true;

  // 24hr countdown for photo unlock
  useEffect(() => {
    const firstTs = messages.length > 0 ? messages[0].ts : null;
    if (!firstTs) {
      setCountdown('');
      return;
    }

    const calcRemaining = () => {
      const unlockAt = firstTs * 1000 + 24 * 60 * 60 * 1000;
      const remaining = unlockAt - Date.now();
      if (remaining <= 0) {
        setCountdown('');
        return;
      }
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${mins.toString().padStart(2, '0')}m`);
    };

    calcRemaining();
    const timer = setInterval(calcRemaining, 60000);
    return () => clearInterval(timer);
  }, [messages.length > 0 ? messages[0]?.ts : null]);

  const canSend = inputText.trim().length > 0 && !sending;

  const renderMessage = ({item, index}: {item: MessageOut; index: number}) => {
    const prevMsg = index > 0 ? uniqueMessages[index - 1] : null;
    const nextMsg = index < uniqueMessages.length - 1 ? uniqueMessages[index + 1] : null;
    const showDate =
      !prevMsg || formatChatDate(item.ts) !== formatChatDate(prevMsg.ts);

    // Group consecutive messages from the same sender
    const isLastInGroup = !nextMsg || nextMsg.role !== item.role;

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparatorContainer}>
            <Text
              style={styles.dateSeparator}
              accessibilityRole="text"
              accessibilityLabel={`Date: ${formatChatDate(item.ts)}`}>
              {formatChatDate(item.ts)}
            </Text>
          </View>
        )}
        {item.role === 'system' ? (
          <View style={styles.systemRow}>
            <View style={styles.systemBubble}>
              <Text style={styles.systemText}>{item.text}</Text>
            </View>
          </View>
        ) : item.role === 'me' ? (
          <View style={[styles.myRow, !isLastInGroup && styles.messageTight]}>
            <View
              style={[
                styles.myBubble,
                isLastInGroup && styles.myBubbleTail,
              ]}
              accessibilityRole="text"
              accessibilityLabel={`You said: ${item.text}, at ${formatMessageTime(item.ts)}`}>
              <Text style={styles.myText}>{item.text}</Text>
            </View>
            {isLastInGroup && (
              <Text style={styles.myTime}>{formatMessageTime(item.ts)}</Text>
            )}
          </View>
        ) : (
          <View style={[styles.theirRow, !isLastInGroup && styles.messageTight]}>
            <View
              style={[
                styles.theirBubble,
                isLastInGroup && styles.theirBubbleTail,
              ]}
              accessibilityRole="text"
              accessibilityLabel={`${partnerName} said: ${item.text}, at ${formatMessageTime(item.ts)}`}>
              <Text style={styles.theirText}>{item.text}</Text>
            </View>
            {isLastInGroup && (
              <Text style={styles.theirTime}>{formatMessageTime(item.ts)}</Text>
            )}
          </View>
        )}
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      {/* Match Feedback Banner */}
      {shouldPrompt && (
        <View style={styles.feedbackBanner}>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>How is your match?</Text>
            <Text style={styles.feedbackText}>
              Are you satisfied with this conversation?
            </Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                style={styles.feedbackYes}
                onPress={() => feedbackMutation.mutate(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Yes, I am satisfied with this match">
                <View style={styles.feedbackYesInner}>
                  <Icon name="heart" size={16} color={colors.white} />
                  <Text style={styles.feedbackYesText}>Yes</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.feedbackNo}
                onPress={() => feedbackMutation.mutate(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="No, I am not satisfied with this match">
                <Icon name="close" size={16} color={colors.textSecondary} />
                <Text style={styles.feedbackNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Feedback Already Answered Banner (task 5) */}
      {alreadyAnswered && !shouldPrompt && (
        <View style={styles.feedbackStatusBanner}>
          <Icon
            name={myResponse ? 'heart' : 'close-circle'}
            size={16}
            color={myResponse ? colors.success : colors.textTertiary}
          />
          <Text style={styles.feedbackStatusText}>
            You said "<Text style={{fontWeight: '700'}}>{myResponse ? 'Yes' : 'No'}</Text>" — {myResponse ? 'satisfied' : 'not satisfied'} with this match
          </Text>
        </View>
      )}

      {/* Photo Unlock Countdown */}
      {countdown !== '' && !photosUnlocked && (
        <View style={styles.countdownContainer}>
          <View style={styles.countdownPill}>
            <Icon name="lock-closed-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.countdownText}>Photos unlock in {countdown}</Text>
          </View>
        </View>
      )}

      {/* Messages */}
      {messagesQuery.isLoading && !messagesQuery.data ? (
        <ConversationSkeleton />
      ) : null}
      <FlatList
        ref={flatListRef}
        data={uniqueMessages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: false})
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={20}
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            accessibilityLabel="Message input"
            accessibilityHint="Type a message to send"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            style={styles.sendBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{disabled: !canSend}}>
            <View
              style={[
                styles.sendBtnCircle,
                {backgroundColor: canSend ? colors.primary : colors.disabled},
              ]}>
              <Icon name="arrow-up" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {/* Feedback Result Modal */}
      <Modal
        visible={feedbackModal !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFeedbackModal(null)}>
        <View style={styles.feedbackModalOverlay}>
          <View style={styles.feedbackModalCard}>
            {feedbackModal?.type === 'unlocked' ? (
              <>
                <View style={styles.feedbackModalIconCircle}>
                  <Icon name="images" size={36} color={colors.primary} />
                </View>
                <Text style={styles.feedbackModalTitle}>Photos Unlocked!</Text>
                <Text style={styles.feedbackModalText}>
                  Both of you are satisfied! You can now view each other's photos.
                </Text>
                <TouchableOpacity
                  style={styles.feedbackModalPrimaryBtn}
                  onPress={() => {
                    setFeedbackModal(null);
                    navigation.navigate('MatchPhotos', {conversationId, partnerName});
                  }}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.feedbackModalPrimaryGradient}>
                    <Icon name="images-outline" size={18} color={colors.white} />
                    <Text style={styles.feedbackModalPrimaryText}>View Photos</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.feedbackModalSecondaryBtn}
                  onPress={() => setFeedbackModal(null)}
                  activeOpacity={0.7}>
                  <Text style={styles.feedbackModalSecondaryText}>Later</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.feedbackModalIconCircle, {backgroundColor: colors.successLight}]}>
                  <Icon name="checkmark-circle" size={36} color={colors.success} />
                </View>
                <Text style={styles.feedbackModalTitle}>Feedback Saved</Text>
                <Text style={styles.feedbackModalText}>
                  Waiting for your match to respond. You'll be notified when they do.
                </Text>
                <TouchableOpacity
                  style={styles.feedbackModalPrimaryBtn}
                  onPress={() => setFeedbackModal(null)}
                  activeOpacity={0.8}>
                  <View style={[styles.feedbackModalPrimaryGradient, {backgroundColor: colors.primary}]}>
                    <Text style={styles.feedbackModalPrimaryText}>Got it</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Android Action Sheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}>
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}>
          <View />
        </TouchableOpacity>
        <View style={[styles.actionSheetCard, {paddingBottom: insets.bottom + spacing.base}]}>
          <View style={styles.actionSheetHandle} />
          <TouchableOpacity
            style={styles.actionSheetRow}
            onPress={() => {
              setShowActionSheet(false);
              handleActionSelect(2);
            }}
            accessibilityRole="button"
            accessibilityLabel="View Photos">
            <Icon name="images-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionSheetRowText, {color: colors.primary}]}>View Photos</Text>
          </TouchableOpacity>
          <View style={styles.actionSheetSeparator} />
          <TouchableOpacity
            style={styles.actionSheetRow}
            onPress={() => {
              setShowActionSheet(false);
              handleActionSelect(1);
            }}
            accessibilityRole="button"
            accessibilityLabel="Report User">
            <Icon name="flag-outline" size={22} color={colors.warning} />
            <Text style={[styles.actionSheetRowText, {color: colors.warning}]}>Report User</Text>
          </TouchableOpacity>
          <View style={styles.actionSheetSeparator} />
          <TouchableOpacity
            style={styles.actionSheetRow}
            onPress={() => {
              setShowActionSheet(false);
              handleActionSelect(0);
            }}
            accessibilityRole="button"
            accessibilityLabel="End Conversation">
            <Icon name="close-circle-outline" size={22} color={colors.error} />
            <Text style={[styles.actionSheetRowText, {color: colors.error}]}>End Conversation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSheetCancel}
            onPress={() => setShowActionSheet(false)}
            accessibilityRole="button"
            accessibilityLabel="Cancel">
            <Text style={styles.actionSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Feedback Banner
  feedbackBanner: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: c.background,
  },
  feedbackCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  feedbackTitle: {
    ...typography.headline,
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  feedbackText: {
    ...typography.subhead,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  feedbackYes: {
    flex: 1,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  feedbackYesInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: c.primary,
    gap: spacing.xs,
  },
  feedbackYesText: {
    ...typography.subhead,
    fontWeight: '600',
    color: c.white,
  },
  feedbackNo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceSecondary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.separatorLight,
    gap: spacing.xs,
  },
  feedbackNoText: {
    ...typography.subhead,
    fontWeight: '600',
    color: c.textSecondary,
  },
  // Messages
  messagesList: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  dateSeparatorContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateSeparator: {
    ...typography.caption1,
    color: c.textTertiary,
    backgroundColor: c.fillTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  myRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  theirRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  messageTight: {
    marginBottom: 2,
  },
  myBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: c.primary,
  },
  myBubbleTail: {
    borderBottomRightRadius: 4,
  },
  myText: {
    ...typography.body,
    color: c.chatMeText,
  },
  myTime: {
    ...typography.caption2,
    color: c.textTertiary,
    alignSelf: 'flex-end',
    marginTop: 2,
    marginRight: spacing.xs,
  },
  theirBubble: {
    maxWidth: '78%',
    backgroundColor: c.chatThem,
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  theirBubbleTail: {
    borderBottomLeftRadius: 4,
  },
  theirText: {
    ...typography.body,
    color: c.chatThemText,
  },
  theirTime: {
    ...typography.caption2,
    color: c.textTertiary,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginLeft: spacing.xs,
  },
  systemRow: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  systemBubble: {
    backgroundColor: c.fillTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  systemText: {
    ...typography.footnote,
    color: c.textTertiary,
  },
  // Input Bar
  inputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separatorLight,
    backgroundColor: c.surface,
    paddingBottom: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: c.textPrimary,
    backgroundColor: c.fill,
    borderRadius: 20,
    paddingHorizontal: spacing.base,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 100,
    marginRight: spacing.sm,
  },
  sendBtn: {
    marginBottom: Platform.OS === 'ios' ? 1 : 0,
  },
  sendBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Countdown Banner
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.fillTertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    gap: spacing.xs,
  },
  countdownText: {
    ...typography.footnote,
    color: c.textSecondary,
  },
  // Android Action Sheet
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
  },
  actionSheetCard: {
    backgroundColor: c.surfaceSolid,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: c.separatorLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    gap: spacing.md,
  },
  actionSheetRowText: {
    ...typography.body,
    fontWeight: '500',
  },
  actionSheetSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.separatorLight,
  },
  actionSheetCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: c.fillTertiary,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  actionSheetCancelText: {
    ...typography.body,
    fontWeight: '600',
    color: c.textSecondary,
  },
  // Feedback status banner (permanently shown after answering)
  feedbackStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: c.fillTertiary,
    gap: spacing.xs,
  },
  feedbackStatusText: {
    ...typography.caption1,
    color: c.textSecondary,
  },
  // Feedback result modal
  feedbackModalOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  feedbackModalCard: {
    backgroundColor: c.surfaceSolid,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.borderGlass,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  feedbackModalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  feedbackModalTitle: {
    ...typography.title2,
    color: c.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  feedbackModalText: {
    ...typography.body,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  feedbackModalPrimaryBtn: {
    width: '100%',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  feedbackModalPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  feedbackModalPrimaryText: {
    ...typography.headline,
    color: c.white,
    fontWeight: '700',
  },
  feedbackModalSecondaryBtn: {
    paddingVertical: spacing.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  feedbackModalSecondaryText: {
    ...typography.body,
    color: c.textTertiary,
  },
});
