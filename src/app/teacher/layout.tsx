"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  QrCode,
  FileBarChart,
  ShieldCheck,
  PlusCircle,
  Maximize2,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUserProfile, resolveCurrentUserProfile } from "@/lib/auth/auth-client";
import * as React from "react";

const teacherNavItems = [
  {
    name: "Overview",
    href: "/teacher",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Class Rosters",
    href: "/teacher/classes",
    icon: Users,
  },
  {
    name: "Live QR Session",
    href: "/teacher/sessions",
    icon: QrCode,
  },
  {
    name: "Reports & Export",
    href: "/teacher/reports",
    icon: FileBarChart,
  },
];

export default function TeacherLayout({
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
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex">
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md hidden md:flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Portal Identity */}
          <div className="p-6 border-b border-slate-800/60">
            <Link href="/teacher" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-950/50">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  AttendGuard
                </span>
                <span className="text-[11px] text-teal-400 font-medium">
                  Faculty Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Faculty Navigation">
            {teacherNavItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-teal-400" : "text-slate-500")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Faculty Profile Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="h-9 w-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
              {userProfile?.fullName ? userProfile.fullName.trim()[0].toUpperCase() : "P"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {userProfile?.fullName || (userProfile === null ? "Loading..." : "Faculty Professor")}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userProfile?.identifier ? `${userProfile.identifier} • Faculty` : "Computer Science Dept."}
              </p>
            </div>
          </div>
          <LogoutButton variant="ghost" size="sm" className="w-full justify-start text-xs h-8" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link href="/" className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-400">Classroom:</span>
              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                Auditorium Hall B2
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex gap-2 border-slate-700 hover:bg-slate-800 text-slate-300 text-xs h-9"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.();
                } else {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                }
              }}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Projector Mode (F11)
            </Button>

            <Button asChild variant="emerald" size="sm" className="gap-2 h-9 text-xs font-semibold">
              <Link href="/teacher/sessions">
                <PlusCircle className="h-3.5 w-3.5" />
                Start Attendance Session
              </Link>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
