export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  MeasurementGuide: undefined;
  Measurement: undefined;
  Analyzing: undefined;
  GeneratingDance: {
    reason?: 'measurement' | 'feedback';
  };
  Home: undefined;
  MyPage: undefined;
  WeeklyDanceLibrary: undefined;
  ExercisePlayer: {
    exerciseId: string;
  };
  ExerciseFeedback: {
    exerciseId: string;
  };
  MonthlyReport: undefined;
};
