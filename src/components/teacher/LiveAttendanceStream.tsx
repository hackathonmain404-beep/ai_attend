"use client";

import * as React from "react";
import { Radio, UserCheck, AlertOctagon, ShieldCheck, X, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface StreamEventItem {
  id: string;
  type: "check_in" | "proxy_alert" | "reverify";
  title: string;
  subtitle: string;
  timestamp: string;
}

interface LiveAttendanceStreamProps {
  events: StreamEventItem[];
  onClear?: () => void;
}

export function LiveAttendanceStream({ events, onClear }: LiveAttendanceStreamProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-slate-300">Live Attendance Channel:</span>
          <span>Listening for student QR scans and hardware verifications...</span>
        </div>
        <Badge variant="outline" className="border-slate-800 text-[10px] text-slate-500">
          Idle
        </Badge>
      </div>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/80 p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live Stream Feed
          </h4>
          <Badge variant="emerald" className="text-[10px] py-0 px-1.5 font-mono">
            {events.length} Updates
          </Badge>
        </div>

        {onClear && (
          <Button
            onClick={onClear}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
          >
            Clear Feed
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
        {events.map((evt) => {
          const isCheckIn = evt.type === "check_in";
          const isProxy = evt.type === "proxy_alert";

          return (
            <div
              key={evt.id}
              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300 ${
                isProxy
                  ? "border-rose-500/40 bg-rose-950/30 text-rose-200"
                  : isCheckIn
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                  : "border-teal-500/30 bg-teal-950/20 text-teal-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isProxy
                      ? "bg-rose-500/20 text-rose-400"
                      : isCheckIn
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-teal-500/20 text-teal-400"
                  }`}
                >
                  {isProxy ? (
                    <AlertOctagon className="h-4 w-4" />
                  ) : isCheckIn ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold truncate text-white">{evt.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{evt.subtitle}</p>
                </div>
              </div>

              <span className="font-mono text-[10px] text-slate-400 shrink-0">
                {evt.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
