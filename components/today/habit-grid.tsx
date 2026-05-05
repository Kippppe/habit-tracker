"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getDayHeader } from "@/utils/date";
import { upsertCheckIn, deleteCheckIn } from "@/app/today/actions";
import { enqueueCheckIn, flushQueue } from "@/lib/offline-queue";
import type { Habit, CheckIn } from "@/lib/types/database";

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  habits: Habit[];
  initialCheckIns: CheckIn[];
  days: string[];
  todayJST: string;
  weekOffset: number;
}

// ── Query key factory ────────────────────────────────────────────────────────

function checkInsKey(start: string, end: string) {
  return ["check_ins", start, end] as const;
}

// ── DayCell ──────────────────────────────────────────────────────────────────

interface DayCellProps {
  habitId: string;
  habitName: string;
  date: string;
  checked: boolean;
  onToggle: (habitId: string, date: string, checked: boolean) => void;
}

function DayCell({ habitId, habitName, date, checked, onToggle }: DayCellProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileTap={prefersReducedMotion ? {} : { scale: 0.92 }}
      onClick={() => onToggle(habitId, date, checked)}
      aria-label={`${habitName} - ${date} - ${checked ? "完了" : "未完了"}`}
      aria-pressed={checked}
      className={cn(
        "w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
        checked
          ? "bg-amber-600 text-white"
          : "bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-transparent"
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            key="check"
            initial={prefersReducedMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? {} : { scale: 0.4, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
          >
            <Check size={16} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Section header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  category: string;
  habitIds: string[];
  days: string[];
  checkInSet: Set<string>;
}

function SectionHeader({
  category,
  habitIds,
  days,
  checkInSet,
}: SectionHeaderProps) {
  const total = habitIds.length * days.length;
  const done = habitIds.reduce(
    (acc, hid) =>
      acc + days.filter((d) => checkInSet.has(`${hid}:${d}`)).length,
    0
  );
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div role="heading" aria-level={2} className="flex items-center gap-2 pt-5 pb-1 sticky left-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {category || "未分類"}
      </span>
      <span className="text-xs text-muted-foreground" aria-hidden>—</span>
      <span className="text-xs text-muted-foreground">
        直近7日 <span className="tabular-nums font-medium">{pct}%</span>
      </span>
    </div>
  );
}

// ── HabitGrid ────────────────────────────────────────────────────────────────

export function HabitGrid({
  habits,
  initialCheckIns,
  days,
  todayJST,
  weekOffset,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      flushQueue().catch(console.error);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
  const startDate = days[0];
  const endDate = days[6];
  const qKey = checkInsKey(startDate, endDate);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: checkIns } = useQuery<CheckIn[]>({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetch(
        `/api/check-ins?start=${startDate}&end=${endDate}`
      );
      return res.json();
    },
    initialData: initialCheckIns,
  });

  // Fast lookup: "habitId:date" → true
  const checkInSet = new Set(
    (checkIns ?? []).map((ci) => `${ci.habit_id}:${ci.date}`)
  );

  // ── Mutation ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async ({
      habitId,
      date,
      checked,
    }: {
      habitId: string;
      date: string;
      checked: boolean;
    }) => {
      const action = checked ? "delete" : "upsert";
      if (!navigator.onLine) {
        await enqueueCheckIn(habitId, date, action);
        return;
      }
      if (checked) {
        await deleteCheckIn(habitId, date);
      } else {
        await upsertCheckIn(habitId, date);
      }
    },
    onMutate: async ({ habitId, date, checked }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<CheckIn[]>(qKey);

      queryClient.setQueryData<CheckIn[]>(qKey, (old = []) => {
        if (checked) {
          return old.filter(
            (ci) => !(ci.habit_id === habitId && ci.date === date)
          );
        }
        return [
          ...old,
          {
            id: `optimistic-${habitId}-${date}`,
            habit_id: habitId,
            user_id: "",
            date,
            note: null,
            created_at: new Date().toISOString(),
          },
        ];
      });

      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(qKey, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  function handleToggle(habitId: string, date: string, checked: boolean) {
    mutation.mutate({ habitId, date, checked });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function navigate(offset: number) {
    router.push(`/today?w=${offset}`);
  }

  // ── Group by category ──────────────────────────────────────────────────────
  const categories = Array.from(new Set(habits.map((h) => h.category ?? "")));

  // ── Empty state ────────────────────────────────────────────────────────────
  if (habits.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-muted-foreground">
          習慣を追加して始めましょう
        </p>
        <Link
          href="/habits"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus size={15} />
          習慣を追加
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-2">
      {/* ── Week navigation ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(weekOffset - 1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            aria-label="前週"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => navigate(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"
            aria-label="次週"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {weekOffset < 0 && (
          <button
            onClick={() => navigate(0)}
            className="text-xs font-medium rounded-full px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            今週へ
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="rounded-2xl bg-card shadow-sm p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Column headers */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-32 md:w-44 shrink-0" />
            {days.map((d) => {
              const { abbr, date } = getDayHeader(d);
              const isToday = d === todayJST;
              return (
                <div
                  key={d}
                  className={cn(
                    "w-10 md:w-12 text-center shrink-0",
                    isToday ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wide">{abbr}</div>
                  <div className="text-xs tabular-nums">{date}</div>
                </div>
              );
            })}
          </div>

          {/* Category sections */}
          {categories.map((cat) => {
            const group = habits.filter((h) => (h.category ?? "") === cat);
            return (
              <div key={cat}>
                <SectionHeader
                  category={cat}
                  habitIds={group.map((h) => h.id)}
                  days={days}
                  checkInSet={checkInSet}
                />
                {group.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-1.5 py-1"
                  >
                    {/* Habit name — sticky */}
                    <div
                      className="sticky left-0 z-10 bg-card w-32 md:w-44 shrink-0 pr-2 flex items-center gap-1.5"
                      style={{ paddingLeft: 0 }}
                    >
                      <div
                        className="w-0.5 self-stretch rounded-full shrink-0"
                        style={{
                          backgroundColor: habit.color ?? "#d97706",
                          minHeight: "2rem",
                        }}
                      />
                      <span className="text-sm font-medium truncate">
                        {habit.name}
                      </span>
                    </div>

                    {/* Cells */}
                    {days.map((date) => {
                      const checked = checkInSet.has(`${habit.id}:${date}`);
                      return (
                        <DayCell
                          key={date}
                          habitId={habit.id}
                          habitName={habit.name}
                          date={date}
                          checked={checked}
                          onToggle={handleToggle}
                        />
                      );
                    })}
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
