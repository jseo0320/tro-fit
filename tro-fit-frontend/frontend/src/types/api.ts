import type { FeedbackValue } from './exercise';

export type RiskLevel = 'low' | 'moderate' | 'high';
export type JointRisk = 'normal' | 'caution' | 'danger';
export type MeasurementType = 'squat' | 'arm_raise' | 'trunk_flexion' | 'full_assessment';
export type VideoStatus = 'ready' | 'generating' | 'failed';

export type AuthUser = {
  id: number;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  age?: number;
  heightCm?: number;
  weightKg?: number;
};

export type LoginRequest = {
  userId: string;
  password: string;
};

export type SignupRequest = {
  userId: string;
  name: string;
  email: string;
  password: string;
  age: number;
  heightCm: number;
  weightKg: number;
  mobilityLevel?: 'comfortable' | 'limited' | 'needs_help';
};

export type AuthResponse = {
  accessToken: string;
  tokenType: 'bearer' | string;
  user?: AuthUser;
};

export type UpdateProfileRequest = {
  name: string;
  email: string;
  age: number;
  heightCm: number;
  weightKg: number;
};

export type LandmarkPoint = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type LandmarkFrame = {
  frameIndex: number;
  timestampMs: number;
  imageWidth?: number;
  imageHeight?: number;
  landmarks: Record<string, LandmarkPoint>;
  worldLandmarks?: Record<string, LandmarkPoint>;
};

export type AnalyzeRomRequest = {
  sessionId: string;
  measurementType: MeasurementType;
  frames: LandmarkFrame[];
};

export type JointAnalysisResult = {
  angleDeg: number | null;
  reliable: boolean;
  risk: JointRisk | null;
};

export type RomAnalysisResult = {
  sessionId: string;
  analyzedAt: string;
  joints: Record<string, JointAnalysisResult>;
  fallsScore: number;
  riskLevel: RiskLevel;
  weakJoints: string[];
  recommendedDifficulty: 'easy' | 'normal' | 'hard';
};

export type GenerateChoreographyRequest = {
  sessionId: string;
  romResult: RomAnalysisResult;
};

export type WeeklyDanceVideo = {
  videoId: string;
  week: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSec: number;
  difficulty: 'easy' | 'normal' | 'hard';
  status: VideoStatus;
  createdAt: string;
  chapters: string[];
};

export type GenerateChoreographyResponse = {
  requestId: string;
  status: VideoStatus;
  video?: WeeklyDanceVideo;
  estimatedSeconds?: number;
};

export type SubmitDifficultyFeedbackRequest = {
  videoId: string;
  feedback: FeedbackValue;
};

export type SubmitDifficultyFeedbackResponse = {
  accepted: boolean;
  nextAction: 'regenerate' | 'save_only';
};
