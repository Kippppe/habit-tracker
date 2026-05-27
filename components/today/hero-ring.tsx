"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";
import { Hanko } from "@/components/brand/hanko";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { PAPER_SETTLE, DURATION } from "@/lib/motion";

interface Props {
  checked: number;
  total: number;
  streak: number;
  bestStreak: number;
}

const RADIUS = 108;
const STROKE = 12;
const CIRC = 2 * Math.PI * RADIUS;

export function HeroRing({ checked, total, streak, bestStreak }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const pct = total > 0 ? checked / total : 0;
  const dashOffset = CIRC * (1 - pct);
  const isComplete = total > 0 && checked >= total;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          習慣を追加して記録を始めましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="relative w-[240px] h-[240px] md:w-[320px] md:h-[320px]">
        <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden>
          <circle
            cx="120" cy="120" r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-foreground/8"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx="120" cy="120" r={RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: DURATION.ring, ease: PAPER_SETTLE }
            }
            transform="rotate(-90 120 120)"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="kansei"
                initial={prefersReducedMotion ? false : { scale: 1.6, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 200, damping: 18 }
                }
              >
                <Hanko size={104} text="完" tilted={false} weathered />
              </motion.div>
            ) : (
              <motion.div
                key="count"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="font-serif leading-none flex items-baseline gap-1">
                  <AnimatedNumber
                    value={checked}
                    duration={DURATION.hero}
                    className={`tabular-nums ${checked === 0 ? "text-foreground/30" : "text-primary"}`}
                    style={{ fontSize: "clamp(48px, 10vw, 72px)" }}
                  />
                  <span
                    className="tabular-nums text-foreground/25"
                    style={{ fontSize: "clamp(28px, 6vw, 44px)" }}
                  >
                    /{total}
                  </span>
                </div>
                <span className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  habits done
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {streak > 0 ? (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/20">
          <Flame size={13} className="text-primary" />
          <span className="font-mono tabular-nums text-sm font-medium text-primary">
            {streak}
          </span>
          <span className="text-xs text-muted-foreground">日連続</span>
        </div>
      ) : bestStreak > 0 ? (
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/20">
          <span className="text-[11px] text-muted-foreground">これまでの最高</span>
          <span className="font-serif tabular-nums text-lg leading-none font-medium text-primary">
            {bestStreak}
          </span>
          <span className="text-xs text-muted-foreground">日連続</span>
        </div>
      ) : null}
    </div>
  );
}
