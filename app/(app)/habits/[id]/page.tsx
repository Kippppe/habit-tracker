import { notFound } from "next/navigation";
import {
  parseISO,
  format,
  addDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  differenceInDays,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getTodayJST, shiftDate } from "@/utils/date";
import { getStreak } from "@/utils/streak";
import { HabitHeader } from "@/components/habits/detail/habit-header";
import { StatsRow } from "@/components/habits/detail/stats-row";
import { YearHeatmap } from "@/components/habits/detail/year-heatmap";
import { Last30DaysChart } from "@/components/habits/detail/last30-days-chart";
import type { Habit } from "@/lib/types/database";

// ── Data helpers ─────────────────────────────────────────────────────────────

export interface HeatmapCell {
  date: string;
  intensity: 0 | 1 | 2 | 3;
  checked: boolean;
  isFuture: boolean;
}

export interface HeatmapWeek {
  monthLabel: string | null;
  cells: HeatmapCell[]; // Mon → Sun
}

export interface ChartPoint {
  date: string;
  displayDate: string;
  checked: boolean;
}

export interface HabitStats {
  streak: number;
  last7Pct: number;
  last30Pct: number;
  allTimePct: number;
}

function buildHeatmap(
  checkInSet: Set<string>,
  targetPerWeek: number,
  todayJST: string
): HeatmapWeek[] {
  const today = parseISO(todayJST);
  const currentWeekMon = startOfWeek(today, { weekStartsOn: 1 });
  const startMon = subWeeks(currentWeekMon, 52);

  return Array.from({ length: 53 }, (_, w) => {
    const weekMon = addWeeks(startMon, w);
    const days = Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekMon, i), "yyyy-MM-dd")
    );

    // Count check-ins for days up to today only
    const weekCount = days.filter(
      (d) => d <= todayJST && checkInSet.has(d)
    ).length;
    const pct = weekCount / Math.max(targetPerWeek, 1);
    const intensity: 0 | 1 | 2 | 3 =
      pct === 0 ? 0 : pct <= 0.33 ? 1 : pct <= 0.66 ? 2 : 3;

    const firstDayMonthStr = days[0].slice(5, 7);
    const prevMonthStr = w > 0 ? format(addWeeks(startMon, w - 1), "MM") : null;
    const monthLabel =
      w === 0 || firstDayMonthStr !== prevMonthStr
        ? `${parseInt(firstDayMonthStr, 10)}月`
        : null;

    return {
      monthLabel,
      cells: days.map((date) => ({
        date,
        intensity,
        checked: checkInSet.has(date),
        isFuture: date > todayJST,
      })),
    };
  });
}

function buildChartData(
  checkInSet: Set<string>,
  todayJST: string
): ChartPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = shiftDate(todayJST, -(29 - i));
    const m = parseInt(date.slice(5, 7), 10);
    const d = parseInt(date.slice(8, 10), 10);
    return { date, displayDate: `${m}/${d}`, checked: checkInSet.has(date) };
  });
}

function buildStats(
  checkInDates: string[],
  habit: Habit,
  todayJST: string
): HabitStats {
  const checkInSet = new Set(checkInDates);

  const streak = getStreak(habit, checkInDates, todayJST);

  const last7 = Array.from({ length: 7 }, (_, i) =>
    shiftDate(todayJST, -(6 - i))
  ).filter((d) => checkInSet.has(d)).length;

  const last30 = Array.from({ length: 30 }, (_, i) =>
    shiftDate(todayJST, -(29 - i))
  ).filter((d) => checkInSet.has(d)).length;

  const createdDate = habit.created_at.slice(0, 10);
  const totalDays = Math.max(
    1,
    differenceInDays(parseISO(todayJST), parseISO(createdDate)) + 1
  );
  const allTimePct = Math.min(
    100,
    Math.round((checkInDates.length / totalDays) * 100)
  );

  return {
    streak,
    last7Pct: Math.round((last7 / 7) * 100),
    last30Pct: Math.round((last30 / 30) * 100),
    allTimePct,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HabitDetailPage({ params }: Props) {
  const { id } = await params;
  const todayJST = getTodayJST();
  const startDate = shiftDate(todayJST, -364);

  const supabase = await createClient();
  const [{ data: habit }, { data: rawCheckIns }] = await Promise.all([
    supabase.from("habits").select("*").eq("id", id).single(),
    supabase
      .from("check_ins")
      .select("date")
      .eq("habit_id", id)
      .gte("date", startDate)
      .lte("date", todayJST),
  ]);

  if (!habit) notFound();

  const checkInDates = rawCheckIns?.map((ci) => ci.date) ?? [];
  const checkInSet = new Set(checkInDates);

  const stats = buildStats(checkInDates, habit, todayJST);
  const heatmapWeeks = buildHeatmap(
    checkInSet,
    habit.target_per_week,
    todayJST
  );
  const chartData = buildChartData(checkInSet, todayJST);

  return (
    <div className="py-6 space-y-6">
      <HabitHeader habit={habit} />
      <StatsRow stats={stats} streakUnit={habit.target_per_week === 7 ? "日" : "週"} />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">過去1年</h2>
        <YearHeatmap weeks={heatmapWeeks} />
      </section>
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">直近30日</h2>
        <Last30DaysChart data={chartData} />
      </section>
    </div>
  );
}
