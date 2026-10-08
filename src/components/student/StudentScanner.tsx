"use client";

import * as React from "react";
import { Camera, CameraOff, ShieldCheck, AlertCircle, RefreshCw, Smartphone, Zap } from "lucide-react";
import { ScanResultModal, type ScanModalStatus } from "@/components/student/ScanResultModal";
import { submitCheckIn, fetchQrChallenge } from "@/lib/services/qr-service";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import type { CheckInResult } from "@/types/qr";

export function StudentScanner() {
  const [hasCamera, setHasCamera] = React.useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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
    }
  };

  // Test Simulator 1: Valid Live Token
  const handleSimulateValidScan = async () => {
    try {
      const challenge = await fetchQrChallenge();
      await handleCheckInAttempt(challenge.challengeToken, false);
    } catch (err: any) {
      setModalStatus("error");
      setErrorMessage(err.message || "Failed to fetch session challenge.");
    }
  };

  // Test Simulator 2: Expired Token (60 seconds old)
  const handleSimulateExpiredScan = async () => {
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
    try {
      const challenge = await fetchQrChallenge();
      await handleCheckInAttempt(challenge.challengeToken, true);
    } catch (err: any) {
      setModalStatus("error");
      setErrorMessage(err.message);
    }
  };

  // Test Simulator 4: Duplicate Check-In
  const handleSimulateDuplicateScan = async () => {
    try {
      const challenge = await fetchQrChallenge();
      // First attempt succeeds
      await handleCheckInAttempt(challenge.challengeToken, false);
      // Second attempt will trigger ALREADY_CHECKED_IN on the same session
    } catch (err: any) {
      setModalStatus("error");
      setErrorMessage(err.message);
    }
  };

  const handleResetScan = () => {
    setModalStatus("idle");
    setCheckInResult(null);
    setErrorMessage("");
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Scanner Viewport Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] overflow-hidden shadow-2xl relative transition-all duration-300 hover:border-blue-500/30 w-full">
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-[#06080A]/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Camera className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Dynamic QR Viewfinder HUD
              </h2>
              <p className="text-zinc-400 text-xs mt-0.5 font-mono">
                Align classroom display token inside targeting crosshairs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HUD ACTIVE
            </span>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative aspect-[4/3] sm:aspect-video w-full bg-[#06080A] flex items-center justify-center overflow-hidden cyber-grid">
          {hasCamera && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          )}

          {/* Futuristic HUD Telemetry Overlays */}
          <div className="absolute top-3 inset-x-4 z-10 flex items-center justify-between text-[10px] font-mono text-zinc-400 pointer-events-none">
            <span className="bg-[#06080A]/90 px-2.5 py-1 rounded border border-zinc-800">
              TARGET: ROTATING HMAC
            </span>
            <span className="bg-[#06080A]/90 px-2.5 py-1 rounded border border-zinc-800">
              FREQ: 15-20s CYCLE
            </span>
          </div>

          {/* Viewfinder Target Reticle */}
          <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 border border-blue-500/30 rounded-2xl flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-[2px] shadow-[0_0_30px_rgba(59,130,246,0.12)]">
            {/* 4 Corner Sci-Fi Targeting Brackets */}
            <div className="absolute -top-1 -left-1 w-9 h-9 border-t-4 border-l-4 border-blue-400 rounded-tl-xl shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            <div className="absolute -top-1 -right-1 w-9 h-9 border-t-4 border-r-4 border-blue-400 rounded-tr-xl shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            <div className="absolute -bottom-1 -left-1 w-9 h-9 border-b-4 border-l-4 border-blue-400 rounded-bl-xl shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
            <div className="absolute -bottom-1 -right-1 w-9 h-9 border-b-4 border-r-4 border-blue-400 rounded-br-xl shadow-[0_0_12px_rgba(59,130,246,0.6)]" />

            {/* Crosshair Center Reticle */}
            <div className="absolute w-6 h-[1px] bg-blue-400/40 pointer-events-none" />
            <div className="absolute h-6 w-[1px] bg-blue-400/40 pointer-events-none" />

            {/* Radar / Scanning Sweep Line */}
            <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_18px_#3b82f6] animate-scanline" />

            {/* Empty Camera Fallback / Reticle Center */}
            {!hasCamera && (
              <div className="text-center p-4 space-y-2 z-10">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-md">
                  {permissionDenied ? (
                    <CameraOff className="h-6 w-6 text-rose-400" />
                  ) : (
                    <Camera className="h-6 w-6 text-blue-400 animate-pulse" />
                  )}
                </div>
                <p className="text-xs font-semibold text-white font-mono">
                  {permissionDenied ? "CAMERA PERMISSION REQUIRED" : "SIMULATOR ACTIVE // RETICLE READY"}
                </p>
                <p className="text-[11px] text-zinc-400 leading-tight max-w-[200px] mx-auto font-mono">
                  {permissionDenied
                    ? "Camera permission denied. Use one-click simulator triggers below."
                    : "Center classroom projector QR within targeting brackets."}
                </p>
              </div>
            )}
          </div>

          {/* Device Hardware Binding Badge */}
          <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full bg-[#06080A]/90 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5 font-mono shadow-md">
            <Smartphone className="h-3.5 w-3.5 text-blue-400" />
            <span>HARDWARE BOUND // SHA-256</span>
          </div>

          {/* Submitting Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
              <p className="text-sm font-semibold text-white font-mono tracking-wide">VERIFYING CRYPTOGRAPHIC TOKEN...</p>
              <p className="text-xs text-zinc-400 font-mono">Validating HMAC timestamp & 1:1 hardware fingerprint</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Test Triggers (For testing & hackathon demonstration without physical projector) */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-5 sm:p-6 space-y-4 transition-all duration-300 hover:border-blue-500/30 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              TEST SUITE & SCANNER SIMULATORS
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400">
            Hackathon Demo Mode
          </span>
        </div>
        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
          Simulate scanning dynamic classroom QR codes under various real-world conditions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleSimulateValidScan}
            disabled={isSubmitting}
            className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-start gap-2.5 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-white" />
            <span>1. Valid Dynamic QR (201)</span>
          </button>

          <button
            onClick={handleSimulateExpiredScan}
            disabled={isSubmitting}
            className="w-full h-11 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-amber-500/30 text-amber-300 hover:text-amber-200 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-start gap-2.5 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-400" />
            <span>2. Expired Token (409)</span>
          </button>

          <button
            onClick={handleSimulateDeviceMismatch}
            disabled={isSubmitting}
            className="w-full h-11 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-start gap-2.5 disabled:opacity-50"
          >
            <Smartphone className="h-4 w-4 shrink-0 text-rose-400" />
            <span>3. Device Mismatch (403)</span>
          </button>

          <button
            onClick={handleSimulateDuplicateScan}
            disabled={isSubmitting}
            className="w-full h-11 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-start gap-2.5 disabled:opacity-50"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-400" />
            <span>4. Duplicate Check-In (409)</span>
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
