"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Hanko } from "@/components/brand/hanko";
import { ACHIEVEMENT_META } from "@/lib/types/achievements";
import type { Achievement } from "@/lib/types/achievements";

interface Props {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementOverlay({ achievement, onClose }: Props) {
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!achievement) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [achievement, handleKeyDown]);

  const meta = achievement ? ACHIEVEMENT_META[achievement.kind] : null;

  async function handleShare() {
    if (!achievement || !meta) return;
    const params = new URLSearchParams({ kind: achievement.kind });
    if (achievement.habitName) params.set("habit", achievement.habitName);
    const ogPath = `/api/og/achievement?${params}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const blob = await fetch(ogPath).then((r) => r.blob());
        const file = new File([blob], "kipwork-achievement.png", { type: "image/png" });
        await navigator.share({ title: meta.title, files: [file] });
        return;
      } catch {
        try {
          await navigator.share({ title: meta.title, url: window.location.origin });
          return;
        } catch {}
      }
    }
    window.open(ogPath, "_blank");
  }

  return (
    <AnimatePresence>
      {achievement && meta && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-sumi/95 flex items-center justify-center"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-label={meta.title}
          >
            {/* Ink radial spread */}
            <motion.div
              key="ink"
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: 1, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.8, ease: "easeOut" }
              }
              className="absolute w-96 h-96 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(139,40,32,0.35) 0%, rgba(139,40,32,0.1) 40%, transparent 70%)",
              }}
            />

            {/* Content card — stop propagation so clicks inside don't close */}
            <motion.div
              key="card"
              initial={
                prefersReducedMotion
                  ? false
                  : { scale: 1.5, rotate: -8, opacity: 0 }
              }
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 220, damping: 20, delay: 0.1 }
              }
              className="relative z-10 flex flex-col items-center gap-6 px-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center rounded-full bg-kinari/10 text-kinari/50 hover:text-kinari transition-colors"
                aria-label="閉じる"
              >
                <X size={15} />
              </button>

              {/* Hanko stamp */}
              <motion.div
                initial={prefersReducedMotion ? false : { scale: 1.3, rotate: -8 }}
                animate={{ scale: 1, rotate: -2 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 200, damping: 18, delay: 0.2 }
                }
              >
                <Hanko size={140} text={meta.kanji} tilted={false} weathered />
              </motion.div>

              {/* Achievement text */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.4, delay: 0.35 }
                }
                className="flex flex-col items-center gap-2 text-center"
              >
                <h2 className="font-serif text-[28px] text-kinari leading-tight">
                  {meta.title}
                </h2>
                <p className="text-sm text-kinari/60">{meta.subtitle}</p>
                {achievement.habitName && (
                  <p className="text-shu-soft text-sm mt-1 font-mono">
                    {achievement.habitName}
                  </p>
                )}
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  prefersReducedMotion ? { duration: 0 } : { duration: 0.3, delay: 0.5 }
                }
                className="flex gap-3"
              >
                <button
                  onClick={handleShare}
                  className="px-5 py-2 rounded bg-shu text-kinari text-sm font-medium hover:bg-shu-soft transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded bg-kinari/10 text-kinari text-sm font-medium hover:bg-kinari/20 transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
