import { parseISO, format, startOfWeek, startOfMonth, differenceInDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getTodayJST, shiftDate } from "@/utils/date";
import { getStreak } from "@/utils/streak";
import { StatsClient } from "@/components/stats/stats-client";
import type { Habit } from "@/lib/types/database";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HabitStat {
  id: string;
  name: string;
  category: string | null;
  color: string | null;
  thisWeekPct: number;
  thisMonthPct: number;
  allTimePct: number;
  streak: number;
}

export interface Summary {
  activeCount: number;
  thisWeekOverallPct: number;
  totalCheckIns: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(actual: number, expected: number): number {
  if (expected <= 0) return 0;
  return Math.min(100, Math.round((actual / expected) * 100));
}

function buildHabitStat(
  habit: Habit,
  dates: string[],
  todayJST: string,
  thisWeekStart: string,
  thisMonthStart: string
): HabitStat {
  const dateSet = new Set(dates);

  // 今週: check-ins / target (既に今週分だけフィルタ済み)
  const thisWeekCount = dates.filter((d) => d >= thisWeekStart).length;
  const thisWeekPct = pct(thisWeekCount, habit.target_per_week);

  // 今月: elapsed days / 7 × target_per_week = expected
  const daysElapsedThisMonth =
    differenceInDays(parseISO(todayJST), parseISO(thisMonthStart)) + 1;
  const expectedMonthly = (habit.target_per_week / 7) * daysElapsedThisMonth;
  const thisMonthCount = dates.filter((d) => d >= thisMonthStart).length;
  const thisMonthPct = pct(thisMonthCount, expectedMonthly);

  // 全期間: 365日のうち elapsed days / 7 × target = expected
  const createdDate = habit.created_at.slice(0, 10);
  const startDate = dates.length > 0 ? dates[0] : todayJST;
  const firstDate = createdDate < startDate ? startDate : createdDate;
  const totalDays = Math.max(
    1,
    differenceInDays(parseISO(todayJST), parseISO(firstDate)) + 1
  );
  const expectedAllTime = (habit.target_per_week / 7) * totalDays;
  const allTimePct = pct(dates.length, expectedAllTime);

  const streak = getStreak(habit, dates, todayJST);

  return {
    id: habit.id,
    name: habit.name,
    category: habit.category,
    color: habit.color,
    thisWeekPct,
    thisMonthPct,
    allTimePct,
    streak,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const todayJST = getTodayJST();
  const startDate = shiftDate(todayJST, -364);

  // 今週月曜、今月1日
  const thisWeekStart = format(
    startOfWeek(parseISO(todayJST), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const thisMonthStart = format(startOfMonth(parseISO(todayJST)), "yyyy-MM-dd");

  const supabase = await createClient();
  const [{ data: habits }, { data: rawCheckIns }] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("check_ins")
      .select("habit_id, date")
      .gte("date", startDate)
      .lte("date", todayJST),
  ]);

  const allHabits = habits ?? [];
  const allCheckIns = rawCheckIns ?? [];

  // habit_id → dates[]
  const byHabit = new Map<string, string[]>();
  for (const ci of allCheckIns) {
    const arr = byHabit.get(ci.habit_id) ?? [];
    arr.push(ci.date);
    byHabit.set(ci.habit_id, arr);
  }

  const habitStats: HabitStat[] = allHabits.map((habit) =>
    buildHabitStat(
      habit,
      byHabit.get(habit.id) ?? [],
      todayJST,
      thisWeekStart,
      thisMonthStart
    )
  );

  // Summary
  const summary: Summary = {
    activeCount: allHabits.length,
    thisWeekOverallPct:
      habitStats.length === 0
        ? 0
        : Math.round(
            habitStats.reduce((s, h) => s + h.thisWeekPct, 0) /
              habitStats.length
          ),
    totalCheckIns: allCheckIns.length,
  };

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">統計</h1>
      <StatsClient habitStats={habitStats} summary={summary} />
    </div>
  );
}
