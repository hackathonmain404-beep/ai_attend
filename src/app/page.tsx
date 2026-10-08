"use client";

import * as React from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUserProfile, saveCurrentUserProfile } from "@/lib/auth/auth-client";
import { Navbar } from "@/components/landing/Navbar";
import { AtmosphericBackground } from "@/components/landing/AtmosphericBackground";
import { Hero } from "@/components/landing/Hero";
import { SecurityPillars } from "@/components/landing/SecurityPillars";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ArchitectureFlow } from "@/components/landing/ArchitectureFlow";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { DemoTourGuideModal } from "@/components/presentation/DemoTourGuideModal";

export default function HomePage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isTourOpen, setIsTourOpen] = React.useState<boolean>(false);

  // Handle incoming OAuth redirect codes (e.g. Google login) and session profile
  React.useEffect(() => {
    async function checkAuthAndOAuthLanding() {
      if (typeof window === "undefined") return;

      const activeProfile = getCurrentUserProfile();
      if (activeProfile) {
        setCurrentUser(activeProfile);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const hasHashToken = window.location.hash.includes("access_token");

      if (code || hasHashToken) {
        try {
          const supabase = createClient();
          let resolvedProfile: any = null;

          if (code) {
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code);
              if (!error && data?.user) {
                const user = data.user;
                const meta = user.user_metadata || {};
                const storedRole =
                  (localStorage.getItem("attendguard-oauth-role") as "student" | "teacher") || "student";

                const { data: dbProfile } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .maybeSingle();

                resolvedProfile = {
                  id: user.id,
                  email: dbProfile?.email || user.email || "",
                  fullName: dbProfile?.full_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Verified Academic",
                  role: dbProfile?.role || storedRole,
                  identifier: dbProfile?.identifier || (storedRole === "teacher" ? `FAC-${user.id.slice(0, 4)}` : `STU-${user.id.slice(0, 4)}`),
                };
              }
            } catch (exchangeErr) {
              console.warn("Client code exchange notice:", exchangeErr);
            }
          }

          if (!resolvedProfile) {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user) {
                const user = session.user;
                const meta = user.user_metadata || {};
                const storedRole =
                  (localStorage.getItem("attendguard-oauth-role") as "student" | "teacher") || "student";

                const { data: dbProfile } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", user.id)
                  .maybeSingle();

                resolvedProfile = {
                  id: user.id,
                  email: dbProfile?.email || user.email || "",
                  fullName: dbProfile?.full_name || meta.full_name || meta.name || user.email?.split("@")[0] || "Verified Academic",
                  role: dbProfile?.role || storedRole,
                  identifier: dbProfile?.identifier || (storedRole === "teacher" ? `FAC-${user.id.slice(0, 4)}` : `STU-${user.id.slice(0, 4)}`),
                };
              }
            } catch {}
          }

          if (resolvedProfile) {
            saveCurrentUserProfile(resolvedProfile);
            localStorage.removeItem("attendguard-oauth-provider");
            localStorage.removeItem("attendguard-oauth-role");

            toast.success(`Authentication Successful!`, {
              description: `Welcome, ${resolvedProfile.fullName}! Launching your command center...`,
            });

            const target = resolvedProfile.role === "teacher" ? "/teacher" : "/student";
            window.location.href = target;
          }
        } catch (err) {
          console.error("OAuth processing failed:", err);
        }
      }
    }

    checkAuthAndOAuthLanding();
  }, []);

  // Keyboard shortcut listener for Hackathon Demo Tour (Shift + D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setIsTourOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const destinationHref = currentUser
    ? currentUser.role === "teacher"
      ? "/teacher"
      : "/student"
    : "/login";

  return (
    <main className="relative min-h-screen bg-[#02040a] text-zinc-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200 antialiased overflow-x-hidden">
      {/* Stitch-Inspired Atmospheric Background & Interactive Dot Matrix */}
      <AtmosphericBackground />

      {/* 1. Minimalist Transparent/Dark Navigation */}
      <Navbar currentUser={currentUser} />

      {/* 2. Single-Focus Immersive Hero with Enormous Typography & Attendance Security Core */}
      <Hero destinationHref={destinationHref} />

      {/* 3. Four Security Pillars with Progressive Disclosure */}
      <SecurityPillars />

      {/* 4. Campus Platform Capabilities */}
      <FeaturesSection />

      {/* 5. Clean Architectural Flow: Generate → Verify → Bind → Record */}
      <ArchitectureFlow />

      {/* 6. Spacious Final CTA Section */}
      <FinalCTA destinationHref={destinationHref} />

      {/* 7. Subdued Minimal Footer */}
      <Footer />

      {/* Interactive Hackathon Demo Tour Modal (Triggered via Shift+D) */}
      <DemoTourGuideModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        initialStep={1}
      />
    </main>
  );
}
