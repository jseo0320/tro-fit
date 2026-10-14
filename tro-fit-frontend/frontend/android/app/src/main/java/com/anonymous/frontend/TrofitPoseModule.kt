package com.anonymous.frontend

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import java.io.File
import java.io.InputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class TrofitPoseModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private var poseLandmarker: PoseLandmarker? = null
  private val maxInputSize = 256

  override fun getName(): String = "TrofitPoseModule"

  @ReactMethod
  fun analyzeImage(uri: String, frameIndex: Int, timestampMs: Int, promise: Promise) {
    executor.execute {
      try {
        Log.i(TAG, "analyzeImage:start frame=$frameIndex uri=$uri")
        val bitmap = loadBitmap(uri)
        Log.i(TAG, "analyzeImage:bitmapLoaded ${bitmap.width}x${bitmap.height}")
        val scaledBitmap = scaleDownBitmap(bitmap, maxInputSize)
        Log.i(TAG, "analyzeImage:bitmapScaled ${scaledBitmap.width}x${scaledBitmap.height}")
        val argbBitmap =
            if (scaledBitmap.config == Bitmap.Config.ARGB_8888) scaledBitmap
            else scaledBitmap.copy(Bitmap.Config.ARGB_8888, false)
        val mpImage = BitmapImageBuilder(argbBitmap).build()
        Log.i(TAG, "analyzeImage:detectStart")
        val result = getPoseLandmarker().detect(mpImage)
        Log.i(TAG, "analyzeImage:detectDone poses=${result.landmarks().size}")
        promise.resolve(toFrameRecord(result, frameIndex, timestampMs, argbBitmap.width, argbBitmap.height))
      } catch (error: Throwable) {
        Log.e(TAG, "analyzeImage:failed", error)
        promise.reject("POSE_ANALYZE_FAILED", error.message, error)
      }
    }
  }

  override fun invalidate() {
    super.invalidate()
    executor.shutdown()
    poseLandmarker?.close()
    poseLandmarker = null
  }

  private fun getPoseLandmarker(): PoseLandmarker {
    val current = poseLandmarker
    if (current != null) {
      return current
    }

    Log.i(TAG, "poseLandmarker:createStart")
    val baseOptions = BaseOptions.builder()
        .setModelAssetPath("pose_landmarker_lite.task")
        .build()
    val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.IMAGE)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(0.3f)
        .setMinPosePresenceConfidence(0.3f)
        .setMinTrackingConfidence(0.5f)
        .setOutputSegmentationMasks(false)
        .build()
    val created = PoseLandmarker.createFromOptions(reactContext, options)
    Log.i(TAG, "poseLandmarker:createDone")
    poseLandmarker = created
    return created
  }

  private fun loadBitmap(uriString: String): Bitmap {
    val uri = Uri.parse(uriString)
    val boundsOptions = BitmapFactory.Options().apply {
      inJustDecodeBounds = true
    }
    openImageInputStream(uriString).use {
      BitmapFactory.decodeStream(it, null, boundsOptions)
    }

    val decodeOptions = BitmapFactory.Options().apply {
      inPreferredConfig = Bitmap.Config.ARGB_8888
      inSampleSize = calculateSampleSize(
          boundsOptions.outWidth,
          boundsOptions.outHeight,
          maxInputSize,
      )
    }

    openImageInputStream(uriString).use {
      return BitmapFactory.decodeStream(it, null, decodeOptions)
          ?: throw IllegalArgumentException("Cannot decode image uri: $uriString")
    }
  }

  private fun openImageInputStream(uriString: String): InputStream {
    val uri = Uri.parse(uriString)
    return when (uri.scheme) {
      "content" -> reactContext.contentResolver.openInputStream(uri)
      "file" -> File(uri.path ?: uriString).inputStream()
      null -> File(uriString).inputStream()
      else -> reactContext.contentResolver.openInputStream(uri)
    } ?: throw IllegalArgumentException("Cannot open image uri: $uriString")
  }

  private fun calculateSampleSize(width: Int, height: Int, maxSize: Int): Int {
    if (width <= 0 || height <= 0) {
      return 1
    }

    var sampleSize = 1
    while ((width / sampleSize) > maxSize || (height / sampleSize) > maxSize) {
      sampleSize *= 2
    }
    return sampleSize
  }

  private fun scaleDownBitmap(bitmap: Bitmap, maxSize: Int): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val longestSide = maxOf(width, height)
    if (longestSide <= maxSize) {
      return bitmap
    }

    val scale = maxSize.toFloat() / longestSide.toFloat()
    val targetWidth = maxOf(1, (width * scale).toInt())
    val targetHeight = maxOf(1, (height * scale).toInt())
    return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
  }

  private fun toFrameRecord(
      result: PoseLandmarkerResult,
      frameIndex: Int,
      timestampMs: Int,
      width: Int,
      height: Int
  ): WritableMap {
    val frame = Arguments.createMap()
    val poses = Arguments.createArray()
    val poseLandmarks = result.landmarks()
    val worldLandmarks = result.worldLandmarks()
    val detected = poseLandmarks.isNotEmpty()

    if (detected) {
      for (poseIndex in poseLandmarks.indices) {
        val pose = Arguments.createMap()
        val landmarks = Arguments.createMap()
        val currentLandmarks = poseLandmarks[poseIndex]
        for (index in currentLandmarks.indices) {
          val landmark = currentLandmarks[index]
          val item = Arguments.createMap()
          item.putDouble("x", round6(landmark.x().toDouble()))
          item.putDouble("y", round6(landmark.y().toDouble()))
          item.putDouble("z", round6(landmark.z().toDouble()))
          item.putDouble("visibility", round6(landmark.visibility().orElse(1.0f).toDouble()))
          if (landmark.presence().isPresent) {
            item.putDouble("presence", round6(landmark.presence().get().toDouble()))
          } else {
            item.putNull("presence")
          }
          item.putInt("pixel_x", (landmark.x() * width).toInt())
          item.putInt("pixel_y", (landmark.y() * height).toInt())
          landmarks.putMap(landmarkName(index), item)
        }

        val world = Arguments.createMap()
        if (poseIndex < worldLandmarks.size) {
          val currentWorldLandmarks = worldLandmarks[poseIndex]
          for (index in currentWorldLandmarks.indices) {
            val landmark = currentWorldLandmarks[index]
            val item = Arguments.createMap()
            item.putDouble("x", round6(landmark.x().toDouble()))
            item.putDouble("y", round6(landmark.y().toDouble()))
            item.putDouble("z", round6(landmark.z().toDouble()))
            item.putDouble("visibility", round6(landmark.visibility().orElse(1.0f).toDouble()))
            if (landmark.presence().isPresent) {
              item.putDouble("presence", round6(landmark.presence().get().toDouble()))
            } else {
              item.putNull("presence")
            }
            world.putMap(landmarkName(index), item)
          }
        }

        pose.putInt("pose_index", poseIndex)
        pose.putMap("landmarks", landmarks)
        pose.putMap("world_landmarks", world)
        poses.pushMap(pose)
      }
    }

    frame.putInt("frame_index", frameIndex)
    frame.putInt("timestamp_ms", timestampMs)
    frame.putBoolean("detected", detected)
    frame.putInt("num_poses", poseLandmarks.size)
    frame.putInt("image_width", width)
    frame.putInt("image_height", height)
    frame.putArray("poses", poses)
    return frame
  }

  private fun round6(value: Double): Double {
    return kotlin.math.round(value * 1_000_000.0) / 1_000_000.0
  }

  private fun landmarkName(index: Int): String {
    return LANDMARK_NAMES.getOrElse(index) { "landmark_$index" }
  }

  companion object {
    private const val TAG = "TrofitPoseModule"

    private val LANDMARK_NAMES = listOf(
        "nose",
        "left_eye_inner",
        "left_eye",
        "left_eye_outer",
        "right_eye_inner",
        "right_eye",
        "right_eye_outer",
        "left_ear",
        "right_ear",
        "mouth_left",
        "mouth_right",
        "left_shoulder",
        "right_shoulder",
        "left_elbow",
        "right_elbow",
        "left_wrist",
        "right_wrist",
        "left_pinky",
        "right_pinky",
        "left_index",
        "right_index",
        "left_thumb",
        "right_thumb",
        "left_hip",
        "right_hip",
        "left_knee",
        "right_knee",
        "left_ankle",
        "right_ankle",
        "left_heel",
        "right_heel",
        "left_foot_index",
        "right_foot_index",
    )
  }
}
