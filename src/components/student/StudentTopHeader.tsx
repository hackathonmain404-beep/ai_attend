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
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md transition-all duration-300">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-5 md:px-6 h-14 flex items-center justify-between gap-3">
        {/* =========================================================
            LEFT AREA: Mobile Toggle & Page Title / Telemetry
            ========================================================= */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <Button
            onClick={onOpenMobile}
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 rounded-lg"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Current Page Title and Subtitle */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                {pageMeta.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-mono font-medium px-2 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {pageMeta.badge}
              </span>
            </div>
            <p className="hidden xs:block text-[10px] font-mono text-slate-400 truncate">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* =========================================================
            RIGHT AREA: Compact User Profile & Device Status
            ========================================================= */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact User Profile Capsule */}
          <div
            className={cn(
              "flex items-center gap-2 py-0.5 px-2 rounded-lg",
              "bg-slate-900/60 border border-slate-800/80",
              "hover:border-slate-700 hover:bg-slate-900/80",
              "transition-colors duration-150",
              "group select-none"
            )}
            title={`Logged in as ${userProfile?.fullName || "Student"}`}
          >
            {/* User Avatar */}
            <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
              {userInitials}
            </div>

            {/* User Details Stack */}
            <div className="flex flex-col text-left font-mono min-w-0 pr-0.5">
              <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-tight truncate max-w-[110px] sm:max-w-[140px] leading-tight">
                {userProfile?.fullName || (userProfile === null ? "Loading..." : "Student")}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-teal-400 font-medium truncate">
                  {userProfile?.identifier || (userProfile === null ? "..." : "STU-AUTH")}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[8.5px] font-medium text-emerald-300">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                  VERIFIED DEVICE
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-5 w-[1px] bg-slate-800 mx-0.5" />

            {/* Logout Action */}
            <LogoutButton
              variant="ghost"
              size="sm"
              showText={false}
              className="h-6 w-6 p-0 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
              title="Sign Out"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
