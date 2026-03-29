import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {launchCamera} from 'react-native-image-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GradientButton} from '../../components/ui/GradientButton';
import {Badge} from '../../components/ui/Badge';
import {LoadingSpinner} from '../../components/ui/LoadingSpinner';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {kycService} from '../../services/kyc';

export const VerificationScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);

  const kycQuery = useQuery({
    queryKey: ['kycStatus'],
    queryFn: kycService.getStatus,
  });

  const uploadMutation = useMutation({
    mutationFn: (uris: string[]) => kycService.upload(uris),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['kycStatus']});
      setIdPhoto(null);
      setSelfiePhoto(null);
      Alert.alert(
        'Submitted',
        'Your verification documents have been submitted for review.',
      );
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit verification documents.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: kycService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['kycStatus']});
    },
  });

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'LikeMinded needs camera access for verification photos.',
          buttonPositive: 'Allow',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const takePhoto = async (setter: (uri: string) => void) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required for verification.',
      );
      return;
    }
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1600,
        cameraType: 'back',
      },
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          setter(asset.uri);
        }
      },
    );
  };

  const takeSelfie = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required for verification.',
      );
      return;
    }
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1600,
        cameraType: 'front',
      },
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (asset?.uri) {
          setSelfiePhoto(asset.uri);
        }
      },
    );
  };

  const handleSubmit = () => {
    if (!idPhoto || !selfiePhoto) {
      Alert.alert('Missing Photos', 'Please capture both required photos.');
      return;
    }
    uploadMutation.mutate([idPhoto, selfiePhoto]);
  };

  const status = kycQuery.data?.status ?? 'unverified';
  const reasons = kycQuery.data?.reasons ?? [];

  if (kycQuery.isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Verification Status</Text>
            <Badge
              label={
                status === 'verified'
                  ? 'Verified'
                  : status === 'pending'
                    ? 'Pending Review'
                    : 'Not Verified'
              }
              variant={
                status === 'verified'
                  ? 'success'
                  : status === 'pending'
                    ? 'warning'
                    : 'error'
              }
            />
          </View>
          {status === 'verified' && (
            <Text style={styles.statusText}>
              Your identity has been verified. You're all set!
            </Text>
          )}
          {status === 'pending' && (
            <>
              <Text style={styles.statusText}>
                Your documents are being reviewed. This usually takes 24-48
                hours.
              </Text>
              <GradientButton
                title="Cancel Verification"
                variant="outline"
                size="small"
                onPress={() => cancelMutation.mutate()}
                loading={cancelMutation.isPending}
                style={styles.cancelButton}
              />
            </>
          )}
        </View>

        {/* Rejection Reasons */}
        {reasons.length > 0 && (
          <View style={styles.reasonsCard}>
            <Text style={styles.reasonsTitle}>Rejection reasons:</Text>
            {reasons.map((reason, index) => (
              <Text key={index} style={styles.reasonText}>
                {'\u2022'} {reason}
              </Text>
            ))}
          </View>
        )}

        {/* Verification Steps - only show if unverified */}
        {status === 'unverified' && (
          <>
            <Text style={styles.sectionHeader}>VERIFICATION STEPS</Text>
            <View style={styles.stepsCard}>
              {/* Step 1: ID Photo */}
              <TouchableOpacity
                style={styles.stepRow}
                onPress={() => takePhoto(setIdPhoto)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={
                  idPhoto
                    ? 'ID photo captured. Tap to retake'
                    : 'Capture ID card or passport photo'
                }>
                <View style={styles.stepNumberContainer}>
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </LinearGradient>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>ID Card / Passport</Text>
                  <Text style={styles.stepDescription}>
                    Take a photo of the front of your ID
                  </Text>
                </View>
                {idPhoto ? (
                  <Icon
                    name="checkmark-circle"
                    size={24}
                    color={colors.success}
                  />
                ) : (
                  <Icon
                    name="camera-outline"
                    size={24}
                    color={colors.textTertiary}
                  />
                )}
              </TouchableOpacity>

              <View style={styles.stepSeparator} />

              {/* Step 2: Selfie */}
              <TouchableOpacity
                style={styles.stepRow}
                onPress={takeSelfie}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={
                  selfiePhoto
                    ? 'Selfie captured. Tap to retake'
                    : 'Take a face selfie'
                }>
                <View style={styles.stepNumberContainer}>
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.end]}
                    style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </LinearGradient>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Face Selfie</Text>
                  <Text style={styles.stepDescription}>
                    Take a clear selfie of your face
                  </Text>
                </View>
                {selfiePhoto ? (
                  <Icon
                    name="checkmark-circle"
                    size={24}
                    color={colors.success}
                  />
                ) : (
                  <Icon
                    name="camera-outline"
                    size={24}
                    color={colors.textTertiary}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Photo Previews */}
            {(idPhoto || selfiePhoto) && (
              <View style={styles.previewSection}>
                <View style={styles.previewRow}>
                  {idPhoto && (
                    <View style={styles.previewItem}>
                      <Image
                        source={{uri: idPhoto}}
                        style={styles.previewImage}
                        accessibilityLabel="ID photo preview"
                      />
                      <TouchableOpacity
                        style={styles.retakeButton}
                        onPress={() => setIdPhoto(null)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Retake ID photo">
                        <Icon
                          name="refresh-outline"
                          size={16}
                          color={colors.secondary}
                        />
                        <Text style={styles.retakeText}>Retake</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {selfiePhoto && (
                    <View style={styles.previewItem}>
                      <Image
                        source={{uri: selfiePhoto}}
                        style={styles.previewImage}
                        accessibilityLabel="Selfie photo preview"
                      />
                      <TouchableOpacity
                        style={styles.retakeButton}
                        onPress={() => setSelfiePhoto(null)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Retake selfie">
                        <Icon
                          name="refresh-outline"
                          size={16}
                          color={colors.secondary}
                        />
                        <Text style={styles.retakeText}>Retake</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Submit Button */}
            <View style={styles.actionContainer}>
              <GradientButton
                title="Submit for Review"
                onPress={handleSubmit}
                loading={uploadMutation.isPending}
                disabled={!idPhoto || !selfiePhoto}
              />
            </View>
          </>
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
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  statusCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    ...typography.headline,
    color: c.textPrimary,
  },
  statusText: {
    ...typography.subhead,
    color: c.textSecondary,
    lineHeight: 20,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  reasonsCard: {
    backgroundColor: c.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginTop: spacing.md,
  },
  reasonsTitle: {
    ...typography.subhead,
    fontWeight: '600',
    color: c.error,
    marginBottom: spacing.xs,
  },
  reasonText: {
    ...typography.footnote,
    color: c.error,
    marginBottom: 2,
    lineHeight: 18,
  },
  sectionHeader: {
    ...typography.footnote,
    color: c.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  stepsCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: c.borderGlass,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  stepNumberContainer: {
    marginRight: spacing.md,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.subhead,
    fontWeight: '700',
    color: c.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body,
    fontWeight: '600',
    color: c.textPrimary,
  },
  stepDescription: {
    ...typography.footnote,
    color: c.textSecondary,
    marginTop: 2,
  },
  stepSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.separatorLight,
    marginLeft: 62,
  },
  previewSection: {
    marginTop: spacing.lg,
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 44,
    accessibilityRole: 'button',
  },
  retakeText: {
    ...typography.subhead,
    color: c.secondary,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: spacing.xl,
  },
});
