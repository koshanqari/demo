"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CampaignPerf } from "@/lib/analytics";

function shortName(s: string, len = 22) {
  return s.length > len ? s.slice(0, len - 1) + "…" : s;
}

export function PerformanceChart({ data }: { data: CampaignPerf[] }) {
  const top = [...data]
    .sort((a, b) => b.readRate - a.readRate)
    .slice(0, 8)
    .map((d) => ({
      name: shortName(d.name),
      fullName: d.name,
      readRate: d.readRate,
      ctr: d.ctr,
    }));

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#52525b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={140}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              fontSize: 12,
            }}
            formatter={(v) => `${v}%`}
            labelFormatter={(_l, p) =>
              (p?.[0]?.payload as { fullName?: string } | undefined)?.fullName ?? ""
            }
          />
          <Bar dataKey="readRate" name="Read rate" radius={[0, 6, 6, 0]}>
            {top.map((_, i) => (
              <Cell key={i} fill="#0ea5e9" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
