"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Props = {
  data: { status: string; count: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "var(--text-secondary)",
  playing: "var(--accent)",
  completed: "#4a9a6a",
  dropped: "#a35555",
};

type BarShapeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  payload?: { status: string; count: number };
};

function StatusBarShape({ x, y, width, height, payload }: BarShapeProps) {
  const fill = payload
    ? (STATUS_COLORS[payload.status] ?? "var(--accent)")
    : "var(--accent)";
  return (
    <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} ry={6} />
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatusTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload as { status: string; count: number };
  const color = STATUS_COLORS[point.status] ?? "var(--accent)";

  return (
    <div
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        padding: "8px 12px",
      }}
    >
      <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 12 }}>
        {point.status.charAt(0).toUpperCase() + point.status.slice(1)}
      </p>
      <p style={{ color, margin: 0, fontWeight: 500 }}>count: {point.count}</p>
    </div>
  );
}

export default function StatusChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis
          dataKey="status"
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) =>
            value.charAt(0).toUpperCase() + value.slice(1)
          }
        />
        <YAxis hide />
        <Tooltip
          content={StatusTooltip}
          cursor={{ fill: "var(--border-color)", opacity: 0.3 }}
        />
        <Bar dataKey="count" shape={StatusBarShape} />
      </BarChart>
    </ResponsiveContainer>
  );
}
