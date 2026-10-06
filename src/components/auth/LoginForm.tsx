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
  GraduationCap,
  Presentation,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
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

  const handleSelectPersona = (type: "student" | "teacher") => {
    setServerError(null);
    if (type === "student") {
      setValue("email", "jane.doe@university.edu", { shouldValidate: true });
      setValue("password", "student123", { shouldValidate: true });
    } else {
      setValue("email", "prof.turing@university.edu", { shouldValidate: true });
      setValue("password", "teacher123", { shouldValidate: true });
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-800 bg-slate-900/75 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
      <CardHeader className="text-center p-0 mb-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/60">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
            Cryptographic Perimeter
          </Badge>
        </div>
        <CardTitle className="text-2xl font-black text-white tracking-tight">
          AttendGuard Sign In
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs mt-1">
          Enter your institutional university credentials to verify identity.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-5">
        {/* Quick Demo Persona Switcher Chips */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Test Personas
            </span>
            <span className="text-[10px] text-emerald-400">1-Click Fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPersona("student")}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-emerald-950/20 hover:border-emerald-500/40 text-left transition-all group"
            >
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">Jane Doe</p>
                <p className="text-[10px] text-slate-500 truncate">Student STU-001</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPersona("teacher")}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-teal-950/20 hover:border-teal-500/40 text-left transition-all group"
            >
              <div className="p-1 rounded-md bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20">
                <Presentation className="h-3.5 w-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">Prof. Turing</p>
                <p className="text-[10px] text-slate-500 truncate">Faculty FAC-001</p>
              </div>
            </button>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-1.5">
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
                  "pl-10 text-sm",
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
          <div className="space-y-1.5">
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
                  "pl-10 pr-10 text-sm",
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
            className="w-full gap-2 font-bold shadow-lg shadow-emerald-950/50 mt-2"
            disabled={isSubmitting}
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
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500">
            Protected by hardware device fingerprint binding & single active device policy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
