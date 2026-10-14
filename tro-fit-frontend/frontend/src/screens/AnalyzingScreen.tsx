import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, ProgressBar } from '../components/common';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Analyzing'>;

const steps = [
  {
    title: '관절 가동 범위 확인',
    status: '완료',
  },
  {
    title: '균형감각 확인',
    status: '완료',
  },
  {
    title: '오늘의 운동 구성',
    status: '진행 중',
  },
];

export default function AnalyzingScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('GeneratingDance', { reason: 'measurement' });
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.center}>
        <View style={styles.analysisMark}>
          <Text style={styles.analysisMarkText}>AI</Text>
        </View>
        <Text style={styles.title}>AI 분석 중</Text>
        <Text style={styles.subtitle}>움직임을 보고 오늘의 루틴을 고르고 있어요.</Text>
        <ProgressBar progress={0.76} style={styles.progress} />
        <AppCard style={styles.card}>
          {steps.map((step) => (
            <View key={step.title} style={styles.stepRow}>
              <Text style={styles.stepTitle}>✓ {step.title}</Text>
              <Text style={[styles.stepStatus, step.status === '진행 중' && styles.activeStatus]}>
                {step.status}
              </Text>
            </View>
          ))}
        </AppCard>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  analysisMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: 64,
  },
  analysisMarkText: {
    color: colors.card,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.titleLarge,
    fontWeight: fontWeights.bold,
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
    marginTop: spacing.xxl,
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepTitle: {
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
});
