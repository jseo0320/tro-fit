import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/common';
import { useExerciseStore } from '../store/exerciseStore';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import { weeklyExercises } from '../utils/mockData';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { setCurrentExerciseById } = useExerciseStore();
  const exercise = weeklyExercises[0];

  const openLatestDance = () => {
    setCurrentExerciseById(exercise.id);
    navigation.navigate('ExercisePlayer', { exerciseId: exercise.id });
  };

  return (
    <ScreenLayout>
      <View style={styles.topBar}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.userName}>이번 주 루틴이 준비됐어요</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.profileButton}
          onPress={() => navigation.navigate('MyPage')}
        >
          <Text style={styles.profileButtonText}>내 정보</Text>
        </Pressable>
      </View>

      <View style={styles.statusStrip}>
        <View style={styles.statusItem}>
          <Text style={styles.statusValue}>2</Text>
          <Text style={styles.statusLabel}>생성 영상</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Text style={styles.statusValue}>+12%</Text>
          <Text style={styles.statusLabel}>움직임 변화</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Text style={styles.statusValue}>3일</Text>
          <Text style={styles.statusLabel}>이번 주</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Text style={styles.label}>최근 영상</Text>
          <Text style={styles.readyBadge}>생성 완료</Text>
        </View>
        <Text style={styles.heroTitle}>{exercise.title}</Text>
        <Text style={styles.heroText}>{exercise.note}</Text>
        <View style={styles.videoPreview}>
          <View style={styles.previewOverlay}>
            <Text style={styles.playMark}>재생</Text>
          </View>
          <View style={styles.previewCaption}>
            <Text style={styles.previewWeek}>{exercise.week}주차</Text>
            <Text style={styles.previewMeta}>
              {exercise.videoLength} · {exercise.difficulty}
            </Text>
          </View>
        </View>
        <AppButton title="최근 영상 열기" style={styles.startButton} onPress={openLatestDance} />
      </View>

      <View style={styles.quickActions}>
        <Pressable style={styles.quickAction} onPress={() => navigation.navigate('WeeklyDanceLibrary')}>
          <Text style={styles.quickIcon}>01</Text>
          <Text style={styles.quickTitle}>영상함</Text>
          <Text style={styles.quickText}>주차별 보기</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => navigation.navigate('MeasurementGuide')}>
          <Text style={styles.quickIcon}>02</Text>
          <Text style={styles.quickTitle}>측정</Text>
          <Text style={styles.quickText}>새 영상 생성</Text>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => navigation.navigate('MonthlyReport')}>
          <Text style={styles.quickIcon}>03</Text>
          <Text style={styles.quickTitle}>리포트</Text>
          <Text style={styles.quickText}>변화 확인</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  profileButton: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  profileButtonText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  statusStrip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusValue: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.sm,
  },
  statusDivider: {
    backgroundColor: colors.border,
    height: 34,
    width: 1,
  },
  heroCard: {
    backgroundColor: colors.darkBrown,
    borderRadius: 28,
    padding: spacing.xl,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.primaryLight,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  readyBadge: {
    backgroundColor: colors.card,
    borderRadius: 999,
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroTitle: {
    color: colors.card,
    fontSize: typography.titleLarge,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
    marginTop: spacing.lg,
  },
  heroText: {
    color: colors.primarySoft,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  videoPreview: {
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    height: 180,
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  previewOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginTop: spacing.xl,
    width: 56,
  },
  playMark: {
    color: colors.card,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
  },
  previewCaption: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
  },
  previewWeek: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  previewMeta: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  startButton: {
    marginTop: spacing.xl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  quickAction: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 118,
    padding: spacing.md,
  },
  quickIcon: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  quickTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeights.bold,
    marginTop: spacing.sm,
  },
  quickText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
