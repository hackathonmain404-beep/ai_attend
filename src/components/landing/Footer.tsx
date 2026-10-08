"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Command Center", href: "/login" },
  { label: "Architecture", href: "#architecture" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#architecture" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "Documentation", href: "/login" },
  { label: "API Reference", href: "/api/health", isExternal: true },
  { label: "System Status", href: "/api/health", isExternal: true },
  { label: "Support", href: "mailto:support@attendguard.edu" },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: "About AttendGuard", href: "#security" },
  { label: "Contact", href: "mailto:contact@attendguard.edu" },
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Responsible Disclosure", href: "#security" },
];

export function Footer() {
  const footerRef = React.useRef<HTMLElement>(null);
  const glowRef = React.useRef<HTMLDivElement>(null);
  const brandColRef = React.useRef<HTMLDivElement>(null);
  const navColRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const bottomBarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Glow intensifies as user scrolls toward footer
      if (glowRef.current && footerRef.current) {
        gsap.fromTo(
          glowRef.current,
          { opacity: 0.1, scale: 0.8 },
          {
            opacity: 0.5,
            scale: 1.1,
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 90%",
              end: "bottom bottom",
              scrub: 1,
            },
          }
        );
      }

      // Staggered reveal of footer columns
      if (brandColRef.current && footerRef.current) {
        const elementsToAnimate = [brandColRef.current, ...navColRefs.current.filter(Boolean)];

        gsap.fromTo(
          elementsToAnimate,
          { opacity: 0, y: 30, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // Bottom bar reveal
      if (bottomBarRef.current && footerRef.current) {
        gsap.fromTo(
          bottomBarRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative w-full bg-transparent border-t border-white/[0.08] pt-24 pb-12 overflow-hidden text-zinc-400 z-10">
      {/* Restrained Ambient Radial Blue/Violet Glow Near Brand Area */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute top-0 left-6 sm:left-12 w-[480px] sm:w-[640px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.12)_0%,_rgba(37,99,235,0.08)_40%,_transparent_72%)] pointer-events-none select-none blur-3xl will-change-transform"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16">
          {/* Brand Column (Span 5 on Desktop) */}
          <div ref={brandColRef} className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-8 will-change-transform">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
            >
              <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:text-blue-300 transition-colors shadow-sm">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                  AttendGuard
                </span>
                <span className="text-[10px] uppercase font-mono font-medium tracking-wider px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Tagline */}
            <p className="text-sm font-medium text-zinc-200 mt-4 tracking-tight">
              Secure attendance. Trusted presence.
            </p>

            {/* Platform Description */}
            <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed font-normal">
              A cryptographically secured attendance platform designed to make campus attendance verifiable, device-bound, and resistant to proxy submissions.
            </p>

            {/* Operational Status Indicator */}
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/70 border border-zinc-800/80 text-[11px] font-mono text-zinc-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-zinc-300">Systems Operational</span>
            </div>
          </div>

          {/* Navigation Categories Container */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Product Column */}
            <div
              ref={(el) => {
                navColRefs.current[0] = el;
              }}
              className="flex flex-col gap-3 will-change-transform"
            >
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Product
              </h3>
              <ul className="flex flex-col gap-2.5">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-all duration-150 hover:translate-x-0.5"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div
              ref={(el) => {
                navColRefs.current[1] = el;
              }}
              className="flex flex-col gap-3 will-change-transform"
            >
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Resources
              </h3>
              <ul className="flex flex-col gap-2.5">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-all duration-150 hover:translate-x-0.5"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div
              ref={(el) => {
                navColRefs.current[2] = el;
              }}
              className="flex flex-col gap-3 col-span-2 sm:col-span-1 will-change-transform"
            >
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Security & Trust
              </h3>
              <ul className="flex flex-col gap-2.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-all duration-150 hover:translate-x-0.5"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div
          ref={bottomBarRef}
          className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 will-change-transform"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© 2026 AttendGuard Technologies. All rights reserved.</span>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <span className="font-mono text-[11px] text-zinc-500">
              Zero-Trust Campus Attendance
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 text-zinc-500">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub Repository"
              className="hover:text-zinc-300 transition-colors p-1"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="mailto:security@attendguard.edu"
              aria-label="Security Contact Email"
              className="hover:text-zinc-300 transition-colors p-1"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
