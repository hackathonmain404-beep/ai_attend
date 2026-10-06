"use client";

import * as React from "react";
import { Zap, Timer, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { triggerSessionReVerification } from "@/lib/services/verification-service";
import type { ReVerifyChallenge } from "@/types/verification";

interface ReVerifyTriggerButtonProps {
  sessionId?: string;
  onChallengeCreated?: (challenge: ReVerifyChallenge) => void;
}

export function ReVerifyTriggerButton({
  sessionId = "44444444-4444-4444-4444-444444444441",
  onChallengeCreated,
}: ReVerifyTriggerButtonProps) {
  const [isOpenConfirm, setIsOpenConfirm] = React.useState(false);
  const [activeChallenge, setActiveChallenge] = React.useState<ReVerifyChallenge | null>(null);
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Active countdown
  React.useEffect(() => {
    if (!activeChallenge) return;

    const timer = setInterval(() => {
      const remainingMs = new Date(activeChallenge.expiresAt).getTime() - Date.now();
      const sec = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsRemaining(sec);

      if (sec <= 0) {
        clearInterval(timer);
        setActiveChallenge(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeChallenge]);

  const handleLaunchChallenge = async () => {
    setIsSubmitting(true);
    try {
      const challenge = await triggerSessionReVerification(sessionId);
      setActiveChallenge(challenge);
      setSecondsRemaining(60);
      setIsOpenConfirm(false);
      if (onChallengeCreated) {
        onChallengeCreated(challenge);
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {activeChallenge ? (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
          <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
          <div className="text-left">
            <span className="text-[11px] font-bold text-amber-300 block">
              In-Class Re-Verification Active
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              {secondsRemaining}s window remaining
            </span>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpenConfirm(true)}
          variant="outline"
          size="sm"
          className="border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold"
        >
          <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
          Surprise Re-Verify (60s)
        </Button>
      )}

      {/* Confirmation Modal */}
      {isOpenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <Card className="w-full max-w-md border-slate-800 bg-slate-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">
                  Broadcast Re-Verification?
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  Auditorium surprise presence check
                </CardDescription>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will broadcast a high-priority prompt to all attendees currently marked present. They must acknowledge the alert from their registered device within <strong>60 seconds</strong> to confirm continued physical presence.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setIsOpenConfirm(false)}
                variant="outline"
                className="w-1/2 border-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLaunchChallenge}
                disabled={isSubmitting}
                variant="amber"
                className="w-1/2 text-xs font-bold"
              >
                {isSubmitting ? "Broadcasting..." : "Launch 60s Check"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
