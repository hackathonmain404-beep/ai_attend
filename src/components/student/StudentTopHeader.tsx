"use client";

import * as React from "react";
import Link from "next/link";
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
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#05070c]/85 backdrop-blur-xl transition-all duration-300">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-14 flex items-center justify-between gap-4">
        {/* =========================================================
            LEFT AREA: Mobile Toggle & Branded Command Center Identity
            ========================================================= */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <Button
            onClick={onOpenMobile}
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0 text-zinc-300 hover:text-white hover:bg-zinc-900 border border-white/[0.1] rounded-lg shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Branded Identity: ATTENDGUARD V1.0 / COMMAND CENTER */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/student" className="flex items-center gap-2 group">
              <span className="font-bold font-mono text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">
                ATTENDGUARD
              </span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border border-blue-500/25 bg-blue-500/10 text-blue-400">
                V1.0
              </span>
            </Link>
            <span className="hidden sm:inline-block text-zinc-650 font-mono text-xs">/</span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 uppercase tracking-wider truncate">
              COMMAND CENTER
            </span>
          </div>
        </div>

        {/* =========================================================
            RIGHT AREA: Compact User Profile & System Status
            ========================================================= */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Global System Status indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.08] px-2.5 py-1 rounded-lg transition-all duration-200 hover:border-blue-500/30 hover:bg-white/[0.05] cursor-default">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPERATIONAL</span>
          </div>

          {/* Compact User Profile Capsule */}
          <div
            className={cn(
              "flex items-center gap-2 py-1 px-2.5 rounded-xl",
              "bg-white/[0.03] border border-white/[0.08]",
              "hover:border-blue-500/30 hover:bg-white/[0.05]",
              "transition-colors duration-150",
              "group select-none"
            )}
            title={`Logged in as ${userProfile?.fullName || "Student"}`}
          >
            {/* User Avatar */}
            <div className="h-7 w-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono font-semibold text-xs flex items-center justify-center shadow-sm shrink-0">
              {userInitials}
            </div>

            {/* User Details Stack */}
            <div className="flex flex-col text-left font-mono min-w-0 pr-0.5">
              <span className="text-[11px] font-medium text-zinc-200 uppercase tracking-tight truncate max-w-[110px] sm:max-w-[140px] leading-tight">
                {userProfile?.fullName || (userProfile === null ? "Loading..." : "Student")}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-zinc-400 font-medium truncate">
                  {userProfile?.identifier || (userProfile === null ? "..." : "STU-AUTH")}
                </span>
                {userProfile === null ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[8.5px] font-mono text-zinc-500">
                    SYNCING...
                  </span>
                ) : userProfile?.device?.isRegistered ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[8.5px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                    BOUND
                  </span>
                ) : (
                  <Link
                    href="/student/device"
                    className="hidden sm:inline-flex items-center gap-1 text-[8.5px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    title="Register primary smartphone"
                  >
                    UNBOUND
                  </Link>
                )}
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-5 w-[1px] bg-white/[0.08] mx-0.5" />

            {/* Logout Action */}
            <LogoutButton
              variant="ghost"
              size="sm"
              showText={false}
              className="h-6 w-6 p-0 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
              title="Sign Out"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
