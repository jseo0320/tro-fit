import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Header } from '../components/common';
import { useExerciseStore } from '../store/exerciseStore';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import { feedbackOptions, reportScores } from '../utils/mockData';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'MonthlyReport'>;

export default function MonthlyReportScreen({ navigation }: Props) {
  const { currentExercise, selectedFeedback } = useExerciseStore();
  const feedbackLabel =
    feedbackOptions.find((option) => option.value === selectedFeedback)?.label ?? '아직 없음';

  return (
    <ScreenLayout bottom={<AppButton title="홈으로 돌아가기" onPress={() => navigation.navigate('Home')} />}>
      <Header
        title="월간 리포트"
        subtitle="이번 달 움직임 변화입니다."
        showBack
        onBackPress={() => navigation.goBack()}
        rightLabel="홈"
        onRightPress={() => navigation.navigate('Home')}
      />
      <AppCard style={styles.summary}>
        <Text style={styles.summaryValue}>+12%</Text>
        <Text style={styles.summaryText}>지난 측정보다 가동성이 좋아졌어요.</Text>
        <Text style={styles.summaryMeta}>
          최근 루틴: {currentExercise.title} · 피드백: {feedbackLabel}
        </Text>
      </AppCard>
      <View style={styles.weekCard}>
        <Text style={styles.weekLabel}>이번 주 기록</Text>
        <View style={styles.weekStats}>
          <View>
            <Text style={styles.weekValue}>3회</Text>
            <Text style={styles.weekCaption}>운동 완료</Text>
          </View>
          <View>
            <Text style={styles.weekValue}>34분</Text>
            <Text style={styles.weekCaption}>총 운동 시간</Text>
          </View>
          <View>
            <Text style={styles.weekValue}>좋음</Text>
            <Text style={styles.weekCaption}>최근 피드백</Text>
          </View>
        </View>
      </View>
      <View style={styles.scoreList}>
        {reportScores.map((score) => (
          <View key={score.label} style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>{score.label}</Text>
              <Text style={styles.scoreChange}>{score.change}</Text>
            </View>
            <Text style={styles.scoreValue}>{score.value}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginTop: spacing.xxxl,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: fontWeights.bold,
  },
  summaryText: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.semibold,
    lineHeight: 26,
    marginTop: spacing.sm,
  },
  summaryMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.md,
  },
  weekCard: {
    backgroundColor: colors.backgroundSoft,
    borderRadius: 20,
    marginTop: spacing.md,
    padding: spacing.xl,
  },
  weekLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.lg,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekValue: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
  },
  weekCaption: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  scoreList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  scoreRow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  scoreLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  scoreValue: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  scoreChange: {
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.xs,
  },
});
