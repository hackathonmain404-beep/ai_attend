"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, Radio, StopCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DynamicQrDisplay } from "@/components/qr/DynamicQrDisplay";

export default function TeacherSessionsProjectorPage() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* Top Projector Action Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Link href="/teacher">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Teacher Console
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold text-slate-300">
              AUDITORIUM LECTURE PROJECTOR MODE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-200"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
                Exit Fullscreen (Esc)
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                Enter Fullscreen (F11)
              </>
            )}
          </Button>

          <Button asChild variant="destructive" size="sm" className="text-xs font-bold">
            <Link href="/teacher">
              <StopCircle className="h-3.5 w-3.5 mr-1.5" />
              End Session
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Projector Stage */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <DynamicQrDisplay
          sessionId="44444444-4444-4444-4444-444444444441"
          courseCode="CS301"
          courseName="Distributed Systems & Cloud Computing"
          totalEnrolled={65}
          presentCount={52}
          rotationIntervalSec={20}
        />
      </main>

      {/* Bottom Security Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 text-center text-xs text-slate-500 font-mono">
        AttendGuard HMAC SHA-256 Dynamic Rolling Tokens • Rotating Every 20 Seconds • Proxy Prevention Active
      </footer>
    </div>
  );
}
