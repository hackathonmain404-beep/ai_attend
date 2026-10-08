"use client";

import * as React from "react";
import { Compass, Sparkles } from "lucide-react";
import { DemoTourGuideModal } from "./DemoTourGuideModal";

export function DemoTourFloatingButton() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  // Shortcut listener: Shift + D opens the demo tour
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + D or Alt + D
      if ((e.shiftKey || e.altKey) && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating launcher hidden from normal dashboard UI per requirement 20; accessible via Shift+D / Alt+D */}
      <aside aria-label="Demo tour launcher" className="hidden" aria-hidden="true">
        <button
          onClick={() => setIsOpen(true)}
          tabIndex={-1}
          aria-label="Open Hackathon Judge Demo Tour (Shift+D)"
        >
          Judge Demo Tour
        </button>
      </aside>

      {/* Tour Guide Modal */}
      <DemoTourGuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
