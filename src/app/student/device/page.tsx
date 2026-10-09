"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Loader2, Smartphone, Key } from "lucide-react";
import { DeviceStatusCard } from "@/components/student/DeviceStatusCard";
import { DeviceRegisterForm } from "@/components/student/DeviceRegisterForm";
import { fetchStudentDeviceStatus } from "@/lib/services/device-client-service";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import type { StudentDeviceStatus } from "@/types/device-ui";

export default function StudentDevicePage() {
  const [deviceStatus, setDeviceStatus] = React.useState<StudentDeviceStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userProfile, setUserProfile] = React.useState<any>(() => {
    return typeof window !== "undefined" ? getCurrentUserProfile() : null;
  });

  const loadStatus = React.useCallback(async () => {
    try {
      const status = await fetchStudentDeviceStatus();
      setDeviceStatus(status);
    } catch {
      setDeviceStatus({ isRegistered: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStatus();
    if (!userProfile) {
      resolveCurrentUserProfile().then(setUserProfile);
    }
  }, [loadStatus, userProfile]);

  const handleRegisteredSuccess = () => {
    setIsLoading(true);
    loadStatus();
  };

  if (isLoading || !deviceStatus) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Syncing hardware security perimeter...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Command Center Page Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-zinc-800/60">
        <div className="space-y-3 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              HARDWARE PERIMETER
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              DEVICE BINDING
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Registered Device Security
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            AttendGuard cryptographically couples your attendance verification to this physical phone to prevent proxy scanning.
          </p>
        </div>

        {/* Right Breadcrumb & Ratio Pill */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO COMMAND CENTER</span>
          </Link>

          <div className="px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>1:1 HARDWARE COUPLING</span>
          </div>
        </div>
      </div>

      {/* 2. Device Status or Registration Form */}
      <section className="space-y-4">
        {deviceStatus.isRegistered ? (
          <DeviceStatusCard status={deviceStatus} />
        ) : (
          <DeviceRegisterForm onRegistered={handleRegisteredSuccess} />
        )}
      </section>

      {/* 3. Security Policy & Anti-Proxy Architecture Section */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
            SECURITY POLICIES
          </h3>
          <span className="text-zinc-600 font-mono text-xs">/</span>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            ANTI-PROXY ARCHITECTURE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 space-y-3 transition-all duration-200 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/20 group">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors">
                Single Active Hardware Policy
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal pl-12">
              Each student account may only bind one primary hardware phone at any time. Scanning tokens from a friend&apos;s phone or unauthorized secondary browser is blocked by the cryptographic perimeter.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 space-y-3 transition-all duration-200 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/20 group">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors">
                Emergency Hardware Reset Procedure
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal pl-12">
              If your phone is damaged, lost, or upgraded, visit your faculty instructor during designated office hours. Instructors can issue an authorized administrative reset logged to the security ledger.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
