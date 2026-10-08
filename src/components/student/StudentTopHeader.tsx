"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { cn } from "@/lib/utils";

interface StudentTopHeaderProps {
  onOpenMobile: () => void;
  userProfile: any;
}

export function StudentTopHeader({
  onOpenMobile,
  userProfile,
}: StudentTopHeaderProps) {
  const pathname = usePathname();

  // Dynamic Page Metadata based on current route
  const pageMeta = React.useMemo(() => {
    if (pathname === "/student" || pathname === "/student/") {
      return {
        title: "Dashboard",
        subtitle: "B.Tech Command Center // Term 5",
        badge: "LIVE TELEMETRY",
      };
    }
    if (pathname.startsWith("/student/scanner")) {
      return {
        title: "Dynamic QR Scanner",
        subtitle: "Rotating HMAC Camera Viewfinder",
        badge: "20s REFRESH",
      };
    }
    if (pathname.startsWith("/student/history")) {
      return {
        title: "Attendance History",
        subtitle: "Cryptographic Attendance Ledger",
        badge: "VERIFIED LOGS",
      };
    }
    if (pathname.startsWith("/student/advisor")) {
      return {
        title: "AI Policy Advisor",
        subtitle: "Zero-Hallucination Academic Companion",
        badge: "NEURAL ADVISOR",
      };
    }
    if (pathname.startsWith("/student/device")) {
      return {
        title: "Device Biometric Binding",
        subtitle: "1:1 SHA-256 Hardware Perimeter",
        badge: "HARDWARE LOCKED",
      };
    }
    if (pathname.startsWith("/student/subjects")) {
      return {
        title: "Subject Attendance",
        subtitle: "Course Breakdown & Margin Math",
        badge: "75% REGULATION",
      };
    }
    return {
      title: "Student Portal",
      subtitle: "AttendGuard Institutional Perimeter",
      badge: "ACTIVE",
    };
  }, [pathname]);

  // Derived user initials (e.g. "Abhijit Raika" -> "AR")
  const userInitials = React.useMemo(() => {
    const rawName = userProfile?.fullName?.trim() || "Student";
    const parts = rawName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return rawName.slice(0, 2).toUpperCase() || "S";
  }, [userProfile?.fullName]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* =========================================================
            LEFT AREA: Mobile Toggle & Page Title / Telemetry
            ========================================================= */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <Button
            onClick={onOpenMobile}
            variant="ghost"
            size="sm"
            className="md:hidden h-10 w-10 p-0 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-xl"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Current Page Title and Subtitle */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                {pageMeta.title}
              </h1>
              <span className="hidden sm:inline-flex text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {pageMeta.badge}
              </span>
            </div>
            <p className="hidden xs:block text-[11px] font-mono text-slate-400 truncate">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* =========================================================
            RIGHT AREA: Modern User Profile & Device Status
            ========================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          {/* User Profile Card */}
          <div
            className={cn(
              "flex items-center gap-3 p-1.5 pl-2.5 pr-2 rounded-2xl",
              "bg-slate-900/80 border border-slate-800/90",
              "hover:border-emerald-500/40 hover:bg-slate-900/95",
              "transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
              "group select-none"
            )}
            title={`Logged in as ${userProfile?.fullName || "Student"}`}
          >
            {/* User Avatar */}
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30 group-hover:ring-emerald-400 group-hover:scale-105 transition-all duration-300 shrink-0">
              {userInitials}
            </div>

            {/* User Details Stack */}
            <div className="flex flex-col text-left font-mono min-w-0 pr-1">
              <span className="text-xs font-black text-slate-100 uppercase tracking-tight truncate max-w-[120px] sm:max-w-[160px] group-hover:text-emerald-300 transition-colors leading-tight">
                {userProfile?.fullName || (userProfile === null ? "Loading..." : "Student")}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-cyan-400 font-bold truncate">
                  {userProfile?.identifier || (userProfile === null ? "..." : "STU-AUTH")}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                  VERIFIED DEVICE
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-[1px] bg-slate-800 group-hover:bg-slate-700/80 transition-colors mx-0.5" />

            {/* Logout Action */}
            <LogoutButton
              variant="ghost"
              size="sm"
              showText={false}
              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-200"
              title="Sign Out"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
