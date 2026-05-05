"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import type { ChartPoint } from "@/app/(app)/habits/[id]/page";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null;
  const { date, checked } = payload[0].payload;
  return (
    <div className="rounded-xl bg-card border border-border px-3 py-2 text-sm shadow-md">
      <p className="font-medium tabular-nums">{date}</p>
      <p className={checked ? "text-primary" : "text-muted-foreground"}>
        {checked ? "完了" : "未完了"}
      </p>
    </div>
  );
}

interface Props {
  data: ChartPoint[];
}

export function Last30DaysChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const checkedColor = isDark ? "#f59e0b" : "#d97706";
  const uncheckedColor = isDark ? "#44403c" : "#e7e5e4";
  const tickColor = isDark ? "#a8a29e" : "#78716c";

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="20%">
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 10, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "transparent" }}
        />
        <Bar dataKey={() => 1} radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.checked ? checkedColor : uncheckedColor}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
