"use client";

import React, { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { PAPER_SETTLE } from "@/lib/motion";

interface Props {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({ value, duration = 0.9, suffix = "", className, style }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(display, value, {
      duration,
      ease: PAPER_SETTLE,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // intentionally omit `display` from deps — only re-animate when `value` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, prefersReducedMotion]);

  return (
    <span className={className} style={style}>
      {display}
      {suffix}
    </span>
  );
}
