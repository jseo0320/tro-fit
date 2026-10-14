import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Header } from '../components/common';
import { useExerciseStore } from '../store/exerciseStore';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import { weeklyExercises } from '../utils/mockData';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyDanceLibrary'>;

export default function WeeklyDanceLibraryScreen({ navigation }: Props) {
  const { setCurrentExerciseById } = useExerciseStore();

  const openVideo = (exerciseId: string) => {
    setCurrentExerciseById(exerciseId);
    navigation.navigate('ExercisePlayer', { exerciseId });
  };

  return (
    <ScreenLayout>
      <Header
        title="주차별 안무 영상"
        subtitle="AI가 만든 영상을 모아두는 공간입니다."
        showBack
        onBackPress={() => navigation.goBack()}
        rightLabel="홈"
        onRightPress={() => navigation.navigate('Home')}
      />
      <AppCard style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>영상함</Text>
        <Text style={styles.summaryTitle}>이번 달 생성 영상 {weeklyExercises.length}개</Text>
        <Text style={styles.summaryText}>측정과 난이도 피드백을 반영해 주차별 안무 영상이 쌓입니다.</Text>
      </AppCard>
      <View style={styles.videoList}>
        {weeklyExercises.map((exercise) => (
          <Pressable key={exercise.id} onPress={() => openVideo(exercise.id)} style={styles.videoCard}>
            <View style={styles.thumbnail}>
              <Text style={styles.thumbnailText}>W{exercise.week}</Text>
            </View>
            <View style={styles.videoInfo}>
              <View style={styles.videoTopRow}>
                <Text style={styles.weekLabel}>{exercise.week}주차</Text>
                <Text style={styles.statusBadge}>생성 완료</Text>
              </View>
              <Text style={styles.videoTitle}>{exercise.title}</Text>
              <Text style={styles.videoMeta}>
                {exercise.videoLength} · {exercise.difficulty} · {exercise.generatedAt}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <AppButton
        title="새 측정으로 영상 만들기"
        variant="secondary"
        style={styles.createButton}
        onPress={() => navigation.navigate('MeasurementGuide')}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    marginTop: spacing.xxxl,
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  videoList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  videoCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  thumbnail: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  thumbnailText: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  videoInfo: {
    flex: 1,
  },
  weekLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  videoTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: colors.successSoft,
    borderRadius: 999,
    color: colors.success,
    fontSize: typography.small,
    fontWeight: fontWeights.bold,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  videoTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  videoMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  createButton: {
    marginTop: spacing.xl,
  },
});
