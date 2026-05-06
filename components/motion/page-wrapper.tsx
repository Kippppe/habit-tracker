"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PAPER_SETTLE, DURATION } from "@/lib/motion";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.standard, ease: PAPER_SETTLE }}
    >
      {children}
    </motion.div>
  );
}
