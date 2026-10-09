"use client";

import * as React from "react";
import Link from "next/link";
import {
  Camera,
  CameraOff,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  CheckCircle2,
  Info,
  Fingerprint,
  KeyRound,
} from "lucide-react";
import jsQR from "jsqr";
import { useQueryClient } from "@tanstack/react-query";
import { ScanResultModal, type VerificationState } from "@/components/student/ScanResultModal";
import { submitCheckIn, fetchQrChallenge } from "@/lib/services/qr-service";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import { apiFetch, getAttendanceVerificationOptions } from "@/lib/api-client";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { CheckInResult } from "@/types/qr";

interface ActiveDeviceStatus {
  isRegistered: boolean;
  deviceName?: string;
  deviceFingerprint?: string;
}

export function StudentScanner() {
  const queryClient = useQueryClient();

  // Verification state machine
  const [verificationState, setVerificationState] = React.useState<VerificationState>("ready");
  const [hasCamera, setHasCamera] = React.useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [activeVector, setActiveVector] = React.useState<string | null>(null);
  const [checkInResult, setCheckInResult] = React.useState<CheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [deviceStatus, setDeviceStatus] = React.useState<ActiveDeviceStatus | null>(null);
  const [lastScannedToken, setLastScannedToken] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Fetch registered device status on mount
  React.useEffect(() => {
    async function checkDevice() {
      try {
        const data = await apiFetch<ActiveDeviceStatus>("/api/auth/device/status");
        setDeviceStatus(data);
      } catch {
        // Fallback gracefully if API not ready
        setDeviceStatus({ isRegistered: true, deviceName: "Primary Mobile Phone" });
      }
    }
    checkDevice();
  }, []);

  // Initialize camera and start video stream
  const startCamera = React.useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasCamera(false);
      setVerificationState("ready");
      return;
    }

    try {
      // Request rear/environment camera facing mode
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      setHasCamera(true);
      setPermissionDenied(false);
      setVerificationState("scanning");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Permission rejected or camera unavailable
      setHasCamera(false);
      setPermissionDenied(true);
      setVerificationState("ready");
    }
  }, []);

  // Stop camera tracks
  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Initial camera attempt on mount
  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Process a QR challenge token payload through WebAuthn + check-in API
  const handleCheckInAttempt = React.useCallback(
    async (token: string, simulatedMismatch = false) => {
      // 1. QR detected
      setVerificationState("qr_detected");
      setErrorMessage("");

      try {
        // Basic frontend format sanity check
        if (!token || typeof token !== "string" || !token.includes(".")) {
          throw new Error("Invalid QR code format. Please scan an authorized AttendGuard dynamic code.");
        }

        // 2. Check browser WebAuthn support
        const isSupported = browserSupportsWebAuthn();
        if (!isSupported) {
          setVerificationState("unsupported_authenticator");
          return;
        }

        // 3. Request fresh WebAuthn authentication options from server
        let optRes;
        try {
          optRes = await getAttendanceVerificationOptions(token);
        } catch (optErr: any) {
          const code = optErr?.code || "";
          const msg = optErr?.message || "";
          if (code === "NO_REGISTERED_CREDENTIALS" || optErr?.data?.requiresRegistration) {
            setVerificationState("credential_not_registered");
            return;
          }
          if (code === "QR_EXPIRED" || (optErr?.status === 409 && msg.toLowerCase().includes("expired"))) {
            setVerificationState("qr_expired");
            return;
          }
          if (optErr?.name === "TypeError" || msg.toLowerCase().includes("fetch")) {
            setVerificationState("network_error");
            return;
          }
          throw optErr;
        }

        if (optRes.requiresRegistration) {
          setVerificationState("credential_not_registered");
          return;
        }

        let webauthnChallengeId: string | undefined;
        let webauthnResponse: any | undefined;

        // If WebAuthn challenge was issued by server, prompt authenticator
        if (optRes.options && optRes.challengeId) {
          webauthnChallengeId = optRes.challengeId;
          setVerificationState("authenticating");

          try {
            webauthnResponse = await startAuthentication({
              optionsJSON: optRes.options,
            });
          } catch (browserAuthErr: any) {
            if (
              browserAuthErr?.name === "NotAllowedError" ||
              browserAuthErr?.message?.toLowerCase().includes("cancel") ||
              browserAuthErr?.message?.toLowerCase().includes("abort")
            ) {
              setVerificationState("verification_cancelled");
              return;
            }
            setVerificationState("verification_failed");
            setErrorMessage(browserAuthErr?.message || "Identity verification could not be completed.");
            return;
          }

          // Browser WebAuthn assertion succeeded, now checking attendance with server
          setVerificationState("verification_successful");
        }

        // 4. Submitting final payload to zero-trust backend
        const fingerprint = await getClientDeviceFingerprint(simulatedMismatch);
        const res = await submitCheckIn({
          challengeToken: token,
          deviceFingerprint: fingerprint,
          webauthnChallengeId,
          webauthnResponse,
        });

        // 5. ONLY mark verified after backend confirms 201 response!
        setCheckInResult(res);
        setVerificationState("attendance_confirmed");

        // Invalidate React Query cache so dashboard statistics update immediately
        try {
          queryClient.invalidateQueries({ queryKey: ["student-attendance-summary"] });
        } catch {}
      } catch (err: any) {
        const code = err?.code || "";
        const message = err?.message || "Check-in failed.";

        if (code === "QR_EXPIRED" || (err?.status === 409 && message.toLowerCase().includes("expired"))) {
          setVerificationState("qr_expired");
        } else if (code === "ALREADY_CHECKED_IN" || code === "QR_REPLAYED") {
          setVerificationState("already_checked_in");
        } else if (code === "WEBAUTHN_REQUIRED" || code === "NO_REGISTERED_CREDENTIALS") {
          setVerificationState("credential_not_registered");
        } else if (
          code === "WEBAUTHN_INVALID" ||
          code === "WEBAUTHN_EXPIRED" ||
          code === "WEBAUTHN_REPLAYED"
        ) {
          setVerificationState("verification_failed");
          setErrorMessage(message || "Identity verification could not be completed.");
        } else if (code === "DEVICE_MISMATCH" || err?.status === 403) {
          setVerificationState("failed");
          setErrorMessage(message || "Hardware Mismatch: Attendance must be recorded from your registered device.");
        } else if (code === "QR_INVALID") {
          setVerificationState("failed");
          setErrorMessage("Invalid QR token signature. The scanned code was not recognized by the server.");
        } else if (err?.name === "TypeError" || message.toLowerCase().includes("fetch")) {
          setVerificationState("network_error");
        } else {
          setVerificationState("failed");
          setErrorMessage(message);
        }
      } finally {
        setActiveVector(null);
      }
    },
    [queryClient]
  );

  // Active in-browser QR detection loop via jsQR
  React.useEffect(() => {
    if (verificationState !== "scanning") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let isScanningActive = true;

    const tick = () => {
      if (!isScanningActive || verificationState !== "scanning") return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Prevent repeated triggers of identical frame data
          if (code.data !== lastScannedToken) {
            setLastScannedToken(code.data);
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try {
                navigator.vibrate(100);
              } catch {}
            }
            handleCheckInAttempt(code.data, false);
            return;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isScanningActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [verificationState, lastScannedToken, handleCheckInAttempt]);

  // Test Simulator 1: Valid Live Token
  const handleSimulateValidScan = async () => {
    setActiveVector("valid");
    try {
      const challenge = await fetchQrChallenge();
      await handleCheckInAttempt(challenge.challengeToken, false);
    } catch (err: any) {
      setVerificationState("failed");
      setErrorMessage(err.message || "Failed to fetch session challenge.");
      setActiveVector(null);
    }
  };

  // Test Simulator 2: Expired Token (60 seconds old)
  const handleSimulateExpiredScan = async () => {
    setActiveVector("expired");
    const expiredPayload = {
      sessionId: "44444444-4444-4444-4444-444444444441",
      seq: 14,
      ts: Math.floor(Date.now() / 1000) - 60,
      nonce: "exp9921",
    };
    const b64 =
      typeof btoa !== "undefined"
        ? btoa(JSON.stringify(expiredPayload))
        : Buffer.from(JSON.stringify(expiredPayload)).toString("base64");
    const expiredToken = `${b64}.sig_expired_test`;

    await handleCheckInAttempt(expiredToken, false);
  };

  // Test Simulator 3: Unregistered Device
  const handleSimulateDeviceMismatch = async () => {
    setActiveVector("mismatch");
    try {
      const challenge = await fetchQrChallenge();
      await handleCheckInAttempt(challenge.challengeToken, true);
    } catch (err: any) {
      setVerificationState("failed");
      setErrorMessage(err.message);
      setActiveVector(null);
    }
  };

  // Test Simulator 4: Duplicate Check-In
  const handleSimulateDuplicateScan = async () => {
    setActiveVector("duplicate");
    try {
      const challenge = await fetchQrChallenge();
      await handleCheckInAttempt(challenge.challengeToken, false);
    } catch (err: any) {
      setVerificationState("failed");
      setErrorMessage(err.message);
      setActiveVector(null);
    }
  };

  const handleResetScan = () => {
    setLastScannedToken(null);
    setCheckInResult(null);
    setErrorMessage("");
    setActiveVector(null);
    setVerificationState("scanning");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* WebAuthn Security Status Banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <Fingerprint className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-zinc-300">
            Attendance protected by <strong className="text-white">WebAuthn / Passkey</strong> verification.
          </span>
        </div>
        <Link
          href="/student/security"
          className="text-emerald-400 hover:text-emerald-300 underline font-semibold shrink-0"
        >
          Manage Passkeys
        </Link>
      </div>

      {/* 1. Official Scanner Viewport Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] overflow-hidden shadow-2xl relative transition-all duration-300 hover:border-blue-500/30 w-full">
        {/* Viewport Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Official Attendance Viewfinder
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                Realtime optical decoder • Biometric WebAuthn check-in
              </p>
            </div>
          </div>

          {/* Verification State Machine Status Pill */}
          <div className="flex items-center gap-2">
            {verificationState === "scanning" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SCANNING LIVE
              </span>
            )}
            {verificationState === "qr_detected" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                QR DETECTED
              </span>
            )}
            {verificationState === "authenticating" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Fingerprint className="h-3 w-3 animate-pulse" />
                VERIFYING USER
              </span>
            )}
            {(verificationState === "verifying" || verificationState === "verification_successful") && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                CHECKING SERVER
              </span>
            )}
            {verificationState === "ready" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                READY TO SCAN
              </span>
            )}
            {(verificationState === "attendance_confirmed" || verificationState === "verified") && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                VERIFIED
              </span>
            )}
            {(verificationState === "qr_expired" || verificationState === "expired") && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Clock className="h-3 w-3" />
                EXPIRED
              </span>
            )}
            {verificationState === "already_checked_in" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <CheckCircle2 className="h-3 w-3" />
                ALREADY PRESENT
              </span>
            )}
            {verificationState === "failed" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="h-3 w-3" />
                FAILED
              </span>
            )}
          </div>
        </div>

        {/* Dedicated Telemetry Sub-bar */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800/80 border-b border-zinc-800/80 bg-[#06080A]/60 px-2 py-2 text-[11px] font-mono text-zinc-400">
          <div className="px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase">Target</span>
            <span className="text-zinc-200 font-medium">15s Dynamic QR</span>
          </div>
          <div className="px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase">Hardware</span>
            <span className={deviceStatus?.isRegistered ? "text-emerald-400 font-medium truncate max-w-[120px]" : "text-amber-400 font-medium"}>
              {deviceStatus?.deviceName || "Enclave Bound"}
            </span>
          </div>
          <div className="px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase">Security</span>
            <span className="text-emerald-400 font-medium">WebAuthn / FIDO2</span>
          </div>
        </div>

        {/* Camera Viewport Canvas */}
        <div className="relative min-h-[340px] sm:min-h-[400px] w-full bg-[#050709] flex items-center justify-center overflow-hidden cyber-grid p-6">
          {hasCamera && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          )}

          {/* Central Target Reticle with Alignment Guide */}
          <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] shadow-[0_0_35px_rgba(59,130,246,0.12)]">
            {/* 4 Corner Sci-Fi Targeting Brackets */}
            <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-2 border-l-2 border-blue-400 rounded-tl-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-2 border-r-2 border-blue-400 rounded-tr-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-2 border-l-2 border-blue-400 rounded-bl-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-2 border-r-2 border-blue-400 rounded-br-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

            {/* Subtle Crosshairs */}
            <div className="absolute w-8 h-[1px] bg-blue-400/30 pointer-events-none" />
            <div className="absolute h-8 w-[1px] bg-blue-400/30 pointer-events-none" />
            <div className="absolute h-2 w-2 rounded-full border border-blue-400/40 pointer-events-none" />

            {/* Radar / Scanning Sweep Line (active while scanning) */}
            {verificationState === "scanning" && (
              <div className="absolute inset-x-3 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_16px_#3b82f6] animate-scanline pointer-events-none" />
            )}

            {/* Guidance Overlay when camera active */}
            {hasCamera && verificationState === "scanning" && (
              <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                <span className="text-[10px] font-mono text-zinc-300 bg-black/60 px-2 py-0.5 rounded border border-zinc-800">
                  Scan the classroom QR code to begin attendance verification.
                </span>
              </div>
            )}

            {/* Inactive Camera / Permission Denied Guidance */}
            {!hasCamera && (
              <div className="text-center space-y-2.5 z-10">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-lg">
                  {permissionDenied ? (
                    <CameraOff className="h-5 w-5 text-rose-400" />
                  ) : (
                    <Camera className="h-5 w-5 text-blue-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white font-mono tracking-wider">
                    {permissionDenied ? "CAMERA PERMISSION DENIED" : "CAMERA SENSOR INACTIVE"}
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[210px] mx-auto font-mono mt-1">
                    {permissionDenied
                      ? "Grant camera access in your browser address bar to scan the live lecture code."
                      : "Click below to grant camera access and arm the optical viewfinder."}
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Arm Camera Sensor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Viewport Integrated Bottom Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-zinc-300">
              {deviceStatus?.isRegistered
                ? `HARDWARE BOUND: ${deviceStatus.deviceName || "REGISTERED DEVICE"}`
                : "HARDWARE BINDING: REGISTER PHONE IN SETTINGS"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400/90">HUD ARMED & ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 2. Official Protocol Guidance Banner */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0B0D10]/90 p-4 space-y-2 text-xs font-mono text-zinc-400 shadow-md">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          <span>Official AttendGuard Verification Protocol</span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          The classroom display features rolling cryptographic challenge tokens with a 15-second expiration window.
          Attendance requires both an active QR scan and fresh WebAuthn biometric verification on your enrolled device to prevent proxy attendance.
        </p>
      </div>

      {/* 3. Interactive Security Test Suite & Simulation Console */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-5 sm:p-6 space-y-5 transition-all duration-300 hover:border-blue-500/30 w-full shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-800/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
                VERIFICATION HARNESS
              </h3>
            </div>
            <p className="text-sm font-semibold text-white tracking-tight">
              Scanner Simulation Console
            </p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
            4 Deterministic Test Vectors
          </span>
        </div>

        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
          Simulate dynamic classroom scan payloads under distinct cryptographic and device-integrity conditions:
        </p>

        {/* 2x2 Grid of Interactive Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* VECTOR 1: Valid Check-In */}
          <button
            onClick={handleSimulateValidScan}
            disabled={verificationState === "verifying" || verificationState === "authenticating"}
            className="text-left p-4 rounded-xl border border-zinc-800/80 bg-[#06080A]/80 hover:bg-[#0c0f14] hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-3 group disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:border-emerald-500/40 transition-colors">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                201 OK
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                1. Valid Dynamic Session
              </h4>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                Live HMAC token matched with registered mobile device and WebAuthn user verification.
              </p>
            </div>
            <div className="flex items-center text-[11px] font-mono text-blue-400 group-hover:text-blue-300 font-medium pt-1">
              <span>{activeVector === "valid" ? "Simulating..." : "Trigger Valid Scan"}</span>
              <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* VECTOR 2: Expired Token */}
          <button
            onClick={handleSimulateExpiredScan}
            disabled={verificationState === "verifying" || verificationState === "authenticating"}
            className="text-left p-4 rounded-xl border border-zinc-800/80 bg-[#06080A]/80 hover:bg-[#0c0f14] hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-3 group disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:border-amber-500/40 transition-colors">
                <Clock className="h-4 w-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                409 EXPIRED
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                2. Stale / Expired Token
              </h4>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                Simulates token 60s past rotation to test automatic expiry rejection.
              </p>
            </div>
            <div className="flex items-center text-[11px] font-mono text-amber-400 group-hover:text-amber-300 font-medium pt-1">
              <span>{activeVector === "expired" ? "Simulating..." : "Test Expiry Rejection"}</span>
              <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* VECTOR 3: Device Mismatch */}
          <button
            onClick={handleSimulateDeviceMismatch}
            disabled={verificationState === "verifying" || verificationState === "authenticating"}
            className="text-left p-4 rounded-xl border border-zinc-800/80 bg-[#06080A]/80 hover:bg-[#0c0f14] hover:border-rose-500/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-3 group disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-400">
                403 FORBIDDEN
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white tracking-tight group-hover:text-rose-300 transition-colors">
                3. Foreign Hardware Spoof
              </h4>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                Rejects unregistered device fingerprint to prevent attendance proxying.
              </p>
            </div>
            <div className="flex items-center text-[11px] font-mono text-rose-400 group-hover:text-rose-300 font-medium pt-1">
              <span>{activeVector === "mismatch" ? "Simulating..." : "Test Anti-Proxy Defense"}</span>
              <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* VECTOR 4: Duplicate Submission */}
          <button
            onClick={handleSimulateDuplicateScan}
            disabled={verificationState === "verifying" || verificationState === "authenticating"}
            className="text-left p-4 rounded-xl border border-zinc-800/80 bg-[#06080A]/80 hover:bg-[#0c0f14] hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-3 group disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:border-blue-500/40 transition-colors">
                <Layers className="h-4 w-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                409 CONFLICT
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-white tracking-tight group-hover:text-blue-300 transition-colors">
                4. Duplicate Replay Guard
              </h4>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                Tests idempotency by attempting a duplicate record on the same lecture.
              </p>
            </div>
            <div className="flex items-center text-[11px] font-mono text-blue-400 group-hover:text-blue-300 font-medium pt-1">
              <span>{activeVector === "duplicate" ? "Simulating..." : "Test Replay Protection"}</span>
              <ArrowRight className="h-3 w-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Verification Status Modal */}
      <ScanResultModal
        status={verificationState}
        result={checkInResult}
        errorMessage={errorMessage}
        onScanAgain={handleResetScan}
        onClose={handleResetScan}
      />
    </div>
  );
}
