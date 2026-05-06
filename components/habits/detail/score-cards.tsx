import { ProgressRing } from "@/components/charts/progress-ring";
import type { HabitStats } from "@/app/(app)/habits/[id]/page";

interface Props {
  stats: HabitStats;
  streakUnit: "日" | "週";
}

interface RingCardProps {
  label: string;
  percent: number;
}

function RingCard({ label, percent }: RingCardProps) {
  return (
    <div className="rounded-md bg-card border border-border shadow-sm p-4 flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="relative">
        <ProgressRing percent={percent} size={64} strokeWidth={6} animated />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs font-medium tabular-nums text-primary">
            {percent}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function StreakCard({ streak, unit }: { streak: number; unit: "日" | "週" }) {
  return (
    <div className="rounded-md bg-primary/5 border border-primary/20 shadow-sm p-4 flex flex-col items-center gap-2 flex-1 min-w-0">
      <div className="font-serif text-4xl leading-none text-primary tabular-nums">
        {streak}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center leading-tight">
        Streak ({unit})
      </span>
    </div>
  );
}

export function ScoreCards({ stats, streakUnit }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StreakCard streak={stats.streak} unit={streakUnit} />
      <RingCard label="This Week" percent={stats.thisWeekPct} />
      <RingCard label="This Month" percent={stats.thisMonthPct} />
      <RingCard label="All Time" percent={stats.allTimePct} />
    </div>
  );
}
