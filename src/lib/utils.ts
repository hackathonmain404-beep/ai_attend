import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and twMerge to safely resolve conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a percentage value to one decimal place.
 */
export function formatPercentage(value: number): string {
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Returns color badge styling depending on attendance threshold.
 * >= 75%: Emerald (Safe)
 * 65% - 74.9%: Amber (At Risk)
 * < 65%: Crimson (Critical Danger)
 */
export function getAttendanceStatus(percentage: number): {
  label: string;
  variant: "emerald" | "amber" | "crimson";
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  if (percentage >= 75) {
    return {
      label: "Safe",
      variant: "emerald",
      bgClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      textClass: "text-emerald-400",
      borderClass: "border-emerald-500/30",
    };
  }
  if (percentage >= 65) {
    return {
      label: "At Risk",
      variant: "amber",
      bgClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      textClass: "text-amber-400",
      borderClass: "border-amber-500/30",
    };
  }
  return {
    label: "Critical",
    variant: "crimson",
    bgClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    textClass: "text-rose-400",
    borderClass: "border-rose-500/30",
  };
}
