import { cn } from "@/lib/utils";
import type { HabitStats } from "@/app/(app)/habits/[id]/page";

interface Props {
  stats: HabitStats;
  streakUnit: "日" | "週";
}

interface StatCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-1",
        accent
          ? "bg-primary/5 border-primary/20"
          : "bg-card border-border"
      )}
    >
      <span
        className={cn(
          "text-3xl font-semibold tabular-nums tracking-tight",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function StatsRow({ stats, streakUnit }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label={`現在ストリーク (${streakUnit})`}
        value={String(stats.streak)}
        accent
      />
      <StatCard label="直近7日" value={`${stats.last7Pct}%`} />
      <StatCard label="直近30日" value={`${stats.last30Pct}%`} />
      <StatCard label="全期間" value={`${stats.allTimePct}%`} />
    </div>
  );
}
