import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {Input} from '../../components/ui/Input';
import {GradientButton} from '../../components/ui/GradientButton';
import {useTheme} from '../../theme/ThemeContext';
import type {ThemeColors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {profileService} from '../../services/profile';
import {authService} from '../../services/auth';

export const DeleteAccountScreen: React.FC = () => {
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;

    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. Are you absolutely sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await profileService.deleteMe();
              await authService.signOut();
            } catch {
              Alert.alert('Error', 'Failed to delete account.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <Icon name="warning-outline" size={56} color={colors.error} />
        </View>

        {/* Title */}
        <Text
          style={styles.title}
          accessibilityRole="header"
          accessibilityLabel="Delete Your Account">
          Delete Your Account
        </Text>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.bulletRow}>
            <Icon
              name="close-circle"
              size={18}
              color={colors.error}
              style={styles.bulletIcon}
            />
            <Text style={styles.bulletText}>
              Your profile will be permanently deleted
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Icon
              name="close-circle"
              size={18}
              color={colors.error}
              style={styles.bulletIcon}
            />
            <Text style={styles.bulletText}>
              All your conversations will be removed
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Icon
              name="close-circle"
              size={18}
              color={colors.error}
              style={styles.bulletIcon}
            />
            <Text style={styles.bulletText}>
              This action cannot be undone
            </Text>
          </View>
        </View>

        {/* Confirmation Input */}
        <View style={styles.confirmCard}>
          <Text style={styles.confirmLabel}>
            Type <Text style={styles.confirmBold}>DELETE</Text> to confirm
          </Text>
          <Input
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="Type DELETE to confirm"
            autoCapitalize="characters"
          />
        </View>

        {/* Delete Button */}
        <View style={styles.buttonContainer}>
          <GradientButton
            title="Delete My Account"
            onPress={handleDelete}
            loading={loading}
            disabled={!isConfirmed}
            style={styles.deleteButton}
            accessibilityLabel="Delete account permanently"
          />
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
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title2,
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  warningCard: {
    backgroundColor: c.errorLight,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  bulletIcon: {
    marginRight: spacing.md,
  },
  bulletText: {
    ...typography.subhead,
    color: c.error,
    flex: 1,
  },
  confirmCard: {
    backgroundColor: c.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: c.borderGlass,
  },
  confirmLabel: {
    ...typography.subhead,
    color: c.textSecondary,
    marginBottom: spacing.md,
  },
  confirmBold: {
    fontWeight: '700',
    color: c.error,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    minHeight: 44,
  },
});
