import type { LandmarkFrame, MeasurementType } from '../types/api';
import type { VisionAiFrameRecord, VisionAiLandmark, VisionAiRomJsonPayload } from '../types/visionAi';

type CreateVisionAiRomJsonOptions = {
  sessionId: string;
  measurementType: MeasurementType;
  joint?: string;
  movement?: string;
  frames: LandmarkFrame[];
  imageWidth?: number;
  imageHeight?: number;
  durationSeconds?: number;
  visibilityThreshold?: number;
};

const DEFAULT_IMAGE_WIDTH = 720;
const DEFAULT_IMAGE_HEIGHT = 1280;
const DEFAULT_VISIBILITY_THRESHOLD = 0.65;

function toVisionAiLandmarks(
  landmarks: LandmarkFrame['landmarks'],
  imageWidth: number,
  imageHeight: number,
  includePixels: boolean,
): Record<string, VisionAiLandmark> {
  return Object.fromEntries(
    Object.entries(landmarks).map(([name, point]) => [
      name,
      {
        x: round6(point.x),
        y: round6(point.y),
        z: round6(point.z),
        visibility: point.visibility === undefined ? 1 : round6(point.visibility),
        presence: null,
        ...(includePixels
          ? {
              pixel_x: Math.round(point.x * imageWidth),
              pixel_y: Math.round(point.y * imageHeight),
            }
          : {}),
      },
    ]),
  );
}

function toVisionAiFrameRecord(
  frame: LandmarkFrame,
  imageWidth: number,
  imageHeight: number,
): VisionAiFrameRecord {
  const detected = Object.keys(frame.landmarks).length > 0;

  return {
    frame_index: frame.frameIndex,
    timestamp_ms: frame.timestampMs,
    detected,
    num_poses: detected ? 1 : 0,
    image_width: imageWidth,
    image_height: imageHeight,
    poses: detected
      ? [
          {
            pose_index: 0,
            landmarks: toVisionAiLandmarks(frame.landmarks, imageWidth, imageHeight, true),
            world_landmarks: toVisionAiLandmarks(frame.worldLandmarks ?? frame.landmarks, imageWidth, imageHeight, false),
          },
        ]
      : [],
  };
}

export function createVisionAiRomJsonPayload({
  sessionId,
  measurementType,
  joint = 'shoulder',
  movement = 'abduction',
  frames,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  durationSeconds,
  visibilityThreshold = DEFAULT_VISIBILITY_THRESHOLD,
}: CreateVisionAiRomJsonOptions): VisionAiRomJsonPayload {
  return {
    session_id: sessionId,
    measurement_type: measurementType,
    joint,
    movement,
    measurement: {
      duration_s: durationSeconds ?? inferDurationSeconds(frames),
      frame_count: frames.length,
      use_world_landmarks: frames.some((frame) => Boolean(frame.worldLandmarks)),
      visibility_threshold: visibilityThreshold,
    },
    frames: frames.map((frame) =>
      toVisionAiFrameRecord(frame, frame.imageWidth ?? imageWidth, frame.imageHeight ?? imageHeight),
    ),
  };
}

export function stringifyVisionAiRomJson(payload: VisionAiRomJsonPayload) {
  return JSON.stringify(payload, null, 2);
}

function inferDurationSeconds(frames: LandmarkFrame[]) {
  if (frames.length < 2) {
    return 0;
  }

  const firstMs = frames[0].timestampMs;
  const lastMs = frames[frames.length - 1].timestampMs;
  return Math.max(0, (lastMs - firstMs) / 1000);
}

function round6(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
