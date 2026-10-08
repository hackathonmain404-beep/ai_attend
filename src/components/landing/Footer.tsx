"use client";

import * as React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950/80 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        {/* Brand & Tagline */}
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2 text-white group">
            <div className="h-6 w-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">AttendGuard</span>
          </Link>
          <p className="text-xs text-zinc-500 max-w-xs font-normal">
            Zero-proxy cryptographic presence verification for academic institutions.
          </p>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500 font-normal">
          <a href="#security" className="hover:text-zinc-300 transition-colors">
            Security
          </a>
          <Link href="/login" className="hover:text-zinc-300 transition-colors">
            Documentation
          </Link>
          <a href="#privacy" className="hover:text-zinc-300 transition-colors">
            Privacy
          </a>
          <a href="#contact" className="hover:text-zinc-300 transition-colors">
            Contact
          </a>
          <span className="text-zinc-800 hidden sm:inline">•</span>
          <span className="text-zinc-600 font-mono text-[11px]">
            © {new Date().getFullYear()} AttendGuard Inc.
          </span>
        </div>
      </div>
    </footer>
  );
}
