import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Header } from '../components/common';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { RootStackParamList } from '../types/navigation';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'MeasurementGuide'>;

const checks = [
  {
    title: '전신이 화면에 보이게 서기',
    description: '머리부터 발끝까지 프레임 안에 들어오도록 2~4m 정도 떨어져 주세요.',
  },
  {
    title: '밝고 단순한 배경에서 촬영',
    description: '관절 인식이 잘 되도록 배경과 구분되는 옷을 입으면 좋아요.',
  },
  {
    title: '5초 동안 어깨 움직임 측정',
    description: '정면을 보고 양팔을 천천히 들어 올렸다가 자연스럽게 내려주세요.',
  },
];

export default function MeasurementGuideScreen({ navigation }: Props) {
  return (
    <ScreenLayout bottom={<AppButton title="카메라 측정 시작" onPress={() => navigation.navigate('Measurement')} />}>
      <Header
        rightLabel="홈"
        subtitle="AI가 어깨 움직임을 읽을 수 있도록 짧게 촬영합니다."
        title="측정 준비"
        onRightPress={() => navigation.navigate('Home')}
      />
      <AppCard style={styles.guideCard}>
        <Text style={styles.cardLabel}>어깨 가동 범위 측정</Text>
        <Text style={styles.cardTitle}>카메라 앞에서 5초 동안 팔을 천천히 움직여주세요.</Text>
        <Text style={styles.cardText}>
          측정 영상은 AI 분석용 관절 좌표를 만들기 위한 자료입니다. 빠르게 움직이기보다 천천히
          끝까지 움직이는 것이 더 중요합니다.
        </Text>
      </AppCard>
      <View style={styles.checkList}>
        {checks.map((check, index) => (
          <View key={check.title} style={styles.checkItem}>
            <Text style={styles.checkIcon}>{index + 1}</Text>
            <View style={styles.checkTextBlock}>
              <Text style={styles.checkText}>{check.title}</Text>
              <Text style={styles.checkDescription}>{check.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  guideCard: {
    marginTop: spacing.xxxl,
  },
  cardLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    lineHeight: 32,
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  checkList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  checkItem: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  checkIcon: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
    width: 24,
  },
  checkTextBlock: {
    flex: 1,
  },
  checkText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeights.semibold,
  },
  checkDescription: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
