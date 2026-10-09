"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  History,
  Bot,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";

export interface StudentNavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  highlight?: boolean;
  description: string;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    name: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
    exact: true,
    description: "Academic Overview & Metrics",
  },
  {
    name: "Scan QR",
    href: "/student/scanner",
    icon: QrCode,
    highlight: true,
    description: "Session QR Camera Viewfinder",
  },
  {
    name: "History",
    href: "/student/history",
    icon: History,
    description: "Cryptographic Attendance Ledger",
  },
  {
    name: "Advisor",
    href: "/student/advisor",
    icon: Bot,
    description: "AI Attendance Companion",
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
  const [isHovered, setIsHovered] = React.useState<boolean>(false);

  // Expanded if pinned open OR temporarily hovered while collapsed
  const isExpanded = !isCollapsed || isHovered;

  return (
    <>
      {/* =========================================================
          DESKTOP VERTICAL SIDEBAR (Fixed / Left)
          ========================================================= */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col",
          "bg-[#07080A] border-r border-zinc-800/80",
          "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none",
          isExpanded ? "w-56 shadow-2xl shadow-black/80" : "w-[68px] shadow-lg shadow-black/50"
        )}
      >
        {/* Top: Logo & Portal Identity */}
        <div
          className={cn(
            "h-14 flex items-center border-b border-zinc-800/80 px-3.5 transition-all duration-300",
            isExpanded ? "justify-between" : "justify-center"
          )}
        >
          <Link
            href="/student"
            className="flex items-center gap-2.5 group transition-transform duration-200"
            title="AttendGuard — Student Command Center"
          >
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:text-blue-300 transition-colors shadow-sm shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div
              className={cn(
                "flex flex-col overflow-hidden transition-all duration-300 whitespace-nowrap",
                isExpanded ? "w-auto opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-2 pointer-events-none"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-white leading-tight">
                  AttendGuard
                </span>
                <span className="text-[9px] uppercase font-mono font-medium tracking-wider px-1 py-0.2 rounded border border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  v1.0
                </span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase">
                Zero-Trust Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Navigation Items */}
        <div className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden space-y-3">
          <div>
            <div
              className={cn(
                "px-2.5 mb-1.5 text-[9px] font-mono font-semibold tracking-wider text-zinc-500 uppercase transition-all duration-300",
                isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden mb-0"
              )}
            >
              Navigation
            </div>

            <nav className="space-y-1">
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
                        "relative flex items-center gap-2.5 rounded-lg font-mono text-xs font-medium transition-all duration-200 group h-10",
                        isExpanded ? "px-2.5 w-full" : "w-11 mx-auto justify-center p-0",
                        isActive
                          ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800/80 border border-transparent hover:translate-x-0.5"
                      )}
                    >
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-blue-500 shadow-[0_0_8px_#3b82f6] transition-all duration-200",
                            !isExpanded && "left-0 h-4 w-1"
                          )}
                        />
                      )}

                      {/* Stable Icon Container */}
                      <div
                        className={cn(
                          "w-5 h-5 flex items-center justify-center shrink-0 transition-transform duration-200",
                          isActive
                            ? "text-blue-400 scale-105"
                            : "text-zinc-400 group-hover:text-zinc-200 group-hover:scale-105"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Smooth Sliding Label */}
                      <span
                        className={cn(
                          "truncate whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          isExpanded
                            ? "opacity-100 translate-x-0 w-auto"
                            : "opacity-0 -translate-x-2 w-0 overflow-hidden pointer-events-none",
                          isActive ? "text-white font-semibold" : "text-zinc-300 group-hover:text-white"
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>

                    {/* Tooltip in Collapsed Mode */}
                    {!isExpanded && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-white">{item.name}</span>
                        <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                          {item.description}
                        </p>
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-zinc-700 rotate-45" />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Collapse Toggle & Quick Sign Out */}
        <div className="p-2 border-t border-zinc-800/80 bg-[#0B0D10]/80 space-y-1">
          {/* Collapse/Expand Toggle Button */}
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
            className={cn(
              "w-full h-8 font-mono text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg transition-colors",
              isExpanded ? "justify-start px-2 gap-2" : "justify-center px-0"
            )}
            title={isCollapsed ? "Pin Sidebar Open" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-blue-400" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-blue-400" />
            )}
            {isExpanded && (
              <span className="truncate text-[11px]">
                {isCollapsed ? "Pin Open" : "Collapse"}
              </span>
            )}
          </Button>

          {/* Sign Out Button in Sidebar Bottom */}
          <div className={cn(isExpanded ? "w-full" : "flex justify-center")}>
            <LogoutButton
              variant="ghost"
              size="sm"
              showText={isExpanded}
              className={cn(
                "h-8 font-mono text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors",
                isExpanded ? "w-full justify-start px-2 gap-2 text-[11px]" : "w-9 p-0 justify-center"
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
          "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
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
          "fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] flex flex-col",
          "bg-[#07080A] backdrop-blur-xl border-r border-zinc-800/80 shadow-2xl",
          "transform transition-transform duration-300 ease-in-out md:hidden select-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80">
          <Link
            href="/student"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5"
          >
            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">
                AttendGuard
              </span>
              <span className="text-[10px] text-zinc-400 font-mono font-medium uppercase">
                Student Portal
              </span>
            </div>
          </Link>

          <Button
            onClick={onCloseMobile}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white rounded-lg"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drawer User Capsule */}
        <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
              {userProfile?.fullName
                ? userProfile.fullName.trim()[0].toUpperCase()
                : "U"}
            </div>
            <div className="flex flex-col min-w-0 font-mono">
              <span className="text-xs font-semibold text-white truncate">
                {userProfile?.fullName || "Student"}
              </span>
              <span className="text-[10px] text-blue-400 truncate">
                {userProfile?.identifier || "STU-AUTH"}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-xs font-medium transition-colors",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "text-zinc-400")} />
                <span className="flex-1 text-left">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer with Logout */}
        <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-950/80">
          <LogoutButton
            variant="outline"
            size="sm"
            showText={true}
            className="w-full justify-center text-xs font-mono font-semibold border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          />
        </div>
      </aside>
    </>
  );
}
