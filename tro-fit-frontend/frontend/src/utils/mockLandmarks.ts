import type { LandmarkFrame } from '../types/api';

const landmarkNames = [
  'nose',
  'left_eye_inner',
  'left_eye',
  'left_eye_outer',
  'right_eye_inner',
  'right_eye',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth_left',
  'mouth_right',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_pinky',
  'right_pinky',
  'left_index',
  'right_index',
  'left_thumb',
  'right_thumb',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
];

const basePose: Record<string, { x: number; y: number; z: number }> = {
  nose: { x: 0.5, y: 0.12, z: -0.1 },
  left_eye_inner: { x: 0.48, y: 0.1, z: -0.1 },
  left_eye: { x: 0.47, y: 0.1, z: -0.1 },
  left_eye_outer: { x: 0.46, y: 0.1, z: -0.1 },
  right_eye_inner: { x: 0.52, y: 0.1, z: -0.1 },
  right_eye: { x: 0.53, y: 0.1, z: -0.1 },
  right_eye_outer: { x: 0.54, y: 0.1, z: -0.1 },
  left_ear: { x: 0.43, y: 0.12, z: -0.08 },
  right_ear: { x: 0.57, y: 0.12, z: -0.08 },
  mouth_left: { x: 0.47, y: 0.16, z: -0.08 },
  mouth_right: { x: 0.53, y: 0.16, z: -0.08 },
  left_shoulder: { x: 0.38, y: 0.28, z: 0 },
  right_shoulder: { x: 0.62, y: 0.28, z: 0 },
  left_elbow: { x: 0.3, y: 0.44, z: 0.02 },
  right_elbow: { x: 0.7, y: 0.44, z: 0.02 },
  left_wrist: { x: 0.26, y: 0.6, z: 0.04 },
  right_wrist: { x: 0.74, y: 0.6, z: 0.04 },
  left_pinky: { x: 0.24, y: 0.62, z: 0.04 },
  right_pinky: { x: 0.76, y: 0.62, z: 0.04 },
  left_index: { x: 0.25, y: 0.63, z: 0.04 },
  right_index: { x: 0.75, y: 0.63, z: 0.04 },
  left_thumb: { x: 0.27, y: 0.62, z: 0.04 },
  right_thumb: { x: 0.73, y: 0.62, z: 0.04 },
  left_hip: { x: 0.43, y: 0.58, z: 0 },
  right_hip: { x: 0.57, y: 0.58, z: 0 },
  left_knee: { x: 0.43, y: 0.76, z: 0.02 },
  right_knee: { x: 0.57, y: 0.76, z: 0.02 },
  left_ankle: { x: 0.43, y: 0.94, z: 0.03 },
  right_ankle: { x: 0.57, y: 0.94, z: 0.03 },
  left_heel: { x: 0.41, y: 0.97, z: 0.04 },
  right_heel: { x: 0.59, y: 0.97, z: 0.04 },
  left_foot_index: { x: 0.45, y: 0.99, z: 0.05 },
  right_foot_index: { x: 0.55, y: 0.99, z: 0.05 },
};

export function createMockLandmarkFrames(frameCount = 30): LandmarkFrame[] {
  return Array.from({ length: frameCount }, (_, frameIndex) => {
    const lift = Math.min(frameIndex / Math.max(frameCount - 1, 1), 1) * 0.28;
    const landmarks = Object.fromEntries(
      landmarkNames.map((name) => {
        const base = basePose[name];
        const isLeftArm = name === 'left_elbow' || name === 'left_wrist' || name === 'left_pinky' || name === 'left_index' || name === 'left_thumb';
        const y = isLeftArm ? base.y - lift : base.y;

        return [
          name,
          {
            x: base.x,
            y,
            z: base.z,
            visibility: 0.95,
          },
        ];
      }),
    );

    return {
      frameIndex,
      timestampMs: frameIndex * 100,
      landmarks,
      worldLandmarks: landmarks,
    };
  });
}
