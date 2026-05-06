// kipwork motion philosophy: "Paper, not rubber — Ink, not light"
// Settle without overshoot. No bounciness. No glow.

export const PAPER_SETTLE = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  micro: 0.15,
  standard: 0.3,
  hero: 0.6,
  ring: 1.2,
} as const;

export const SPRING_SETTLE = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 0.8,
} as const;

// Tap feedback: compress then settle — no large overshoot
export const TAP_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 30,
} as const;
