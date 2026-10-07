"use client";

import * as React from "react";
import { Zap, UserCheck, AlertOctagon, ShieldCheck, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  simulateRealtimeCheckIn,
  simulateRealtimeProxyBlocked,
  simulateRealtimeReverify,
} from "@/lib/realtime/attendance-channel";

interface RealtimeSimControlsProps {
  sessionId?: string;
}

export function RealtimeSimControls({
  sessionId = "44444444-4444-4444-4444-444444444441",
}: RealtimeSimControlsProps) {
  const handleCheckIn = () => {
    simulateRealtimeCheckIn(sessionId);
  };

  const handleProxy = () => {
    simulateRealtimeProxyBlocked(sessionId);
  };

  const handleReverify = () => {
    simulateRealtimeReverify(sessionId);
  };

  return (
    <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-white block">
            Real-Time Stream Testing Suite
          </span>
          <span className="text-[11px] text-slate-400">
            Simulate live events on channel session:{sessionId.substring(0, 8)}...
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Button
          onClick={handleCheckIn}
          variant="emerald"
          size="sm"
          className="text-xs font-semibold h-8"
        >
          <UserCheck className="h-3.5 w-3.5 mr-1" />
          + Simulate Check-In
        </Button>

        <Button
          onClick={handleProxy}
          variant="destructive"
          size="sm"
          className="text-xs font-semibold h-8"
        >
          <AlertOctagon className="h-3.5 w-3.5 mr-1" />
          + Simulate Proxy Block
        </Button>

        <Button
          onClick={handleReverify}
          variant="outline"
          size="sm"
          className="text-xs font-semibold h-8 border-teal-500/30 text-teal-300 hover:bg-teal-500/10"
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
          + Spot Re-Verify
        </Button>
      </div>
    </div>
  );
}
