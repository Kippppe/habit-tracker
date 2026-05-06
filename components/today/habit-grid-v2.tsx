"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TAP_SPRING, DURATION } from "@/lib/motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { shiftDate } from "@/utils/date";
import type { Habit } from "@/lib/types/database";

type Period = 4 | 12 | 26 | 52;
const PERIODS: Period[] = [4, 12, 26, 52];
const DAY_ABBRS = ["月", "火", "水", "木", "金", "土", "日"];
const GAP = 2;

interface Props {
  habits: Habit[];
  checkInSet: Set<string>;
  todayJST: string;
  onToggle: (habitId: string, date: string, checked: boolean) => void;
}

function cellSize(p: Period): number {
  if (p <= 4) return 22;
  if (p <= 12) return 16;
  if (p <= 26) return 12;
  return 9;
}

function buildDays(todayJST: string, weeks: number): string[] {
  return Array.from({ length: weeks * 7 }, (_, i) =>
    shiftDate(todayJST, -(weeks * 7 - 1 - i))
  );
}

function getDayIdx(dateStr: string): number {
  const dow = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return dow === 0 ? 6 : dow - 1;
}

function formatMMDD(dateStr: string): string {
  const m = parseInt(dateStr.slice(5, 7), 10);
  const d = parseInt(dateStr.slice(8, 10), 10);
  return `${m}/${d}`;
}

interface DayCellProps {
  habitId: string;
  habitName: string;
  date: string;
  isToday: boolean;
  isFuture: boolean;
  checked: boolean;
  size: number;
  onToggle: (habitId: string, date: string, checked: boolean) => void;
}

function DayCell({ habitId, habitName, date, isToday, isFuture, checked, size, onToggle }: DayCellProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isFuture) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-[2px] bg-kinari-soft dark:bg-sumi-soft opacity-20 shrink-0"
      />
    );
  }

  return (
    <motion.button
      whileTap={prefersReducedMotion ? {} : { scale: 0.88 }}
      transition={TAP_SPRING}
      onClick={() => onToggle(habitId, date, checked)}
      aria-label={`${habitName} ${date} ${checked ? "完了" : "未完了"}`}
      aria-pressed={checked}
      style={{ width: size, height: size }}
      className={cn(
        "rounded-[2px] shrink-0 flex items-center justify-center relative transition-colors",
        checked
          ? "bg-shu dark:bg-shu-soft text-kinari"
          : isToday
          ? "bg-kinari-soft dark:bg-sumi-soft border border-primary/40 text-transparent"
          : "bg-kinari-soft dark:bg-sumi-soft border border-line/40 dark:border-sumi-soft/25 text-transparent"
      )}
    >
      {isToday && !checked && (
        <motion.div
          className="absolute inset-0 rounded-[2px] ring-1 ring-primary/30"
          animate={prefersReducedMotion ? {} : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <AnimatePresence>
        {checked && size >= 12 && (
          <motion.div
            key="check"
            initial={prefersReducedMotion ? false : { scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? {} : { scale: 0.3, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : DURATION.micro }}
          >
            <Check size={Math.max(5, size - 8)} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function HabitGridV2({ habits, checkInSet, todayJST, onToggle }: Props) {
  const [period, setPeriod] = useState<Period>(4);
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = buildDays(todayJST, period);
  const size = cellSize(period);
  const weekWidth = 7 * size + 6 * GAP;
  const categories = Array.from(new Set(habits.map(h => h.category ?? "")));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [period]);

  return (
    <div className="space-y-3">
      {/* Period switcher */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "text-[11px] font-mono px-2.5 py-1 rounded transition-colors",
              period === p
                ? "bg-shu text-kinari"
                : "bg-kinari-soft dark:bg-sumi-soft text-muted-foreground hover:bg-shu/10"
            )}
          >
            {p}W
          </button>
        ))}
      </div>

      <div className="rounded-md bg-card border border-border shadow-sm overflow-hidden">
        <div className="relative">
          {/* Left gradient fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent z-10" />

          <div
            ref={scrollRef}
            className="overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="min-w-max p-3">
              {/* Header */}
              <div className="flex mb-1">
                {/* Spacer aligns with habit name column */}
                <div className="w-28 md:w-36 shrink-0 pr-2" />

                <div>
                  {/* Week labels */}
                  <div className="flex gap-[2px] mb-0.5">
                    {Array.from({ length: period }, (_, wi) => (
                      <div
                        key={wi}
                        className="shrink-0 overflow-hidden"
                        style={{ width: weekWidth }}
                      >
                        <span className="text-[9px] font-mono text-muted-foreground/35 uppercase tracking-wide">
                          W{wi + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Day abbreviations + dates */}
                  <div className="flex gap-[2px]">
                    {days.map((date, i) => {
                      const isToday = date === todayJST;
                      const dayIdx = getDayIdx(date);
                      return (
                        <div
                          key={date}
                          className="flex flex-col items-center shrink-0"
                          style={{ width: size }}
                        >
                          {size >= 14 && (
                            <span
                              className={cn(
                                "text-[8px] font-mono leading-none",
                                isToday
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground/40"
                              )}
                            >
                              {DAY_ABBRS[dayIdx]}
                            </span>
                          )}
                          {size >= 16 && period <= 12 && (i % 7 === 0 || isToday) && (
                            <span
                              className={cn(
                                "text-[7px] font-mono tabular-nums leading-none mt-0.5",
                                isToday ? "text-primary" : "text-muted-foreground/25"
                              )}
                            >
                              {formatMMDD(date)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Habit rows by category */}
              <div className="space-y-3 mt-2">
                {categories.map(cat => {
                  const group = habits.filter(h => (h.category ?? "") === cat);
                  return (
                    <div key={cat} className="space-y-1">
                      {cat && (
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          {cat}
                        </p>
                      )}
                      {group.map(habit => (
                        <div key={habit.id} className="flex items-center gap-[2px]">
                          <div className="w-28 md:w-36 shrink-0 pr-2 flex items-center gap-1.5">
                            <div
                              className="w-0.5 self-stretch rounded-full shrink-0"
                              style={{
                                backgroundColor: habit.color ?? "#8b2820",
                                minHeight: "1rem",
                              }}
                            />
                            <span className="text-xs truncate">{habit.name}</span>
                          </div>
                          <div className="flex gap-[2px]">
                            {days.map(date => (
                              <DayCell
                                key={date}
                                habitId={habit.id}
                                habitName={habit.name}
                                date={date}
                                checked={checkInSet.has(`${habit.id}:${date}`)}
                                isFuture={date > todayJST}
                                isToday={date === todayJST}
                                size={size}
                                onToggle={onToggle}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
