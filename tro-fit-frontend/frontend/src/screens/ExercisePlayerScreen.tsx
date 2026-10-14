import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Header, ProgressBar } from '../components/common';
import { useExerciseStore } from '../store/exerciseStore';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'ExercisePlayer'>;

export default function ExercisePlayerScreen({ navigation, route }: Props) {
  const { currentExercise, setCurrentExerciseById } = useExerciseStore();

  useEffect(() => {
    setCurrentExerciseById(route.params.exerciseId);
  }, [route.params.exerciseId, setCurrentExerciseById]);

  return (
    <ScreenLayout
      bottom={<AppButton title="난이도 피드백 남기기" onPress={() => navigation.navigate('ExerciseFeedback', { exerciseId: route.params.exerciseId })} />}
    >
      <Header
        title={`${currentExercise.week}주차 안무 영상`}
        subtitle="생성된 영상을 열어 따라 하는 화면입니다."
        showBack
        onBackPress={() => navigation.goBack()}
        rightLabel="홈"
        onRightPress={() => navigation.navigate('Home')}
      />
      <View style={styles.stage}>
        <View style={styles.videoChrome}>
          <View style={styles.character}>
            <View style={styles.head} />
            <View style={styles.body} />
            <View style={styles.armLeft} />
            <View style={styles.armRight} />
          </View>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        </View>
        <Text style={styles.stageText}>{currentExercise.title}</Text>
        <Text style={styles.stageSubText}>AI 생성 영상 · {currentExercise.generatedAt}</Text>
        <View style={styles.castPill}>
          <Text style={styles.castText}>생성된 안무 영상</Text>
        </View>
      </View>
      <AppCard style={styles.musicCard}>
        <Text style={styles.nowPlaying}>WEEK {currentExercise.week} VIDEO</Text>
        <Text style={styles.song}>{currentExercise.songTitle}</Text>
        <Text style={styles.meta}>
          {currentExercise.artist} · {currentExercise.subtitle} · {currentExercise.difficulty}
        </Text>
        <ProgressBar progress={0.34} style={styles.progress} />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>04:05</Text>
          <Text style={styles.timeText}>{currentExercise.videoLength}</Text>
        </View>
        <View style={styles.chapterList}>
          {currentExercise.chapters.map((chapter, index) => (
            <View key={chapter} style={styles.chapterItem}>
              <Text style={styles.chapterIndex}>{index + 1}</Text>
              <Text style={styles.chapterText}>{chapter}</Text>
            </View>
          ))}
        </View>
        <AppButton
          title="영상함으로 돌아가기"
          variant="secondary"
          style={styles.castButton}
          onPress={() => navigation.navigate('WeeklyDanceLibrary')}
        />
      </AppCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 26,
    height: 330,
    justifyContent: 'center',
    marginTop: spacing.xxl,
    padding: spacing.xl,
  },
  character: {
    alignItems: 'center',
    height: 150,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 180,
  },
  videoChrome: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 22,
    height: 190,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    bottom: spacing.md,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    width: 48,
  },
  playIcon: {
    color: colors.card,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
    marginLeft: 2,
  },
  head: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  body: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 84,
    marginTop: spacing.xs,
    width: 58,
  },
  armLeft: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    height: 18,
    left: 20,
    position: 'absolute',
    top: 72,
    transform: [{ rotate: '-22deg' }],
    width: 76,
  },
  armRight: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    height: 18,
    position: 'absolute',
    right: 20,
    top: 72,
    transform: [{ rotate: '22deg' }],
    width: 76,
  },
  stageText: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  stageSubText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  castPill: {
    backgroundColor: colors.card,
    borderRadius: 999,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  castText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  musicCard: {
    marginTop: spacing.xl,
  },
  nowPlaying: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  song: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  progress: {
    marginTop: spacing.xl,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  castButton: {
    marginTop: spacing.lg,
  },
  chapterList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  chapterItem: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  chapterIndex: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    width: 18,
  },
  chapterText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: typography.body,
  },
});
