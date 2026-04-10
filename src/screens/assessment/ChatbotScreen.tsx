import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {assessmentService} from '../../services/assessment';
import {eventsService} from '../../services/events';

// ─── Types ───────────────────────────────────────────────────

interface ParsedOption {
  label: string; // "A", "B", "C", "D"
  text: string; // The option text
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string; // Display text (question only, no option lines)
  options?: ParsedOption[]; // Parsed MCQ options
  isFreeform?: boolean; // Whether this is a freeform text input question
  freeformKey?: string; // The freeform key (e.g., "ideal_match")
}

interface ProgressData {
  total?: number;
  answered?: number;
  self_answered?: number;
  pref_answered?: number;
  self_total?: number;
  pref_total?: number;
}

// ─── Helpers ─────────────────────────────────────────────────

/** Always strip [[mcq:...]], [[dyn:...]], [[freeform:...]] tags from display text */
function stripTags(text: string): string {
  return text
    .replace(/\[\[mcq:[^\]]*\]\]/g, '')
    .replace(/\[\[dyn:[^\]]*\]\]/g, '')
    .replace(/\[\[freeform:[^\]]*\]\]/g, '')
    .trim();
}

// ─── MCQ Parser ──────────────────────────────────────────────

/**
 * Parses the backend reply text which looks like:
 * "Question text?\nA) Option A text\nB) Option B text\nC) Option C text\nD) Write your own answer\n\n[[mcq:S1]]"
 *
 * Returns { questionText, options[] }
 */
function parseMcqReply(reply: string): {
  questionText: string;
  options: ParsedOption[];
  isFreeform: boolean;
  freeformKey: string;
} {
  if (!reply) {
    return {questionText: '', options: [], isFreeform: false, freeformKey: ''};
  }

  // Check for [[freeform:...]] tag
  const freeformMatch = reply.match(/\[\[freeform:([^\]]*)\]\]/);
  const isFreeform = !!freeformMatch;
  const freeformKey = freeformMatch ? freeformMatch[1] : '';

  // Remove [[mcq:...]], [[dyn:...]], and [[freeform:...]] tags
  let cleaned = reply
    .replace(/\[\[mcq:[^\]]*\]\]/g, '')
    .replace(/\[\[dyn:[^\]]*\]\]/g, '')
    .replace(/\[\[freeform:[^\]]*\]\]/g, '')
    .trim();

  // If freeform, return just the question text with no MCQ options
  if (isFreeform) {
    return {questionText: cleaned, options: [], isFreeform, freeformKey};
  }

  // Try to extract option lines like "A) ...", "B) ...", etc.
  const optionRegex = /^([A-D])\)\s*(.+)$/gm;
  const options: ParsedOption[] = [];
  let match;

  while ((match = optionRegex.exec(cleaned)) !== null) {
    options.push({
      label: match[1],
      text: match[2].trim(),
    });
  }

  // The question text is everything before the first option line
  let questionText = cleaned;
  if (options.length > 0) {
    const firstOptIndex = cleaned.search(/^[A-D]\)\s/m);
    if (firstOptIndex > 0) {
      questionText = cleaned.substring(0, firstOptIndex).trim();
    }
  }

  return {questionText, options, isFreeform: false, freeformKey: ''};
}

/**
 * Checks if a reply is a plain text message (no MCQ options)
 */
function isPlainMessage(reply: string): boolean {
  const {options} = parseMcqReply(reply);
  return options.length === 0;
}

// ─── Typing Indicator Component ─────────────────────────────

interface TypingDotsProps {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}

const TypingDots: React.FC<TypingDotsProps> = ({colors, styles}) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={styles.typingDotsRow}>
      {/* Bot avatar */}
      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.botAvatar}>
        <Icon name="sparkles" size={12} color={colors.white} />
      </LinearGradient>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, {opacity: dot1}]} />
        <Animated.View style={[styles.typingDot, {opacity: dot2}]} />
        <Animated.View style={[styles.typingDot, {opacity: dot3}]} />
      </View>
    </View>
  );
};

// ─── Component ───────────────────────────────────────────────

export const ChatbotScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [phase, setPhase] = useState<string>('self');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load history
  const historyQuery = useQuery({
    queryKey: ['chatbotHistory'],
    queryFn: assessmentService.getHistory,
    enabled: !historyLoaded,
  });

  // Send message to backend
  const sendMutation = useMutation({
    mutationFn: (messageText: string) =>
      assessmentService.sendMessage({message: messageText}),
    onSuccess: (data: any) => {
      setIsTyping(false);

      if (data?.phase) {
        setPhase(data.phase);
      }
      if (data?.progress) {
        setProgress(data.progress);
      }

      const reply = data?.reply || '';
      if (!reply) {
        return;
      }

      if (data?.phase === 'done') {
        setIsDone(true);
        // Plain done message
        const msg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: reply,
          options: [],
        };
        setMessages(prev => [...prev, msg]);
        // Invalidate traits so they refresh
        queryClient.invalidateQueries({queryKey: ['traits']});
        queryClient.invalidateQueries({queryKey: ['chatbotHistory']});

        // Fire assessment_completed event so matching knows we're done
        eventsService.track('assessment_completed', {
          properties: {source: 'chatbot', phase: 'done'},
        });

        return;
      }

      // Parse MCQ or freeform from reply
      const {questionText, options, isFreeform, freeformKey} = parseMcqReply(reply);
      const msg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: questionText || reply,
        options,
        isFreeform,
        freeformKey,
      };
      setMessages(prev => [...prev, msg]);
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  // Process history when loaded
  useEffect(() => {
    if (!historyQuery.data || historyLoaded) {
      return;
    }

    const data = historyQuery.data as any;
    const historyMessages = data?.messages ?? data ?? [];

    if (data?.phase) {
      setPhase(data.phase);
    }
    if (data?.progress) {
      setProgress(data.progress);
    }
    if (data?.phase === 'done') {
      setIsDone(true);
      // Fire assessment_completed event (dedupe handled server-side)
      eventsService.track('assessment_completed', {
        properties: {source: 'history_load', phase: 'done'},
      });
    }

    if (Array.isArray(historyMessages) && historyMessages.length > 0) {
      // Find the index of the last bot message so we only show options for it
      let lastBotIndex = -1;
      for (let idx = historyMessages.length - 1; idx >= 0; idx--) {
        const r = historyMessages[idx].role;
        if (r === 'assistant' || r === 'bot') {
          lastBotIndex = idx;
          break;
        }
      }

      // Convert history messages — parse last bot message for options
      const converted: ChatMessage[] = historyMessages.map(
        (msg: any, i: number) => {
          const content = msg.content || msg.message || msg.text || '';
          const isBot = msg.role === 'assistant' || msg.role === 'bot';

          if (isBot) {
            const isLast = i === lastBotIndex;
            const {questionText, options, isFreeform, freeformKey} = parseMcqReply(content);
            return {
              id: `hist-${i}`,
              role: 'assistant' as const,
              content: questionText || content,
              options: isLast && data?.phase !== 'done' ? options : [],
              isFreeform: isLast && data?.phase !== 'done' ? isFreeform : false,
              freeformKey: isLast ? freeformKey : '',
            };
          }

          return {
            id: `hist-${i}`,
            role: 'user' as const,
            content,
            options: [],
          };
        },
      );

      setMessages(converted);
      setHistoryLoaded(true);

      // If the last message is from the user (they answered but didn't get the
      // next question), request the next question from the backend
      if (
        lastBotIndex < historyMessages.length - 1 &&
        data?.phase !== 'done'
      ) {
        setIsTyping(true);
        sendMutation.mutate('continue');
      }
    } else if (historyQuery.isSuccess) {
      // No history — need to kick off the first question
      setHistoryLoaded(true);
      triggerFirstQuestion();
    }
  }, [historyQuery.data, historyQuery.isSuccess]);

  const triggerFirstQuestion = () => {
    // Fire assessment_started event
    eventsService.track('assessment_started', {
      properties: {source: 'chatbot'},
    });

    // First, call /assessment/start to initialize
    assessmentService
      .start()
      .then(() => {
        // Then send an initial message to get the first question
        setIsTyping(true);
        sendMutation.mutate('start');
      })
      .catch(() => {
        // If start fails (already started), just send message
        setIsTyping(true);
        sendMutation.mutate('start');
      });
  };

  const handleSelectOption = (option: ParsedOption) => {
    if (option.label === 'D') {
      // "Write your own answer" — show custom input
      setShowCustomInput(true);
      return;
    }

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: option.text,
    };
    setMessages(prev => {
      // Remove options from the last bot message (already answered)
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant'
          ? {...m, options: []}
          : m,
      );
      return [...updated, userMsg];
    });
    setIsTyping(true);

    // Send just the letter to backend
    sendMutation.mutate(option.label);
  };

  const handleSendCustom = () => {
    if (!customInput.trim()) {
      return;
    }

    const text = customInput.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages(prev => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant'
          ? {...m, options: []}
          : m,
      );
      return [...updated, userMsg];
    });
    setIsTyping(true);
    setShowCustomInput(false);
    setCustomInput('');

    // Send as "D: <custom text>" for the backend to parse as option D
    sendMutation.mutate(`D: ${text}`);
  };

  // Get options and freeform state from the last bot message
  const lastBotMessage = [...messages]
    .reverse()
    .find(m => m.role === 'assistant');
  const currentOptions = lastBotMessage?.options || [];
  const isFreeformQuestion = lastBotMessage?.isFreeform || false;

  const handleSendFreeform = () => {
    if (!customInput.trim()) {
      return;
    }
    const text = customInput.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages(prev => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant'
          ? {...m, isFreeform: false}
          : m,
      );
      return [...updated, userMsg];
    });
    setIsTyping(true);
    setCustomInput('');
    sendMutation.mutate(text);
  };

  const handleSkipFreeform = () => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: 'Skip',
    };
    setMessages(prev => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'assistant'
          ? {...m, isFreeform: false}
          : m,
      );
      return [...updated, userMsg];
    });
    setIsTyping(true);
    sendMutation.mutate('skip');
  };

  // Progress calculations
  const progressPercent =
    progress?.total && progress?.answered
      ? Math.round((progress.answered / progress.total) * 100)
      : 0;

  const phaseLabel =
    phase === 'self'
      ? 'Phase 1: About You'
      : phase === 'pref'
      ? 'Phase 2: Your Ideal Partner'
      : 'Assessment';

  const renderMessage = ({item, index}: {item: ChatMessage; index: number}) => {
    if (item.role === 'assistant') {
      const displayText = stripTags(item.content);
      // Show avatar for first bot message or when previous message is from user
      const showAvatar =
        index === 0 || messages[index - 1]?.role === 'user';

      return (
        <View style={styles.botRow}>
          {showAvatar ? (
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.botAvatar}>
              <Icon name="sparkles" size={12} color={colors.white} />
            </LinearGradient>
          ) : (
            <View style={styles.avatarSpacer} />
          )}
          <View
            style={styles.botBubble}
            accessibilityRole="text"
            accessibilityLabel={`Assistant: ${displayText}`}>
            <Text style={styles.botText}>{displayText}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.userRow}>
        <LinearGradient
          colors={[colors.gradient.start, colors.gradient.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.userBubble}
          accessibilityRole="text"
          accessibilityLabel={`You: ${item.content}`}>
          <Text style={styles.userText}>{item.content}</Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}>
      {/* Progress Header */}
      {!isDone && (progress?.answered ?? 0) > 0 ? (
        <View
          style={styles.progressHeader}
          accessibilityLabel={`${phaseLabel}, ${progressPercent}% complete`}>
          <View style={styles.progressTopRow}>
            <Text style={styles.phaseLabel}>{phaseLabel}</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[
                styles.progressBarFill,
                {width: `${Math.min(progressPercent, 100)}%`},
              ]}
            />
          </View>
        </View>
      ) : isDone ? (
        <View style={styles.progressHeader}>
          <View style={styles.doneRow}>
            <Icon name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.doneText}>Assessment Complete</Text>
          </View>
        </View>
      ) : null}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {isTyping && <TypingDots colors={colors} styles={styles} />}

      {/* MCQ Options */}
      {currentOptions.length > 0 && !isTyping && !isDone && (
        <View style={styles.optionsContainer}>
          {currentOptions.map((option, index) => {
            const isCustom = option.label === 'D';
            return (
              <TouchableOpacity
                key={`${option.label}-${index}`}
                style={[
                  styles.optionCard,
                  isCustom && styles.optionCardCustom,
                ]}
                onPress={() => handleSelectOption(option)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={`Option ${option.label}: ${option.text}`}>
                <LinearGradient
                  colors={
                    isCustom
                      ? [colors.surfaceSecondary, colors.surfaceSecondary]
                      : [colors.gradient.start, colors.gradient.end]
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.optionLetterCircle}>
                  <Text
                    style={[
                      styles.optionLetterText,
                      isCustom && styles.optionLetterTextCustom,
                    ]}>
                    {isCustom ? (
                      <Icon
                        name="pencil-outline"
                        size={14}
                        color={colors.textTertiary}
                      />
                    ) : (
                      option.label
                    )}
                  </Text>
                </LinearGradient>
                <Text style={styles.optionText} numberOfLines={3}>
                  {option.text}
                </Text>
                {isCustom && (
                  <Icon
                    name="chevron-forward"
                    size={16}
                    color={colors.textTertiary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Freeform Input (for optional open-ended questions) */}
      {isFreeformQuestion && !isTyping && !isDone && (
        <View
          style={[
            styles.freeformContainer,
            {paddingBottom: Math.max(insets.bottom, 8)},
          ]}>
          <TextInput
            style={styles.freeformInput}
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="Type your answer..."
            placeholderTextColor={colors.textTertiary}
            multiline
            accessibilityLabel="Type your answer"
          />
          <View style={styles.freeformButtons}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipFreeform}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Skip this question">
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.freeformSendButton,
                !customInput.trim() && styles.freeformSendButtonDisabled,
              ]}
              onPress={handleSendFreeform}
              disabled={!customInput.trim()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Submit your answer"
              accessibilityState={{disabled: !customInput.trim()}}>
              <LinearGradient
                colors={
                  customInput.trim()
                    ? [colors.gradient.start, colors.gradient.end]
                    : [colors.disabled, colors.disabled]
                }
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.freeformSendGradient}>
                <Text style={styles.freeformSendText}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Custom Input (for "D" / Write your own) */}
      {showCustomInput && (
        <View
          style={[
            styles.customInputContainer,
            {paddingBottom: Math.max(insets.bottom, 8)},
          ]}>
          <TextInput
            style={styles.customInput}
            value={customInput}
            onChangeText={setCustomInput}
            placeholder="Type your answer..."
            placeholderTextColor={colors.textTertiary}
            multiline
            autoFocus
            accessibilityLabel="Type your custom answer"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendCustom}
            disabled={!customInput.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send answer"
            accessibilityState={{disabled: !customInput.trim()}}>
            <LinearGradient
              colors={
                customInput.trim()
                  ? [colors.gradient.start, colors.gradient.end]
                  : [colors.disabled, colors.disabled]
              }
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.sendButtonGradient}>
              <Icon name="arrow-up" size={18} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Done - View Results button */}
      {isDone && !isTyping && (
        <View
          style={[
            styles.doneButtonContainer,
            {paddingBottom: Math.max(insets.bottom, 16)},
          ]}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View your results">
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.doneButtonGradient}>
              <Icon
                name="trophy-outline"
                size={20}
                color={colors.white}
              />
              <Text style={styles.doneButtonText}>View Your Results</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Progress Header
  progressHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: c.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.separatorLight,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseLabel: {
    ...typography.subhead,
    fontWeight: '600',
    color: c.textPrimary,
  },
  progressPercent: {
    ...typography.footnote,
    fontWeight: '600',
    color: c.primary,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.separatorLight,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneText: {
    ...typography.subhead,
    fontWeight: '600',
    color: c.success,
  },
  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  botRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
    alignItems: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarSpacer: {
    width: 28,
    marginRight: 8,
  },
  botBubble: {
    backgroundColor: c.chatThem,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  botText: {
    ...typography.body,
    color: c.chatThemText,
    lineHeight: 22,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    maxWidth: '80%',
    alignSelf: 'flex-end',
  },
  userBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    ...typography.body,
    color: c.chatMeText,
    lineHeight: 22,
  },
  // Typing Indicator
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.chatThem,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.textTertiary,
  },
  // MCQ Options
  optionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separatorLight,
    backgroundColor: c.surface,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: c.separatorLight,
  },
  optionCardCustom: {
    borderStyle: 'dashed',
    borderColor: c.textTertiary,
    backgroundColor: c.surfaceSecondary,
  },
  optionLetterCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    ...typography.subhead,
    fontWeight: '700',
    color: c.white,
  },
  optionLetterTextCustom: {
    color: c.textTertiary,
  },
  optionText: {
    ...typography.subhead,
    color: c.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  // Custom Input
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separatorLight,
    backgroundColor: c.surface,
  },
  customInput: {
    flex: 1,
    ...typography.body,
    color: c.textPrimary,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    marginBottom: 2,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Done Button
  doneButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separatorLight,
    backgroundColor: c.surface,
  },
  doneButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  doneButtonText: {
    ...typography.headline,
    fontWeight: '700',
    color: c.white,
  },
  // Freeform Input
  freeformContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.separatorLight,
    backgroundColor: c.surface,
  },
  freeformInput: {
    ...typography.body,
    color: c.textPrimary,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    maxHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  freeformButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.separatorLight,
    backgroundColor: c.surface,
  },
  skipButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: c.textSecondary,
  },
  freeformSendButton: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  freeformSendButtonDisabled: {
    opacity: 0.6,
  },
  freeformSendGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  freeformSendText: {
    ...typography.body,
    fontWeight: '700',
    color: c.white,
  },
});
