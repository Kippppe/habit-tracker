"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";

export interface SparklinePoint {
  date: string;
  value: number;
}

interface Props {
  data: SparklinePoint[];
  height?: number;
  stroke?: string;
}

export function Sparkline({ data, height = 48, stroke }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const lineColor = stroke ?? (isDark ? "#b8463a" : "#8b2820");
  const gradId = `spark-grad-${lineColor.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const pt = payload[0].payload as SparklinePoint;
            return (
              <div className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 shadow-sm">
                <span className="tabular-nums font-medium">{pt.value}%</span>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
