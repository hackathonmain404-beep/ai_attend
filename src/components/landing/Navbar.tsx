"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { gsap } from "@/lib/gsap";

interface NavbarProps {
  currentUser?: any;
  isLoaded?: boolean;
}

export function Navbar({ currentUser, isLoaded = true }: NavbarProps) {
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const ctaBtnRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP Navbar Entrance Animation when loader completes
  React.useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current) return;

    if (!isLoaded) {
      gsap.set(headerRef.current, { opacity: 0, y: -20 });
      return;
    }

    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.05 }
    );
  }, [isLoaded]);

  // Micro-interaction: CTA button magnetic pull & scale
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    gsap.to(e.currentTarget, { x, y, duration: 0.2, ease: "power2.out" });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    gsap.to(e.currentTarget, { scale: 1, x: 0, y: 0, duration: 0.35, ease: "power2.out" });
  };

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
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 will-change-transform ${
          isScrolled
            ? "bg-[#02040a]/85 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-lg shadow-black/40"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Logo */}
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
                className="hover:text-white transition-colors duration-200 focus:outline-none focus-visible:text-white text-xs tracking-wide font-medium py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              ref={ctaBtnRef}
              href={destinationHref}
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide shadow-[0_0_24px_rgba(37,99,235,0.35)] transition-colors inline-flex items-center justify-center will-change-transform"
            >
              <span>Launch Command Center</span>
            </a>
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

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[#02040a]/95 backdrop-blur-2xl md:hidden pt-24 px-6 flex flex-col justify-between pb-8">
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-zinc-200 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href={destinationHref}
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full py-3.5 rounded-full bg-blue-600 text-white text-center text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/30"
          >
            Launch Command Center
          </a>
        </div>
      )}
    </>
  );
}
