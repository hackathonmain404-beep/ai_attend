"use client";

import * as React from "react";
import { Calculator, AlertTriangle, ShieldCheck, TrendingDown, TrendingUp, RotateCcw, Plus, Minus, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { simulateFutureAttendance } from "@/lib/services/subject-service";

interface AttendanceSimulatorCardProps {
  attended: number;
  totalHeld: number;
  courseCode?: string;
}

export function AttendanceSimulatorCard({
  attended,
  totalHeld,
  courseCode = "This Course",
}: AttendanceSimulatorCardProps) {
  const [deltaAttended, setDeltaAttended] = React.useState<number>(0);
  const [deltaMissed, setDeltaMissed] = React.useState<number>(0);

  const currentPercent = totalHeld > 0 ? (attended / totalHeld) * 100 : 100;

  const simulation = React.useMemo(() => {
    return simulateFutureAttendance(attended, totalHeld, deltaAttended, deltaMissed);
  }, [attended, totalHeld, deltaAttended, deltaMissed]);

  const hasModifications = deltaAttended > 0 || deltaMissed > 0;

  const handleReset = () => {
    setDeltaAttended(0);
    setDeltaMissed(0);
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Attendance Forecaster & Leave Simulator
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5">
              Simulate upcoming absences or attendances to predict regulatory standing
            </CardDescription>
          </div>
        </div>

        {hasModifications && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-white gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Forecast
          </Button>
        )}
      </div>

      {/* Projection Metric Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Current State */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Current Official Standing
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">
                {currentPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({attended} / {totalHeld} held)
              </span>
            </div>
          </div>
          <Badge
            variant={currentPercent >= 75 ? "emerald" : "destructive"}
            className="text-xs font-semibold"
          >
            {currentPercent >= 75 ? "Safe" : "At Risk"}
          </Badge>
        </div>

        {/* Projected State */}
        <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
          simulation.projectedPercentage >= 75
            ? "border-emerald-500/40 bg-emerald-950/20"
            : simulation.projectedPercentage >= 65
            ? "border-amber-500/40 bg-amber-950/20"
            : "border-rose-500/40 bg-rose-950/20"
        }`}>
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Projected Standing
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${
                simulation.projectedPercentage >= 75
                  ? "text-emerald-400"
                  : simulation.projectedPercentage >= 65
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}>
                {simulation.projectedPercentage.toFixed(1)}%
              </span>
              {hasModifications && (
                <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                  simulation.deltaPercentage >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {simulation.deltaPercentage >= 0 ? (
                    <TrendingUp className="h-3 w-3 inline" />
                  ) : (
                    <TrendingDown className="h-3 w-3 inline" />
                  )}
                  {simulation.deltaPercentage > 0 ? `+${simulation.deltaPercentage.toFixed(1)}%` : `${simulation.deltaPercentage.toFixed(1)}%`}
                </span>
              )}
            </div>
          </div>

          <Badge
            variant={
              simulation.projectedStatus === "safe"
                ? "emerald"
                : simulation.projectedStatus === "at_risk"
                ? "amber"
                : "destructive"
            }
            className="text-xs font-semibold"
          >
            {simulation.projectedStatus === "safe"
              ? "Projected Safe"
              : simulation.projectedStatus === "at_risk"
              ? "Projected Defaulter"
              : "Critical Risk"}
          </Badge>
        </div>
      </div>

      {/* Interactive Simulation Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Simulate Missed Classes */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Hypothetical Absences
            </span>
            <span className="font-mono text-sm font-black text-rose-400">
              +{deltaMissed} {deltaMissed === 1 ? "class" : "classes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDeltaMissed((m) => Math.max(0, m - 1))}
              disabled={deltaMissed <= 0}
              variant="outline"
              size="sm"
              className="w-1/2 border-slate-800 text-xs"
            >
              <Minus className="h-3.5 w-3.5 mr-1" />
              Reduce
            </Button>
            <Button
              onClick={() => setDeltaMissed((m) => m + 1)}
              variant="outline"
              size="sm"
              className="w-1/2 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Miss Next Class
            </Button>
          </div>
        </div>

        {/* Simulate Attended Classes */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Consecutive Attendances
            </span>
            <span className="font-mono text-sm font-black text-emerald-400">
              +{deltaAttended} {deltaAttended === 1 ? "class" : "classes"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setDeltaAttended((a) => Math.max(0, a - 1))}
              disabled={deltaAttended <= 0}
              variant="outline"
              size="sm"
              className="w-1/2 border-slate-800 text-xs"
            >
              <Minus className="h-3.5 w-3.5 mr-1" />
              Reduce
            </Button>
            <Button
              onClick={() => setDeltaAttended((a) => a + 1)}
              variant="outline"
              size="sm"
              className="w-1/2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Attend Next Class
            </Button>
          </div>
        </div>
      </div>

      {/* Actionable Simulation Advice Banner */}
      <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
        simulation.projectedPercentage >= 75
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          : "border-rose-500/30 bg-rose-500/10 text-rose-200"
      }`}>
        {simulation.projectedPercentage >= 75 ? (
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          <p className="font-semibold mb-0.5">
            {simulation.projectedPercentage >= 75
              ? "Compliant Standing Forecast"
              : "Regulatory Non-Compliance Alert"}
          </p>
          <p className="text-slate-300 text-[11px]">
            {simulation.summaryMessage}
          </p>
        </div>
      </div>
    </Card>
  );
}
