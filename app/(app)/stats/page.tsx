import { parseISO, format, startOfWeek, startOfMonth, differenceInDays, addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getTodayJST, shiftDate } from "@/utils/date";
import { getStreak } from "@/utils/streak";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import type { Habit } from "@/lib/types/database";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HabitStat {
  id: string;
  name: string;
  category: string | null;
  color: string | null;
  streak: number;
  thisWeekPct: number;
  thisMonthPct: number;
  allTimePct: number;
}

export interface DailyRhythmPoint {
  date: string;
  displayDate: string;
  value: number;
  checked: boolean;
}

export interface CategoryStat {
  category: string;
  color: string;
  thisMonthPct: number;
  habitCount: number;
}

export interface MilestoneAchievement {
  milestone: number;
  milestoneKanji: string;
  habitId: string;
  habitName: string;
  habitColor: string;
  achievedDate: string;
}

export interface HeroData {
  activeCount: number;
  thisWeekOverallPct: number;
  daysTracked: number;
  trackingStartDate: string;
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
  const thisWeekCount = dates.filter((d) => d >= thisWeekStart).length;
  const thisWeekPct = pct(thisWeekCount, habit.target_per_week);

  const daysElapsedThisMonth =
    differenceInDays(parseISO(todayJST), parseISO(thisMonthStart)) + 1;
  const thisMonthCount = dates.filter((d) => d >= thisMonthStart).length;
  const thisMonthPct = pct(thisMonthCount, (habit.target_per_week / 7) * daysElapsedThisMonth);

  const createdDate = habit.created_at.slice(0, 10);
  const firstDate = createdDate > dates[0] ? createdDate : (dates[0] ?? todayJST);
  const totalDays = Math.max(1, differenceInDays(parseISO(todayJST), parseISO(firstDate)) + 1);
  const allTimePct = pct(dates.length, (habit.target_per_week / 7) * totalDays);

  return {
    id: habit.id,
    name: habit.name,
    category: habit.category,
    color: habit.color,
    streak: getStreak(habit, dates, todayJST),
    thisWeekPct,
    thisMonthPct,
    allTimePct,
  };
}

function buildDailyRhythm(
  checkIns: { habit_id: string; date: string }[],
  todayJST: string
): DailyRhythmPoint[] {
  const countByDay = new Map<string, number>();
  for (const ci of checkIns) countByDay.set(ci.date, (countByDay.get(ci.date) ?? 0) + 1);

  return Array.from({ length: 30 }, (_, i) => {
    const date = shiftDate(todayJST, -(29 - i));
    const m = parseInt(date.slice(5, 7), 10);
    const d = parseInt(date.slice(8, 10), 10);
    const value = countByDay.get(date) ?? 0;
    return { date, displayDate: `${m}/${d}`, value, checked: value > 0 };
  });
}

function buildCategoryStats(
  habits: Habit[],
  habitStats: HabitStat[]
): CategoryStat[] {
  const SHU_SHADES = ["#8b2820", "#b8463a", "#c45f50", "#d07860", "#9c3830", "#a84848"];
  const statById = new Map(habitStats.map((h) => [h.id, h]));
  const catMap = new Map<string, Habit[]>();
  for (const h of habits) {
    const cat = h.category ?? "";
    catMap.set(cat, [...(catMap.get(cat) ?? []), h]);
  }

  return Array.from(catMap.entries()).map(([category, catHabits], idx) => {
    const monthPcts = catHabits.map((h) => statById.get(h.id)?.thisMonthPct ?? 0);
    const avgMonthPct = Math.round(monthPcts.reduce((s, v) => s + v, 0) / catHabits.length);
    return {
      category: category || "未分類",
      color: catHabits[0]?.color ?? SHU_SHADES[idx % SHU_SHADES.length],
      thisMonthPct: avgMonthPct,
      habitCount: catHabits.length,
    };
  });
}

const MILESTONE_MAP: Record<number, string> = { 7: "七", 30: "月", 100: "百", 365: "年" };

function detectMilestones(
  habits: Habit[],
  byHabit: Map<string, string[]>
): MilestoneAchievement[] {
  const thresholds = [7, 30, 100, 365];
  const results: MilestoneAchievement[] = [];

  for (const habit of habits) {
    const dates = [...(byHabit.get(habit.id) ?? [])].sort();
    if (dates.length === 0) continue;

    const achieved = new Set<number>();
    let runStart = 0;

    for (let i = 1; i <= dates.length; i++) {
      const isEnd =
        i === dates.length ||
        shiftDate(dates[i - 1], 1) !== dates[i];

      if (isEnd) {
        const runLen = i - runStart;
        for (const m of thresholds) {
          if (runLen >= m && !achieved.has(m)) {
            achieved.add(m);
            results.push({
              milestone: m,
              milestoneKanji: MILESTONE_MAP[m] ?? String(m),
              habitId: habit.id,
              habitName: habit.name,
              habitColor: habit.color ?? "#8b2820",
              achievedDate: dates[runStart + m - 1],
            });
          }
        }
        runStart = i;
      }
    }
  }

  return results.sort((a, b) => b.achievedDate.localeCompare(a.achievedDate));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const todayJST = getTodayJST();
  const startDate = shiftDate(todayJST, -364);

  const thisWeekStart = format(
    startOfWeek(parseISO(todayJST), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const thisMonthStart = format(startOfMonth(parseISO(todayJST)), "yyyy-MM-dd");

  const supabase = await createClient();
  const [{ data: habits }, { data: rawCheckIns }] = await Promise.all([
    supabase.from("habits").select("*").is("archived_at", null).order("created_at", { ascending: true }),
    supabase.from("check_ins").select("habit_id, date").gte("date", startDate).lte("date", todayJST),
  ]);

  const allHabits = habits ?? [];
  const allCheckIns = rawCheckIns ?? [];

  const byHabit = new Map<string, string[]>();
  for (const ci of allCheckIns) {
    byHabit.set(ci.habit_id, [...(byHabit.get(ci.habit_id) ?? []), ci.date]);
  }

  const habitStats = allHabits.map((h) =>
    buildHabitStat(h, byHabit.get(h.id) ?? [], todayJST, thisWeekStart, thisMonthStart)
  );

  const thisWeekOverallPct =
    habitStats.length === 0
      ? 0
      : Math.round(habitStats.reduce((s, h) => s + h.thisWeekPct, 0) / habitStats.length);

  const earliestHabit = allHabits[0]?.created_at.slice(0, 10) ?? todayJST;
  const daysTracked = differenceInDays(parseISO(todayJST), parseISO(earliestHabit)) + 1;

  const dailyRhythm = buildDailyRhythm(allCheckIns, todayJST);
  const avgPerDay =
    dailyRhythm.length > 0
      ? Math.round((dailyRhythm.reduce((s, d) => s + d.value, 0) / 30) * 10) / 10
      : 0;

  const categoryStats = buildCategoryStats(allHabits, habitStats);
  const milestones = detectMilestones(allHabits, byHabit);

  const hero: HeroData = {
    activeCount: allHabits.length,
    thisWeekOverallPct,
    daysTracked,
    trackingStartDate: earliestHabit,
  };

  return (
    <StatsDashboard
      hero={hero}
      habitStats={habitStats}
      dailyRhythm={dailyRhythm}
      avgPerDay={avgPerDay}
      categoryStats={categoryStats}
      milestones={milestones}
      totalHabitCount={allHabits.length}
    />
  );
}
