"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Laptop,
  Smartphone,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  startRegistration,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import {
  getWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  getStudentWebAuthnCredentials,
  revokeWebAuthnCredential,
} from "@/lib/api-client";

interface EnrolledCredential {
  id: string;
  credentialId: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
  isRevoked: boolean;
  revokedAt?: string | null;
}

export default function StudentSecurityPage() {
  const [credentials, setCredentials] = React.useState<EnrolledCredential[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [registrationState, setRegistrationState] = React.useState<
    "idle" | "options" | "prompt" | "verifying" | "success" | "error" | "cancelled"
  >("idle");
  const [feedbackMessage, setFeedbackMessage] = React.useState<string>("");
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  // Authenticator compatibility detection
  const [compatibility, setCompatibility] = React.useState<{
    supported: boolean;
    platformAvailable: boolean;
    checked: boolean;
  }>({
    supported: true,
    platformAvailable: true,
    checked: false,
  });

  // Check WebAuthn support on mount
  React.useEffect(() => {
    async function checkSupport() {
      const supported = browserSupportsWebAuthn();
      let platformAvailable = false;
      if (supported) {
        try {
          platformAvailable = await platformAuthenticatorIsAvailable();
        } catch {
          platformAvailable = false;
        }
      }
      setCompatibility({
        supported,
        platformAvailable,
        checked: true,
      });
    }
    checkSupport();
  }, []);

  // Fetch student's credentials
  const loadCredentials = React.useCallback(async () => {
    try {
      const res = await getStudentWebAuthnCredentials();
      if (res && Array.isArray(res.credentials)) {
        setCredentials(res.credentials);
      }
    } catch (err: any) {
      console.error("Failed to load credentials", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // Initiate WebAuthn Registration
  const handleRegister = async () => {
    setIsRegistering(true);
    setRegistrationState("options");
    setFeedbackMessage("");

    try {
      // 1. Fetch registration options from server
      const optRes = await getWebAuthnRegistrationOptions();
      if (!optRes || !optRes.options) {
        throw new Error("Failed to generate registration challenge.");
      }

      // 2. Invoke browser WebAuthn API
      setRegistrationState("prompt");
      let registrationResponse;
      try {
        // Fallback guard: Ensure rp.id matches current hostname if server returned localhost on remote host
        const currentHost = typeof window !== "undefined" ? window.location.hostname : null;
        if (currentHost && optRes.options?.rp?.id) {
          if (
            currentHost !== "localhost" &&
            currentHost !== "127.0.0.1" &&
            (optRes.options.rp.id === "localhost" || optRes.options.rp.id === "127.0.0.1")
          ) {
            optRes.options.rp.id = currentHost;
          }
        }

        registrationResponse = await startRegistration({
          optionsJSON: optRes.options,
        });
      } catch (browserErr: any) {
        if (
          browserErr?.name === "NotAllowedError" ||
          browserErr?.message?.toLowerCase().includes("cancel") ||
          browserErr?.message?.toLowerCase().includes("abort")
        ) {
          setRegistrationState("cancelled");
          setFeedbackMessage("Registration cancelled. Your device authenticator prompt was dismissed.");
          return;
        }
        setRegistrationState("error");
        setFeedbackMessage(
          browserErr?.message || "Device authenticator verification failed or timed out."
        );
        return;
      }

      // 3. Submit cryptographic response to server for verification
      setRegistrationState("verifying");
      const verifyRes = await verifyWebAuthnRegistration(
        optRes.challengeId,
        registrationResponse
      );

      if (!verifyRes || !verifyRes.verified) {
        throw new Error("Server cryptographic verification failed.");
      }

      // 4. Success!
      setRegistrationState("success");
      setFeedbackMessage(
        "Secure authenticator registered successfully! Your device will now verify attendance before check-in."
      );
      await loadCredentials();
    } catch (err: any) {
      setRegistrationState("error");
      setFeedbackMessage(err?.message || "An unexpected error occurred during enrollment.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Revoke credential
  const handleRevoke = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this authenticator? You will not be able to use it for attendance.")) {
      return;
    }
    setRevokingId(id);
    try {
      await revokeWebAuthnCredential(id);
      await loadCredentials();
    } catch (err: any) {
      alert(err?.message || "Network error while revoking credential.");
    } finally {
      setRevokingId(null);
    }
  };

  const activeCredentials = credentials.filter((c) => !c.isRevoked && !c.revokedAt);
  const hasActiveCredential = activeCredentials.length > 0;

  return (
    <div className="space-y-10 sm:space-y-12 max-w-4xl mx-auto">
      {/* 1. Command Center Page Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 sm:pb-8 border-b border-zinc-800/60">
        <div className="space-y-3 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              IDENTITY ENCLAVE
            </span>
            <span className="text-zinc-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              WEBAUTHN VERIFICATION
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
            Secure Your Attendance
          </h1>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Register a device authenticator so AttendGuard can ask you to verify yourself before submitting attendance.
            This ensures that someone who borrows your phone cannot scan attendance on your behalf.
          </p>
        </div>

        {/* Right Action & Breadcrumb */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO COMMAND CENTER</span>
          </Link>

          <div className="px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasActiveCredential ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span>{hasActiveCredential ? "PASSKEY ACTIVE" : "ENROLLMENT REQUIRED"}</span>
          </div>
        </div>
      </div>

      {/* 2. Platform Compatibility Warning (if unsupported) */}
      {compatibility.checked && (!compatibility.supported || !compatibility.platformAvailable) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs font-mono">
            <p className="font-semibold text-amber-300">
              Limited Device Authenticator Support Detected
            </p>
            <p className="text-amber-200/90 leading-relaxed font-sans text-xs">
              {!compatibility.supported
                ? "Your current browser does not support the W3C Web Authentication (WebAuthn) standard. Please switch to a modern browser like Chrome, Safari, Edge, or Firefox."
                : "A built-in biometric sensor or platform authenticator (Touch ID, Face ID, Windows Hello, or Screen Lock PIN) was not detected. You can still register an external FIDO2/U2F security key if available."}
            </p>
          </div>
        </div>
      )}

      {/* 3. Primary Registration Action Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/5">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                {hasActiveCredential ? "Enrolled Device Passkey" : "Register Device Authenticator"}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Cryptographic FIDO2 / WebAuthn user verification
              </p>
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={isRegistering || !compatibility.supported}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-xl px-5 h-11 shadow-lg shadow-emerald-900/30 transition-all duration-200 shrink-0 flex items-center gap-2"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enrolling...</span>
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>{hasActiveCredential ? "Add Another Authenticator" : "Register Secure Authentication"}</span>
              </>
            )}
          </Button>
        </div>

        {/* State Banners */}
        {registrationState === "prompt" && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center gap-3 text-blue-200 text-xs font-mono">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
            <div>
              <span className="font-semibold text-white">Device Prompt Active:</span>{" "}
              Please complete verification on your phone or computer (fingerprint, Face ID, Windows Hello, or PIN).
            </div>
          </div>
        )}

        {registrationState === "verifying" && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center gap-3 text-blue-200 text-xs font-mono">
            <RefreshCw className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
            <div>
              <span className="font-semibold text-white">Verifying Cryptographic Signature:</span>{" "}
              The server is validating the cryptographic assertion and storing the public key.
            </div>
          </div>
        )}

        {registrationState === "success" && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3 text-emerald-200 text-xs font-mono">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-emerald-300">Enrollment Complete</span>
              <p className="font-sans text-xs text-emerald-200/90">{feedbackMessage}</p>
            </div>
          </div>
        )}

        {registrationState === "cancelled" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-amber-200 text-xs font-mono">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-300">Action Cancelled</span>
              <p className="font-sans text-xs text-amber-200/90">{feedbackMessage}</p>
            </div>
          </div>
        )}

        {registrationState === "error" && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3 text-rose-200 text-xs font-mono">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-rose-300">Registration Failed</span>
              <p className="font-sans text-xs text-rose-200/90">{feedbackMessage}</p>
            </div>
          </div>
        )}

        {/* Informative Explanatory Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80 text-xs">
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#06080A]/60 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold font-mono text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Zero Biometric Storage</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              AttendGuard never collects, uploads, or stores raw fingerprints or facial scans. Biometrics remain strictly inside your device&apos;s secure enclave.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#06080A]/60 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold font-mono text-[11px]">
              <Smartphone className="h-3.5 w-3.5 text-blue-400" />
              <span>Multi-Method Support</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Your device may use fingerprint sensors, Face ID, Windows Hello, or device screen PIN. Any supported platform authenticator is accepted.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800 bg-[#06080A]/60 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold font-mono text-[11px]">
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>Proxy Prevention</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              When scanning attendance, a real-time cryptographic challenge is signed by this authenticator, proving your physical presence.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Active Registered Authenticators List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Registered Authenticators
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Devices authorized to perform attendance verification for your account
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {activeCredentials.length} {activeCredentials.length === 1 ? "Active Key" : "Active Keys"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 border border-zinc-800 rounded-2xl bg-[#0B0D10]">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <p className="text-xs font-mono text-zinc-400">Loading credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-[#0B0D10] space-y-3">
            <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <KeyRound className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-200">No Authenticators Registered</p>
              <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                You must register at least one device authenticator before checking into classes with biometric passkey verification.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((cred) => {
              const isRevoked = cred.isRevoked || !!cred.revokedAt;
              return (
                <div
                  key={cred.id}
                  className={`p-4 sm:p-5 rounded-2xl border ${
                    isRevoked
                      ? "border-zinc-800/40 bg-zinc-950/40 opacity-60"
                      : "border-zinc-800 bg-[#0B0D10] hover:border-zinc-700/80"
                  } transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl ${
                        isRevoked
                          ? "bg-zinc-900 text-zinc-600 border border-zinc-800"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      } flex items-center justify-center shrink-0`}
                    >
                      {cred.deviceType === "singleDevice" ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white font-mono">
                          {cred.deviceType === "singleDevice"
                            ? "Dedicated Platform Authenticator"
                            : "Multi-Device Passkey / Key"}
                        </span>
                        {isRevoked ? (
                          <span className="px-2 py-0.2 rounded text-[9px] font-mono uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            REVOKED
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        ID: <span className="text-zinc-300">{cred.credentialId.slice(0, 16)}...</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-500 pt-0.5">
                        <span>Enrolled: {new Date(cred.createdAt).toLocaleDateString()}</span>
                        {cred.lastUsedAt && (
                          <span>Last Used: {new Date(cred.lastUsedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isRevoked && (
                    <Button
                      onClick={() => handleRevoke(cred.id)}
                      disabled={revokingId === cred.id}
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/20 rounded-xl h-9 px-3 text-xs font-mono shrink-0 transition-colors"
                    >
                      {revokingId === cred.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      <span>Revoke Authenticator</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Recovery & Troubleshooting Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0B0D10]/80 p-5 sm:p-6 space-y-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold">
          <HelpCircle className="h-4 w-4 text-blue-400 shrink-0" />
          <span>Device Loss, Recovery & Support</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
          If your enrolled device is lost, stolen, or damaged:
        </p>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 leading-relaxed font-sans pl-1">
          <li>Log in from a secondary trusted device using your credentials and revoke the compromised authenticator above.</li>
          <li>Register a new authenticator immediately to resume attendance verification.</li>
          <li>If you are locked out of all devices, contact your class instructor or department administrator for an identity verification override.</li>
        </ul>
      </div>
    </div>
  );
}
