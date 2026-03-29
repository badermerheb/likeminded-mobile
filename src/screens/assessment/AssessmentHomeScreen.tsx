import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {GradientButton} from '../../components/ui/GradientButton';
import {Badge} from '../../components/ui/Badge';
import {AssessmentSkeleton} from '../../components/ui/SkeletonScreens';
import {useTheme} from '../../theme/ThemeContext';
import {typography} from '../../theme/typography';
import {assessmentService} from '../../services/assessment';
import type {AssessmentStackParamList} from '../../types/navigation';
import type {ThemeColors} from '../../theme/colors';

type NavigationProp = NativeStackNavigationProp<
  AssessmentStackParamList,
  'AssessmentHome'
>;

export const AssessmentHomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const historyQuery = useQuery({
    queryKey: ['chatbotHistory'],
    queryFn: assessmentService.getHistory,
    retry: 1,
    staleTime: 30000,
  });

  const traitsQuery = useQuery({
    queryKey: ['traits'],
    queryFn: assessmentService.getTraits,
  });

  const historyData = historyQuery.data as any;
  const historyMessages = historyData?.messages ?? historyData ?? [];
  const hasHistory =
    Array.isArray(historyMessages) && historyMessages.length > 0;
  const phase = historyData?.phase;
  const hasTraits =
    traitsQuery.data?.some(t => t.score !== null && t.score !== undefined) ??
    false;

  const status =
    hasTraits || phase === 'done'
      ? 'completed'
      : hasHistory
        ? 'in_progress'
        : 'not_started';

  const progressData = historyData?.progress;
  const progressPercent =
    progressData?.total && progressData?.answered
      ? Math.round((progressData.answered / progressData.total) * 100)
      : 0;

  const statusBadgeLabel =
    status === 'completed'
      ? 'Completed'
      : status === 'in_progress'
        ? 'In Progress'
        : 'Not Started';

  const statusBadgeVariant =
    status === 'completed'
      ? 'success'
      : status === 'in_progress'
        ? 'warning'
        : 'default';

  const ctaTitle =
    status === 'completed'
      ? 'View Results'
      : status === 'in_progress'
        ? 'Continue Assessment'
        : 'Start Assessment';

  if (historyQuery.isLoading || traitsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.skeletonContainer}>
        <AssessmentSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.container,
        {paddingBottom: Math.max(insets.bottom, 16) + 16},
      ]}
      showsVerticalScrollIndicator={false}>
      <Text
        style={styles.largeTitle}
        accessibilityRole="header"
        accessibilityLabel="Assessment">
        Assessment
      </Text>

      <LinearGradient
        colors={[colors.gradient.start, colors.gradient.end]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.heroCard}>
        <View style={styles.heroBadgeContainer}>
          <Badge label={statusBadgeLabel} variant={statusBadgeVariant} />
        </View>
        <View style={styles.heroIconCircle}>
          <Icon name="clipboard-outline" size={32} color={colors.white} />
        </View>
        <Text style={styles.heroTitle}>Personality Assessment</Text>
        <Text style={styles.heroSubtitle}>
          Discover your personality traits through our AI-powered assessment
        </Text>
      </LinearGradient>

      <View style={styles.groupedCard}>
        <View
          style={styles.groupedRow}
          accessibilityLabel={`Status: ${statusBadgeLabel}`}>
          <View style={styles.groupedRowLeft}>
            <View
              style={[styles.rowIcon, {backgroundColor: colors.info + '1A'}]}>
              <Icon name="pulse-outline" size={18} color={colors.info} />
            </View>
            <Text style={styles.groupedRowLabel}>Status</Text>
          </View>
          <Badge label={statusBadgeLabel} variant={statusBadgeVariant} />
        </View>

        {status === 'in_progress' && (
          <>
            <View style={styles.groupedSeparator} />
            <View
              style={styles.groupedRow}
              accessibilityLabel={`Progress: ${progressPercent}%`}>
              <View style={styles.groupedRowLeft}>
                <View
                  style={[
                    styles.rowIcon,
                    {backgroundColor: colors.warning + '1A'},
                  ]}>
                  <Icon
                    name="bar-chart-outline"
                    size={18}
                    color={colors.warning}
                  />
                </View>
                <Text style={styles.groupedRowLabel}>Progress</Text>
              </View>
              <Text style={styles.groupedRowValue}>{progressPercent}%</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.sectionHeader}>HOW IT WORKS</Text>
      <View style={styles.groupedCard}>
        <StepRow
          number="1"
          title="Answer Questions"
          description="Share about your personality and preferences"
          colors={colors}
          styles={styles}
        />
        <View style={styles.groupedSeparator} />
        <StepRow
          number="2"
          title="AI Analysis"
          description="Our AI analyzes your responses for key traits"
          colors={colors}
          styles={styles}
        />
        <View style={styles.groupedSeparator} />
        <StepRow
          number="3"
          title="Get Matched"
          description="Find your most compatible matches"
          colors={colors}
          styles={styles}
        />
      </View>

      <View style={styles.buttonContainer}>
        <GradientButton
          title={ctaTitle}
          onPress={() => navigation.navigate('Chatbot')}
          accessibilityLabel={ctaTitle}
        />
      </View>
    </ScrollView>
  );
};

const StepRow: React.FC<{
  number: string;
  title: string;
  description: string;
  colors: ThemeColors;
  styles: any;
}> = ({number, title, description, colors, styles}) => (
  <View
    style={styles.stepRow}
    accessibilityLabel={`Step ${number}: ${title}. ${description}`}>
    <LinearGradient
      colors={[colors.gradient.start, colors.gradient.end]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.stepNumberCircle}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </LinearGradient>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    skeletonContainer: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    largeTitle: {
      ...typography.largeTitle,
      color: c.textPrimary,
      marginBottom: 16,
      marginTop: 8,
    },
    heroCard: {
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
      position: 'relative',
    },
    heroBadgeContainer: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
    heroIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    heroTitle: {
      ...typography.title2,
      color: c.white,
      marginBottom: 8,
      textAlign: 'center',
    },
    heroSubtitle: {
      ...typography.subhead,
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      lineHeight: 20,
    },
    sectionHeader: {
      ...typography.footnote,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      marginLeft: 16,
      marginTop: 4,
    },
    groupedCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      marginBottom: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borderGlass,
    },
    groupedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    groupedRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    groupedRowLabel: {
      ...typography.body,
      color: c.textPrimary,
    },
    groupedRowValue: {
      ...typography.body,
      color: c.textSecondary,
      fontWeight: '500',
    },
    groupedSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.separatorLight,
      marginLeft: 60,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 60,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    stepNumberCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
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
    buttonContainer: {
      paddingVertical: 8,
      paddingHorizontal: 0,
    },
  });
