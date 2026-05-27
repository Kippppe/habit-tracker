"use client";

import { Flame, CalendarDays, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/charts/progress-ring";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { SparklineChart } from "./sparkline-chart";

interface SparkPoint {
  date: string;
  pct: number;
}

interface WeekBar {
  day: string;
  pct: number;
  isToday: boolean;
}

interface Props {
  todayPct: number;
  todayChecked: number;
  todayTotal: number;
  streak: number;
  bestStreak: number;
  thisWeekPct: number;
  weekBars: WeekBar[];
  sparklineData: SparkPoint[];
}

function CardShell({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-card border border-border shadow-sm p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground/35">{icon}</span>
      </div>
      {children}
    </div>
  );
}

export function StatCards({
  todayPct,
  todayChecked,
  todayTotal,
  streak,
  bestStreak,
  thisWeekPct,
  weekBars,
  sparklineData,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Today */}
      <CardShell label="Today" icon={<Target size={13} />}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ProgressRing percent={todayPct} size={64} strokeWidth={6} animated />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-[10px] tabular-nums text-primary font-semibold">
                {todayPct}%
              </span>
            </div>
          </div>
          <div>
            <div className="font-serif text-xl leading-none text-primary tabular-nums">
              {todayChecked}
              <span className="text-sm text-foreground/30">/{todayTotal}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">完了</div>
          </div>
        </div>
      </CardShell>

      {/* Streak */}
      <CardShell label="Streak" icon={<Flame size={13} />}>
        {streak > 0 ? (
          <div>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={streak}
                duration={0.8}
                className="font-serif text-3xl leading-none text-primary tabular-nums"
              />
              <span className="text-xs text-muted-foreground">日</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">
              最長 {bestStreak}日
            </div>
          </div>
        ) : bestStreak > 0 ? (
          <div>
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={bestStreak}
                duration={0.8}
                className="font-serif text-3xl leading-none text-primary tabular-nums"
              />
              <span className="text-xs text-muted-foreground">日</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">
              最高記録 · 現在 0日
            </div>
          </div>
        ) : (
          <div>
            <div className="font-serif text-3xl leading-none text-muted-foreground/40">
              —
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">まだ記録なし</div>
          </div>
        )}
      </CardShell>

      {/* This Week */}
      <CardShell label="This week" icon={<CalendarDays size={13} />}>
        <div>
          <div className="font-serif text-2xl leading-none text-primary tabular-nums mb-2">
            {thisWeekPct}
            <span className="text-base text-foreground/30">%</span>
          </div>
          <div className="flex items-end gap-0.5 h-8">
            {weekBars.map(({ day, pct, isToday }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-0.5 h-full">
                <div className="w-full flex-1 relative rounded-sm overflow-hidden bg-foreground/8">
                  <div
                    className={cn(
                      "absolute bottom-0 w-full rounded-sm transition-all duration-500",
                      isToday ? "bg-primary" : "bg-primary/35"
                    )}
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[7px] font-mono shrink-0",
                    isToday ? "text-primary font-semibold" : "text-muted-foreground/45"
                  )}
                >
                  {day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardShell>

      {/* 30 Days */}
      <CardShell label="30 days" icon={<TrendingUp size={13} />}>
        <SparklineChart data={sparklineData} height={56} />
      </CardShell>
    </div>
  );
}
