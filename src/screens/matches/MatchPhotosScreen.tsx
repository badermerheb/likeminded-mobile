import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {LoadingSpinner} from '../../components/ui/LoadingSpinner';
import {IconCircle} from '../../components/ui/IconCircle';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {conversationsService} from '../../services/conversations';
import type {MatchesStackParamList} from '../../types/navigation';

const {width} = Dimensions.get('window');
const GRID_GAP = spacing.sm;
const GRID_PADDING = spacing.base;
const PHOTO_SIZE = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchPhotos'>;

export const MatchPhotosScreen: React.FC = () => {
  const route = useRoute<Props['route']>();
  const {conversationId} = route.params;
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const photosQuery = useQuery({
    queryKey: ['conversationPhotos', conversationId],
    queryFn: () => conversationsService.getPhotos(conversationId),
  });

  if (photosQuery.isLoading) {
    return <LoadingSpinner fullScreen message="Loading photos..." />;
  }

  const photos = photosQuery.data ?? [];

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconCircle
          name="lock-closed"
          size={72}
          gradient
          iconSize={36}
          accessibilityLabel="Photos locked"
        />
        <Text style={styles.emptyTitle}>Photos Locked</Text>
        <Text style={styles.emptySubtitle}>
          Photos will be unlocked after you both provide positive feedback about
          this match.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionHeader}>
        Unlocked after mutual positive feedback
      </Text>

      <View style={styles.grid}>
        {photos.map((photoUrl: string, index: number) => (
          <View
            key={index}
            style={styles.photoWrapper}
            accessibilityRole="image"
            accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}>
            <Image
              source={{uri: photoUrl}}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  contentContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  sectionHeader: {
    ...typography.footnote,
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.25,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: c.surfaceTertiary,
    shadowColor: c.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  // Empty / Locked state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: c.background,
  },
  emptyTitle: {
    ...typography.title2,
    color: c.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});
