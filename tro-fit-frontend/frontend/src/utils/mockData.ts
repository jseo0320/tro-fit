import type { Exercise, FeedbackOption, ReportScore } from '../types/exercise';

export const weeklyExercises: Exercise[] = [
  {
    id: 'week1-shoulder',
    week: 1,
    title: '어깨와 팔 열기',
    subtitle: 'Shoulders & Arms',
    duration: '약 4분',
    difficulty: '쉬움',
    focus: '어깨 가동성',
    songTitle: '아모르 파티',
    artist: '김연자',
    recommendation: '팔을 크게 여는 동작을 먼저 배치했어요.',
    note: '빠른 스텝은 줄이고 상체 움직임을 천천히 키우는 루틴입니다.',
    videoStatus: 'ready',
    generatedAt: '2026.06.11',
    videoLength: '4:05',
    chapters: ['준비 호흡', '팔 열기', '어깨 돌리기', '마무리 스트레칭'],
  },
  {
    id: 'week2-waist',
    week: 2,
    title: '허리 부드럽게 돌리기',
    subtitle: 'Waist Twist',
    duration: '약 4분',
    difficulty: '쉬움',
    focus: '허리 유연성',
    songTitle: '찐이야',
    artist: '영탁',
    recommendation: '허리에 부담이 덜한 회전 동작으로 구성했어요.',
    note: '앉았다 일어나는 동작 없이 서서 따라 할 수 있습니다.',
    videoStatus: 'ready',
    generatedAt: '2026.06.18',
    videoLength: '4:12',
    chapters: ['가벼운 스텝', '허리 트위스트', '옆구리 열기', '천천히 정리'],
  },
];

export const feedbackOptions: FeedbackOption[] = [
  {
    value: 'too_fast',
    label: '조금 빨랐어요',
    helper: '다음 루틴은 박자를 낮춰요.',
  },
  {
    value: 'just_right',
    label: '딱 좋았어요',
    helper: '현재 난이도를 유지해요.',
  },
  {
    value: 'too_hard',
    label: '조금 어려웠어요',
    helper: '동작 범위를 더 작게 잡아요.',
  },
  {
    value: 'more',
    label: '더 하고 싶어요',
    helper: '다음 주 운동 시간을 살짝 늘려요.',
  },
];

export const reportScores: ReportScore[] = [
  {
    label: '관절 가동성',
    value: 72,
    change: '+12%',
  },
  {
    label: '균형감각',
    value: 68,
    change: '+6%',
  },
  {
    label: '무릎 유연성',
    value: 74,
    change: '+9%',
  },
];
