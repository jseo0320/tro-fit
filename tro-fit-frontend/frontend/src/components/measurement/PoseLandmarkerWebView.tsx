import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { LandmarkFrame } from '../../types/api';
import { colors, spacing, typography } from '../../styles';

type PoseLandmarkerWebViewProps = {
  durationMs?: number;
  measurementRunId: number;
  onFramesReady: (frames: LandmarkFrame[]) => void;
  onStatusChange?: (status: string) => void;
};

type PoseMessage =
  | { type: 'status'; status: string }
  | { type: 'frames'; frames: LandmarkFrame[] }
  | { type: 'error'; message: string };

export default function PoseLandmarkerWebView({
  durationMs = 5000,
  measurementRunId,
  onFramesReady,
  onStatusChange,
}: PoseLandmarkerWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const html = useMemo(() => createPoseLandmarkerHtml(), []);

  useEffect(() => {
    if (measurementRunId <= 0) {
      return;
    }

    webViewRef.current?.injectJavaScript(`
      window.startPoseMeasurement && window.startPoseMeasurement(${durationMs});
      true;
    `);
  }, [durationMs, measurementRunId]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Mobile development build required</Text>
      </View>
    );
  }

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as PoseMessage;

      if (message.type === 'frames') {
        onFramesReady(message.frames);
        return;
      }

      if (message.type === 'status') {
        onStatusChange?.(message.status);
        return;
      }

      onStatusChange?.(message.message);
      console.log('Pose landmarker error:', message.message);
    } catch (error) {
      console.log('Invalid pose landmarker message:', error);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      allowFileAccess
      allowUniversalAccessFromFileURLs
      allowsInlineMediaPlayback
      androidLayerType="hardware"
      domStorageEnabled
      javaScriptEnabled
      javaScriptCanOpenWindowsAutomatically
      mediaCapturePermissionGrantType="grant"
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode="always"
      originWhitelist={['*']}
      source={{ html, baseUrl: 'https://localhost' }}
      style={StyleSheet.absoluteFill}
      webviewDebuggingEnabled
      onError={(event) => {
        const { description } = event.nativeEvent;
        onStatusChange?.(`WebView error: ${description}`);
        console.log('Pose WebView error:', event.nativeEvent);
      }}
      onHttpError={(event) => {
        onStatusChange?.(`WebView HTTP ${event.nativeEvent.statusCode}`);
        console.log('Pose WebView HTTP error:', event.nativeEvent);
      }}
      onLoadEnd={() => {
        console.log('Pose WebView loaded');
      }}
      onMessage={handleMessage}
    />
  );
}

function createPoseLandmarkerHtml() {
  return String.raw`
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <style>
      html, body {
        background: #1f100d;
        height: 100%;
        margin: 0;
        overflow: hidden;
        width: 100%;
      }
      video, canvas {
        height: 100%;
        left: 0;
        object-fit: cover;
        position: absolute;
        top: 0;
        transform: scaleX(-1);
        width: 100%;
      }
      #status {
        background: rgba(30, 15, 12, 0.72);
        border-radius: 999px;
        color: #fff7ef;
        font: 600 12px system-ui, sans-serif;
        left: 16px;
        padding: 8px 12px;
        position: absolute;
        top: 16px;
        z-index: 3;
      }
    </style>
  </head>
  <body>
    <video id="video" autoplay playsinline muted></video>
    <canvas id="canvas"></canvas>
    <div id="status">Loading pose model...</div>

    <script type="module">
      import { FilesetResolver, PoseLandmarker, DrawingUtils } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22';

      const landmarkNames = ${JSON.stringify(BLAZE_POSE_LANDMARK_NAMES)};
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const statusEl = document.getElementById('status');
      const ctx = canvas.getContext('2d');
      let landmarker = null;
      let drawingUtils = null;
      let latestResult = null;
      let recording = false;
      let recordedFrames = [];
      let frameIndex = 0;
      let recordStartedAt = 0;
      let lastSampledAt = 0;

      function post(message) {
        window.ReactNativeWebView?.postMessage(JSON.stringify(message));
      }

      function setStatus(status) {
        statusEl.textContent = status;
        post({ type: 'status', status });
      }

      function toLandmarkMap(points, width, height, includePixels) {
        const output = {};
        if (!points) return output;

        for (let i = 0; i < points.length && i < landmarkNames.length; i += 1) {
          const point = points[i];
          output[landmarkNames[i]] = {
            x: round6(point.x),
            y: round6(point.y),
            z: round6(point.z || 0),
            visibility: round6(point.visibility ?? 1),
            presence: point.presence ?? null,
            ...(includePixels
              ? {
                  pixel_x: Math.round(point.x * width),
                  pixel_y: Math.round(point.y * height),
                }
              : {}),
          };
        }

        return output;
      }

      function captureFrame(now) {
        if (!latestResult?.landmarks?.length) return;

        const landmarks = latestResult.landmarks[0];
        const worldLandmarks = latestResult.worldLandmarks?.[0] || landmarks;
        recordedFrames.push({
          frameIndex,
          timestampMs: Math.round(now - recordStartedAt),
          landmarks: toLandmarkMap(landmarks, video.videoWidth || 720, video.videoHeight || 1280, false),
          worldLandmarks: toLandmarkMap(worldLandmarks, video.videoWidth || 720, video.videoHeight || 1280, false),
        });
        frameIndex += 1;
      }

      function draw(result) {
        const width = video.videoWidth || window.innerWidth;
        const height = video.videoHeight || window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        if (!result?.landmarks?.length || !drawingUtils) return;

        for (const landmarks of result.landmarks) {
          drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#fff7ef', lineWidth: 3 });
          drawingUtils.drawLandmarks(landmarks, { color: '#ffb24a', radius: 3 });
        }
      }

      async function init() {
        try {
          const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
          landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } },
            audio: false,
          });
          video.srcObject = stream;
          await video.play();
          drawingUtils = new DrawingUtils(ctx);
          setStatus('Camera ready');
          requestAnimationFrame(loop);
        } catch (error) {
          setStatus('Camera/model error');
          post({ type: 'error', message: String(error) });
        }
      }

      function loop(now) {
        if (landmarker && video.readyState >= 2) {
          latestResult = landmarker.detectForVideo(video, now);
          draw(latestResult);

          if (recording && now - lastSampledAt >= 100) {
            captureFrame(now);
            lastSampledAt = now;
          }
        }

        requestAnimationFrame(loop);
      }

      window.startPoseMeasurement = function startPoseMeasurement(durationMs = 5000) {
        recordedFrames = [];
        frameIndex = 0;
        recordStartedAt = performance.now();
        lastSampledAt = 0;
        recording = true;
        setStatus('Measuring...');

        setTimeout(() => {
          recording = false;
          setStatus('Measurement complete');
          post({ type: 'frames', frames: recordedFrames });
        }, durationMs);
      };

      function round6(value) {
        return Math.round(Number(value || 0) * 1000000) / 1000000;
      }

      init();
    </script>
  </body>
</html>
`;
}

const BLAZE_POSE_LANDMARK_NAMES = [
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

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: colors.darkBrown,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fallbackText: {
    color: colors.card,
    fontSize: typography.caption,
    textAlign: 'center',
  },
});
