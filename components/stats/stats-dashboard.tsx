"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/charts/progress-ring";
import { DonutChart } from "@/components/charts/donut-chart";
import { GoalBarChart } from "@/components/charts/goal-bar-chart";
import { Hanko } from "@/components/brand/hanko";
import type {
  HabitStat,
  HeroData,
  DailyRhythmPoint,
  CategoryStat,
  MilestoneAchievement,
} from "@/app/(app)/stats/page";

// ── Section chrome ────────────────────────────────────────────────────────────

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <p className="font-mono text-[11px] text-shu uppercase tracking-[0.15em] mb-2">
      {num} / {label}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-[22px] font-normal tracking-tight leading-tight mb-4">
      {children}
    </h2>
  );
}

// ── Section 1: Hero ───────────────────────────────────────────────────────────

function HeroSection({ hero }: { hero: HeroData }) {
  const startYear = hero.trackingStartDate.slice(0, 4);
  const startMonth = parseInt(hero.trackingStartDate.slice(5, 7), 10);
  const startDay = parseInt(hero.trackingStartDate.slice(8, 10), 10);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Active habits */}
      <div className="rounded-md bg-card border border-border shadow-sm p-6 flex flex-col justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Active habits
        </p>
        <span
          className="font-serif text-primary leading-none tabular-nums"
          style={{ fontSize: "clamp(52px, 10vw, 72px)" }}
        >
          {hero.activeCount}
        </span>
      </div>

      {/* This week's score */}
      <div className="rounded-md bg-card border border-border shadow-sm p-6 flex flex-col items-center justify-center gap-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          This week&apos;s score
        </p>
        <div className="relative">
          <ProgressRing percent={hero.thisWeekOverallPct} size={96} strokeWidth={8} animated />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-sm font-medium tabular-nums text-primary">
              {hero.thisWeekOverallPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Days tracked */}
      <div className="rounded-md bg-card border border-border shadow-sm p-6 flex flex-col justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Days tracked
        </p>
        <div>
          <span
            className="font-serif text-primary leading-none tabular-nums block"
            style={{ fontSize: "clamp(52px, 10vw, 72px)" }}
          >
            {hero.daysTracked}
          </span>
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            since {startYear}年{startMonth}月{startDay}日
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Section 2: Daily Rhythm ───────────────────────────────────────────────────

function DailyRhythmSection({
  data,
  avgPerDay,
  goalLine,
}: {
  data: DailyRhythmPoint[];
  avgPerDay: number;
  goalLine: number;
}) {
  return (
    <section>
      <SectionLabel num="01" label="DAILY RHYTHM" />
      <SectionTitle>
        毎日の<em>リズム</em>
      </SectionTitle>
      <div className="rounded-md bg-card border border-border shadow-sm p-4">
        <GoalBarChart data={data} goalLine={goalLine} height={160} />
        <p className="text-xs text-sumi-soft dark:text-line font-sans mt-2 tabular-nums">
          average{" "}
          <span className="font-medium text-foreground">{avgPerDay}</span> habits
          / day
        </p>
      </div>
    </section>
  );
}

// ── Section 3: By Category ────────────────────────────────────────────────────

function pctClass(v: number): string {
  if (v >= 80) return "text-shu dark:text-shu-soft";
  if (v >= 50) return "text-sumi-soft dark:text-line";
  return "text-sumi-soft";
}

function CategorySection({ stats }: { stats: CategoryStat[] }) {
  const segments = stats.map((s) => ({
    label: s.category,
    value: s.habitCount,
    color: s.color,
  }));

  return (
    <section>
      <SectionLabel num="02" label="BY CATEGORY" />
      <SectionTitle>
        カテゴリ別の<em>内訳</em>
      </SectionTitle>
      <div className="rounded-md bg-card border border-border shadow-sm p-4">
        {stats.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            カテゴリが設定されていません。
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut */}
            <div className="shrink-0">
              <DonutChart segments={segments} size={160} />
            </div>

            {/* Table */}
            <div className="flex-1 w-full min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">
                      カテゴリ
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground pb-2 pr-4">
                      習慣数
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground pb-2">
                      今月
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.category} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="truncate font-medium">{s.category}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                        {s.habitCount}
                      </td>
                      <td
                        className={cn(
                          "py-2 text-right tabular-nums font-semibold",
                          pctClass(s.thisMonthPct)
                        )}
                      >
                        {s.thisMonthPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Section 4: The Table ─────────────────────────────────────────────────────

type SortKey = "streak" | "thisWeekPct" | "thisMonthPct" | "allTimePct";

function TableSection({ habitStats }: { habitStats: HabitStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("thisMonthPct");
  const [asc, setAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) setAsc((a) => !a);
    else { setSortKey(key); setAsc(false); }
  }

  const rows = [...habitStats].sort((a, b) =>
    asc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
  );

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={11} className="opacity-25 inline ml-0.5" />;
    return asc
      ? <ChevronUp size={11} className="inline ml-0.5 text-primary" />
      : <ChevronDown size={11} className="inline ml-0.5 text-primary" />;
  }

  const colTh = (key: SortKey, label: string) => (
    <th
      className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => handleSort(key)}
    >
      {label}
      <SortIcon col={key} />
    </th>
  );

  if (habitStats.length === 0) return null;

  return (
    <section>
      <SectionLabel num="03" label="THE TABLE" />
      <SectionTitle>
        全習慣の<em>一覧</em>
      </SectionTitle>

      {/* Desktop */}
      <div className="hidden md:block rounded-md bg-card border border-border shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                習慣
              </th>
              {colTh("streak", "Streak")}
              {colTh("thisWeekPct", "今週")}
              {colTh("thisMonthPct", "今月")}
              {colTh("allTimePct", "全期間")}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr
                key={h.id}
                className="border-b border-border last:border-0 hover:bg-shu/5 dark:hover:bg-shu/10 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-0.5 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: h.color ?? "#8b2820" }}
                    />
                    <span className="text-sm font-medium">{h.name}</span>
                    {h.category && (
                      <span className="text-[10px] rounded px-1.5 py-0.5 font-mono"
                        style={{ border: "1px solid #8b2820", color: "#4a4640" }}>
                        {h.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-sm tabular-nums font-medium text-muted-foreground">
                  {h.streak}
                </td>
                <td className={cn("px-3 py-3 text-right text-sm tabular-nums font-medium", pctClass(h.thisWeekPct))}>
                  {h.thisWeekPct}%
                </td>
                <td className={cn("px-3 py-3 text-right text-sm tabular-nums font-medium", pctClass(h.thisMonthPct))}>
                  {h.thisMonthPct}%
                </td>
                <td className={cn("px-3 py-3 text-right text-sm tabular-nums font-medium", pctClass(h.allTimePct))}>
                  {h.allTimePct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <div className="flex gap-2 flex-wrap">
          {([["streak", "Streak"], ["thisWeekPct", "今週"], ["thisMonthPct", "今月"], ["allTimePct", "全期間"]] as [SortKey, string][])
            .map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={cn(
                  "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                  sortKey === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {label}{sortKey === key && (asc ? " ↑" : " ↓")}
              </button>
            ))}
        </div>
        {rows.map((h) => (
          <div key={h.id} className="rounded-md bg-card border border-border p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 rounded-full shrink-0" style={{ backgroundColor: h.color ?? "#8b2820" }} />
              <span className="font-medium text-sm">{h.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([["Streak", h.streak, ""], ["今週", h.thisWeekPct, "%"], ["今月", h.thisMonthPct, "%"], ["全期間", h.allTimePct, "%"]] as [string, number, string][])
                .map(([lbl, val, unit]) => (
                  <div key={lbl}>
                    <p className="text-[10px] text-muted-foreground">{lbl}</p>
                    <p className={cn("text-lg font-semibold tabular-nums", unit === "%" ? pctClass(val) : "")}>
                      {val}{unit}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 5: Milestones ─────────────────────────────────────────────────────

function MilestonesSection({ milestones }: { milestones: MilestoneAchievement[] }) {
  if (milestones.length === 0) return null;

  function formatDate(d: string) {
    const y = d.slice(0, 4);
    const m = parseInt(d.slice(5, 7), 10);
    const day = parseInt(d.slice(8, 10), 10);
    return `${y}年${m}月${day}日`;
  }

  return (
    <section>
      <SectionLabel num="04" label="MILESTONES" />
      <SectionTitle>
        達成した<em>記念日</em>
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {milestones.map((ms, i) => (
          <div
            key={`${ms.habitId}-${ms.milestone}`}
            className="rounded-md bg-card border border-border shadow-sm p-4 flex flex-col items-center gap-2 text-center"
          >
            <Hanko size={56} text={ms.milestoneKanji} tilted={i % 3 !== 0} weathered />
            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {ms.milestone} days
              </p>
              <p className="text-sm font-medium mt-0.5 leading-tight">{ms.habitName}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                {formatDate(ms.achievedDate)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  hero: HeroData;
  habitStats: HabitStat[];
  dailyRhythm: DailyRhythmPoint[];
  avgPerDay: number;
  categoryStats: CategoryStat[];
  milestones: MilestoneAchievement[];
  totalHabitCount: number;
}

export function StatsDashboard({
  hero,
  habitStats,
  dailyRhythm,
  avgPerDay,
  categoryStats,
  milestones,
  totalHabitCount,
}: Props) {
  return (
    <div className="py-6 space-y-14">
      <HeroSection hero={hero} />

      {habitStats.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          習慣を追加すると統計が表示されます。
        </p>
      )}

      {habitStats.length > 0 && (
        <>
          <DailyRhythmSection
            data={dailyRhythm}
            avgPerDay={avgPerDay}
            goalLine={totalHabitCount}
          />
          <CategorySection stats={categoryStats} />
          <TableSection habitStats={habitStats} />
          <MilestonesSection milestones={milestones} />
        </>
      )}
    </div>
  );
}
