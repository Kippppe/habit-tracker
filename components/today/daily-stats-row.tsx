"use client";

import { Flame, Target, TrendingUp, CalendarDays } from "lucide-react";
import { SparklineChart } from "./sparkline-chart";

interface SparkPoint {
  date: string;
  pct: number;
}

interface Props {
  todayPct: number;
  todayChecked: number;
  todayTotal: number;
  streak: number;
  thisWeekPct: number;
  sparklineData: SparkPoint[];
}

const RADIUS = 18;
const STROKE = 4;
const CIRC = 2 * Math.PI * RADIUS;

function MiniDonut({ pct }: { pct: number }) {
  const offset = CIRC * (1 - pct / 100);
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" aria-hidden>
      <circle
        cx="24" cy="24" r={RADIUS}
        fill="none"
        stroke="currentColor"
        className="text-foreground/10"
        strokeWidth={STROKE}
      />
      <circle
        cx="24" cy="24" r={RADIUS}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
        style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
      />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function StatCard({ label, children, icon }: StatCardProps) {
  return (
    <div className="rounded-md bg-card border border-border shadow-sm p-4 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground/50">{icon}</span>}
      </div>
      {children}
    </div>
  );
}

export function DailyStatsRow({
  todayPct,
  todayChecked,
  todayTotal,
  streak,
  thisWeekPct,
  sparklineData,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {/* Today completion */}
      <StatCard label="Today" icon={<Target size={13} />}>
        <div className="flex items-center gap-3">
          <MiniDonut pct={todayPct} />
          <div>
            <div className="font-serif text-2xl leading-none text-primary tabular-nums">
              {todayPct}
              <span className="text-base text-foreground/40">%</span>
            </div>
            <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
              {todayChecked}/{todayTotal}
            </div>
          </div>
        </div>
      </StatCard>

      {/* Streak */}
      <StatCard label="Streak" icon={<Flame size={13} />}>
        <div className="font-serif text-3xl leading-none text-primary tabular-nums">
          {streak}
          <span className="font-sans text-xs text-muted-foreground ml-1">日</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">連続達成</div>
      </StatCard>

      {/* This week */}
      <StatCard label="This week" icon={<CalendarDays size={13} />}>
        <div className="font-serif text-3xl leading-none text-primary tabular-nums">
          {thisWeekPct}
          <span className="text-base text-foreground/40">%</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">月〜今日</div>
      </StatCard>

      {/* 30-day sparkline */}
      <StatCard label="30 days" icon={<TrendingUp size={13} />}>
        <SparklineChart data={sparklineData} height={44} />
      </StatCard>
    </div>
  );
}
