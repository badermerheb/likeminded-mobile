import React from 'react';
import {View, StyleSheet} from 'react-native';
import {SkeletonLoader} from './SkeletonLoader';
import {spacing, borderRadius} from '../../theme';
import {useTheme} from '../../theme/ThemeContext';

/** Profile screen skeleton: centered avatar, name, info chips, menu rows */
export const ProfileSkeleton: React.FC = () => {
  const {colors} = useTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.profileHeaderCard,
          {backgroundColor: colors.surface},
        ]}>
        <SkeletonLoader width={88} height={88} borderRadius={44} />
        <SkeletonLoader
          width={160}
          height={24}
          borderRadius={borderRadius.sm}
          style={styles.mt12}
        />
        <View style={styles.profileChipsRow}>
          <SkeletonLoader width={72} height={28} borderRadius={14} />
          <SkeletonLoader width={80} height={28} borderRadius={14} />
          <SkeletonLoader width={96} height={28} borderRadius={14} />
        </View>
        <SkeletonLoader
          width={80}
          height={22}
          borderRadius={borderRadius.sm}
          style={styles.mt8}
        />
      </View>

      {Array.from({length: 4}).map((_, i) => (
        <View
          key={i}
          style={[styles.menuRow, {backgroundColor: colors.surface}]}>
          <SkeletonLoader width={36} height={36} borderRadius={18} />
          <SkeletonLoader
            width={160}
            height={16}
            borderRadius={borderRadius.sm}
            style={styles.ml12}
          />
        </View>
      ))}
    </View>
  );
};

/** Matches list skeleton: 4 conversation rows */
export const MatchesSkeleton: React.FC = () => {
  const {colors} = useTheme();
  return (
    <View style={styles.container}>
      {Array.from({length: 4}).map((_, i) => (
        <View
          key={i}
          style={[styles.conversationRow, {backgroundColor: colors.surface}]}>
          <SkeletonLoader width={52} height={52} borderRadius={26} />
          <View style={styles.conversationText}>
            <SkeletonLoader
              width={120}
              height={16}
              borderRadius={borderRadius.sm}
            />
            <SkeletonLoader
              width={200}
              height={13}
              borderRadius={borderRadius.sm}
              style={styles.mt8}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

/** Conversation skeleton: alternating left/right chat bubbles */
export const ConversationSkeleton: React.FC = () => (
  <View style={styles.container}>
    {[
      {align: 'flex-start' as const, width: 200},
      {align: 'flex-end' as const, width: 160},
      {align: 'flex-start' as const, width: 240},
      {align: 'flex-end' as const, width: 180},
      {align: 'flex-start' as const, width: 140},
      {align: 'flex-end' as const, width: 220},
    ].map((bubble, i) => (
      <View key={i} style={[styles.bubbleRow, {alignSelf: bubble.align}]}>
        <SkeletonLoader
          width={bubble.width}
          height={40}
          borderRadius={borderRadius.lg}
        />
      </View>
    ))}
  </View>
);

/** Assessment skeleton: hero card + 3 step rows */
export const AssessmentSkeleton: React.FC = () => {
  const {colors} = useTheme();
  return (
    <View style={styles.container}>
      <SkeletonLoader
        width="100%"
        height={160}
        borderRadius={borderRadius.lg}
      />
      {Array.from({length: 3}).map((_, i) => (
        <View
          key={i}
          style={[styles.stepRow, {backgroundColor: colors.surface}]}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.stepText}>
            <SkeletonLoader
              width={180}
              height={16}
              borderRadius={borderRadius.sm}
            />
            <SkeletonLoader
              width={240}
              height={13}
              borderRadius={borderRadius.sm}
              style={styles.mt8}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  mt8: {
    marginTop: spacing.sm,
  },
  mt12: {
    marginTop: spacing.md,
  },
  ml12: {
    marginLeft: spacing.md,
  },
  profileHeaderCard: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  profileChipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  conversationText: {
    flex: 1,
  },
  bubbleRow: {
    marginVertical: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  stepText: {
    flex: 1,
  },
});
