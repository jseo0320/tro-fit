import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Header } from '../components/common';
import { useExerciseStore } from '../store/exerciseStore';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import { feedbackOptions } from '../utils/mockData';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseFeedback'>;

export default function ExerciseFeedbackScreen({ navigation }: Props) {
  const { currentExercise, selectedFeedback, setSelectedFeedback } = useExerciseStore();

  return (
    <ScreenLayout
      bottom={
        <AppButton
          title="난이도 반영해서 새 안무 만들기"
          onPress={() => navigation.navigate('GeneratingDance', { reason: 'feedback' })}
        />
      }
    >
      <Header title="난이도 피드백" rightLabel="홈" onRightPress={() => navigation.navigate('Home')} />
      <Text style={styles.title}>오늘도 잘하셨어요.</Text>
      <Text style={styles.subtitle}>다음 루틴에 반영할 느낌을 골라주세요.</Text>
      <AppCard style={styles.doneCard}>
        <Text style={styles.doneLabel}>완료한 운동</Text>
        <Text style={styles.doneTitle}>{currentExercise.title}</Text>
        <Text style={styles.doneText}>
          {currentExercise.videoLength} · {currentExercise.songTitle} · {currentExercise.difficulty}
        </Text>
      </AppCard>
      <View style={styles.options}>
        {feedbackOptions.map((option) => {
          const isSelected = selectedFeedback === option.value;

          return (
          <Pressable
            key={option.value}
            onPress={() => setSelectedFeedback(option.value)}
            style={[styles.option, isSelected && styles.selected]}
          >
            <Text style={[styles.optionText, isSelected && styles.selectedText]}>{option.label}</Text>
            <Text style={styles.optionHelper}>{option.helper}</Text>
          </Pressable>
          );
        })}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: typography.titleLarge,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xxxl,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  doneCard: {
    marginTop: spacing.xxl,
  },
  doneLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  doneTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
    marginTop: spacing.xs,
  },
  doneText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  options: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  option: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.xl,
  },
  selected: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.semibold,
  },
  optionHelper: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  selectedText: {
    color: colors.dark,
  },
});
