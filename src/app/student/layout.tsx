"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import { StudentSidebar, STUDENT_NAV_ITEMS } from "@/components/student/StudentSidebar";
import { StudentTopHeader } from "@/components/student/StudentTopHeader";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Active user profile state with authoritative session resolution
  const [userProfile, setUserProfile] = React.useState<any>(() => {
    return typeof window !== "undefined" ? getCurrentUserProfile() : null;
  });

  // Sidebar collapse state with localStorage persistence (compact/collapsed by default)
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState<boolean>(false);

  // Restore sidebar preference on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("attendguard-sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {}
  }, []);

  const handleToggleCollapse = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("attendguard-sidebar-collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  // Close mobile drawer on route navigation
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Synchronize authenticated user profile changes
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
    <div className="min-h-screen bg-[#06080A] text-zinc-100 flex relative">
      {/* =========================================================
          1. VERTICAL SIDEBAR (Desktop Fixed & Mobile Slide-Out)
          ========================================================= */}
      <StudentSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        userProfile={userProfile}
      />

      {/* =========================================================
          2. MAIN VIEWPORT & DASHBOARD CONTENT
          ========================================================= */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isCollapsed ? "md:pl-[68px]" : "md:pl-56"
        )}
      >
        {/* Top Header with Breadcrumbs, Telemetry & Top-Right Profile */}
        <StudentTopHeader
          onOpenMobile={() => setIsMobileOpen(true)}
          userProfile={userProfile}
        />

        {/* Dashboard Main Content Area */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 pb-28 md:pb-16 space-y-12 sm:space-y-16">
          {children}
        </main>
      </div>

      {/* =========================================================
          3. MOBILE BOTTOM NAVIGATION DOCK (Thumb Ergonomics)
          ========================================================= */}
      <nav
        aria-label="Student Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-[#0B0D10]/95 backdrop-blur-lg md:hidden shadow-2xl"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {STUDENT_NAV_ITEMS.map((item) => {
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
                        ? "bg-blue-600 text-white shadow-blue-950/80 ring-2 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-950/50"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-mono mt-1 transition-colors uppercase tracking-tight",
                      isActive ? "text-blue-400 font-bold" : "text-zinc-400"
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
                  isActive ? "text-blue-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all",
                    isActive ? "bg-blue-600/15 text-blue-400" : "group-hover:bg-zinc-800/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono mt-0.5 uppercase tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
