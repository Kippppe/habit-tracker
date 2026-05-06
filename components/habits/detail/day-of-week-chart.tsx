"use client";

import { cn } from "@/lib/utils";

export interface DayOfWeekStat {
  day: string;
  pct: number;
  count: number;
  total: number;
}

interface Props {
  data: DayOfWeekStat[];
}

function barColor(pct: number): string {
  if (pct >= 80) return "var(--color-shu, #8b2820)";
  if (pct >= 50) return "var(--color-shu-soft, #b8463a)";
  return "var(--color-line, #d6cab0)";
}

export function DayOfWeekChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.pct), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1.5 h-28">
        {data.map(({ day, pct, count, total }) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1 h-full group relative">
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 shadow-sm tabular-nums">
                {count}/{total}
              </div>
            </div>

            {/* Pct label */}
            <span
              className={cn(
                "text-[9px] tabular-nums font-mono leading-none",
                pct >= 80 ? "text-primary font-semibold" : "text-muted-foreground/60"
              )}
            >
              {pct > 0 ? `${pct}%` : ""}
            </span>

            {/* Bar track */}
            <div className="w-full flex-1 rounded-sm bg-foreground/6 overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full rounded-sm transition-all duration-700 ease-out"
                style={{
                  height: `${(pct / 100) * 100}%`,
                  backgroundColor: barColor(pct),
                  opacity: pct === 0 ? 0.2 : 1,
                }}
              />
            </div>

            {/* Day label */}
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{day}</span>
          </div>
        ))}
      </div>

      {/* Summary: best and worst day */}
      {(() => {
        const sorted = [...data].sort((a, b) => b.pct - a.pct);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if (best.pct === 0) return null;
        return (
          <p className="text-[11px] text-muted-foreground font-sans">
            最も安定:{" "}
            <span className="text-foreground font-medium">{best.day}曜日</span>
            {" "}({best.pct}%)
            {worst.pct < best.pct && (
              <>
                　要注意:{" "}
                <span className="text-foreground font-medium">{worst.day}曜日</span>
                {" "}({worst.pct}%)
              </>
            )}
          </p>
        );
      })()}
    </div>
  );
}
