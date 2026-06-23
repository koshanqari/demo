"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics";

function shortDate(s: string) {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
}

function fmtTick(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(n);
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 8, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00BBB4" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#00BBB4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gRead" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gClicked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickMargin={6}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={fmtTick}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              fontSize: 12,
            }}
            labelFormatter={(l) => `Date: ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="delivered"
            stroke="#00BBB4"
            strokeWidth={2}
            fill="url(#gDelivered)"
          />
          <Area
            type="monotone"
            dataKey="read"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#gRead)"
          />
          <Area
            type="monotone"
            dataKey="clicked"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gClicked)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
