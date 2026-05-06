"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "next-themes";

interface DataPoint {
  date: string;
  pct: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
}

export function SparklineChart({ data, height = 40 }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const lineColor = isDark ? "#b8463a" : "#8b2820";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const pt = payload[0].payload as DataPoint;
            return (
              <div className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 shadow-sm">
                <span className="tabular-nums font-medium">{pt.pct}%</span>
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke={lineColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
