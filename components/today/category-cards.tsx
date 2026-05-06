"use client";

interface CategoryStat {
  category: string;
  done: number;
  total: number;
  pct: number;
  weekPct: number;
  color: string;
}

interface Props {
  stats: CategoryStat[];
}

export function CategoryCards({ stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {stats.map(({ category, done, total, pct, weekPct, color }) => (
        <div
          key={category || "未分類"}
          className="rounded-md bg-card border border-border shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium truncate flex-1">
              {category || "未分類"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
              今週 {weekPct}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground shrink-0">
              {done}/{total}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
