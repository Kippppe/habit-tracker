import { createClient } from "@/lib/supabase/server";
import { getTodayJST, shiftDate } from "@/utils/date";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import type { Habit } from "@/lib/types/database";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyRhythmPoint {
  date: string;
  displayDate: string;
  value: number;
  checked: boolean;
}

export interface MilestoneAchievement {
  milestone: number;
  milestoneKanji: string;
  habitId: string;
  habitName: string;
  habitColor: string;
  achievedDate: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

  const supabase = await createClient();
  const [{ data: habits }, { data: rawCheckIns }] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .neq("status", "archived")
      .order("created_at", { ascending: true }),
    supabase
      .from("check_ins")
      .select("habit_id, date")
      .gte("date", startDate)
      .lte("date", todayJST),
  ]);

  const allHabits = habits ?? [];
  const habitIds = new Set(allHabits.map((h) => h.id));
  // Rhythm + milestones reflect all non-archived habit data.
  const relevantCheckIns = (rawCheckIns ?? []).filter((ci) => habitIds.has(ci.habit_id));
  const activeCount = allHabits.filter((h) => h.status === "active").length;

  const byHabit = new Map<string, string[]>();
  for (const ci of relevantCheckIns) {
    byHabit.set(ci.habit_id, [...(byHabit.get(ci.habit_id) ?? []), ci.date]);
  }

  const dailyRhythm = buildDailyRhythm(relevantCheckIns, todayJST);
  const avgPerDay =
    dailyRhythm.length > 0
      ? Math.round((dailyRhythm.reduce((s, d) => s + d.value, 0) / 30) * 10) / 10
      : 0;

  const milestones = detectMilestones(allHabits, byHabit);

  return (
    <StatsDashboard
      dailyRhythm={dailyRhythm}
      avgPerDay={avgPerDay}
      milestones={milestones}
      goalLine={activeCount}
      hasHabits={allHabits.length > 0}
    />
  );
}
