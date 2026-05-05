import { cn } from "@/lib/utils";
import type { HeatmapWeek } from "@/app/(app)/habits/[id]/page";

const INTENSITY_CLASS: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-stone-100 dark:bg-stone-800",
  1: "bg-amber-200",
  2: "bg-amber-400",
  3: "bg-amber-600",
};

const WEEKDAY_LABELS = ["月", "", "水", "", "金", "", "日"];

interface Props {
  weeks: HeatmapWeek[];
}

export function YearHeatmap({ weeks }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max flex gap-1">
        {/* Weekday labels */}
        <div className="flex flex-col gap-[3px] pt-5 pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-end text-[9px] text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {/* Month label */}
            <div className="h-5 flex items-end">
              {week.monthLabel && (
                <span className="text-[10px] text-muted-foreground leading-none">
                  {week.monthLabel}
                </span>
              )}
            </div>

            {/* Day cells */}
            {week.cells.map((cell, di) => (
              <div
                key={di}
                title={
                  cell.isFuture
                    ? cell.date
                    : `${cell.date}: ${cell.checked ? "完了" : "未完了"}`
                }
                className={cn(
                  "w-3 h-3 rounded-sm transition-opacity",
                  cell.isFuture
                    ? "opacity-0"
                    : INTENSITY_CLASS[cell.intensity]
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
