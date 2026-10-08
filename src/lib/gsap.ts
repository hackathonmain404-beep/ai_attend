"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

export function registerGSAP() {
  if (typeof window !== "undefined" && !isRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({
      ignoreMobileResize: true,
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
    });
    isRegistered = true;
  }
  return { gsap, ScrollTrigger };
}

// Auto-register on client
if (typeof window !== "undefined") {
  registerGSAP();
}

export { gsap, ScrollTrigger };
