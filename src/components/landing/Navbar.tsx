"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, Menu, X, ArrowRight } from "lucide-react";
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
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const mobileLinksRef = React.useRef<HTMLDivElement>(null);
  const logoRef = React.useRef<HTMLAnchorElement>(null);
  const navLinksContainerRef = React.useRef<HTMLElement>(null);

  // Monitor scroll for subtle navbar styling
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP Navbar Entrance Animation when loader completes
  React.useEffect(() => {
    if (typeof window === "undefined" || !headerRef.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isLoaded) {
      if (!prefersReducedMotion) {
        gsap.set(headerRef.current, { opacity: 0, y: -20 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set([headerRef.current, logoRef.current, navLinksContainerRef.current, ctaBtnRef.current], {
          opacity: 1,
          y: 0,
          scale: 1,
          x: 0,
        });
        return;
      }

      const tl = gsap.timeline({ delay: 0.08 });
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }
      )
        .fromTo(
          logoRef.current,
          { opacity: 0, scale: 0.94, x: -10 },
          { opacity: 1, scale: 1, x: 0, duration: 0.5, ease: "power2.out" },
          "-=0.4"
        );

      if (navLinksContainerRef.current) {
        tl.fromTo(
          navLinksContainerRef.current.children,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: "power2.out" },
          "-=0.3"
        );
      }

      if (ctaBtnRef.current) {
        tl.fromTo(
          ctaBtnRef.current,
          { opacity: 0, scale: 0.93 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
          "-=0.25"
        );
      }
    }, headerRef);

    return () => ctx.revert();
  }, [isLoaded]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close mobile menu
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  // GSAP Animation for Mobile Menu opening/closing
  React.useEffect(() => {
    if (typeof window === "undefined" || !mobileMenuRef.current) return;

    if (isMobileMenuOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }
      );
      if (mobileLinksRef.current) {
        gsap.fromTo(
          mobileLinksRef.current.children,
          { opacity: 0, x: -10 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.06, ease: "power2.out", delay: 0.1 }
        );
      }
    }
  }, [isMobileMenuOpen]);

  // Micro-interaction: Desktop CTA button magnetic pull (only on devices with fine pointer)
  const isFinePointer = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
    gsap.to(e.currentTarget, { x, y, duration: 0.2, ease: "power2.out" });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isFinePointer()) return;
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 will-change-transform pt-[env(safe-area-inset-top,0px)] ${
          isScrolled
            ? "bg-[#02040a]/90 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/40"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            ref={logoRef}
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1 -ml-1 will-change-transform"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:border-blue-400 group-hover:text-blue-300 transition-colors shadow-sm">
              <Shield className="h-3.5 w-3.5 stroke-[2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                AttendGuard
              </span>
              <span className="text-[10px] uppercase font-mono font-medium tracking-wider px-1.5 py-0.5 rounded border border-white/10 text-zinc-400 bg-white/[0.03]">
                v1.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav
            ref={navLinksContainerRef}
            className="hidden md:flex items-center gap-7 text-sm font-normal text-zinc-400"
            aria-label="Desktop Navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-white transition-colors duration-200 focus:outline-none focus-visible:text-white text-xs tracking-wide font-medium py-1.5 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-blue-500"
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
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide shadow-[0_0_24px_rgba(37,99,235,0.35)] transition-colors inline-flex items-center justify-center will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              <span>Launch Command Center</span>
            </a>
          </div>

          {/* Mobile Hamburger Trigger (Accessible, min 44x44px touch target) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden h-11 w-11 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <span
                className={`absolute h-0.5 w-4 bg-current transform transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-0" : "-translate-y-1.5"
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-current transition-opacity duration-200 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-current transform transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 translate-y-0" : "translate-y-1.5"
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Dark Full-Width Navigation Panel */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-30 bg-[#02040a]/98 backdrop-blur-md md:hidden flex flex-col justify-between pt-[calc(4.5rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] px-6 overflow-y-auto"
        >
          {/* Subtle Blue Glow in background */}
          <div
            aria-hidden="true"
            className="absolute top-1/4 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
          />

          {/* Navigation Links list */}
          <div ref={mobileLinksRef} className="flex flex-col gap-2 pt-4 relative z-10">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold px-2 mb-1">
              PLATFORM NAVIGATION
            </span>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMobileMenu}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl text-base font-medium text-zinc-200 hover:text-white hover:bg-white/[0.04] active:bg-blue-600/10 active:text-blue-300 transition-colors border border-transparent hover:border-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-zinc-500" />
              </a>
            ))}
          </div>

          {/* Bottom Action CTA & Status */}
          <div className="pt-6 border-t border-white/[0.08] flex flex-col gap-3 relative z-10">
            <a
              href={destinationHref}
              onClick={closeMobileMenu}
              className="w-full min-h-[48px] py-3.5 px-6 rounded-full bg-blue-600 active:bg-blue-700 text-white text-center text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>Launch Command Center</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-mono text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>SYSTEM STATUS: OPERATIONAL</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
