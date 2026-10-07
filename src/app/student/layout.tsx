"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  QrCode,
  History,
  Bot,
  Smartphone,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import * as React from "react";

const navItems = [
  {
    name: "Dashboard",
    href: "/student",
    icon: Home,
    exact: true,
  },
  {
    name: "Scan QR",
    href: "/student/scanner",
    icon: QrCode,
    highlight: true,
  },
  {
    name: "History",
    href: "/student/history",
    icon: History,
  },
  {
    name: "Advisor",
    href: "/student/advisor",
    icon: Bot,
  },
  {
    name: "Device",
    href: "/student/device",
    icon: Smartphone,
  },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = React.useState<any>(() => {
    return typeof window !== "undefined" ? getCurrentUserProfile() : null;
  });

  React.useEffect(() => {
    let isMounted = true;
    if (!userProfile) {
      resolveCurrentUserProfile().then((p) => {
        if (isMounted && p) setUserProfile(p);
      });
    }

    const handleUserChange = (e: Event) => {
      const custom = e as CustomEvent<any>;
      if (isMounted) setUserProfile(custom.detail);
    };

    window.addEventListener("attendguard-user-changed", handleUserChange);
    return () => {
      isMounted = false;
      window.removeEventListener("attendguard-user-changed", handleUserChange);
    };
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col pb-24 md:pb-8">
      {/* Student Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <Link href="/student" className="flex items-center gap-3 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white leading-tight">
                AttendGuard
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                B.Tech Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all duration-200 relative",
                    isActive
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-400" : "text-slate-400")} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_6px_#10b981]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Device Status */}
          <div className="flex items-center gap-2.5">
            {/* Live Telemetry Ping */}
            <div className="hidden xl:flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE PING: 14ms</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800/80">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center shadow-md shadow-emerald-950/40">
                {userProfile?.fullName ? userProfile.fullName.trim()[0].toUpperCase() : "U"}
              </div>
              <div className="hidden lg:flex flex-col text-left font-mono">
                <span className="text-xs font-bold text-slate-200 leading-tight">
                  {userProfile?.fullName || (userProfile === null ? "Loading..." : "Student")}
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">
                  {userProfile?.identifier || (userProfile === null ? "..." : "STU-AUTH")}
                </span>
              </div>
            </div>

            <Badge variant="emerald" className="hidden sm:inline-flex text-[10px] py-0.5 px-2 font-mono font-bold">
              VERIFIED DEVICE
            </Badge>

            <LogoutButton variant="ghost" size="sm" showText={false} className="h-8 w-8 p-0 text-slate-400 hover:text-white" title="Sign Out" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Dock (Student Primary UX) */}
      <nav
        aria-label="Student Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-lg md:hidden shadow-2xl"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div
                    className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-200 group-active:scale-95",
                      isActive
                        ? "bg-emerald-500 text-white shadow-emerald-950/80 ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-950/50"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium mt-1 transition-colors",
                      isActive ? "text-emerald-400 font-bold" : "text-slate-400"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center h-full min-h-[44px] transition-colors group",
                  isActive ? "text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all",
                    isActive ? "bg-emerald-500/10 text-emerald-400" : "group-hover:bg-slate-800/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
