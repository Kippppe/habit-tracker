"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertCheckIn, deleteCheckIn } from "@/app/today/actions";
import { enqueueCheckIn, flushQueue } from "@/lib/offline-queue";
import { shiftDate } from "@/utils/date";
import { HeroRing } from "./hero-ring";
import { HabitGridV2 } from "./habit-grid-v2";
import { StatCards } from "./stat-cards";
import { CategoryCards } from "./category-cards";
import { AchievementOverlay } from "./achievement-overlay";
import type { Habit, CheckIn } from "@/lib/types/database";
import type { Achievement } from "@/lib/types/achievements";

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
    <h2 className="font-serif text-[26px] md:text-[30px] font-normal tracking-tight leading-tight mb-4">
      {children}
    </h2>
  );
}

// ── Derivation helpers ────────────────────────────────────────────────────────

const DAY_NAMES_JP = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
const DAY_ABBRS_JP = ["月", "火", "水", "木", "金", "土", "日"];

function getDayNameJP(dateStr: string): string {
  const dow = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return DAY_NAMES_JP[dow];
}

function getWeekDaysSoFar(today: string): string[] {
  const dow = new Date(today + "T00:00:00Z").getUTCDay();
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  return Array.from({ length: daysSinceMon + 1 }, (_, i) =>
    shiftDate(today, -(daysSinceMon - i))
  );
}

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

function deriveBestStreak(checkInSet: Set<string>): number {
  const dates = Array.from(new Set(Array.from(checkInSet).map(k => k.slice(-10)))).sort();
  if (dates.length === 0) return 0;
  let best = 1, current = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff =
      (new Date(dates[i] + "T00:00:00Z").getTime() -
        new Date(dates[i - 1] + "T00:00:00Z").getTime()) /
      86400000;
    if (diff === 1) { current++; best = Math.max(best, current); }
    else current = 1;
  }
  return best;
}

function deriveThisWeekPct(habits: Habit[], checkInSet: Set<string>, today: string): number {
  const days = getWeekDaysSoFar(today);
  const total = days.length * habits.length;
  if (total === 0) return 0;
  const done = days.reduce(
    (acc, d) => acc + habits.filter(h => checkInSet.has(`${h.id}:${d}`)).length,
    0
  );
  return Math.round((done / total) * 100);
}

function deriveWeekBars(habits: Habit[], checkInSet: Set<string>, today: string) {
  const dow = new Date(today + "T00:00:00Z").getUTCDay();
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  const monday = shiftDate(today, -daysSinceMon);
  return Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(monday, i);
    const isFuture = date > today;
    const pct =
      isFuture || habits.length === 0
        ? 0
        : Math.round(
            (habits.filter(h => checkInSet.has(`${h.id}:${date}`)).length /
              habits.length) *
              100
          );
    return { day: DAY_ABBRS_JP[i], pct, isToday: date === today };
  });
}

function deriveSparkline(habits: Habit[], checkInSet: Set<string>, today: string) {
  return Array.from({ length: 30 }, (_, i) => {
    const date = shiftDate(today, -(29 - i));
    const done = habits.filter(h => checkInSet.has(`${h.id}:${date}`)).length;
    return { date, pct: habits.length > 0 ? Math.round((done / habits.length) * 100) : 0 };
  });
}

function deriveCategoryStats(habits: Habit[], checkInSet: Set<string>, today: string) {
  const weekDays = getWeekDaysSoFar(today);
  const map = new Map<string, Habit[]>();
  habits.forEach(h => {
    const cat = h.category ?? "";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(h);
  });
  return Array.from(map.entries()).map(([category, catHabits]) => {
    const done = catHabits.filter(h => checkInSet.has(`${h.id}:${today}`)).length;
    const weekTotal = weekDays.length * catHabits.length;
    const weekDone = weekDays.reduce(
      (acc, d) =>
        acc + catHabits.filter(h => checkInSet.has(`${h.id}:${d}`)).length,
      0
    );
    return {
      category,
      done,
      total: catHabits.length,
      pct: catHabits.length > 0 ? Math.round((done / catHabits.length) * 100) : 0,
      weekPct: weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0,
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
  const [achievement, setAchievement] = useState<Achievement | null>(null);

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

  const streak = useMemo(
    () => deriveOverallStreak(checkInSet, todayJST),
    [checkInSet, todayJST]
  );
  const bestStreak = useMemo(() => deriveBestStreak(checkInSet), [checkInSet]);
  const thisWeekPct = useMemo(
    () => deriveThisWeekPct(habits, checkInSet, todayJST),
    [habits, checkInSet, todayJST]
  );
  const weekBars = useMemo(
    () => deriveWeekBars(habits, checkInSet, todayJST),
    [habits, checkInSet, todayJST]
  );
  const sparklineData = useMemo(
    () => deriveSparkline(habits, checkInSet, todayJST),
    [habits, checkInSet, todayJST]
  );
  const categoryStats = useMemo(
    () => deriveCategoryStats(habits, checkInSet, todayJST),
    [habits, checkInSet, todayJST]
  );
  const dayName = getDayNameJP(todayJST);

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
      if (!navigator.onLine) {
        await enqueueCheckIn(habitId, date, checked ? "delete" : "upsert");
        return null;
      }
      if (checked) { await deleteCheckIn(habitId, date); return null; }
      return await upsertCheckIn(habitId, date);
    },
    onSuccess: data => {
      if (data?.achievement) setAchievement(data.achievement);
    },
    onMutate: async ({ habitId, date, checked }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<CheckIn[]>(qKey);
      queryClient.setQueryData<CheckIn[]>(qKey, (old = []) => {
        if (checked) return old.filter(ci => !(ci.habit_id === habitId && ci.date === date));
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
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  function handleToggle(habitId: string, date: string, checked: boolean) {
    mutation.mutate({ habitId, date, checked });
  }

  return (
    <>
      <AchievementOverlay achievement={achievement} onClose={() => setAchievement(null)} />
      <div className="py-6 space-y-14">

        {/* 01 TODAY */}
        <section>
          <SectionLabel num="01" label="TODAY" />
          <SectionTitle>
            <em>{dayName}</em>の記録
          </SectionTitle>
          <HeroRing checked={todayChecked} total={habits.length} streak={streak} />
        </section>

        {habits.length > 0 && (
          <>
            {/* 02 THE GRID */}
            <section>
              <SectionLabel num="02" label="THE GRID" />
              <SectionTitle>
                習慣の<em>グリッド</em>
              </SectionTitle>
              <HabitGridV2
                habits={habits}
                checkInSet={checkInSet}
                todayJST={todayJST}
                onToggle={handleToggle}
              />
            </section>

            {/* 03 TRENDS */}
            <section>
              <SectionLabel num="03" label="TRENDS" />
              <SectionTitle>
                進捗の<em>傾向</em>
              </SectionTitle>
              <StatCards
                todayPct={todayPct}
                todayChecked={todayChecked}
                todayTotal={habits.length}
                streak={streak}
                bestStreak={bestStreak}
                thisWeekPct={thisWeekPct}
                weekBars={weekBars}
                sparklineData={sparklineData}
              />
            </section>

            {/* 04 BY CATEGORY */}
            {categoryStats.length > 0 && (
              <section>
                <SectionLabel num="04" label="BY CATEGORY" />
                <SectionTitle>
                  カテゴリ別の<em>状況</em>
                </SectionTitle>
                <CategoryCards stats={categoryStats} />
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
