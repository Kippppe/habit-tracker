"use client";

import { useAnimation, motion, useReducedMotion } from "framer-motion";
import { Hanko } from "./hanko";
import { PAPER_SETTLE } from "@/lib/motion";

export function LogoHorizontal({ size = 28 }: { size?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();

  function onHoverStart() {
    if (prefersReducedMotion) return;
    controls.start({
      rotate: [-2, -3, -2],
      transition: { duration: 0.4, ease: PAPER_SETTLE, times: [0, 0.5, 1] },
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        animate={controls}
        onHoverStart={onHoverStart}
        whileTap={{ scale: 0.95 }}
        style={{ rotate: -2 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <Hanko size={size} tilted={false} />
      </motion.div>
      <span
        className="font-serif font-normal text-foreground leading-none select-none"
        style={{ fontSize: Math.round(size * 0.75), letterSpacing: "-0.05em" }}
      >
        kipwork
      </span>
    </div>
  );
}

export function LogoStacked({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <LogoHorizontal size={size} />
      <p className="text-xs text-muted-foreground font-sans text-center max-w-xs leading-relaxed">
        Hospitality web, by someone who&apos;s worked the front desk.
      </p>
    </div>
  );
}
