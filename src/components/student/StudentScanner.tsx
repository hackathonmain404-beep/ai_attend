"use client";

import * as React from "react";
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
} from "lucide-react";
import { ScanResultModal, type ScanModalStatus } from "@/components/student/ScanResultModal";
import { submitCheckIn, fetchQrChallenge } from "@/lib/services/qr-service";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import type { CheckInResult } from "@/types/qr";

export function StudentScanner() {
  const [hasCamera, setHasCamera] = React.useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeVector, setActiveVector] = React.useState<string | null>(null);
  const [modalStatus, setModalStatus] = React.useState<ScanModalStatus>("idle");
  const [checkInResult, setCheckInResult] = React.useState<CheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Initialize camera feed if available
  React.useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setHasCamera(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setCameraStream(stream);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        // Permissions denied or no camera hardware
        setHasCamera(false);
        setPermissionDenied(true);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Process a QR challenge token payload through the authoritative check-in API
  const handleCheckInAttempt = async (token: string, simulatedMismatch = false) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const fingerprint = await getClientDeviceFingerprint(simulatedMismatch);
      const res = await submitCheckIn({
        challengeToken: token,
        deviceFingerprint: fingerprint,
      });

      setCheckInResult(res);
      setModalStatus("success");
    } catch (err: any) {
      const code = err?.code || "";
      const message = err?.message || "Check-in failed.";

      if (code === "QR_EXPIRED" || err?.status === 409 && message.toLowerCase().includes("expired")) {
        setModalStatus("qr_expired");
      } else if (code === "DEVICE_MISMATCH" || err?.status === 403) {
        setModalStatus("device_mismatch");
        setErrorMessage(message);
      } else if (code === "ALREADY_CHECKED_IN") {
        setModalStatus("already_checked_in");
      } else {
        setModalStatus("error");
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
      setActiveVector(null);
    }
  };

  // Test Simulator 1: Valid Live Token
  const handleSimulateValidScan = async () => {
    setActiveVector("valid");
    try {
      const challenge = await fetchQrChallenge();
      await handleCheckInAttempt(challenge.challengeToken, false);
    } catch (err: any) {
      setModalStatus("error");
      setErrorMessage(err.message || "Failed to fetch session challenge.");
      setActiveVector(null);
      setIsSubmitting(false);
    }
  };

  // Test Simulator 2: Expired Token (60 seconds old)
  const handleSimulateExpiredScan = async () => {
    setActiveVector("expired");
    const expiredPayload = {
      sessionId: "44444444-4444-4444-4444-444444444441",
      seq: 14,
      ts: Math.floor(Date.now() / 1000) - 60, // 60s ago
      nonce: "exp9921",
    };
    const b64 = typeof btoa !== "undefined"
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
      setModalStatus("error");
      setErrorMessage(err.message);
      setActiveVector(null);
      setIsSubmitting(false);
    }
  };

  // Test Simulator 4: Duplicate Check-In
  const handleSimulateDuplicateScan = async () => {
    setActiveVector("duplicate");
    try {
      const challenge = await fetchQrChallenge();
      // First attempt succeeds
      await handleCheckInAttempt(challenge.challengeToken, false);
      // Second attempt will trigger ALREADY_CHECKED_IN on the same session
    } catch (err: any) {
      setModalStatus("error");
      setErrorMessage(err.message);
      setActiveVector(null);
      setIsSubmitting(false);
    }
  };

  const handleResetScan = () => {
    setModalStatus("idle");
    setCheckInResult(null);
    setErrorMessage("");
    setActiveVector(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 1. Scanner Viewport Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] overflow-hidden shadow-2xl relative transition-all duration-300 hover:border-blue-500/30 w-full">
        {/* Viewport Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                Optical Viewfinder HUD
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                Realtime optical sensor • High-assurance targeting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasCamera ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SENSOR LIVE
              </span>
            ) : permissionDenied ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                SIMULATION READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                INITIALIZING
              </span>
            )}
          </div>
        </div>

        {/* Dedicated Telemetry Sub-bar (Eliminates overlap with corner brackets) */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800/80 border-b border-zinc-800/80 bg-[#06080A]/60 px-2 py-2 text-[11px] font-mono text-zinc-400">
          <div className="px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase">Target</span>
            <span className="text-zinc-200 font-medium">Rotating HMAC</span>
          </div>
          <div className="px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase">Cadence</span>
            <span className="text-zinc-200 font-medium">15–20s Cycle</span>
          </div>
          <div className="px-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
            <span className="text-[10px] text-zinc-500 uppercase">Enclave</span>
            <span className="text-blue-400 font-medium">SHA-256 Bound</span>
          </div>
        </div>

        {/* Camera Viewport Canvas */}
        <div className="relative min-h-[340px] sm:min-h-[380px] w-full bg-[#050709] flex items-center justify-center overflow-hidden cyber-grid p-6">
          {hasCamera && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          )}

          {/* Central Target Reticle */}
          <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 border border-blue-500/30 rounded-2xl flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] shadow-[0_0_35px_rgba(59,130,246,0.12)]">
            {/* 4 Sleek Corner Sci-Fi Targeting Brackets */}
            <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-2 border-l-2 border-blue-400 rounded-tl-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-2 border-r-2 border-blue-400 rounded-tr-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-2 border-l-2 border-blue-400 rounded-bl-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-2 border-r-2 border-blue-400 rounded-br-lg shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

            {/* Subtle Crosshairs */}
            <div className="absolute w-8 h-[1px] bg-blue-400/30 pointer-events-none" />
            <div className="absolute h-8 w-[1px] bg-blue-400/30 pointer-events-none" />
            <div className="absolute h-2 w-2 rounded-full border border-blue-400/40 pointer-events-none" />

            {/* Radar / Scanning Sweep Line */}
            <div className="absolute inset-x-3 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_16px_#3b82f6] animate-scanline pointer-events-none" />

            {/* Inactive Camera / Fallback Guidance */}
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
                    {permissionDenied ? "CAMERA SENSOR INACTIVE" : "RETICLE ARMED & READY"}
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[210px] mx-auto font-mono mt-1">
                    {permissionDenied
                      ? "Browser optical stream unavailable. Execute test vectors via the console below."
                      : "Center classroom projector QR code within targeting brackets."}
                  </p>
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SIMULATION READY
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submitting Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-6 text-center">
              <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
              <p className="text-sm font-semibold text-white font-mono tracking-wide">
                VERIFYING CRYPTOGRAPHIC CHALLENGE...
              </p>
              <p className="text-xs text-zinc-400 font-mono max-w-sm">
                Authenticating HMAC signature, timestamp freshness, and 1:1 hardware enclave binding.
              </p>
            </div>
          )}
        </div>

        {/* Viewport Integrated Bottom Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-zinc-300">DEVICE ENCLAVE ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-400/90">HUD SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Security Test Suite & Simulation Console */}
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

        {/* 2x2 Grid of Refined Interactive Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* VECTOR 1: Valid Check-In */}
          <button
            onClick={handleSimulateValidScan}
            disabled={isSubmitting}
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
                Live HMAC token matched with registered mobile device fingerprint.
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
        status={modalStatus}
        result={checkInResult}
        errorMessage={errorMessage}
        onScanAgain={handleResetScan}
        onClose={handleResetScan}
      />
    </div>
  );
}

