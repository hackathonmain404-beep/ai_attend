"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Smartphone, ShieldCheck, HelpCircle, Lock, RefreshCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DeviceStatusCard } from "@/components/student/DeviceStatusCard";
import { DeviceRegisterForm } from "@/components/student/DeviceRegisterForm";
import { fetchStudentDeviceStatus } from "@/lib/services/device-client-service";
import { getMockStudentDeviceStatus } from "@/mocks/device-ui";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import type { StudentDeviceStatus } from "@/types/device-ui";

export default function StudentDevicePage() {
  const [deviceStatus, setDeviceStatus] = React.useState<StudentDeviceStatus | null>(() =>
    getMockStudentDeviceStatus()
  );
  const [userProfile, setUserProfile] = React.useState<any>(() => {
    return typeof window !== "undefined" ? getCurrentUserProfile() : null;
  });

  React.useEffect(() => {
    fetchStudentDeviceStatus().then(setDeviceStatus);
    if (!userProfile) {
      resolveCurrentUserProfile().then(setUserProfile);
    }
  }, [userProfile]);

  const handleSimulateUnregister = () => {
    setDeviceStatus({
      isRegistered: false,
    });
  };

  const handleRegisteredSuccess = () => {
    fetchStudentDeviceStatus().then(setDeviceStatus);
  };

  if (!deviceStatus) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <p className="text-xs text-slate-400">Loading hardware device security status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Student Portal
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Hardware Binding Perimeter
            </span>
          </div>
        </div>

        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs font-mono">
          {userProfile?.fullName || "Student"} • {userProfile?.identifier || "STU-AUTH"}
        </Badge>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-7">
        {/* Title Intro */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Registered Device Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            AttendGuard cryptographically couples your attendance verification to this physical phone to prevent proxy scanning.
          </p>
        </div>

        {/* Device Status or Registration Form */}
        {deviceStatus.isRegistered ? (
          <DeviceStatusCard
            status={deviceStatus}
            onSimulateUnregister={handleSimulateUnregister}
          />
        ) : (
          <DeviceRegisterForm onRegistered={handleRegisteredSuccess} />
        )}

        {/* Security Policy & FAQ Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-teal-400" />
            Hardware Binding Policies & Anti-Proxy Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Card className="p-4 border-slate-800 bg-slate-900/40 space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                1-to-1 Device Ratio
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Each student account is locked to a single physical device fingerprint. Attendance cannot be submitted from another student&apos;s phone or a laptop browser.
              </p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/40 space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <RefreshCcw className="h-3.5 w-3.5 text-amber-400" />
                Hardware Upgrades
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If you purchase a new smartphone or your phone is repaired, inform your instructor. They will issue an administrative reset permitting new hardware registration.
              </p>
            </Card>

            <Card className="p-4 border-slate-800 bg-slate-900/40 space-y-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                Privacy Safeguards
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                AttendGuard never tracks GPS location or reads personal files. Fingerprints consist solely of standard browser and screen dimensions hashed via SHA-256.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
