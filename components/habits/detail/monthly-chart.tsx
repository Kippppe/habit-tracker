"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import type { MonthlyPoint } from "@/app/(app)/habits/[id]/page";

interface Props {
  data: MonthlyPoint[];
}

export function MonthlyChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const lineColor = isDark ? "#b8463a" : "#8b2820";
  const tickColor = isDark ? "#d6cab0" : "#4a4640";
  const gridColor = isDark ? "rgba(214,202,176,0.08)" : "rgba(26,24,20,0.06)";

  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <XAxis
          dataKey="displayMonth"
          tick={{ fontSize: 10, fill: tickColor }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
          ticks={[0, 50, 100]}
        />
        <ReferenceLine y={100} stroke={gridColor} strokeWidth={1} />
        <ReferenceLine y={50} stroke={gridColor} strokeWidth={1} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const pt = payload[0].payload as MonthlyPoint;
            return (
              <div className="text-[11px] bg-card border border-border rounded px-2 py-1 shadow-sm">
                <p className="font-medium">{pt.displayMonth}</p>
                <p className="tabular-nums text-primary">{pt.pct}%</p>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
