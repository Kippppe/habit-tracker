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
import { ScoreCards } from "@/components/habits/detail/score-cards";
import { YearHeatmap } from "@/components/habits/detail/year-heatmap";
import { GoalBarChart } from "@/components/charts/goal-bar-chart";
import { MonthlyChart } from "@/components/habits/detail/monthly-chart";
import type { Habit } from "@/lib/types/database";

// ── Type exports (used by child components) ───────────────────────────────────

export interface HeatmapCell {
  date: string;
  intensity: 0 | 1 | 2 | 3;
  checked: boolean;
  isFuture: boolean;
}

export interface HeatmapWeek {
  monthLabel: string | null;
  cells: HeatmapCell[];
}

export interface ChartPoint {
  date: string;
  displayDate: string;
  checked: boolean;
}

export interface MonthlyPoint {
  month: string;
  displayMonth: string;
  pct: number;
}

export interface NoteEntry {
  date: string;
  note: string;
}

export interface HabitStats {
  streak: number;
  thisWeekPct: number;
  thisMonthPct: number;
  allTimePct: number;
}

// ── Data builders ─────────────────────────────────────────────────────────────

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

    const weekCount = days.filter((d) => d <= todayJST && checkInSet.has(d)).length;
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

function buildGoalBarData(
  checkInSet: Set<string>,
  todayJST: string
) {
  return Array.from({ length: 30 }, (_, i) => {
    const date = shiftDate(todayJST, -(29 - i));
    const m = parseInt(date.slice(5, 7), 10);
    const d = parseInt(date.slice(8, 10), 10);
    const checked = checkInSet.has(date);
    return { date, displayDate: `${m}/${d}`, value: checked ? 1 : 0, checked };
  });
}

function buildMonthlyData(
  checkInSet: Set<string>,
  todayJST: string
): MonthlyPoint[] {
  return Array.from({ length: 12 }, (_, i) => {
    // month offset: 11 months ago up to current month
    const offset = 11 - i;
    const todayDate = parseISO(todayJST);
    const year = todayDate.getUTCFullYear();
    const month = todayDate.getUTCMonth() - offset; // may be negative; Date handles it
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const capDay = lastDay.toISOString().slice(0, 10) > todayJST
      ? parseISO(todayJST)
      : lastDay;

    const totalDays = differenceInDays(capDay, firstDay) + 1;
    let done = 0;
    for (let d = 0; d < totalDays; d++) {
      if (checkInSet.has(format(addDays(firstDay, d), "yyyy-MM-dd"))) done++;
    }
    const pct = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0;
    return {
      month: format(firstDay, "yyyy-MM"),
      displayMonth: `${firstDay.getUTCMonth() + 1}月`,
      pct,
    };
  });
}

function buildStats(
  checkInDates: string[],
  habit: Habit,
  todayJST: string
): HabitStats {
  const checkInSet = new Set(checkInDates);
  const streak = getStreak(habit, checkInDates, todayJST);

  // This week: Mon → today
  const todayDate = parseISO(todayJST);
  const dow = todayDate.getUTCDay();
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  const weekDays = Array.from({ length: daysSinceMon + 1 }, (_, i) =>
    shiftDate(todayJST, -daysSinceMon + i)
  );
  const thisWeekPct = weekDays.length > 0
    ? Math.round((weekDays.filter((d) => checkInSet.has(d)).length / weekDays.length) * 100)
    : 0;

  // This month: 1st → today
  const dayOfMonth = todayDate.getUTCDate();
  const monthDays = Array.from({ length: dayOfMonth }, (_, i) =>
    shiftDate(todayJST, -(dayOfMonth - 1 - i))
  );
  const thisMonthPct = Math.round(
    (monthDays.filter((d) => checkInSet.has(d)).length / dayOfMonth) * 100
  );

  // All time
  const createdDate = habit.created_at.slice(0, 10);
  const totalDays = Math.max(
    1,
    differenceInDays(parseISO(todayJST), parseISO(createdDate)) + 1
  );
  const allTimePct = Math.min(
    100,
    Math.round((checkInDates.length / totalDays) * 100)
  );

  return { streak, thisWeekPct, thisMonthPct, allTimePct };
}

// ── Section chrome ─────────────────────────────────────────────────────────────

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <p className="font-mono text-[11px] text-shu uppercase tracking-[0.15em] mb-2">
      {num} / {label}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[22px] font-normal tracking-tight leading-tight mb-3">
      {children}
    </h2>
  );
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
      .select("date, note")
      .eq("habit_id", id)
      .gte("date", startDate)
      .lte("date", todayJST)
      .order("date", { ascending: false }),
  ]);

  if (!habit) notFound();

  const checkInDates = rawCheckIns?.map((ci) => ci.date) ?? [];
  const checkInSet = new Set(checkInDates);

  const stats = buildStats(checkInDates, habit, todayJST);
  const heatmapWeeks = buildHeatmap(checkInSet, habit.target_per_week, todayJST);
  const goalBarData = buildGoalBarData(checkInSet, todayJST);
  const monthlyData = buildMonthlyData(checkInSet, todayJST);
  const notes: NoteEntry[] = (rawCheckIns ?? [])
    .filter((ci): ci is { date: string; note: string } => ci.note !== null && ci.note.trim() !== "")
    .slice(0, 20);

  const goalLine = habit.target_per_week / 7;

  return (
    <div className="py-6 space-y-10">
      {/* Header */}
      <HabitHeader habit={habit} />

      {/* Score cards */}
      <ScoreCards
        stats={stats}
        streakUnit={habit.target_per_week === 7 ? "日" : "週"}
      />

      {/* 01 THE PATTERN */}
      <section>
        <SectionLabel num="01" label="THE PATTERN" />
        <SectionTitle>過去1年の<em>軌跡</em></SectionTitle>
        <div className="rounded-md bg-card border border-border p-4 shadow-sm">
          <YearHeatmap weeks={heatmapWeeks} />
        </div>
      </section>

      {/* 02 RECENT */}
      <section>
        <SectionLabel num="02" label="RECENT" />
        <SectionTitle>直近30日の<em>記録</em></SectionTitle>
        <div className="rounded-md bg-card border border-border p-4 shadow-sm">
          <GoalBarChart data={goalBarData} goalLine={goalLine} height={120} />
        </div>
      </section>

      {/* 03 TRAJECTORY */}
      <section>
        <SectionLabel num="03" label="TRAJECTORY" />
        <SectionTitle>月次達成率の<em>推移</em></SectionTitle>
        <div className="rounded-md bg-card border border-border p-4 shadow-sm">
          <MonthlyChart data={monthlyData} />
        </div>
      </section>

      {/* 04 NOTES */}
      {notes.length > 0 && (
        <section>
          <SectionLabel num="04" label="NOTES" />
          <SectionTitle>メモの<em>記録</em></SectionTitle>
          <div className="rounded-md bg-card border border-border shadow-sm divide-y divide-border">
            {notes.map((entry) => (
              <div key={entry.date} className="px-4 py-3 space-y-0.5">
                <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {entry.date}
                </p>
                <p className="text-sm leading-relaxed">{entry.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
