"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  History,
  Bot,
  Smartphone,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Lock,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";

export interface StudentNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
  highlight?: boolean;
  description: string;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    name: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
    badge: "MAIN",
    exact: true,
    description: "Academic Overview & Metrics",
  },
  {
    name: "Scan QR",
    href: "/student/scanner",
    icon: QrCode,
    badge: "HUD",
    highlight: true,
    description: "Rotating HMAC Camera Viewfinder",
  },
  {
    name: "History",
    href: "/student/history",
    icon: History,
    badge: "AUDIT",
    description: "Cryptographic Attendance Ledger",
  },
  {
    name: "Advisor",
    href: "/student/advisor",
    icon: Bot,
    badge: "AI 2.0",
    description: "Zero-Hallucination Attendance Companion",
  },
  {
    name: "Device",
    href: "/student/device",
    icon: Smartphone,
    badge: "SECURE",
    description: "1:1 SHA-256 Hardware Perimeter",
  },
];

interface StudentSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  userProfile: any;
}

export function StudentSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  userProfile,
}: StudentSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* =========================================================
          DESKTOP VERTICAL SIDEBAR (Fixed / Left)
          ========================================================= */}
      <aside
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col",
          "bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 shadow-2xl shadow-slate-950/80",
          "transition-[width] duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Top: Logo & Portal Identity */}
        <div
          className={cn(
            "h-20 flex items-center border-b border-slate-800/80 px-4 transition-all duration-300",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/student"
            className={cn(
              "flex items-center gap-3 group transition-transform duration-200",
              isCollapsed && "justify-center w-full"
            )}
            title="AttendGuard — B.Tech Portal"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30 group-hover:ring-emerald-400/70 group-hover:scale-105 transition-all duration-300 shrink-0">
              <ShieldCheck className="h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </div>

            <div
              className={cn(
                "flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap",
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
              )}
            >
              <span className="text-base font-black tracking-tight text-white leading-tight flex items-center gap-1.5">
                AttendGuard
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider uppercase">
                B.Tech Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 py-5 px-3 overflow-y-auto overflow-x-hidden space-y-6">
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-2.5 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase transition-opacity duration-300">
                Command Navigation
              </div>
            )}

            <nav className="space-y-1.5">
              {STUDENT_NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl font-mono text-xs font-bold transition-all duration-250 group",
                        isCollapsed ? "h-12 w-12 mx-auto justify-center p-0" : "px-3.5 py-3 w-full",
                        isActive
                          ? "bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 text-emerald-300 border border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.18)]"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 hover:border-slate-800/80 border border-transparent hover:translate-x-1"
                      )}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-emerald-400 shadow-[0_0_10px_#10b981] transition-all duration-300",
                            isCollapsed && "left-0 h-5 w-1"
                          )}
                        />
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          "transition-transform duration-250 shrink-0",
                          isActive
                            ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] scale-105"
                            : "text-slate-400 group-hover:text-emerald-300 group-hover:scale-105"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Label & Badge (Expanded Mode) */}
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between min-w-0 transition-opacity duration-300">
                          <span className={cn("truncate", isActive ? "text-white font-bold" : "")}>
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className={cn(
                                "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border transition-colors",
                                isActive
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : item.highlight
                                  ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                                  : "bg-slate-900 text-slate-500 border-slate-800 group-hover:text-slate-300 group-hover:border-slate-700"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700/80 text-white shadow-2xl shadow-slate-950 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">{item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5 max-w-[180px]">
                          {item.description}
                        </p>
                        {/* Tooltip Left Arrow */}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Telemetry, Collapse Toggle, & Quick Sign Out */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Telemetry Card (Expanded Mode Only) */}
          {!isCollapsed && (
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-1 transition-opacity duration-300">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-cyan-400" />
                  PERIMETER:
                </span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="text-[9px] text-slate-500 truncate">
                SHA-256 HARDWARE LOCKED
              </div>
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full h-9 font-mono text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition-all duration-200",
              isCollapsed ? "justify-center px-0" : "justify-start px-3 gap-2.5"
            )}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-emerald-400" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 text-emerald-400" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </Button>

          {/* Sign Out Button in Sidebar Bottom */}
          <div className={cn(isCollapsed ? "flex justify-center" : "w-full")}>
            <LogoutButton
              variant="ghost"
              size="sm"
              showText={!isCollapsed}
              className={cn(
                "h-9 font-mono text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all duration-200",
                isCollapsed ? "w-10 p-0 justify-center" : "w-full justify-start px-3 gap-2.5"
              )}
            />
          </div>
        </div>
      </aside>

      {/* =========================================================
          MOBILE SLIDE-OVER DRAWER (< md)
          ========================================================= */}
      {/* Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Mobile Drawer Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col",
          "bg-slate-950/98 backdrop-blur-2xl border-r border-slate-800 shadow-2xl shadow-slate-950",
          "transform transition-transform duration-300 ease-in-out md:hidden select-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="h-18 p-4 flex items-center justify-between border-b border-slate-800/80">
          <Link
            href="/student"
            onClick={onCloseMobile}
            className="flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white leading-tight">
                AttendGuard
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                B.Tech Portal
              </span>
            </div>
          </Link>

          <Button
            onClick={onCloseMobile}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-white rounded-lg"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Drawer User Capsule */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white font-black text-sm flex items-center justify-center shadow-md">
              {userProfile?.fullName
                ? userProfile.fullName.trim()[0].toUpperCase()
                : "U"}
            </div>
            <div className="flex flex-col min-w-0 font-mono">
              <span className="text-xs font-bold text-white truncate">
                {userProfile?.fullName || "Student"}
              </span>
              <span className="text-[10px] text-cyan-400 font-bold truncate">
                {userProfile?.identifier || "STU-AUTH"}
              </span>
              <Badge variant="emerald" className="mt-1 w-fit text-[9px] py-0 px-1.5 font-bold">
                VERIFIED DEVICE
              </Badge>
            </div>
          </div>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
            Navigation
          </div>

          {STUDENT_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl font-mono text-xs font-bold transition-all duration-200",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-emerald-400" : "text-slate-400")} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded border",
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer with Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80">
          <LogoutButton
            variant="outline"
            size="sm"
            showText={true}
            className="w-full justify-center text-xs font-mono font-bold border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          />
        </div>
      </aside>
    </>
  );
}
