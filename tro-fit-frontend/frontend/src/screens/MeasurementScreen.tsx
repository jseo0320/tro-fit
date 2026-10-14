import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AppButton, Header, ProgressBar } from '../components/common';
import PoseLandmarkerWebView from '../components/measurement/PoseLandmarkerWebView';
import { submitRomLandmarkJson } from '../services/api';
import { analyzePoseImage, canAnalyzePoseOnDevice } from '../services/nativePose';
import { colors, fontWeights, spacing, typography } from '../styles';
import type { LandmarkFrame } from '../types/api';
import type { RootStackParamList } from '../types/navigation';
import { createMockLandmarkFrames } from '../utils/mockLandmarks';
import { createVisionAiRomJsonPayload } from '../utils/visionAiJson';
import ScreenLayout from './ScreenLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Measurement'>;
type MeasurementPhase = 'ready' | 'countdown' | 'recording' | 'complete';
type CapturedPosePhoto = {
  uri: string;
  frameIndex: number;
  timestampMs: number;
};

const COUNTDOWN_SECONDS = 3;
const RECORDING_SECONDS = 5;
const POSE_CAPTURE_INTERVAL_MS = 1600;
const MAX_CAPTURED_POSE_PHOTOS = 3;
const ENABLE_EXPERIMENTAL_WEBVIEW_POSE = false;
const ENABLE_NATIVE_POSE_ANALYSIS = true;

export default function MeasurementScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const recordingStartedAtRef = useRef(0);
  const capturedFrameIndexRef = useRef(0);
  const isCapturingFrameRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<MeasurementPhase>('ready');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [remainingSeconds, setRemainingSeconds] = useState(RECORDING_SECONDS);
  const [cameraReady, setCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [poseStatus, setPoseStatus] = useState('Initializing pose model');
  const [measurementRunId, setMeasurementRunId] = useState(0);
  const [landmarkFrames, setLandmarkFrames] = useState<LandmarkFrame[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPosePhoto[]>([]);

  const canUseCamera = permission?.granted;
  const isBusy = phase === 'countdown' || phase === 'recording';
  const progress =
    phase === 'recording' || phase === 'complete'
      ? (RECORDING_SECONDS - remainingSeconds) / RECORDING_SECONDS
      : 0;

  useEffect(() => {
    if (phase !== 'countdown') {
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);

    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setRemainingSeconds(RECORDING_SECONDS);
          setPhase('recording');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }

    setLandmarkFrames([]);
    setCapturedPhotos([]);
    recordingStartedAtRef.current = Date.now();
    capturedFrameIndexRef.current = 0;
    isCapturingFrameRef.current = false;
    setPoseStatus(canAnalyzePoseOnDevice() ? 'Camera frame capture ready' : 'Native pose module unavailable');
    if (ENABLE_EXPERIMENTAL_WEBVIEW_POSE) {
      setMeasurementRunId((current) => current + 1);
    }

    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setPhase('complete');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [phase]);

  useEffect(() => {
    if (
      phase !== 'recording' ||
      !canUseCamera ||
      !cameraReady ||
      Platform.OS !== 'android' ||
      ENABLE_EXPERIMENTAL_WEBVIEW_POSE ||
      !canAnalyzePoseOnDevice()
    ) {
      return;
    }

    const firstCaptureTimer = setTimeout(capturePosePhoto, 500);
    const timer = setInterval(capturePosePhoto, POSE_CAPTURE_INTERVAL_MS);

    return () => {
      clearTimeout(firstCaptureTimer);
      clearInterval(timer);
    };
  }, [phase, canUseCamera, cameraReady]);

  const startMeasurement = async () => {
    if (!permission?.granted) {
      const nextPermission = await requestPermission();

      if (!nextPermission.granted) {
        return;
      }
    }

    setRemainingSeconds(RECORDING_SECONDS);
    setPhase('countdown');
  };

  const completeMeasurement = async () => {
    setSubmitting(true);

    try {
      const analyzedFrames = await analyzeCapturedPhotos();
      const frames = analyzedFrames.length > 0 ? analyzedFrames : landmarkFrames.length > 0 ? landmarkFrames : createMockLandmarkFrames();
      const sessionId = `rom-${Date.now()}`;
      const payload = createVisionAiRomJsonPayload({
        sessionId,
        measurementType: 'arm_raise',
        joint: 'shoulder',
        movement: 'abduction',
        frames,
        durationSeconds: RECORDING_SECONDS,
      });

      console.log(`ROM frames source: ${analyzedFrames.length > 0 ? 'native-mediapipe' : 'mock-fallback'}`);
      console.log('Measurement analysis summary:', {
        capturedPhotos: capturedPhotos.length,
        analyzedFrames: analyzedFrames.length,
        currentLandmarkFrames: landmarkFrames.length,
        usingMockFallback: analyzedFrames.length === 0 && landmarkFrames.length === 0,
      });
      console.log('Vision AI ROM JSON summary:', {
        sessionId,
        frameCount: payload.frames.length,
        firstFrame: payload.frames[0]?.frame_index,
        lastFrame: payload.frames[payload.frames.length - 1]?.frame_index,
      });
      await submitRomLandmarkJson(payload);
    } catch (error) {
      console.log('ROM landmark JSON submit failed:', error);
    } finally {
      setSubmitting(false);
      navigation.navigate('Analyzing');
    }
  };

  const capturePosePhoto = async () => {
    if (isCapturingFrameRef.current || phase !== 'recording' || !cameraRef.current) {
      return;
    }

    if (capturedFrameIndexRef.current >= MAX_CAPTURED_POSE_PHOTOS) {
      return;
    }

    isCapturingFrameRef.current = true;
    const frameIndex = capturedFrameIndexRef.current;
    const timestampMs = Math.max(0, Date.now() - recordingStartedAtRef.current);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: false,
        exif: false,
        quality: 0.15,
        shutterSound: false,
      });
      setCapturedPhotos((current) => [...current, { uri: photo.uri, frameIndex, timestampMs }]);
      capturedFrameIndexRef.current = frameIndex + 1;
      setPoseStatus(`Captured frames: ${frameIndex + 1}`);
      console.log('Measurement capture summary:', {
        capturedPhotos: frameIndex + 1,
        timestampMs,
      });
    } catch (error) {
      console.log('Pose photo capture failed:', error);
      setPoseStatus('Frame capture failed');
    } finally {
      isCapturingFrameRef.current = false;
    }
  };

  const analyzeCapturedPhotos = async () => {
    if (
      !ENABLE_NATIVE_POSE_ANALYSIS ||
      Platform.OS !== 'android' ||
      !canAnalyzePoseOnDevice() ||
      capturedPhotos.length === 0
    ) {
      if (!ENABLE_NATIVE_POSE_ANALYSIS) {
        setPoseStatus('Native pose analysis disabled');
      }
      return [];
    }

    const frames: LandmarkFrame[] = [];
    setPoseStatus('Analyzing captured frames');

    for (const photo of capturedPhotos) {
      try {
        console.log('Native pose photo analysis start:', {
          frameIndex: photo.frameIndex,
          timestampMs: photo.timestampMs,
          uri: photo.uri,
        });
        const frame = await analyzePoseImage(photo.uri, photo.frameIndex, photo.timestampMs);
        console.log('Native pose photo analysis done:', {
          frameIndex: photo.frameIndex,
          detectedLandmarks: frame ? Object.keys(frame.landmarks).length : 0,
        });
        if (frame && Object.keys(frame.landmarks).length > 0) {
          frames.push(frame);
          setLandmarkFrames([...frames]);
        }
      } catch (error) {
        console.log('Native pose photo analysis failed:', error);
      }
    }

    setPoseStatus(frames.length > 0 ? `Pose frames: ${frames.length}` : 'No pose detected');
    return frames;
  };

  const getBottomButton = () => {
    if (phase === 'complete') {
      return <AppButton loading={submitting} title="분석 시작" onPress={completeMeasurement} />;
    }

    return (
      <AppButton
        disabled={isBusy}
        loading={isBusy}
        title={phase === 'recording' ? '측정 중' : '5초 측정 시작'}
        onPress={startMeasurement}
      />
    );
  };

  return (
    <ScreenLayout bottom={getBottomButton()}>
      <Header
        rightLabel="홈"
        subtitle="어깨 움직임을 5초 동안 촬영합니다."
        title="카메라 측정"
        onRightPress={() => navigation.navigate('Home')}
      />

      <View style={styles.cameraBox}>
        {canUseCamera && Platform.OS !== 'web' && ENABLE_EXPERIMENTAL_WEBVIEW_POSE ? (
          <PoseLandmarkerWebView
            durationMs={RECORDING_SECONDS * 1000}
            measurementRunId={measurementRunId}
            onFramesReady={(frames) => {
              setLandmarkFrames(frames);
              console.log('Pose landmark frames ready:', frames.length);
            }}
            onStatusChange={setPoseStatus}
          />
        ) : canUseCamera ? (
          <CameraView
            ref={cameraRef}
            facing="front"
            mode="picture"
            mute
            style={StyleSheet.absoluteFill}
            onCameraReady={() => setCameraReady(true)}
          />
        ) : (
          <View style={styles.mockCamera}>
            <Text style={styles.mockTitle}>카메라 준비</Text>
            <Text style={styles.mockText}>
              카메라 권한을 허용하면 실제 화면을 보면서 측정할 수 있어요.
            </Text>
            {permission && !permission.granted ? (
              <AppButton
                title="카메라 권한 허용"
                variant="secondary"
                style={styles.permissionButton}
                onPress={requestPermission}
              />
            ) : null}
          </View>
        )}

        <View style={styles.recordingPill}>
          <View style={[styles.recordingDot, phase === 'recording' ? styles.liveDot : styles.readyDot]} />
          <Text style={styles.recordingText}>{phase === 'recording' ? '촬영 중' : '대기 중'}</Text>
        </View>

        {phase === 'countdown' ? (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownText}>정면을 보고 준비해주세요</Text>
          </View>
        ) : null}

        {phase === 'recording' ? (
          <View style={styles.recordingOverlay}>
            <Text style={styles.remainingNumber}>{remainingSeconds}</Text>
            <Text style={styles.remainingText}>초 남음</Text>
          </View>
        ) : null}

        <View style={styles.bodyGuide}>
          <View style={styles.headGuide} />
          <View style={styles.torsoGuide} />
          <View style={styles.leftArmGuide} />
          <View style={styles.rightArmGuide} />
        </View>
        <View style={styles.floorLine} />
      </View>

      <View style={styles.status}>
        <Text style={styles.step}>SHOULDER CHECK</Text>
        <Text style={styles.instruction}>{getInstruction(phase)}</Text>
        <Text style={styles.supportText}>
          팔을 빠르게 흔들지 말고, 양팔을 천천히 들어 올렸다가 내려주세요. 머리부터 발끝까지
          화면에 들어오면 분석 정확도가 좋아집니다.
        </Text>
        <ProgressBar progress={progress} style={styles.progress} />
        <View style={styles.metrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>5초</Text>
            <Text style={styles.metricLabel}>촬영 시간</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>2~4m</Text>
            <Text style={styles.metricLabel}>권장 거리</Text>
          </View>
        </View>
        {Platform.OS === 'web' ? (
          <Text style={styles.webNote}>
            웹에서는 브라우저 카메라 상태에 따라 실제 영상 저장이 제한될 수 있어요. 지금은 AI 연동 전
            측정 흐름과 관절 좌표 생성을 먼저 확인합니다.
          </Text>
        ) : null}
        {canUseCamera && !cameraReady ? (
          <Text style={styles.webNote}>{Platform.OS === 'web' ? '카메라 화면을 불러오는 중입니다.' : poseStatus}</Text>
        ) : null}
        {Platform.OS !== 'web' && (capturedPhotos.length > 0 || landmarkFrames.length > 0) ? (
          <Text style={styles.webNote}>
            Captured: {capturedPhotos.length} / Pose frames: {landmarkFrames.length}
          </Text>
        ) : null}
      </View>
    </ScreenLayout>
  );
}

function getInstruction(phase: MeasurementPhase) {
  if (phase === 'countdown') {
    return '곧 촬영을 시작합니다.';
  }

  if (phase === 'recording') {
    return '양팔을 천천히 들어 올려주세요.';
  }

  if (phase === 'complete') {
    return '측정이 완료되었습니다.';
  }

  return '정면을 보고 편하게 서주세요.';
}

const styles = StyleSheet.create({
  cameraBox: {
    alignItems: 'center',
    backgroundColor: colors.darkBrown,
    borderRadius: 24,
    height: 390,
    justifyContent: 'center',
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  mockCamera: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  mockTitle: {
    color: colors.card,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  mockText: {
    color: colors.primarySoft,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: spacing.xl,
  },
  recordingPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    top: spacing.lg,
    zIndex: 3,
  },
  recordingDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  liveDot: {
    backgroundColor: colors.danger,
  },
  readyDot: {
    backgroundColor: colors.warning,
  },
  recordingText: {
    color: colors.card,
    fontSize: typography.caption,
    fontWeight: fontWeights.semibold,
  },
  countdownOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 15, 12, 0.72)',
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    position: 'absolute',
    zIndex: 4,
  },
  countdownNumber: {
    color: colors.card,
    fontSize: 58,
    fontWeight: fontWeights.bold,
  },
  countdownText: {
    color: colors.primarySoft,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  recordingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    zIndex: 3,
  },
  remainingNumber: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
  },
  remainingText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  bodyGuide: {
    alignItems: 'center',
    height: 275,
    justifyContent: 'flex-start',
    opacity: 0.86,
    position: 'absolute',
    width: 190,
  },
  headGuide: {
    borderColor: colors.primaryLight,
    borderRadius: 28,
    borderWidth: 2,
    height: 48,
    width: 48,
  },
  torsoGuide: {
    borderColor: colors.primaryLight,
    borderRadius: 30,
    borderWidth: 2,
    height: 120,
    marginTop: spacing.sm,
    width: 86,
  },
  leftArmGuide: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    height: 3,
    left: 12,
    position: 'absolute',
    top: 94,
    transform: [{ rotate: '-34deg' }],
    width: 78,
  },
  rightArmGuide: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    height: 3,
    position: 'absolute',
    right: 12,
    top: 94,
    transform: [{ rotate: '34deg' }],
    width: 78,
  },
  floorLine: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    bottom: 58,
    height: 3,
    opacity: 0.7,
    position: 'absolute',
    width: 210,
  },
  status: {
    marginTop: spacing.xl,
  },
  step: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: fontWeights.bold,
  },
  instruction: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: fontWeights.bold,
    marginTop: spacing.sm,
  },
  supportText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  progress: {
    marginTop: spacing.lg,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  metricItem: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: spacing.lg,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: fontWeights.bold,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  webNote: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
