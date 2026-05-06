"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import { Hanko } from "@/components/brand/hanko";

interface Props {
  checked: number;
  total: number;
  overallStreak: number;
}

const RADIUS = 96;
const STROKE = 14;
const CIRC = 2 * Math.PI * RADIUS;

export function TodayHeroCard({ checked, total, overallStreak }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const pct = total > 0 ? checked / total : 0;
  const dashOffset = CIRC * (1 - pct);
  const isComplete = total > 0 && checked >= total;

  return (
    <div className="flex flex-col items-center gap-5 py-8">
      <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px]">
        <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden>
          {/* Track */}
          <circle
            cx="120" cy="120" r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-foreground/10"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <motion.circle
            cx="120" cy="120" r={RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
            transform="rotate(-90 120 120)"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="kansei"
                initial={prefersReducedMotion ? false : { scale: 1.6, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 18 }}
              >
                <Hanko size={88} text="完" tilted={false} weathered />
              </motion.div>
            ) : (
              <motion.div
                key="count"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="font-serif leading-none flex items-baseline gap-0.5">
                  <span
                    className="tabular-nums text-primary"
                    style={{ fontSize: "clamp(40px, 8vw, 56px)" }}
                  >
                    {checked}
                  </span>
                  <span
                    className="tabular-nums text-foreground/25"
                    style={{ fontSize: "clamp(22px, 4vw, 32px)" }}
                  >
                    /{total}
                  </span>
                </div>
                <span className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  habits
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {overallStreak > 0 && (
        <div className="flex items-center gap-1.5">
          <Flame size={15} className="text-primary" />
          <span className="font-mono tabular-nums text-sm font-medium">{overallStreak}</span>
          <span className="text-xs text-muted-foreground">日連続</span>
        </div>
      )}
    </div>
  );
}
