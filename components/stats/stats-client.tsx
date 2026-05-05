"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitStat, Summary } from "@/app/(app)/stats/page";

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Percentage color ──────────────────────────────────────────────────────────

function pctClass(v: number): string {
  if (v >= 80) return "text-amber-600 dark:text-amber-500";
  if (v >= 50) return "text-stone-700 dark:text-stone-300";
  return "text-stone-400";
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = "thisWeekPct" | "thisMonthPct" | "allTimePct" | "streak";

function sorted(
  rows: HabitStat[],
  key: SortKey,
  asc: boolean
): HabitStat[] {
  return [...rows].sort((a, b) =>
    asc ? a[key] - b[key] : b[key] - a[key]
  );
}

// ── Category badge ────────────────────────────────────────────────────────────

function CategoryBadge({
  category,
  color,
}: {
  category: string | null;
  color: string | null;
}) {
  if (!category) return null;
  return (
    <span
      className="text-xs rounded-full px-2 py-0.5 font-medium ml-1.5"
      style={{
        backgroundColor: `${color ?? "#d97706"}33`, // 20% opacity
        color: color ?? "#d97706",
      }}
    >
      {category}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  habitStats: HabitStat[];
  summary: Summary;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function StatsClient({ habitStats, summary }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("thisMonthPct");
  const [asc, setAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setAsc((a) => !a);
    } else {
      setSortKey(key);
      setAsc(false);
    }
  }

  const rows = sorted(habitStats, sortKey, asc);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ChevronUp size={12} className="opacity-30 inline ml-0.5" />;
    return asc ? (
      <ChevronUp size={12} className="inline ml-0.5 text-primary" />
    ) : (
      <ChevronDown size={12} className="inline ml-0.5 text-primary" />
    );
  }

  const colHeader = (key: SortKey, label: string) => (
    <th
      className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => handleSort(key)}
    >
      {label}
      <SortIcon col={key} />
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="アクティブ習慣" value={summary.activeCount} />
        <SummaryCard
          label="今週総達成率"
          value={`${summary.thisWeekOverallPct}%`}
        />
        <SummaryCard label="合計チェックイン" value={summary.totalCheckIns} />
      </div>

      {habitStats.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          習慣を追加すると統計が表示されます。
        </p>
      )}

      {/* Desktop table */}
      {habitStats.length > 0 && (
        <div className="hidden md:block rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  習慣
                </th>
                {colHeader("thisWeekPct", "今週")}
                {colHeader("thisMonthPct", "今月")}
                {colHeader("allTimePct", "全期間")}
                {colHeader("streak", "ストリーク")}
              </tr>
            </thead>
            <tbody>
              {rows.map((h, i) => (
                <tr
                  key={h.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors",
                    i % 2 === 0 ? "" : ""
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-0.5 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: h.color ?? "#d97706" }}
                      />
                      <span className="text-sm font-medium">{h.name}</span>
                      <CategoryBadge
                        category={h.category}
                        color={h.color}
                      />
                    </div>
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
                  <td className="px-3 py-3 text-right text-sm tabular-nums font-medium text-muted-foreground">
                    {h.streak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile card list */}
      {habitStats.length > 0 && (
        <div className="md:hidden space-y-2">
          {/* Sort buttons for mobile */}
          <div className="flex gap-2 flex-wrap text-xs">
            {(
              [
                ["thisWeekPct", "今週"],
                ["thisMonthPct", "今月"],
                ["allTimePct", "全期間"],
                ["streak", "ストリーク"],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
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
                {label} {sortKey === key && (asc ? "↑" : "↓")}
              </button>
            ))}
          </div>

          {rows.map((h) => (
            <div
              key={h.id}
              className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-0.5 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: h.color ?? "#d97706" }}
                />
                <span className="font-medium text-sm">{h.name}</span>
                <CategoryBadge category={h.category} color={h.color} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["今週", h.thisWeekPct, "%"],
                    ["今月", h.thisMonthPct, "%"],
                    ["全期間", h.allTimePct, "%"],
                    ["ストリーク", h.streak, ""],
                  ] as [string, number, string][]
                ).map(([label, val, unit]) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p
                      className={cn(
                        "text-lg font-semibold tabular-nums",
                        unit === "%" ? pctClass(val) : "text-foreground"
                      )}
                    >
                      {val}
                      {unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
