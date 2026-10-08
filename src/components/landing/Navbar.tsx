"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, ArrowUpRight } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface NavbarProps {
  currentUser?: any;
}

export function Navbar({ currentUser }: NavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Security", href: "#security" },
    { label: "Architecture", href: "#architecture" },
    { label: "Features", href: "#features" },
  ];

  const destinationHref = currentUser
    ? currentUser.role === "teacher"
      ? "/teacher"
      : "/student"
    : "/login";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#02040a]/75 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-lg shadow-black/40"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Logo - Stitch Style Minimalist Outline */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-blue-400 group-hover:border-blue-500/40 group-hover:text-blue-300 transition-colors">
              <Shield className="h-3.5 w-3.5 stroke-[1.75]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-base tracking-[-0.02em] text-white group-hover:text-zinc-200 transition-colors">
                AttendGuard
              </span>
              <span className="text-[10px] uppercase font-mono font-medium tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-zinc-400 bg-white/[0.03]">
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-zinc-400" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-white transition-colors duration-200 focus:outline-none focus-visible:text-white text-xs tracking-wide font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            <MagneticButton
              href={destinationHref}
              variant="primary"
              className="px-4 py-2 text-xs font-semibold tracking-wide shadow-[0_0_24px_rgba(37,99,235,0.35)]"
            >
              <span>Launch Command Center</span>
            </MagneticButton>
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden h-9 w-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Animated Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[65px] z-30 md:hidden bg-[#02040a]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 shadow-2xl flex flex-col gap-5"
          >
            <nav className="flex flex-col gap-3 text-sm font-medium text-zinc-300">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 px-3 rounded-lg hover:bg-white/[0.05] hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                </a>
              ))}
            </nav>

            <div className="pt-2 border-t border-white/10">
              <Link
                href={destinationHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs tracking-wide text-center flex items-center justify-center shadow-lg shadow-blue-950/50"
              >
                Launch Command Center
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
