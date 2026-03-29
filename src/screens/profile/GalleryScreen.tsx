import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {launchImageLibrary} from 'react-native-image-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {LoadingSpinner} from '../../components/ui/LoadingSpinner';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {photosService} from '../../services/photos';

const {width} = Dimensions.get('window');
const GRID_PADDING = spacing.base;
const GRID_GAP = spacing.md;
const PHOTO_WIDTH = (width - GRID_PADDING * 2 - GRID_GAP) / 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * (4 / 3);

export const GalleryScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();

  const photosQuery = useQuery({
    queryKey: ['myPhotos'],
    queryFn: photosService.getMyPhotos,
  });

  const uploadMutation = useMutation({
    mutationFn: ({uri, position}: {uri: string; position: number}) =>
      photosService.uploadGalleryPhoto(uri, position),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['myPhotos']});
    },
    onError: () => {
      Alert.alert('Error', 'Failed to upload photo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (position: number) =>
      photosService.deleteGalleryPhoto(position),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['myPhotos']});
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete photo.');
    },
  });

  const handlePickPhoto = (position: number) => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, maxWidth: 1200, maxHeight: 1600},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          uploadMutation.mutate({uri: asset.uri, position});
        }
      },
    );
  };

  const handleDeletePhoto = (position: number) => {
    Alert.alert('Delete Photo', 'Are you sure you want to remove this photo?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(position),
      },
    ]);
  };

  const photos: (string | null)[] = Array.isArray(photosQuery.data)
    ? photosQuery.data
    : [null, null, null];

  // Ensure we always have 3 slots
  while (photos.length < 3) photos.push(null);

  const filledCount = photos.filter(p => p && p.length > 0).length;

  if (photosQuery.isLoading) {
    return <LoadingSpinner fullScreen message="Loading photos..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Add at least 3 photos</Text>
          <Text style={styles.headerCount}>
            {filledCount}/3 added
            {filledCount < 3 && (
              <Text style={styles.headerWarning}>
                {' \u2014 '}{3 - filledCount} more needed
              </Text>
            )}
          </Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.grid}>
          {photos.map((photoUrl, index) => {
            const position = index + 1;
            const hasPhoto = photoUrl && photoUrl.length > 0;

            return (
              <View key={position} style={styles.photoSlot}>
                {hasPhoto ? (
                  <View style={styles.photoWrapper}>
                    <Image
                      source={{uri: photoUrl}}
                      style={styles.photo}
                      accessibilityLabel={`Photo ${position}. Double tap to delete`}
                    />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePhoto(position)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete photo ${position}`}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <Icon name="close" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlot}
                    onPress={() => handlePickPhoto(position)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Add photo">
                    <Icon name="add" size={32} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Info Footer */}
        <View style={styles.infoFooter}>
          <Icon
            name="information-circle-outline"
            size={18}
            color={colors.textTertiary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Your photos will be shared with matches after mutual positive
            feedback.
          </Text>
        </View>

        {(uploadMutation.isPending || deleteMutation.isPending) && (
          <LoadingSpinner message="Processing..." />
        )}
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
    padding: GRID_PADDING,
    paddingBottom: spacing['2xl'],
  },
  headerInfo: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.title3,
    color: c.textPrimary,
    marginBottom: spacing.xs,
  },
  headerCount: {
    ...typography.subhead,
    color: c.textSecondary,
  },
  headerWarning: {
    color: c.warning,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoSlot: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoWrapper: {
    flex: 1,
    position: 'relative',
    borderRadius: borderRadius.md,
    shadowColor: c.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: c.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emptySlot: {
    flex: 1,
    backgroundColor: c.fill,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: c.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 1,
  },
  infoText: {
    ...typography.footnote,
    color: c.textTertiary,
    flex: 1,
    lineHeight: 18,
  },
});
