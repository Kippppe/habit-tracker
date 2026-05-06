"use client";

import {
  AreaChart,
  Area,
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
  const strokeColor = isDark ? "#b8463a" : "#8b2820";
  const tickColor = isDark ? "#d6cab0" : "#4a4640";
  const gridColor = isDark ? "rgba(214,202,176,0.07)" : "rgba(26,24,20,0.05)";
  const gradId = "monthlyAreaGrad";

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.18} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>

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
          ticks={[0, 50, 80, 100]}
        />

        {/* Grid lines */}
        <ReferenceLine y={100} stroke={gridColor} strokeWidth={1} />
        <ReferenceLine y={50} stroke={gridColor} strokeWidth={1} />
        {/* 80% target line */}
        <ReferenceLine
          y={80}
          stroke={strokeColor}
          strokeOpacity={0.25}
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: "80%",
            position: "right",
            fontSize: 9,
            fill: tickColor,
            opacity: 0.5,
          }}
        />

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

        <Area
          type="monotone"
          dataKey="pct"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={{ fill: strokeColor, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
