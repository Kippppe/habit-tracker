"use client";

interface CategoryStat {
  category: string;
  done: number;
  total: number;
  pct: number;
  color: string;
}

interface Props {
  stats: CategoryStat[];
}

export function CategoryBreakdown({ stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <div className="rounded-md bg-card border border-border shadow-sm p-4 space-y-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        By category
      </p>
      <div className="space-y-2.5">
        {stats.map(({ category, done, total, pct, color }) => (
          <div key={category || "未分類"}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium truncate">
                {category || "未分類"}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {done}/{total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
