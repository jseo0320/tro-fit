import type { LandmarkPoint, MeasurementType } from './api';

export type VisionAiLandmark = LandmarkPoint & {
  presence?: number | null;
  pixel_x?: number;
  pixel_y?: number;
};

export type VisionAiPose = {
  pose_index: number;
  landmarks: Record<string, VisionAiLandmark>;
  world_landmarks: Record<string, VisionAiLandmark>;
};

export type VisionAiFrameRecord = {
  frame_index: number;
  timestamp_ms: number;
  detected: boolean;
  num_poses: number;
  image_width: number;
  image_height: number;
  poses: VisionAiPose[];
};

export type VisionAiRomJsonPayload = {
  session_id: string;
  measurement_type: MeasurementType;
  joint: string;
  movement: string;
  measurement: {
    duration_s: number;
    frame_count: number;
    use_world_landmarks: boolean;
    visibility_threshold: number;
  };
  frames: VisionAiFrameRecord[];
};
