"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: "Command Center", href: "/login" },
  { label: "Security", href: "#security" },
  { label: "Features", href: "#features" },
  { label: "Architecture", href: "#architecture" },
  { label: "How It Works", href: "#architecture" },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: "Documentation", href: "/login" },
  { label: "API Reference", href: "/api/health", isExternal: true },
  { label: "Security Overview", href: "#security" },
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
  return (
    <footer className="relative w-full bg-zinc-950 border-t border-zinc-900/90 pt-20 pb-12 overflow-hidden text-zinc-400">
      {/* Restrained Ambient Radial Blue Glow Near Brand Area */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-6 sm:left-12 w-[420px] sm:w-[560px] h-[260px] bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.06),_transparent_72%)] pointer-events-none select-none blur-3xl"
      />

      {/* Almost-Invisible Subtle Grid Texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#27272a06_1px,transparent_1px),linear-gradient(to_bottom,#27272a06_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16">
          {/* Brand Column (Span 5 on Desktop) */}
          <div className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-8">
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

            {/* Subtle Operational Status Pill */}
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/70 border border-zinc-800/80 text-[11px] font-mono text-zinc-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-zinc-300">Systems Operational</span>
            </div>
          </div>

          {/* Navigation Categories Container (Span 7 on Desktop, 2-column grid on mobile) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Product Column */}
            <div className="flex flex-col gap-3">
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
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Resources
              </h3>
              <ul className="flex flex-col gap-2.5">
                {RESOURCE_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noopener noreferrer" : undefined}
                      className="group inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-all duration-150 hover:translate-x-0.5"
                    >
                      <span>{link.label}</span>
                      {link.isExternal && (
                        <ArrowUpRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Column */}
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                Company
              </h3>
              <ul className="flex flex-col gap-2.5">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-all duration-150 hover:translate-x-0.5"
                    >
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Separated by thin zinc-800 border */}
        <div className="border-t border-zinc-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-zinc-500 font-normal">
          {/* Copyright */}
          <div>
            <p className="font-mono text-[11.5px] text-zinc-500">
              © 2026 AttendGuard. All rights reserved.
            </p>
          </div>

          {/* Social Links (Subtle Monochrome Icons) */}
          <div className="flex items-center gap-3 order-last sm:order-none">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AttendGuard on GitHub"
              className="h-8 w-8 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-colors duration-150 shadow-sm"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AttendGuard on LinkedIn"
              className="h-8 w-8 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-colors duration-150 shadow-sm"
            >
              <Linkedin className="h-3.5 w-3.5" />
            </a>
            <a
              href="mailto:contact@attendguard.edu"
              aria-label="Contact AttendGuard by email"
              className="h-8 w-8 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-colors duration-150 shadow-sm"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Right Infrastructure Tagline */}
          <div className="text-center sm:text-right">
            <p className="text-zinc-500 font-normal">
              Built for secure campus infrastructure.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
