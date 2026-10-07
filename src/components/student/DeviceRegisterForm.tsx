"use client";

import * as React from "react";
import { Smartphone, ShieldCheck, Fingerprint, Loader2, CheckCircle2, AlertOctagon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { registerStudentDevice } from "@/lib/services/device-client-service";
import type { DeviceRegistrationResponse } from "@/types/device-ui";

interface DeviceRegisterFormProps {
  onRegistered: (res: DeviceRegistrationResponse) => void;
}

export function DeviceRegisterForm({ onRegistered }: DeviceRegisterFormProps) {
  const [deviceName, setDeviceName] = React.useState("Jane's Primary Smartphone");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      setErrorMessage("Please enter a descriptive device name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await registerStudentDevice(deviceName.trim(), undefined, true);
      toast.success("Device Successfully Bound!", {
        description: `Bound ${deviceName} to your student profile.`,
      });
      onRegistered(res);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to register device. An active device may already be registered."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-emerald-500/40 bg-slate-900/60 p-6 sm:p-8 space-y-6 max-w-xl mx-auto shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
          <Smartphone className="h-7 w-7 animate-pulse" />
        </div>
        <div>
          <Badge variant="emerald" className="text-xs mb-1 font-bold">
            Initial Hardware Binding
          </Badge>
          <CardTitle className="text-xl font-bold text-white tracking-tight">
            Register Primary Device
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Bind this smartphone to your AttendGuard student profile
          </CardDescription>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300" htmlFor="device-name-input">
            Device Display Name
          </label>
          <Input
            id="device-name-input"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g. Jane's Pixel 8 Pro or iPhone 15"
            disabled={isSubmitting}
            className="text-sm bg-slate-950 border-slate-800"
          />
          <p className="text-[11px] text-slate-500">
            A friendly name to identify your smartphone on attendance rosters.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400 space-y-1.5 font-mono">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Fingerprint className="h-4 w-4 text-emerald-400" />
            <span>Automated Hardware Fingerprint Generation</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            Upon submission, AttendGuard computes a unique SHA-256 hash from your device hardware properties. This binds your account so that attendance can only be scanned from this phone.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="emerald"
          size="lg"
          className="w-full font-bold shadow-lg shadow-emerald-950/50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Binding Device...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Bind This Device to Account
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
