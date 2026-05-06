import { cn } from "@/lib/utils";
import type { HeatmapWeek } from "@/app/(app)/habits/[id]/page";

const INTENSITY_CLASS: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-kinari-soft dark:bg-sumi-soft",
  1: "bg-shu/20 dark:bg-shu/30",
  2: "bg-shu/55 dark:bg-shu-soft",
  3: "bg-shu dark:bg-shu-soft",
};

const WEEKDAY_LABELS = ["月", "", "水", "", "金", "", "日"];

interface Props {
  weeks: HeatmapWeek[];
  todayJST: string;
}

export function YearHeatmap({ weeks, todayJST }: Props) {
  return (
    <div className="overflow-x-auto space-y-3">
      <div className="min-w-max flex gap-1">
        {/* Weekday labels */}
        <div className="flex flex-col gap-[3px] pt-5 pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 flex items-center justify-end text-[9px] text-muted-foreground"
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
            {week.cells.map((cell, di) => {
              const isToday = cell.date === todayJST;
              return (
                <div
                  key={di}
                  title={
                    cell.isFuture
                      ? cell.date
                      : `${cell.date}: ${cell.checked ? "完了" : "未完了"}`
                  }
                  className={cn(
                    "w-3.5 h-3.5 rounded-sm transition-opacity",
                    cell.isFuture
                      ? "opacity-0"
                      : INTENSITY_CLASS[cell.intensity],
                    isToday && "ring-1 ring-primary ring-offset-[1.5px] ring-offset-card"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Intensity legend */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground/60">少</span>
        {([0, 1, 2, 3] as const).map((i) => (
          <div
            key={i}
            className={cn("w-3.5 h-3.5 rounded-sm", INTENSITY_CLASS[i])}
          />
        ))}
        <span className="text-[9px] text-muted-foreground/60">多</span>
      </div>
    </div>
  );
}
