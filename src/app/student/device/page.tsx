"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Smartphone, ShieldCheck, HelpCircle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
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
          <DeviceStatusCard status={deviceStatus} />
        ) : (
          <DeviceRegisterForm onRegistered={handleRegisteredSuccess} />
        )}

        {/* Security Policy & FAQ Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-teal-400" />
            Hardware Binding Policies & Anti-Proxy Architecture
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Lock className="h-4 w-4 text-emerald-400" />
                Single Active Hardware Policy
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Each student account may only bind one primary hardware phone at any time. Scanning tokens from a friend&apos;s phone or unauthorized secondary browser is blocked by the cryptographic perimeter.
              </p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                Emergency Hardware Reset Procedure
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                If your phone is damaged, lost, or upgraded, visit your faculty instructor during designated office hours. Instructors can issue an authorized administrative reset logged to the security ledger.
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 text-center text-xs text-slate-500 font-mono">
        AttendGuard Zero-Trust Hardware Coupled Architecture • SHA-256 Client Security Perimeter
      </footer>
    </div>
  );
}
