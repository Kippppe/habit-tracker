"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";

export interface GoalBarPoint {
  date: string;
  displayDate: string;
  value: number;
  checked: boolean;
}

interface Props {
  data: GoalBarPoint[];
  goalLine?: number;
  height?: number;
}

export function GoalBarChart({ data, goalLine, height = 120 }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const shuColor = isDark ? "#b8463a" : "#8b2820";
  const sumiColor = isDark ? "#3a3530" : "#d6cab0";
  const tickColor = isDark ? "#d6cab0" : "#4a4640";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="18%">
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 10, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <Tooltip
          cursor={{ fill: "transparent" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const pt = payload[0].payload as GoalBarPoint;
            return (
              <div className="text-[11px] bg-card border border-border rounded px-2 py-1 shadow-sm">
                <p className="tabular-nums font-medium">{pt.date}</p>
                <p className={pt.checked ? "text-primary" : "text-muted-foreground"}>
                  {pt.checked ? "完了" : "未完了"}
                </p>
              </div>
            );
          }}
        />
        {goalLine !== undefined && (
          <ReferenceLine
            y={goalLine}
            stroke={shuColor}
            strokeDasharray="4 3"
            strokeWidth={1.5}
            strokeOpacity={0.7}
          />
        )}
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.checked ? shuColor : sumiColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
