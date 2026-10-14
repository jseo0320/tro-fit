import { create } from 'zustand';
import type { Exercise, FeedbackValue } from '../types/exercise';
import { weeklyExercises } from '../utils/mockData';

type ExerciseState = {
  currentExercise: Exercise;
  selectedFeedback: FeedbackValue | null;
  setCurrentExerciseById: (exerciseId: string) => void;
  setSelectedFeedback: (feedback: FeedbackValue) => void;
};

export const useExerciseStore = create<ExerciseState>((set) => ({
  currentExercise: weeklyExercises[0],
  selectedFeedback: 'just_right',
  setCurrentExerciseById: (exerciseId) =>
    set({
      currentExercise:
        weeklyExercises.find((exercise) => exercise.id === exerciseId) ?? weeklyExercises[0],
    }),
  setSelectedFeedback: (feedback) =>
    set({
      selectedFeedback: feedback,
    }),
}));
