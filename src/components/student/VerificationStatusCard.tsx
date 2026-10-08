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
      protocol: "HMAC-SHA256 ROTATION",
      status: "VERIFIED",
      statusDetail: "20s Expiry Cycle",
      icon: QrCode,
      isVerified: true,
    },
    {
      number: "02",
      title: "DEVICE BINDING",
      protocol: "1:1 HARDWARE SEED",
      status: isDeviceBound ? "VERIFIED" : "PENDING",
      statusDetail: isDeviceBound ? "1:1 Bound Device" : "Registration Req.",
      icon: Smartphone,
      isVerified: isDeviceBound,
    },
    {
      number: "03",
      title: "PERIMETER VERIFICATION",
      protocol: "CAMPUS GEOFENCE",
      status: "VERIFIED",
      statusDetail: "Boundary Active",
      icon: MapPin,
      isVerified: true,
    },
    {
      number: "04",
      title: "REAL-TIME VALIDATION",
      protocol: "ATOMIC FINALITY",
      status: "ACTIVE",
      statusDetail: "Sub-Second Sync",
      icon: ShieldCheck,
      isVerified: true,
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-[#0B0D10] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold">
              VERIFICATION STATUS
            </h2>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            Zero-Trust state across cryptographic, hardware, and perimeter security layers.
          </p>
        </div>

        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/60 self-start sm:self-auto shrink-0">
          Security Perimeter
        </span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {layers.map((layer) => {
          const Icon = layer.icon;

          return (
            <div
              key={layer.number}
              className={`p-3.5 rounded-lg border transition-all duration-200 flex flex-col justify-between ${
                layer.isVerified
                  ? "border-zinc-800/80 bg-zinc-950/60 hover:border-blue-500/35"
                  : "border-amber-500/30 bg-amber-950/10"
              }`}
            >
              <div>
                {/* Top: Number & Icon */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-medium text-zinc-500">
                    {layer.number}
                  </span>
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center ${
                      layer.isVerified
                        ? "bg-zinc-900 border border-zinc-800 text-blue-400"
                        : "bg-amber-500/10 border border-amber-500/25 text-amber-400"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                </div>

                {/* Layer Title & Protocol */}
                <h3 className="text-xs font-semibold text-white tracking-tight">
                  {layer.title}
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                  {layer.protocol}
                </p>
              </div>

              {/* Status Rail */}
              <div className="pt-2 mt-3 border-t border-zinc-800/70 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">
                  {layer.statusDetail}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${
                    layer.isVerified ? "text-blue-400" : "text-amber-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
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
    </div>
  );
}
