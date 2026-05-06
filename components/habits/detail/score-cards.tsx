import { ProgressRing } from "@/components/charts/progress-ring";
import { AnimatedNumber } from "@/components/motion/animated-number";
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
          <AnimatedNumber
            value={percent}
            duration={0.8}
            className="font-mono text-[11px] font-semibold tabular-nums text-primary"
          />
        </div>
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function StreakCard({ streak, bestStreak, unit }: { streak: number; bestStreak: number; unit: "日" | "週" }) {
  return (
    <div className="rounded-md bg-primary/5 border border-primary/20 shadow-sm p-4 flex flex-col items-center gap-1 flex-1 min-w-0">
      <AnimatedNumber
        value={streak}
        duration={0.8}
        className="font-serif text-4xl leading-none text-primary tabular-nums"
      />
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center leading-tight">
        Streak ({unit})
      </span>
      {bestStreak > streak && (
        <span className="text-[9px] font-mono text-muted-foreground/60 tabular-nums mt-0.5">
          最高 {bestStreak}{unit}
        </span>
      )}
    </div>
  );
}

export function ScoreCards({ stats, streakUnit }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StreakCard streak={stats.streak} bestStreak={stats.bestStreak} unit={streakUnit} />
      <RingCard label="This Week" percent={stats.thisWeekPct} />
      <RingCard label="This Month" percent={stats.thisMonthPct} />
      <RingCard label="All Time" percent={stats.allTimePct} />
    </div>
  );
}
