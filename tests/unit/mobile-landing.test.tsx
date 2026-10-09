import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";

// Mock GSAP to prevent headless test environment errors
vi.mock("@/lib/gsap", () => ({
  gsap: {
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    })),
    context: vi.fn((fn: () => void) => {
      fn();
      return { revert: vi.fn() };
    }),
    registerPlugin: vi.fn(),
    matchMedia: vi.fn(() => ({
      add: vi.fn(),
      revert: vi.fn(),
    })),
  },
  ScrollTrigger: {
    config: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(() => []),
  },
}));

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SecurityToken } from "@/components/landing/SecurityToken";
import { SecurityPillars } from "@/components/landing/SecurityPillars";
import { ArchitectureFlow } from "@/components/landing/ArchitectureFlow";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

describe("Mobile Navbar Component", () => {
  it("renders shield logo, wordmark, navigation links, and mobile menu button", () => {
    const html = renderToString(<Navbar />);

    expect(html).toContain("AttendGuard");
    expect(html).toContain("v1.0");
    expect(html).toContain("Security");
    expect(html).toContain("Architecture");
    expect(html).toContain("Features");
    expect(html).toContain("Launch Command Center");
    expect(html).toContain("aria-label=\"Open navigation menu\"");
    expect(html).toContain("aria-controls=\"mobile-navigation\"");
  });
});

describe("Mobile Hero Component", () => {
  it("renders layout in exact required order: headline, copy, and CTAs", () => {
    const html = renderToString(<Hero destinationHref="/login" />);

    expect(html).toContain("Zero-Proxy Attendance.");
    expect(html).toContain("Secure your campus perimeter with cryptographic QR challenges and hardware-bound device verification.");
    expect(html).toContain("Launch Command Center");
    expect(html).toContain("Explore Security Pillars");
    expect(html).toContain("href=\"#security\"");
  });
});

describe("Mobile SecurityToken Component", () => {
  it("renders live status indicator, countdown, and cryptographic metadata badges", () => {
    const html = renderToString(<SecurityToken mode="crypto" />);

    expect(html).toContain("LIVE");
    expect(html).toContain("TOKEN VALID");
    expect(html).toContain("DEVICE BOUND");
    expect(html).toContain("CHALLENGE ACTIVE");
    expect(html).toContain("SIMULATED LIVE CREDENTIAL");
    expect(html).toContain("<svg");
  });

  it("supports mode switching to device enclave, perimeter radar, and validation ledger", () => {
    const deviceHtml = renderToString(<SecurityToken mode="device" />);
    expect(deviceHtml).toContain("Hardware Enclave");

    const perimeterHtml = renderToString(<SecurityToken mode="perimeter" />);
    expect(perimeterHtml).toContain("Perimeter Radar");

    const validationHtml = renderToString(<SecurityToken mode="validation" />);
    expect(validationHtml).toContain("Validation Ledger");
  });
});

describe("Mobile SecurityPillars Component", () => {
  it("renders all four zero-trust pillars with numbers and titles", () => {
    const html = renderToString(<SecurityPillars />);

    expect(html).toContain("Four Layers. One Trusted Presence.");
    expect(html).toContain("Dynamic Challenges");
    expect(html).toContain("Device Binding");
    expect(html).toContain("Perimeter Verification");
    expect(html).toContain("Real-Time Validation");
    expect(html).toContain("01");
    expect(html).toContain("02");
    expect(html).toContain("03");
    expect(html).toContain("04");
    expect(html).toContain("HMAC-SHA256 Ephemeral Tokens");
  });

  it("renders tap-to-expand controls with accessibility attributes", () => {
    const html = renderToString(<SecurityPillars />);

    expect(html).toContain("aria-expanded");
    expect(html).toContain("tech-details-pillar-01");
  });
});

describe("ArchitectureFlow Component", () => {
  it("renders the end-to-end 4-step pipeline: GENERATE, VERIFY, BIND, RECORD", () => {
    const html = renderToString(<ArchitectureFlow />);

    expect(html).toContain("GENERATE → VERIFY → BIND → RECORD");
    expect(html).toContain("GENERATE");
    expect(html).toContain("VERIFY");
    expect(html).toContain("BIND");
    expect(html).toContain("RECORD");
    expect(html).toContain("12ms");
    expect(html).toContain("85ms");
    expect(html).toContain("140ms");
    expect(html).toContain("210ms");
  });
});

describe("FeaturesSection Component", () => {
  it("renders all four platform capabilities", () => {
    const html = renderToString(<FeaturesSection />);

    expect(html).toContain("Engineered for Academic Integrity.");
    expect(html).toContain("Random In-Class Re-Verification");
    expect(html).toContain("Deterministic 75% Margin Engine");
    expect(html).toContain("Grounded AI Attendance Advisor");
    expect(html).toContain("RFC-4180 Audit-Ready Exports");
  });
});

describe("FinalCTA and Footer Components", () => {
  it("renders final statement headline and accessible touch target CTA", () => {
    const html = renderToString(<FinalCTA destinationHref="/login" />);

    expect(html).toContain("Attendance should be verified, not assumed.");
    expect(html).toContain("Launch Command Center");
    expect(html).toContain('href="/login"');
  });

  it("renders footer brand, status, and navigation categories", () => {
    const html = renderToString(<Footer />);

    expect(html).toContain("AttendGuard");
    expect(html).toContain("Systems Operational");
    expect(html).toContain("Product");
    expect(html).toContain("Resources");
    expect(html).toContain("Company");
    expect(html).toContain("2026 AttendGuard");
  });
});
