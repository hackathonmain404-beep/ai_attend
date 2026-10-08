"use client";

import * as React from "react";
import {
  QrCode,
  Smartphone,
  Scan,
  Activity,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface MetricItem {
  label: string;
  value: string;
}

interface ProtocolStep {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  metrics: MetricItem[];
  accent: "emerald" | "teal" | "amber" | "rose" | "cyan";
  verdict: string;
}

const STEPS: ProtocolStep[] = [
  {
    step: "01",
    title: "Dynamic HMAC-SHA256 QR Rotation",
    subtitle: "Anti-Screenshot • 15s Refresh Cycle",
    description:
      "The classroom projector broadcasts high-entropy time-varying HMAC tokens encoded with teacher secret keys and unix epoch windows. Snapped photos forwarded over WhatsApp or Telegram expire before the remote student can point their camera.",
    icon: QrCode,
    tag: "Defeats WhatsApp Sharing",
    metrics: [
      { label: "Cycle Duration", value: "15-20 Seconds" },
      { label: "Token Entropy", value: "256-bit SHA" },
      { label: "Replay Attack Risk", value: "0.00% Zero" },
    ],
    accent: "emerald",
    verdict: "PHOTO EXPIRED ON TRANSFER",
  },
  {
    step: "02",
    title: "Hardware Device Fingerprint 1:1 Lock",
    subtitle: "Anti-Buddy Proxy • SHA-256 Hardware Seed",
    description:
      "Each student account is cryptographically bound to a unique physical device signature computed from WebGL renderer, canvas hashes, and hardware CPU cores. Attempting to sign in on a friend's smartphone returns an immediate 403 Forbidden tamper alert.",
    icon: Smartphone,
    tag: "Defeats Account Sharing",
    metrics: [
      { label: "Binding Ratio", value: "Strict 1:1" },
      { label: "Entropy Signals", value: "6 Device Vectors" },
      { label: "Proxy Impersonation", value: "Blocked (403)" },
    ],
    accent: "amber",
    verdict: "DEVICE MISMATCH DETECTED",
  },
  {
    step: "03",
    title: "Optical Viewfinder Sub-Second Check-In",
    subtitle: "Real-Time Camera Scan • Instant Geolocation",
    description:
      "Students aim their verified phone camera at the classroom screen. The client engine computes the cryptographic hash, compares spatial timestamp tolerances, and streams verification status over secure WebSockets in sub-300ms latency.",
    icon: Scan,
    tag: "Instant Validation",
    metrics: [
      { label: "Verification Latency", value: "< 280ms" },
      { label: "WebSocket Sync", value: "Sub-Second" },
      { label: "Optical Alignment", value: "Auto-Calibrated" },
    ],
    accent: "teal",
    verdict: "CHECK-IN CONFIRMED",
  },
  {
    step: "04",
    title: "Unannounced 60s Spot Re-Verification",
    subtitle: "Defeats 'Scan & Ditch' • Random In-Class Chime",
    description:
      "To prevent students from scanning at 09:00 AM and walking out of lecture immediately after, the system triggers an unannounced spot re-verification prompt. An audio chime rings and a 60-second countdown modal requires immediate physical screen affirmation.",
    icon: Activity,
    tag: "Defeats Class Ditching",
    metrics: [
      { label: "Challenge Window", value: "60 Seconds" },
      { label: "Trigger Mechanism", value: "Faculty On-Demand" },
      { label: "Failure Consequence", value: "Marked Absent" },
    ],
    accent: "rose",
    verdict: "PHYSICAL PRESENCE VALIDATED",
  },
  {
    step: "05",
    title: "Tamper-Evident Non-Repudiable Ledger",
    subtitle: "RFC-4180 CSV Export • Deterministic 75% Buffer",
    description:
      "Verified attendances are permanently committed to the immutable database log with cryptographic timestamps and device IDs. Grounded deterministic formulas instantly calculate the remaining safety margin to protect the university 75% regulatory requirement.",
    icon: FileCheck,
    tag: "Non-Repudiable Finality",
    metrics: [
      { label: "Audit Ledger", value: "100% Immutable" },
      { label: "Export Standard", value: "RFC-4180 CSV" },
      { label: "Margin Guard", value: "Deterministic 75%" },
    ],
    accent: "cyan",
    verdict: "COMMITTED TO LEDGER",
  },
];

export function ScrollDefenseProtocolFlow() {
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(0);

  // Monitor which step is currently nearest center of screen
  React.useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      const centerY = window.innerHeight * 0.45;

      for (let i = 0; i < STEPS.length; i++) {
        const el = document.getElementById(`defense-step-${STEPS[i].step}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= centerY && rect.bottom >= centerY) {
            setActiveStepIndex(i);
            break;
          }
        }
      }
    };

    const throttledScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const getAccentStyles = (accent: ProtocolStep["accent"], isActive: boolean) => {
    switch (accent) {
      case "emerald":
        return {
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          ring: isActive
            ? "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-110"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          cardBorder: isActive ? "border-emerald-500/60 shadow-lg shadow-emerald-950/40" : "hover:border-emerald-500/40",
          dot: "bg-emerald-400",
        };
      case "teal":
        return {
          badge: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          ring: isActive
            ? "border-teal-400 bg-teal-500/20 text-teal-300 shadow-[0_0_25px_rgba(20,184,166,0.5)] scale-110"
            : "border-teal-500/30 bg-teal-500/10 text-teal-400",
          cardBorder: isActive ? "border-teal-500/60 shadow-lg shadow-teal-950/40" : "hover:border-teal-500/40",
          dot: "bg-teal-400",
        };
      case "amber":
        return {
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          ring: isActive
            ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-110"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400",
          cardBorder: isActive ? "border-amber-500/60 shadow-lg shadow-amber-950/40" : "hover:border-amber-500/40",
          dot: "bg-amber-400",
        };
      case "rose":
        return {
          badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          ring: isActive
            ? "border-rose-400 bg-rose-500/20 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.5)] scale-110"
            : "border-rose-500/30 bg-rose-500/10 text-rose-400",
          cardBorder: isActive ? "border-rose-500/60 shadow-lg shadow-rose-950/40" : "hover:border-rose-500/40",
          dot: "bg-rose-400",
        };
      case "cyan":
        return {
          badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          ring: isActive
            ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.5)] scale-110"
            : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
          cardBorder: isActive ? "border-cyan-500/60 shadow-lg shadow-cyan-950/40" : "hover:border-cyan-500/40",
          dot: "bg-cyan-400",
        };
    }
  };

  return (
    <section id="lifecycle" className="max-w-5xl mx-auto w-full my-16 px-4 sm:px-0 scroll-mt-24">
      {/* Section Header */}
      <ScrollReveal animation="fade-up" className="text-center mb-12 sm:mb-16 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300 shadow-lg shadow-emerald-950/30">
          <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>Interactive Cryptographic Verification Flow</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
          How AttendGuard Neutralizes Every Proxy Attack
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Scroll through the 5-stage defense pipeline that guarantees authentic physical classroom presence with zero tolerance for tampering.
        </p>
      </ScrollReveal>

      {/* Vertical Animated Pipeline Timeline */}
      <div className="relative">
        {/* Animated Central Glowing Conduit Line */}
        <div className="hidden md:block absolute left-1/2 top-6 bottom-6 -translate-x-1/2 w-[2px] bg-gradient-to-b from-emerald-500 via-teal-400 to-cyan-500 opacity-30 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />

        {/* Dynamic laser beacon tracking active step */}
        <div
          className="hidden md:block absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_16px_#34d399,0_0_32px_#06b6d4] transition-all duration-500 ease-out z-20 pointer-events-none"
          style={{
            top: `calc(${activeStepIndex * 20}% + 28px)`,
          }}
        />

        <div className="space-y-12 md:space-y-16">
          {STEPS.map((step, idx) => {
            const isActive = activeStepIndex === idx;
            const styles = getAccentStyles(step.accent, isActive);
            const Icon = step.icon;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={step.step}
                id={`defense-step-${step.step}`}
                className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 scroll-mt-32"
              >
                {/* Content Card (Alternates Left / Right on Desktop) */}
                <div
                  className={`w-full md:w-[45%] ${
                    isEven ? "md:order-1 md:text-right" : "md:order-3 md:text-left"
                  }`}
                >
                  <ScrollReveal
                    animation={isEven ? "fade-right" : "fade-left"}
                    delay={idx * 60}
                    className={`p-6 rounded-2xl border bg-slate-900/75 backdrop-blur-md shadow-xl transition-all duration-300 ${
                      styles.cardBorder
                    } group`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-3 flex-wrap ${
                        isEven ? "md:justify-end" : "justify-start"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${styles.badge}`}
                      >
                        {step.tag}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">
                        STAGE {step.step}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          ACTIVE TELEMETRY
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mb-3">
                      {step.subtitle}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Technical Telemetry Metrics Grid */}
                    <div
                      className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-left"
                    >
                      {step.metrics.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/70"
                        >
                          <span className="text-[9.5px] text-slate-500 block truncate font-medium">
                            {m.label}
                          </span>
                          <span className="text-xs font-bold text-slate-200 block truncate font-mono mt-0.5">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Anti-Proxy Verdict Strip */}
                    <div className="mt-3 pt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="text-slate-500">Security Verdict:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        {step.verdict}
                      </span>
                    </div>
                  </ScrollReveal>
                </div>

                {/* Central Step Milestone Marker Node */}
                <div className="z-10 md:order-2 flex flex-col items-center">
                  <ScrollReveal animation="zoom-in" delay={idx * 60}>
                    <div
                      className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${styles.ring}`}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </ScrollReveal>
                </div>

                {/* Counterbalance Spacer for 2-column alternating grid on desktop */}
                <div
                  className={`hidden md:block md:w-[45%] ${
                    isEven ? "md:order-3" : "md:order-1"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
