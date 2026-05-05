"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
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
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="20%">
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 10, fill: "#78716c" }}
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
              fill={entry.checked ? "#d97706" : "#e7e5e4"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
