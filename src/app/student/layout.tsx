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

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col pb-24 md:pb-6">
      {/* Student Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/student" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-950">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-tight">
                AttendGuard
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                Student Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" className="hidden sm:inline-flex text-[11px] py-0.5">
              Verified Device
            </Badge>
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Dock (Student Primary UX) */}
      <nav
        aria-label="Student Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/90 bg-slate-950/90 backdrop-blur-lg md:hidden shadow-2xl"
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
                        ? "bg-emerald-500 text-white shadow-emerald-950/80 ring-2 ring-emerald-400"
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
