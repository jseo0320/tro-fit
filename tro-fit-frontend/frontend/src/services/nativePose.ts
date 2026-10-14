import { NativeModules, Platform } from 'react-native';
import type { LandmarkFrame, LandmarkPoint } from '../types/api';

type NativePosePoint = LandmarkPoint & {
  presence?: number | null;
  pixel_x?: number;
  pixel_y?: number;
};

type NativePoseFrameRecord = {
  frame_index: number;
  timestamp_ms: number;
  detected: boolean;
  num_poses: number;
  image_width: number;
  image_height: number;
  poses: Array<{
    pose_index: number;
    landmarks: Record<string, NativePosePoint>;
    world_landmarks?: Record<string, NativePosePoint>;
  }>;
};

type TrofitPoseModule = {
  analyzeImage(uri: string, frameIndex: number, timestampMs: number): Promise<NativePoseFrameRecord>;
};

const nativeModule = NativeModules.TrofitPoseModule as TrofitPoseModule | undefined;

export function canAnalyzePoseOnDevice() {
  return Platform.OS === 'android' && Boolean(nativeModule);
}

export async function analyzePoseImage(
  uri: string,
  frameIndex: number,
  timestampMs: number,
): Promise<LandmarkFrame | null> {
  if (!canAnalyzePoseOnDevice() || !nativeModule) {
    return null;
  }

  const record = await nativeModule.analyzeImage(uri, frameIndex, timestampMs);
  if (!record.detected || record.poses.length === 0) {
    return {
      frameIndex: record.frame_index,
      timestampMs: record.timestamp_ms,
      imageWidth: record.image_width,
      imageHeight: record.image_height,
      landmarks: {},
      worldLandmarks: {},
    };
  }

  const pose = record.poses[0];
  return {
    frameIndex: record.frame_index,
    timestampMs: record.timestamp_ms,
    imageWidth: record.image_width,
    imageHeight: record.image_height,
    landmarks: stripNativePointExtras(pose.landmarks),
    worldLandmarks: stripNativePointExtras(pose.world_landmarks ?? {}),
  };
}

function stripNativePointExtras(points: Record<string, NativePosePoint>): Record<string, LandmarkPoint> {
  return Object.fromEntries(
    Object.entries(points).map(([name, point]) => [
      name,
      {
        x: point.x,
        y: point.y,
        z: point.z,
        visibility: point.visibility,
      },
    ]),
  );
}
