import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Header, ProgressBar } from '../components/common';
import { useExerciseStore } from '../store/exerciseStore';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'GeneratingDance'>;

const buildSteps = [
  '측정 결과 정리',
    '난이도와 동작 속도 조정',
  '한 주 안무 영상 생성',
];

export default function GeneratingDanceScreen({ navigation, route }: Props) {
  const { currentExercise } = useExerciseStore();
  const isFeedbackRegeneration = route.params?.reason === 'feedback';

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('WeeklyDanceLibrary');
    }, 2600);

    return () => clearTimeout(timer);
  }, [currentExercise.id, navigation]);

  return (
    <ScreenLayout
      bottom={
        <AppButton
          title="주차별 영상함 보기"
          onPress={() => navigation.replace('WeeklyDanceLibrary')}
        />
      }
    >
      <Header title="안무 영상 생성 중" rightLabel="홈" onRightPress={() => navigation.navigate('Home')} />
      <View style={styles.hero}>
        <Text style={styles.kicker}>{isFeedbackRegeneration ? 'FEEDBACK APPLIED' : 'AI DANCE BUILD'}</Text>
        <Text style={styles.title}>
          {isFeedbackRegeneration ? '난이도에 맞춰 새 안무를 만들고 있어요.' : '이번 주 맞춤 안무를 만들고 있어요.'}
        </Text>
        <Text style={styles.subtitle}>
          실제 서비스에서는 영상 생성에 몇 분이 걸릴 수 있어요. 완성되면 이번 주 안무에 자동 반영됩니다.
        </Text>
      </View>
      <ProgressBar progress={0.58} style={styles.progress} />
      <AppCard style={styles.card}>
        {buildSteps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <Text style={styles.stepText}>{step}</Text>
            <Text style={[styles.stepStatus, index === 2 && styles.activeStatus]}>
              {index < 2 ? '완료' : '진행 중'}
            </Text>
          </View>
        ))}
      </AppCard>
      <AppCard style={styles.resultCard}>
        <Text style={styles.resultLabel}>생성될 영상</Text>
        <Text style={styles.resultTitle}>{currentExercise.title}</Text>
        <Text style={styles.resultText}>{currentExercise.duration} · {currentExercise.songTitle} · 영상함에 저장됨</Text>
      </AppCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: spacing.xxxl,
  },
  kicker: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.titleLarge,
    fontWeight: fontWeights.bold,
    lineHeight: 36,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  progress: {
    marginTop: spacing.xxl,
  },
  card: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepText: {
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  stepStatus: {
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  activeStatus: {
    color: colors.primary,
  },
  resultCard: {
    marginTop: spacing.md,
  },
  resultLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  resultText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
});
