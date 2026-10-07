"use client";

import * as React from "react";
import { X, PlayCircle, QrCode, Clock, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TeacherClass } from "@/types/teacher";

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: TeacherClass[];
  onStartSession: (classId: string, intervalSec: number) => void;
}

export function StartSessionModal({
  isOpen,
  onClose,
  classes,
  onStartSession,
}: StartSessionModalProps) {
  const [selectedClassId, setSelectedClassId] = React.useState<string>(
    classes[0]?.id || ""
  );
  const [rotationSec, setRotationSec] = React.useState<number>(20);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    onStartSession(selectedClassId, rotationSec);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <Card className="w-full max-w-lg border-teal-500/40 bg-slate-950 p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="p-0 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                Launch Attendance Broadcast
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Generate cryptographic rotating QR codes for classroom verification
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Course Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Course & Cohort
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClassId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedClassId === c.id
                      ? "border-teal-500 bg-teal-950/20 ring-1 ring-teal-500/50"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-teal-400 block">
                      {c.code}
                    </span>
                    <p className="text-sm font-bold text-white leading-tight mt-0.5">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {c.schedule} • {c.enrolledCount} Enrolled Students
                    </p>
                  </div>
                  {selectedClassId === c.id && (
                    <Badge variant="outline" className="border-teal-500/40 text-teal-300 text-xs">
                      Selected
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* QR Rotation Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Dynamic QR Rotation Interval
              </label>
              <span className="text-xs font-mono font-bold text-teal-400">
                {rotationSec} Seconds TTL
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setRotationSec(sec)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    rotationSec === sec
                      ? "border-teal-500 bg-teal-500/20 text-white"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white"
                  }`}
                >
                  {sec}s {sec === 20 ? "(Standard)" : ""}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Short rotation windows prevent students from sharing photo captures of the projector screen.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button type="submit" variant="emerald" className="flex-1 gap-2 font-bold shadow-lg shadow-emerald-950">
              <PlayCircle className="h-4 w-4" />
              Start Live Broadcast
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
