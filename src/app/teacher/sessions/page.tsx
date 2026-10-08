"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2, Radio, StopCircle, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DynamicQrDisplay } from "@/components/qr/DynamicQrDisplay";
import { useTeacherOverview, endAttendanceSession } from "@/lib/services/teacher-service";
import { toast } from "sonner";

export default function TeacherSessionsProjectorPage() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const { data, isLoading, refetch } = useTeacherOverview();
  const activeSession = data?.activeSession;

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

  const handleEndSession = async () => {
    if (!activeSession?.sessionId) return;
    try {
      await endAttendanceSession(activeSession.sessionId);
      toast.info("Session Closed", {
        description: "Attendance broadcast terminated and records archived.",
      });
      refetch();
    } catch {
      toast.error("Failed to terminate session");
    }
  };

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
            <Radio className={`h-4 w-4 ${activeSession ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span className="text-xs font-mono font-semibold text-slate-300">
              {activeSession ? "AUDITORIUM LECTURE PROJECTOR MODE" : "PROJECTOR STANDBY"}
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

          {activeSession && (
            <Button
              onClick={handleEndSession}
              variant="destructive"
              size="sm"
              className="text-xs font-bold"
            >
              <StopCircle className="h-3.5 w-3.5 mr-1.5" />
              End Session
            </Button>
          )}
        </div>
      </header>

      {/* Main Projector Stage */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <span className="text-sm">Connecting to faculty broadcast feed...</span>
          </div>
        ) : activeSession ? (
          <DynamicQrDisplay
            sessionId={activeSession.sessionId}
            courseCode={activeSession.courseCode}
            courseName={activeSession.className}
            totalEnrolled={activeSession.totalEnrolled}
            presentCount={activeSession.presentCount}
            rotationIntervalSec={activeSession.qrRotationIntervalSec || 20}
          />
        ) : (
          <Card className="max-w-md w-full p-8 border-slate-800 bg-slate-900/60 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Radio className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">No Active Lecture Broadcast</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              There is currently no live attendance session in progress. Start an attendance session from your Faculty Console to project dynamic rolling QR tokens.
            </p>
            <Button asChild variant="emerald" size="sm" className="gap-2 font-bold shadow-md shadow-emerald-950">
              <Link href="/teacher">
                <PlayCircle className="h-4 w-4" />
                Return to Faculty Console
              </Link>
            </Button>
          </Card>
        )}
      </main>

      {/* Bottom Security Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 text-center text-xs text-slate-500 font-mono">
        AttendGuard HMAC SHA-256 Dynamic Rolling Tokens • Rotating Every {activeSession?.qrRotationIntervalSec || 20} Seconds • Proxy Prevention Active
      </footer>
    </div>
  );
}
