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
  data: { genre: string; count: number }[];
};

export default function GenreChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-text-secondary">No genre data yet.</p>;
  }

  return (
    // responsive container makers chart auto fill and resize
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="genre"
          width={90}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border-color)",
            borderRadius: 8,
          }}
        />
        <Bar dataKey="count" fill="var(--accent)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
