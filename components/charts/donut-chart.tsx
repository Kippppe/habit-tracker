"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  size?: number;
}

export function DonutChart({ segments, size = 120 }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <ResponsiveContainer width={size} height={size}>
      <PieChart>
        <Pie
          data={segments}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="75%"
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={false}
        >
          {segments.map((seg, i) => (
            <Cell key={i} fill={seg.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const seg = payload[0].payload as DonutSegment;
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div className="text-[11px] bg-card border border-border rounded px-2 py-1 shadow-sm">
                <p className="font-medium">{seg.label}</p>
                <p className="tabular-nums text-muted-foreground">{pct}%</p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
