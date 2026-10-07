"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Presentation,
  QrCode,
  Scan,
  Activity,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  X,
  Smartphone,
  Compass,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  targetUrl: string;
  targetLabel: string;
  badgeText: string;
  badgeVariant: "emerald" | "outline" | "secondary" | "destructive";
  icon: React.ElementType;
  story: string;
  antiProxyMechanism: string;
  testInstructions: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: "Teacher Launches Session",
    subtitle: "HMAC Dynamic Cryptographic Token Generation",
    targetUrl: "/teacher",
    targetLabel: "Go to Teacher Dashboard",
    badgeText: "Step 1 • Initialization",
    badgeVariant: "emerald",
    icon: Presentation,
    story:
      "Prof. Alan Turing enters the lecture hall and activates a verified attendance broadcast for CS101 Data Structures with a 20-second dynamic rotation interval.",
    antiProxyMechanism:
      "Static QR codes are dead. AttendGuard generates time-bound HMAC SHA-256 tokens signed by server secrets, invalidating any token older than 20 seconds.",
    testInstructions: [
      "Review the Active Session monitor showing current TTL countdown and headcount.",
      "Click 'Start New Session' to see the rotation interval picker (15s, 20s, 30s).",
      "Notice the teacher hardware perimeter status and pending device resets.",
    ],
  },
  {
    id: 2,
    title: "Auditorium Projector Display",
    subtitle: "High-Contrast Scalable Display with TTL Ring",
    targetUrl: "/teacher/sessions",
    targetLabel: "Open Projector Screen",
    badgeText: "Step 2 • Projection",
    badgeVariant: "outline",
    icon: QrCode,
    story:
      "The classroom projector displays the dynamic SVG QR code in high contrast so students across a 200-seat lecture hall can scan simultaneously.",
    antiProxyMechanism:
      "A circular SVG countdown ring visualizes remaining token validity. If a proxy-attempting student takes a photo and WhatsApps it to an absent roommate, the code expires before they can scan it.",
    testInstructions: [
      "Observe the 20-second circular progress ring deplete in real time.",
      "Watch the cryptographic token hash rotate automatically upon expiry.",
      "Click 'Manual Refresh Token' to test on-demand hash regeneration.",
    ],
  },
  {
    id: 3,
    title: "Student Camera Scanner & Check-In",
    subtitle: "Hardware-Bound Device Fingerprint Verification",
    targetUrl: "/student/scanner",
    targetLabel: "Launch Student Scanner",
    badgeText: "Step 3 • Check-In",
    badgeVariant: "emerald",
    icon: Scan,
    story:
      "Jane Doe opens AttendGuard's mobile scanner on her registered smartphone to check in for class.",
    antiProxyMechanism:
      "The scanner silently captures the device's hardware fingerprint (Canvas, WebGL, Screen, AudioContext hash). If a student logs in on a classmate's phone to check in for them, the system rejects it as a 'Device Mismatch Proxy Attempt'.",
    testInstructions: [
      "Click 'Simulate Valid QR' to test successful 200 OK attendance confirmation.",
      "Click 'Simulate Expired Token' to verify strict 410 Gone rejection handling.",
      "Click 'Simulate Device Mismatch' to test instant 403 Forbidden proxy blocking.",
    ],
  },
  {
    id: 4,
    title: "Real-Time Stream & Proxy Interception",
    subtitle: "Reactive Presence Feeds & Rogue Device Alerts",
    targetUrl: "/teacher",
    targetLabel: "View Live Teacher Stream",
    badgeText: "Step 4 • Real-Time Stream",
    badgeVariant: "secondary",
    icon: Activity,
    story:
      "Back on the faculty console, attendance events arrive instantly over a real-time channel without refreshing the page.",
    antiProxyMechanism:
      "Suspicious proxy attempts flash in rose red on the live security ticker with student ID, MAC/fingerprint signature, and timestamp for faculty audit.",
    testInstructions: [
      "Scroll down to the 'Live Attendance Stream' widget on the teacher page.",
      "Use the 'Stream Simulator Controls' to inject simulated check-in bursts.",
      "Click 'Simulate Proxy Violation' to trigger a live crimson warning banner.",
    ],
  },
  {
    id: 5,
    title: "Surprise In-Class Re-Verification",
    subtitle: "60-Second Challenge Defeats 'Scan & Run' Ditching",
    targetUrl: "/student",
    targetLabel: "Inspect Student Dashboard",
    badgeText: "Step 5 • Anti-Ditching",
    badgeVariant: "destructive",
    icon: ShieldAlert,
    story:
      "At minute 35 of the lecture, the professor fires a surprise re-verification challenge to catch students who scanned the QR and left the room.",
    antiProxyMechanism:
      "Students receive an urgent 60-second biometric/device challenge on their screen. Absent students cannot respond from outside the classroom before the deadline expires.",
    testInstructions: [
      "Observe the re-verification trigger controls on the teacher portal.",
      "Check the student dashboard where active challenges pop up with audio-visual urgency.",
      "Inspect the Student Attendance History ledger (/student/history) for verification proof.",
    ],
  },
  {
    id: 6,
    title: "AI Advisor & Regulatory Analytics",
    subtitle: "Grounded Attendance Math & Leave Forecaster",
    targetUrl: "/student/advisor",
    targetLabel: "Open AI Attendance Advisor",
    badgeText: "Step 6 • AI & Analytics",
    badgeVariant: "emerald",
    icon: Sparkles,
    story:
      "Jane Doe asks the AI Advisor if she can afford to take next Friday off without violating the 75% university regulatory minimum.",
    antiProxyMechanism:
      "Zero hallucination guarantee: The advisor uses deterministic mathematical calculations for margins (can miss next N classes / recovery needed) and refuses to invent fake policies.",
    testInstructions: [
      "Click quick-prompt chips like 'Can I miss tomorrow's CS101 lecture?'.",
      "Visit /student/subjects/11111111-1111-1111-1111-111111111111 to test the interactive leave forecaster slider.",
      "Visit /teacher/reports to generate official RFC-4180 audit CSV spreadsheets.",
    ],
  },
];

interface DemoTourGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

export function DemoTourGuideModal({
  isOpen,
  onClose,
  initialStep = 1,
}: DemoTourGuideModalProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(
    Math.max(0, Math.min(initialStep - 1, TOUR_STEPS.length - 1))
  );

  // Sync initial step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(Math.max(0, Math.min(initialStep - 1, TOUR_STEPS.length - 1)));
    }
  }, [isOpen, initialStep]);

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const StepIcon = step.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleTeleport = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="w-full max-w-2xl bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/50">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 id="tour-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                AttendGuard Hackathon Evaluator Tour
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Judges' HUD
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Step-by-step interactive walkthrough of all proxy-prevention pillars
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close tour"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Tabs / Progress Pill Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-950/60 border-b border-slate-900 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {TOUR_STEPS.map((s, idx) => {
              const active = idx === currentStepIndex;
              const completed = idx < currentStepIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20"
                      : completed
                      ? "bg-slate-800/80 text-emerald-300 hover:bg-slate-800"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <span>{s.id}.</span>
                  <span className="truncate max-w-[100px]">{s.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step Headline & Icon */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={step.badgeVariant}>{step.badgeText}</Badge>
                  <span className="text-xs text-slate-500">
                    Step {step.id} of {TOUR_STEPS.length}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{step.title}</h3>
                <p className="text-xs font-medium text-emerald-400/90">{step.subtitle}</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="emerald"
              onClick={() => handleTeleport(step.targetUrl)}
              className="gap-1.5 shrink-0 text-xs font-semibold"
            >
              Teleport Now
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Story Narrative */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Hackathon Storyline
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{step.story}</p>
            </CardContent>
          </Card>

          {/* Anti-Proxy Defense Pillar */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>How AttendGuard Prevents Proxy Attendance Here</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              {step.antiProxyMechanism}
            </p>
          </div>

          {/* What Judges Can Test */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Interactive Evaluation Checklist</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {step.testInstructions.map((instruction, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrev}
              disabled={isFirst}
              className="text-xs gap-1 border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              disabled={isLast}
              className="text-xs gap-1 border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Guide
            </Button>
            <Button
              size="sm"
              variant="emerald"
              onClick={() => handleTeleport(step.targetUrl)}
              className="text-xs gap-1.5 font-semibold"
            >
              <span>{step.targetLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
