"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { shiftDate, getDayHeader } from "@/utils/date";
import type { Habit } from "@/lib/types/database";

type Period = 4 | 12 | 26 | 52;

interface Props {
  habits: Habit[];
  checkInSet: Set<string>;
  todayJST: string;
  onToggle: (habitId: string, date: string, checked: boolean) => void;
}

function buildDays(todayJST: string, weeks: number): string[] {
  return Array.from({ length: weeks * 7 }, (_, i) =>
    shiftDate(todayJST, -(weeks * 7 - 1 - i))
  );
}

interface DayCellProps {
  habitId: string;
  habitName: string;
  date: string;
  checked: boolean;
  isFuture: boolean;
  onToggle: (habitId: string, date: string, checked: boolean) => void;
}

function DayCell({ habitId, habitName, date, checked, isFuture, onToggle }: DayCellProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isFuture) {
    return (
      <div className="w-5 h-5 rounded-[2px] bg-kinari-soft dark:bg-sumi-soft opacity-30 shrink-0" />
    );
  }

  return (
    <motion.button
      whileTap={prefersReducedMotion ? {} : { scale: 0.85 }}
      onClick={() => onToggle(habitId, date, checked)}
      aria-label={`${habitName} - ${date} - ${checked ? "完了" : "未完了"}`}
      aria-pressed={checked}
      className={cn(
        "w-5 h-5 rounded-[2px] shrink-0 flex items-center justify-center transition-colors",
        checked
          ? "bg-shu dark:bg-shu-soft text-kinari"
          : "bg-kinari-soft dark:bg-sumi-soft border border-line dark:border-sumi-soft/50 text-transparent"
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            key="check"
            initial={prefersReducedMotion ? false : { scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? {} : { scale: 0.3, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
          >
            <Check size={10} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function WeekGridSection({ habits, checkInSet, todayJST, onToggle }: Props) {
  const [period, setPeriod] = useState<Period>(4);
  const days = buildDays(todayJST, period);

  const categories = Array.from(new Set(habits.map((h) => h.category ?? "")));

  const PERIODS: Period[] = [4, 12, 26, 52];

  return (
    <div className="space-y-3">
      {/* Period switcher */}
      <div className="flex gap-1">
        {PERIODS.map((p) => (
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

      {/* Grid */}
      <div className="rounded-md bg-card border border-border shadow-sm p-4 overflow-x-auto">
        <div className="min-w-max space-y-4">
          {categories.map((cat) => {
            const group = habits.filter((h) => (h.category ?? "") === cat);
            return (
              <div key={cat} className="space-y-1.5">
                {cat && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </p>
                )}
                {group.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-1">
                    {/* Habit name */}
                    <div className="w-28 md:w-36 shrink-0 pr-2 flex items-center gap-1.5">
                      <div
                        className="w-0.5 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: habit.color ?? "#8b2820", minHeight: "1.25rem" }}
                      />
                      <span className="text-xs truncate">{habit.name}</span>
                    </div>
                    {/* Day cells */}
                    <div className="flex gap-0.5">
                      {days.map((date) => {
                        const checked = checkInSet.has(`${habit.id}:${date}`);
                        const isFuture = date > todayJST;
                        return (
                          <DayCell
                            key={date}
                            habitId={habit.id}
                            habitName={habit.name}
                            date={date}
                            checked={checked}
                            isFuture={isFuture}
                            onToggle={onToggle}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
