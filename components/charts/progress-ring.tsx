"use client";

import { motion, useReducedMotion } from "framer-motion";

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

export function ProgressRing({ percent, size = 64, strokeWidth = 6, animated = true }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const cx = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* Track */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="currentColor"
        className="text-foreground/10"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <motion.circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: animated ? circ : offset }}
        animate={{ strokeDashoffset: offset }}
        transition={
          prefersReducedMotion || !animated
            ? { duration: 0 }
            : { duration: 1.2, ease: "easeOut" }
        }
        transform={`rotate(-90 ${cx} ${cx})`}
      />
    </svg>
  );
}
