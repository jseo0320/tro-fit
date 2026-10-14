export type Exercise = {
  id: string;
  week: number;
  title: string;
  subtitle: string;
  duration: string;
  difficulty: string;
  focus: string;
  songTitle: string;
  artist: string;
  recommendation: string;
  note: string;
  videoStatus: 'ready' | 'generating';
  generatedAt: string;
  videoLength: string;
  chapters: string[];
};

export type FeedbackValue = 'too_fast' | 'just_right' | 'too_hard' | 'more';

export type FeedbackOption = {
  value: FeedbackValue;
  label: string;
  helper: string;
};

export type ReportScore = {
  label: string;
  value: number;
  change: string;
};
