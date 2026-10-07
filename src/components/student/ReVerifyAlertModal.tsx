"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Smartphone, Timer, Zap, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitStudentReVerification } from "@/lib/services/verification-service";
import { getClientDeviceFingerprint } from "@/lib/device/fingerprint";
import type { ReVerifyChallenge, ReVerifyResult } from "@/types/verification";

interface ReVerifyAlertModalProps {
  challenge: ReVerifyChallenge | null;
  onCompleted?: (result: ReVerifyResult) => void;
  onDismiss?: () => void;
}

export function ReVerifyAlertModal({
  challenge,
  onCompleted,
  onDismiss,
}: ReVerifyAlertModalProps) {
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(60);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successResult, setSuccessResult] = React.useState<ReVerifyResult | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  const duration = challenge?.durationSeconds || 60;

  // Countdown timer
  React.useEffect(() => {
    if (!challenge) return;

    const calcRemaining = () => {
      const diffMs = new Date(challenge.expiresAt).getTime() - Date.now();
      const sec = Math.max(0, Math.floor(diffMs / 1000));
      return sec;
    };

    setSecondsRemaining(calcRemaining());

    const timer = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  if (!challenge) return null;

  const isExpired = secondsRemaining <= 0;
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / duration) * 100));

  const handleConfirm = async (simulatedMismatch = false) => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const fingerprint = await getClientDeviceFingerprint(simulatedMismatch);
      const res = await submitStudentReVerification({
        sessionId: challenge.sessionId,
        challengeId: challenge.reverifyChallengeId,
        deviceFingerprint: fingerprint,
      });

      setSuccessResult(res);
      if (onCompleted) {
        onCompleted(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm re-verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
      <Card className="w-full max-w-md border-amber-500/50 bg-slate-950 p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        {/* Animated Top Glow Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 animate-pulse" />

        {successResult ? (
          /* SUCCESS STATE */
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="emerald" className="mb-2 text-xs font-bold">
                Presence Verified
              </Badge>
              <CardTitle className="text-2xl font-black text-white">
                Re-Verification Confirmed!
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-1">
                Your presence was authoritatively confirmed for this session.
              </CardDescription>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-300 space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Record ID:</span>
                <span className="text-slate-300">{successResult.recordId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verified At:</span>
                <span className="text-emerald-400 font-bold">
                  {new Date(successResult.reVerifiedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <Button
              onClick={() => {
                setSuccessResult(null);
                if (onDismiss) onDismiss();
              }}
              variant="emerald"
              className="w-full font-bold"
            >
              Done
            </Button>
          </div>
        ) : isExpired ? (
          /* EXPIRED STATE */
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <Badge variant="destructive" className="mb-2 text-xs font-bold">
                Window Expired
              </Badge>
              <CardTitle className="text-2xl font-black text-white">
                Re-Verification Window Closed
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs mt-1">
                The 60-second surprise presence check has ended. Please contact your instructor.
              </CardDescription>
            </div>
            <Button
              onClick={onDismiss}
              variant="outline"
              className="w-full border-slate-700"
            >
              Close
            </Button>
          </div>
        ) : (
          /* ACTIVE COUNTDOWN STATE */
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <Badge variant="amber" className="text-[10px] uppercase font-bold tracking-wider">
                    Surprise Presence Check
                  </Badge>
                  <CardTitle className="text-xl font-black text-white mt-0.5">
                    Confirm Classroom Presence
                  </CardTitle>
                </div>
              </div>
            </div>

            <CardDescription className="text-slate-300 text-xs leading-relaxed">
              Your instructor initiated an in-class re-verification alert. Tap below from your registered smartphone to maintain active attendance status.
            </CardDescription>

            {/* Countdown Progress Bar */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Timer className="h-4 w-4 text-amber-400" />
                  Time Remaining:
                </span>
                <span className="font-mono text-amber-300 text-sm font-bold">
                  {secondsRemaining} seconds
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Device Hardware Info */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono px-1">
              <Smartphone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Bound to Verified Smartphone</span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={() => handleConfirm(false)}
                disabled={isSubmitting || isExpired}
                variant="emerald"
                size="lg"
                className="w-full font-bold text-sm shadow-lg shadow-emerald-950/50"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {isSubmitting ? "Verifying Presence..." : "Confirm In-Class Presence"}
              </Button>

              <Button
                onClick={() => handleConfirm(true)}
                disabled={isSubmitting || isExpired}
                variant="ghost"
                size="sm"
                className="w-full text-slate-500 hover:text-rose-400 text-[11px]"
              >
                Test Proxy Detection (Simulate Mismatch Device)
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
