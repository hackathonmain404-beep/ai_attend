"use client";

import * as React from "react";
import { Camera, CameraOff, Sparkles, ShieldCheck, AlertCircle, RefreshCw, Smartphone, Zap } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanResultModal, type ScanModalStatus } from "@/components/student/ScanResultModal";
import { submitCheckIn, fetchQrChallenge } from "@/lib/services/qr-service";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import { ApiError } from "@/lib/api-client";
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
      <Card className="border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative">
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-400" />
              <span>DYNAMIC QR VIEWFINDER HUD</span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-0.5 font-mono">
              Align classroom display token inside targeting crosshairs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold bg-emerald-500/10">
              HUD ACTIVE
            </Badge>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative aspect-[4/3] sm:aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden cyber-grid">
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
          <div className="absolute top-3 inset-x-4 z-10 flex items-center justify-between text-[10px] font-mono text-emerald-400/80 pointer-events-none">
            <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              TARGET: ROTATING HMAC
            </span>
            <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              FREQ: 15-20s CYCLE
            </span>
          </div>

          {/* Viewfinder Target Reticle */}
          <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 border border-emerald-400/30 rounded-2xl flex items-center justify-center p-4 bg-slate-950/30 backdrop-blur-[2px] shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            {/* 4 Corner Sci-Fi Targeting Brackets */}
            <div className="absolute -top-1 -left-1 w-9 h-9 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            <div className="absolute -top-1 -right-1 w-9 h-9 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            <div className="absolute -bottom-1 -left-1 w-9 h-9 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            <div className="absolute -bottom-1 -right-1 w-9 h-9 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_12px_rgba(16,185,129,0.7)]" />

            {/* Crosshair Center Reticle */}
            <div className="absolute w-6 h-[1px] bg-emerald-400/40 pointer-events-none" />
            <div className="absolute h-6 w-[1px] bg-emerald-400/40 pointer-events-none" />

            {/* Radar / Scanning Laser Sweep Line */}
            <div className="absolute inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_18px_#10b981] animate-scanline" />

            {/* Empty Camera Fallback / Reticle Center */}
            {!hasCamera && (
              <div className="text-center p-4 space-y-2 z-10">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
                  {permissionDenied ? (
                    <CameraOff className="h-6 w-6 text-rose-400" />
                  ) : (
                    <Camera className="h-6 w-6 text-emerald-400 animate-pulse" />
                  )}
                </div>
                <p className="text-xs font-bold text-white font-mono">
                  {permissionDenied ? "CAMERA PERMISSION REQUIRED" : "SIMULATOR ACTIVE // RETICLE READY"}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight max-w-[200px] mx-auto">
                  {permissionDenied
                    ? "Camera permission denied. Use one-click simulator triggers below."
                    : "Center classroom projector QR within targeting brackets."}
                </p>
              </div>
            )}
          </div>

          {/* Device Hardware Binding Badge */}
          <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 font-mono shadow-md">
            <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
            <span>HARDWARE BOUND // SHA-256</span>
          </div>

          {/* Submitting Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-sm font-bold text-white font-mono tracking-wide">VERIFYING CRYPTOGRAPHIC TOKEN...</p>
              <p className="text-xs text-slate-400">Validating HMAC timestamp & 1:1 hardware fingerprint</p>
            </div>
          )}
        </div>
      </Card>

      {/* Simulator Test Triggers (For testing & hackathon demonstration without physical projector) */}
      <Card className="border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Interactive Test Suite & Scanner Simulators
            </h4>
          </div>
          <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
            Hackathon Demo Mode
          </Badge>
        </div>
        <p className="text-xs text-slate-400">
          Simulate scanning dynamic classroom QR codes under various real-world conditions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <Button
            onClick={handleSimulateValidScan}
            disabled={isSubmitting}
            variant="emerald"
            size="sm"
            className="w-full justify-start text-xs font-semibold"
          >
            <ShieldCheck className="h-4 w-4 mr-2 shrink-0" />
            1. Scan Valid Dynamic QR (201)
          </Button>

          <Button
            onClick={handleSimulateExpiredScan}
            disabled={isSubmitting}
            variant="amber"
            size="sm"
            className="w-full justify-start text-xs font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2 shrink-0" />
            2. Simulate Expired QR (409)
          </Button>

          <Button
            onClick={handleSimulateDeviceMismatch}
            disabled={isSubmitting}
            variant="destructive"
            size="sm"
            className="w-full justify-start text-xs font-semibold"
          >
            <Smartphone className="h-4 w-4 mr-2 shrink-0" />
            3. Simulate Device Mismatch (403)
          </Button>

          <Button
            onClick={handleSimulateDuplicateScan}
            disabled={isSubmitting}
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs font-semibold border-slate-700 hover:bg-slate-800"
          >
            <AlertCircle className="h-4 w-4 mr-2 shrink-0 text-teal-400" />
            4. Duplicate Check-In Test (409)
          </Button>
        </div>
      </Card>

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
