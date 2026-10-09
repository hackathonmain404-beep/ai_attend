"use client";

import * as React from "react";
import { Smartphone, ShieldCheck, Fingerprint, Loader2, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { registerStudentDevice } from "@/lib/services/device-client-service";
import type { DeviceRegistrationResponse } from "@/types/device-ui";

interface DeviceRegisterFormProps {
  onRegistered: (res: DeviceRegistrationResponse) => void;
}

export function DeviceRegisterForm({ onRegistered }: DeviceRegisterFormProps) {
  const [deviceName, setDeviceName] = React.useState("Primary Student Smartphone");
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
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 space-y-6 max-w-xl mx-auto shadow-2xl transition-all duration-300 hover:border-blue-500/30">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <Smartphone className="h-6 w-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold mb-1">
            Initial Hardware Binding
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Register Primary Device
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bind this smartphone to your AttendGuard student profile
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block" htmlFor="device-name-input">
            Device Display Name
          </label>
          <Input
            id="device-name-input"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g. Pixel 8 Pro or iPhone 15"
            disabled={isSubmitting}
            className="text-xs sm:text-sm bg-[#06080A] border-zinc-800 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-zinc-600 font-mono h-11 rounded-lg"
          />
          <p className="text-[11px] font-mono text-zinc-500">
            A friendly name to identify your smartphone on attendance rosters.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800/80 bg-[#06080A] text-xs text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-200 font-mono text-xs font-semibold">
            <Fingerprint className="h-4 w-4 text-blue-400" />
            <span>Automated Hardware Fingerprint Generation</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-normal leading-relaxed pl-6">
            Upon submission, AttendGuard computes a unique SHA-256 hash from your device hardware properties. This binds your account so that attendance can only be scanned from this phone.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Binding Device Hardware...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              <span>Bind This Device to Account</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
