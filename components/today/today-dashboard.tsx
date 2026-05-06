"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertCheckIn, deleteCheckIn } from "@/app/today/actions";
import { enqueueCheckIn, flushQueue } from "@/lib/offline-queue";
import { shiftDate } from "@/utils/date";
import { TodayHeroCard } from "./today-hero-card";
import { WeekGridSection } from "./week-grid-section";
import { DailyStatsRow } from "./daily-stats-row";
import { CategoryBreakdown } from "./category-breakdown";
import type { Habit, CheckIn } from "@/lib/types/database";

// ── Section chrome ────────────────────────────────────────────────────────────

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <p className="font-mono text-[11px] text-shu uppercase tracking-[0.15em] mb-2">
      {num} / {label}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[26px] md:text-[30px] font-normal tracking-tight leading-tight mb-1">
      {children}
    </h2>
  );
}

// ── Stats derivation ──────────────────────────────────────────────────────────

function deriveOverallStreak(checkInSet: Set<string>, today: string): number {
  const dates = new Set<string>();
  checkInSet.forEach(key => dates.add(key.slice(-10)));
  const yesterday = shiftDate(today, -1);
  const start = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null;
  if (!start) return 0;
  let count = 0;
  let d = start;
  while (dates.has(d)) { count++; d = shiftDate(d, -1); }
  return count;
}

function deriveThisWeekPct(habits: Habit[], checkInSet: Set<string>, today: string): number {
  const todayD = new Date(today + "T00:00:00Z");
  const dow = todayD.getUTCDay();
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  const days = Array.from({ length: daysSinceMon + 1 }, (_, i) =>
    shiftDate(today, -(daysSinceMon - i))
  );
  const total = days.length * habits.length;
  if (total === 0) return 0;
  const done = days.reduce(
    (acc, d) => acc + habits.filter(h => checkInSet.has(`${h.id}:${d}`)).length,
    0
  );
  return Math.round((done / total) * 100);
}

function deriveSparkline(habits: Habit[], checkInSet: Set<string>, today: string) {
  return Array.from({ length: 30 }, (_, i) => {
    const date = shiftDate(today, -(29 - i));
    const done = habits.filter(h => checkInSet.has(`${h.id}:${date}`)).length;
    return { date, pct: habits.length > 0 ? Math.round((done / habits.length) * 100) : 0 };
  });
}

function deriveCategoryStats(habits: Habit[], checkInSet: Set<string>, today: string) {
  const map = new Map<string, Habit[]>();
  habits.forEach(h => {
    const cat = h.category ?? "";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(h);
  });
  return Array.from(map.entries()).map(([category, catHabits]) => {
    const done = catHabits.filter(h => checkInSet.has(`${h.id}:${today}`)).length;
    return {
      category,
      done,
      total: catHabits.length,
      pct: catHabits.length > 0 ? Math.round((done / catHabits.length) * 100) : 0,
      color: catHabits[0]?.color ?? "#8b2820",
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  habits: Habit[];
  initialCheckIns: CheckIn[];
  todayJST: string;
  since: string;
}

export function TodayDashboard({ habits, initialCheckIns, todayJST, since }: Props) {
  const queryClient = useQueryClient();
  const qKey = ["check_ins", since, todayJST] as const;

  const { data: checkIns = initialCheckIns } = useQuery<CheckIn[]>({
    queryKey: qKey,
    queryFn: async () => {
      const res = await fetch(`/api/check-ins?start=${since}&end=${todayJST}`);
      return res.json();
    },
    initialData: initialCheckIns,
  });

  useEffect(() => {
    const flush = () => flushQueue().catch(console.error);
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  const checkInSet = useMemo(
    () => new Set(checkIns.map(ci => `${ci.habit_id}:${ci.date}`)),
    [checkIns]
  );

  const todayChecked = useMemo(
    () => habits.filter(h => checkInSet.has(`${h.id}:${todayJST}`)).length,
    [habits, checkInSet, todayJST]
  );

  const todayPct = habits.length > 0 ? Math.round((todayChecked / habits.length) * 100) : 0;
  const overallStreak = useMemo(() => deriveOverallStreak(checkInSet, todayJST), [checkInSet, todayJST]);
  const thisWeekPct = useMemo(() => deriveThisWeekPct(habits, checkInSet, todayJST), [habits, checkInSet, todayJST]);
  const sparklineData = useMemo(() => deriveSparkline(habits, checkInSet, todayJST), [habits, checkInSet, todayJST]);
  const categoryStats = useMemo(() => deriveCategoryStats(habits, checkInSet, todayJST), [habits, checkInSet, todayJST]);

  const mutation = useMutation({
    mutationFn: async ({ habitId, date, checked }: { habitId: string; date: string; checked: boolean }) => {
      const action = checked ? "delete" : "upsert";
      if (!navigator.onLine) {
        await enqueueCheckIn(habitId, date, action);
        return;
      }
      if (checked) await deleteCheckIn(habitId, date);
      else await upsertCheckIn(habitId, date);
    },
    onMutate: async ({ habitId, date, checked }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<CheckIn[]>(qKey);
      queryClient.setQueryData<CheckIn[]>(qKey, (old = []) => {
        if (checked) return old.filter(ci => !(ci.habit_id === habitId && ci.date === date));
        return [...old, {
          id: `optimistic-${habitId}-${date}`,
          habit_id: habitId,
          user_id: "",
          date,
          note: null,
          created_at: new Date().toISOString(),
        }];
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  function handleToggle(habitId: string, date: string, checked: boolean) {
    mutation.mutate({ habitId, date, checked });
  }

  return (
    <div className="py-8 space-y-20">
      {/* 01 TODAY */}
      <section>
        <SectionLabel num="01" label="TODAY" />
        <SectionTitle>How are you doing <em>today</em>?</SectionTitle>
        <TodayHeroCard
          checked={todayChecked}
          total={habits.length}
          overallStreak={overallStreak}
        />
      </section>

      {/* 02 THE GRID */}
      <section>
        <SectionLabel num="02" label="THE GRID" />
        <SectionTitle>Your habits, <em>at a glance</em></SectionTitle>
        {habits.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8">まだ習慣が登録されていません。</p>
        ) : (
          <WeekGridSection
            habits={habits}
            checkInSet={checkInSet}
            todayJST={todayJST}
            onToggle={handleToggle}
          />
        )}
      </section>

      {/* 03 TRENDS */}
      <section>
        <SectionLabel num="03" label="TRENDS" />
        <SectionTitle>Patterns and <em>progress</em></SectionTitle>
        <DailyStatsRow
          todayPct={todayPct}
          todayChecked={todayChecked}
          todayTotal={habits.length}
          streak={overallStreak}
          thisWeekPct={thisWeekPct}
          sparklineData={sparklineData}
        />
        <CategoryBreakdown stats={categoryStats} />
      </section>
    </div>
  );
}
