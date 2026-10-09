"use client";

import * as React from "react";
import {
  CameraPermissionState,
  CapturedFaceData,
  FaceCameraError,
  FaceFramingStatus,
  FramingEvaluation,
} from "@/components/face-verification/types";

interface UseFaceCameraOptions {
  autoStart?: boolean;
  mirrorVideo?: boolean;
  onError?: (error: FaceCameraError) => void;
}

export function useFaceCamera({
  autoStart = false,
  mirrorVideo = true,
  onError,
}: UseFaceCameraOptions = {}) {
  const [permissionState, setPermissionState] = React.useState<CameraPermissionState>(
    autoStart ? "requesting" : "idle"
  );
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [capturedImage, setCapturedImage] = React.useState<CapturedFaceData | null>(null);
  const [facingMode, setFacingMode] = React.useState<"user" | "environment">("user");
  const [framingEvaluation, setFramingEvaluation] = React.useState<FramingEvaluation>({
    status: "no_face",
    message: "Position your face within the frame",
    isCapturable: false,
    score: 0,
  });

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const analysisIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = React.useRef(true);

  // Initialize hidden canvas for frame analysis
  React.useEffect(() => {
    isMountedRef.current = true;
    if (typeof document !== "undefined") {
      hiddenCanvasRef.current = document.createElement("canvas");
      hiddenCanvasRef.current.width = 160;
      hiddenCanvasRef.current.height = 120;
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, []);

  /**
   * Stop active media stream tracks and reset streaming state.
   */
  const stopCamera = React.useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, [stream]);

  /**
   * Start camera video capture with front-facing camera preference.
   */
  const startCamera = React.useCallback(async () => {
    stopCamera();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const err: FaceCameraError = {
        code: "UNSUPPORTED",
        message: "Your browser does not support camera access (getUserMedia API).",
      };
      setPermissionState("unavailable");
      onError?.(err);
      return;
    }

    setPermissionState("requesting");

    try {
      // Prefer front-facing camera with optimal HD portrait constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        // Fallback to minimal constraints if device rejected ideal resolution
        if (firstErr.name === "OverconstrainedError" || firstErr.name === "ConstraintNotSatisfiedError") {
          newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } else {
          throw firstErr;
        }
      }

      if (!isMountedRef.current) {
        newStream.getTracks().forEach((t) => t.stop());
        return;
      }

      setStream(newStream);
      setPermissionState("granted");
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
          await videoRef.current.play();
        } catch {
          // Autoplay policy or interrupted
        }
      }
    } catch (err: any) {
      let faceError: FaceCameraError;

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        faceError = {
          code: "PERMISSION_DENIED",
          message: "Camera permission denied. Please allow camera access in your browser settings to verify your face.",
          originalError: err,
        };
        setPermissionState("denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        faceError = {
          code: "NOT_FOUND",
          message: "No camera found on this device. Please connect a working webcam or mobile camera.",
          originalError: err,
        };
        setPermissionState("unavailable");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        faceError = {
          code: "NOT_READABLE",
          message: "Camera is currently in use by another application. Please close other video apps and retry.",
          originalError: err,
        };
        setPermissionState("unavailable");
      } else {
        faceError = {
          code: "UNKNOWN",
          message: err.message || "An unexpected error occurred while requesting camera access.",
          originalError: err,
        };
        setPermissionState("unavailable");
      }

      onError?.(faceError);
    }
  }, [facingMode, stopCamera, onError]);

  // Handle auto-start option
  React.useEffect(() => {
    if (autoStart) {
      startCamera();
    }
  }, [autoStart, startCamera]);

  /**
   * Periodic real-time frame evaluation for biometric framing guidance.
   */
  React.useEffect(() => {
    if (!isStreaming || !videoRef.current) {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      return;
    }

    const analyzeCurrentFrame = async () => {
      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;

      // Draw downsampled frame to hidden analysis canvas
      ctx.drawImage(video, 0, 0, cw, ch);

      // Check for native browser FaceDetector API if supported
      if (typeof window !== "undefined" && "FaceDetector" in window) {
        try {
          const detector = new (window as any).FaceDetector({ maxDetectedFaces: 3 });
          const faces = await detector.detect(canvas);

          if (faces.length === 0) {
            setFramingEvaluation({
              status: "no_face",
              message: "Position your face within the frame",
              isCapturable: false,
              score: 20,
            });
            return;
          }

          if (faces.length > 1) {
            setFramingEvaluation({
              status: "multiple_faces",
              message: "Multiple faces detected — Ensure only you are in view",
              isCapturable: false,
              score: 30,
            });
            return;
          }

          const face = faces[0].boundingBox;
          const faceAreaRatio = (face.width * face.height) / (cw * ch);

          if (faceAreaRatio < 0.08) {
            setFramingEvaluation({
              status: "too_far",
              message: "Move closer to the camera",
              isCapturable: false,
              score: 55,
            });
            return;
          }

          if (faceAreaRatio > 0.65) {
            setFramingEvaluation({
              status: "too_close",
              message: "Move slightly back",
              isCapturable: false,
              score: 60,
            });
            return;
          }

          // Face aligned and well positioned
          setFramingEvaluation({
            status: "good",
            message: "Face aligned — Hold steady",
            isCapturable: true,
            score: 95,
          });
          return;
        } catch {
          // Native detector error, fall through to optical heuristic analyzer
        }
      }

      // Optical Heuristic Analyzer (works in all modern browsers without WebAssembly bloat)
      try {
        const imgData = ctx.getImageData(0, 0, cw, ch);
        const data = imgData.data;

        // 1. Overall Lighting Analysis
        let totalLuma = 0;
        const totalPixels = cw * ch;
        for (let i = 0; i < data.length; i += 4) {
          totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        const avgLuma = totalLuma / totalPixels;

        if (avgLuma < 35) {
          setFramingEvaluation({
            status: "poor_lighting",
            message: "Lighting too dim — Face the light source",
            isCapturable: false,
            score: 30,
            lightLevel: "dark",
          });
          return;
        }

        if (avgLuma > 230) {
          setFramingEvaluation({
            status: "poor_lighting",
            message: "Lighting washed out — Avoid strong backlighting",
            isCapturable: false,
            score: 35,
            lightLevel: "washed_out",
          });
          return;
        }

        // 2. Center Oval Contrast & Edge Gradient (Face Target Zone)
        // Center region: 25% to 75% width, 20% to 80% height
        let centerLumaSum = 0;
        let centerEdgeCount = 0;
        let centerCount = 0;

        const startX = Math.floor(cw * 0.25);
        const endX = Math.floor(cw * 0.75);
        const startY = Math.floor(ch * 0.2);
        const endY = Math.floor(ch * 0.8);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * cw + x) * 4;
            const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            centerLumaSum += luma;
            centerCount++;

            if (x > startX) {
              const prevIdx = (y * cw + (x - 1)) * 4;
              const prevLuma = 0.299 * data[prevIdx] + 0.587 * data[prevIdx + 1] + 0.114 * data[prevIdx + 2];
              if (Math.abs(luma - prevLuma) > 25) {
                centerEdgeCount++;
              }
            }
          }
        }

        const centerAvgLuma = centerLumaSum / (centerCount || 1);
        const centerEdgeDensity = centerEdgeCount / (centerCount || 1);

        // Faces exhibit characteristic edge gradients (eyes, nose, mouth) in center target zone
        if (centerEdgeDensity < 0.05) {
          setFramingEvaluation({
            status: "no_face",
            message: "Position your face within the frame",
            isCapturable: false,
            score: 40,
          });
        } else if (centerEdgeDensity > 0.40) {
          setFramingEvaluation({
            status: "too_close",
            message: "Move slightly back from camera",
            isCapturable: false,
            score: 65,
          });
        } else {
          setFramingEvaluation({
            status: "good",
            message: "Face aligned — Hold steady",
            isCapturable: true,
            score: Math.min(95, Math.round(75 + centerEdgeDensity * 50)),
            lightLevel: "optimal",
          });
        }
      } catch {
        // Fallback default
        setFramingEvaluation({
          status: "good",
          message: "Face aligned — Hold steady",
          isCapturable: true,
          score: 80,
        });
      }
    };

    analysisIntervalRef.current = setInterval(analyzeCurrentFrame, 200);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [isStreaming]);

  /**
   * Captures the current video frame as high-resolution JPEG Blob.
   */
  const captureFrame = React.useCallback(async (): Promise<CapturedFaceData | null> => {
    const video = videoRef.current;
    if (!video || !isStreaming || video.readyState < 2) {
      return null;
    }

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth || 1280;
    captureCanvas.height = video.videoHeight || 720;

    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return null;

    // Apply mirror transform on capture if enabled and front-facing
    if (mirrorVideo && facingMode === "user") {
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    return new Promise((resolve) => {
      captureCanvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
          const data: CapturedFaceData = {
            blob,
            dataUrl,
            width: captureCanvas.width,
            height: captureCanvas.height,
            timestamp: new Date().toISOString(),
            qualityEstimate: framingEvaluation.score,
          };

          setCapturedImage(data);
          // Pause/stop video stream to freeze preview cleanly
          stopCamera();
          resolve(data);
        },
        "image/jpeg",
        0.92
      );
    });
  }, [isStreaming, mirrorVideo, facingMode, framingEvaluation.score, stopCamera]);

  /**
   * Discards captured photo and restarts live camera.
   */
  const retake = React.useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  /**
   * Switch between front-facing and rear cameras if supported on device.
   */
  const switchFacingMode = React.useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  return {
    videoRef,
    stream,
    isStreaming,
    permissionState,
    framingEvaluation,
    capturedImage,
    facingMode,
    startCamera,
    stopCamera,
    captureFrame,
    retake,
    switchFacingMode,
  };
}
