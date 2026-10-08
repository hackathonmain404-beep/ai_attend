import type { Variants } from "framer-motion";

export const EASE_EXPONENTIAL = [0.16, 1, 0.3, 1] as const;
export const EASE_SOFT = [0.25, 0.1, 0.25, 1] as const;

export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: (customDelay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: EASE_EXPONENTIAL,
      delay: customDelay,
    },
  }),
};

export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (customDelay: number = 0) => ({
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: EASE_SOFT,
      delay: customDelay,
    },
  }),
};

export const scaleUpVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 16,
  },
  visible: (customDelay: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: EASE_EXPONENTIAL,
      delay: customDelay,
    },
  }),
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};
