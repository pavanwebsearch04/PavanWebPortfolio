// Shared motion tokens. Every animated component pulls its timing from here so
// the whole site moves with one rhythm.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // cubic-bezier(0.16, 1, 0.3, 1)
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const; // cubic-bezier(0.65, 0, 0.35, 1)

// durations in seconds
export const DUR = {
  micro: 0.2, // 150-250ms
  hover: 0.38, // 300-450ms
  reveal: 0.5, // 400-600ms
} as const;

// stagger between siblings, in seconds (60-90ms)
export const STAGGER = 0.075;

// reveal = fade + rise, used consistently
export const REVEAL_RISE = 16; // px

// same tokens for CSS / GSAP strings
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
export const EASE_IN_OUT_CSS = "cubic-bezier(0.65, 0, 0.35, 1)";

// accent: always the CSS variable, never a hard-coded hex in components
export const ACCENT = "var(--accent)";
