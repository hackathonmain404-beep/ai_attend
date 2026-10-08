import * as React from "react";
import { QrCode, Smartphone, MapPin, ShieldCheck } from "lucide-react";

interface VerificationStatusCardProps {
  isDeviceBound: boolean;
}

export function VerificationStatusCard({ isDeviceBound }: VerificationStatusCardProps) {
  const layers = [
    {
      number: "01",
      title: "DYNAMIC CHALLENGE",
      description: "Cryptographic session verification with rotating HMAC tokens.",
      status: "VERIFIED",
      icon: QrCode,
      isVerified: true,
    },
    {
      number: "02",
      title: "DEVICE BINDING",
      description: "Trusted hardware association & SHA-256 fingerprint seed.",
      status: isDeviceBound ? "VERIFIED" : "PENDING",
      icon: Smartphone,
      isVerified: isDeviceBound,
    },
    {
      number: "03",
      title: "PERIMETER",
      description: "Campus presence verification and geofence boundary checks.",
      status: "VERIFIED",
      icon: MapPin,
      isVerified: true,
    },
    {
      number: "04",
      title: "REAL-TIME VALIDATION",
      description: "Immediate submission checks and immutable ledger finality.",
      status: "ACTIVE",
      icon: ShieldCheck,
      isVerified: true,
    },
  ];

  return (
    <section id="verification" className="scroll-mt-24 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              VERIFICATION LAYERS
            </h2>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              ZERO-TRUST ARCHITECTURE
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-1">
            Zero-trust validation across every attendance submission.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider self-start sm:self-auto shrink-0">
          FOUR LAYERS ACTIVE
        </span>
      </div>

      {/* 4 Minimal Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {layers.map((layer) => {
          const Icon = layer.icon;

          return (
            <div
              key={layer.number}
              className={`group rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/25 hover:-translate-y-1 hover:bg-[#0E1117] flex flex-col justify-between ${
                layer.isVerified
                  ? "border-zinc-800/80 bg-[#0B0D10]"
                  : "border-amber-500/30 bg-[#0B0D10]"
              }`}
            >
              <div>
                {/* Header: Number & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold text-zinc-500 group-hover:text-blue-400 transition-colors">
                    {layer.number}
                  </span>
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                      layer.isVerified
                        ? "bg-zinc-900 border border-zinc-800 text-blue-400 group-hover:border-blue-500/40 group-hover:shadow-sm group-hover:shadow-blue-500/20"
                        : "bg-amber-500/10 border border-amber-500/25 text-amber-400 group-hover:border-amber-500/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm font-semibold text-white tracking-tight mb-1.5 group-hover:text-blue-100 transition-colors">
                  {layer.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  {layer.description}
                </p>
              </div>

              {/* Status Rail */}
              <div className="pt-3 mt-4 border-t border-zinc-800/70 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                  STATUS
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold flex items-center gap-1.5 transition-colors ${
                    layer.isVerified ? "text-blue-400 group-hover:text-blue-300" : "text-amber-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125 ${
                      layer.isVerified ? "bg-blue-400" : "bg-amber-400"
                    }`}
                  />
                  {layer.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

