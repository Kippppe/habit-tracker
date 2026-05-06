import type { HabitStats } from "@/app/(app)/habits/[id]/page";

interface Props {
  stats: HabitStats;
  streakUnit: "日" | "週";
}

// Kept for backwards compat — page now uses ScoreCards; this file is unused.
export function StatsRow({ stats, streakUnit }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-md border p-4 bg-primary/5 border-primary/20 flex flex-col gap-1">
        <span className="text-3xl font-semibold tabular-nums text-primary">{stats.streak}</span>
        <span className="text-xs text-muted-foreground">ストリーク ({streakUnit})</span>
      </div>
      <div className="rounded-md border p-4 bg-card border-border flex flex-col gap-1">
        <span className="text-3xl font-semibold tabular-nums">{stats.thisWeekPct}%</span>
        <span className="text-xs text-muted-foreground">今週</span>
      </div>
      <div className="rounded-md border p-4 bg-card border-border flex flex-col gap-1">
        <span className="text-3xl font-semibold tabular-nums">{stats.thisMonthPct}%</span>
        <span className="text-xs text-muted-foreground">今月</span>
      </div>
      <div className="rounded-md border p-4 bg-card border-border flex flex-col gap-1">
        <span className="text-3xl font-semibold tabular-nums">{stats.allTimePct}%</span>
        <span className="text-xs text-muted-foreground">全期間</span>
      </div>
    </div>
  );
}
