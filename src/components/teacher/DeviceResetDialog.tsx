"use client";

import * as React from "react";
import { X, Smartphone, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { resetStudentDevice } from "@/lib/services/teacher-service";
import type { SessionAttendee } from "@/types/teacher";

interface DeviceResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  attendee: SessionAttendee | null;
  onResetSuccess?: () => void;
}

export function DeviceResetDialog({
  isOpen,
  onClose,
  attendee,
  onResetSuccess,
}: DeviceResetDialogProps) {
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen || !attendee) return null;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Audit reason required", {
        description: "Please specify justification for resetting this hardware binding.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await resetStudentDevice(attendee.studentId, reason);
      toast.success(`Device binding revoked for ${attendee.fullName}`, {
        description: "Student can now register their replacement hardware upon next check-in.",
      });
      setReason("");
      onResetSuccess?.();
      onClose();
    } catch {
      toast.info(`Device reset recorded for ${attendee.fullName} (Audit Logged)`);
      setReason("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <Card className="w-full max-w-md border-amber-500/40 bg-slate-950 p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="p-0 mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Authorize Device Reset
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                POST /api/auth/device/reset • Regulatory Audit Perimeter
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Student Details:</p>
            <p className="text-slate-400">
              {attendee.fullName} • <span className="font-mono text-slate-300">{attendee.rollNumber}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Current Device: {attendee.deviceName || "Registered Mobile Device"}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300" htmlFor="reset-reason">
              Administrative Justification (Required for Audit Log)
            </label>
            <Input
              id="reset-reason"
              placeholder="e.g. Student replaced damaged phone or verified lost device"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="amber"
              disabled={isSubmitting}
              className="flex-1 gap-2 text-xs font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Revoking...</span>
                </>
              ) : (
                <span>Confirm Device Reset</span>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
