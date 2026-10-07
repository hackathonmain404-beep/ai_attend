"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TiltCard } from "@/components/ui/tilt-card";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth/auth-client";
import { createClient } from "@/lib/supabase/client";
import { MOCK_USERS } from "@/mocks/auth";
import { cn } from "@/lib/utils";

// Social Provider Icons
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [socialLoading, setSocialLoading] = React.useState<string | null>(null);
  const [socialRole, setSocialRole] = React.useState<"student" | "teacher">("student");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const { profile, role } = await signIn(data.email, data.password);

      toast.success(`Welcome back, ${profile.fullName}!`, {
        description: `Signed in as ${role === "student" ? "Student" : "Faculty Professor"}.`,
      });

      // Target redirection logic
      if (redirectTarget && redirectTarget.startsWith("/")) {
        router.push(redirectTarget);
      } else {
        router.push(role === "student" ? "/student" : "/teacher");
      }
      router.refresh();
    } catch (err: any) {
      const message = err.message || "Failed to authenticate. Please check your credentials.";
      setServerError(message);
      toast.error("Authentication Failed", { description: message });
    }
  };

  const handleSocialLogin = async (provider: "discord" | "github" | "google") => {
    setSocialLoading(provider);
    setServerError(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const isMock = supabaseUrl.includes("mock-project") || !supabaseUrl.startsWith("http");

      if (!isMock) {
        const supabase = createClient();
        const targetUrl = redirectTarget || (socialRole === "student" ? "/student" : "/teacher");
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(targetUrl)}`
            : `/auth/callback?redirect=${encodeURIComponent(targetUrl)}`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: redirectUrl },
        });

        if (error) throw error;
        return;
      }

      // Smooth realistic feedback delay
      await new Promise((r) => setTimeout(r, 500));

      const selectedUserEmail =
        socialRole === "student"
          ? "jane.doe@university.edu"
          : "prof.turing@university.edu";

      const userRecord = MOCK_USERS[selectedUserEmail].profile;

      // Set cookies and local storage
      if (typeof document !== "undefined") {
        const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
        document.cookie = `attendguard-demo-user=${encodeURIComponent(
          JSON.stringify(userRecord)
        )}; path=/; expires=${expires}; SameSite=Lax`;
        localStorage.setItem("attendguard-user", JSON.stringify(userRecord));
      }

      const providerLabels = {
        google: "Google Workspace",
        github: "GitHub Student/Faculty",
        discord: "Discord Academic Community",
      };

      toast.success(`Connected via ${providerLabels[provider]}!`, {
        description: `Authenticated as ${userRecord.fullName} (${
          socialRole === "student" ? "Student STU-001" : "Faculty Professor"
        }).`,
      });

      if (redirectTarget && redirectTarget.startsWith("/")) {
        router.push(redirectTarget);
      } else {
        router.push(socialRole === "student" ? "/student" : "/teacher");
      }
      router.refresh();
    } catch (err: any) {
      const msg = err.message || `Failed to sign in with ${provider}.`;
      setServerError(msg);
      toast.error("Social Sign-In Failed", { description: msg });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <TiltCard maxTilt={5} scale={1.01} className="w-full max-w-md">
      <Card className="w-full border-slate-800 bg-slate-900/85 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 relative">
        <CardHeader className="text-center p-0 mb-5">
          <div
            className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mb-3.5 shadow-lg shadow-emerald-950/60"
            style={{ transform: "translateZ(20px)" }}
          >
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-black text-white tracking-tight" style={{ transform: "translateZ(12px)" }}>
            AttendGuard Sign In
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1" style={{ transform: "translateZ(8px)" }}>
            Authenticate with academic credentials or connected institutional accounts.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-4">
          {/* Social OAuth Sign-In Suite (Discord, GitHub, Google) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">
                Instant Social OAuth
              </span>
              {/* Role Toggle for OAuth */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSocialRole("student")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold transition-all duration-200",
                    socialRole === "student"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setSocialRole("teacher")}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold transition-all duration-200",
                    socialRole === "teacher"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Faculty
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={Boolean(socialLoading) || isSubmitting}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 hover-lift-3d disabled:opacity-50 transition-all text-xs font-semibold shadow-md group"
                title={`Continue with Google as ${socialRole === "student" ? "Student" : "Faculty"}`}
              >
                {socialLoading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <GoogleIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                )}
                <span>Google</span>
              </button>

              {/* GitHub OAuth Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("github")}
                disabled={Boolean(socialLoading) || isSubmitting}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 hover-lift-3d disabled:opacity-50 transition-all text-xs font-semibold shadow-md group"
                title={`Continue with GitHub as ${socialRole === "student" ? "Student" : "Faculty"}`}
              >
                {socialLoading === "github" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <GitHubIcon className="h-4 w-4 shrink-0 text-slate-200 group-hover:text-white transition-transform group-hover:scale-110" />
                )}
                <span>GitHub</span>
              </button>

              {/* Discord OAuth Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin("discord")}
                disabled={Boolean(socialLoading) || isSubmitting}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:bg-[#5865F2]/15 hover:border-[#5865F2]/50 text-slate-200 hover-lift-3d disabled:opacity-50 transition-all text-xs font-semibold shadow-md group"
                title={`Continue with Discord as ${socialRole === "student" ? "Student" : "Faculty"}`}
              >
                {socialLoading === "discord" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <DiscordIcon className="h-4 w-4 shrink-0 text-[#5865F2] group-hover:brightness-125 transition-transform group-hover:scale-110" />
                )}
                <span>Discord</span>
              </button>
            </div>
          </div>

          {/* Dividing OR Line */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800/80" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-500">
              <span className="bg-slate-900/90 px-3">or</span>
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Authentication Error</p>
                <p className="text-rose-300/80 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300" htmlFor="email-input">
                Academic Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="name@university.edu"
                  className={cn(
                    "pl-10 text-sm bg-slate-950/60 border-slate-800 focus:border-emerald-500 transition-colors",
                    errors.email && "border-rose-500/80 focus-visible:ring-rose-500"
                  )}
                  disabled={isSubmitting}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 font-medium pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300" htmlFor="password-input">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "pl-10 pr-10 text-sm bg-slate-950/60 border-slate-800 focus:border-emerald-500 transition-colors",
                    errors.password && "border-rose-500/80 focus-visible:ring-rose-500"
                  )}
                  disabled={isSubmitting}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 font-medium pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="emerald"
              className="w-full gap-2 font-bold shadow-lg shadow-emerald-950/60 mt-1 hover-lift-3d"
              disabled={isSubmitting || Boolean(socialLoading)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to AttendGuard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Notice Footer */}
          <div className="text-center pt-1 border-t border-slate-800/60">
            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Hardware-bound device perimeter & single active session policy</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </TiltCard>
  );
}
