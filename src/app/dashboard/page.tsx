"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, Sprout } from "lucide-react";
import type {
  Campaign,
  CampaignKpis,
  CampaignPerf,
  TrendPoint,
} from "@/lib/analytics";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { SummaryPanel } from "@/components/dashboard/SummaryPanel";
import { cn } from "@/lib/utils";

interface ApiResp {
  days: number;
  campaigns: Campaign[];
  kpis: CampaignKpis;
  trend: TrendPoint[];
  performance: CampaignPerf[];
}

const RANGES = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 60, label: "60d" },
  { value: 90, label: "90d" },
];

export default function DashboardPage() {
  const [days, setDays] = useState(60);
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns?days=${days}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  async function seed() {
    setSeeding(true);
    try {
      await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count: 24 }),
      });
      await load();
    } finally {
      setSeeding(false);
    }
  }

  const empty = !loading && (!data || data.campaigns.length === 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <Link href="/" className="flex items-center gap-1.5">
          <Image
            src="/concentrix-logo.png"
            alt="Concentrix"
            width={22}
            height={22}
            className="rounded-md"
          />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Concentrix Bot
          </span>
        </Link>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            WhatsApp Campaign Dashboard
          </h1>
          <p className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Live KPIs across delivered, read, click and reply funnels — with a Gemini-written
            performance summary.
          </p>
        </div>
        <DateRange days={days} setDays={setDays} />
      </div>

      {loading && !data && (
        <div className="mt-12 flex items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> loading…
        </div>
      )}

      {empty && (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Sprout className="mx-auto h-8 w-8 text-brand-600" />
          <h2 className="mt-3 text-base font-semibold">No campaigns yet</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Seed 24 realistic WhatsApp campaigns to explore the dashboard end-to-end.
          </p>
          <button
            onClick={seed}
            disabled={seeding}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sprout className="h-4 w-4" />
            )}
            {seeding ? "Seeding…" : "Seed demo data"}
          </button>
        </div>
      )}

      {data && data.campaigns.length > 0 && (
        <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
          <KpiStrip kpis={data.kpis} />

          <SummaryPanel days={days} />

          <div className="grid gap-5 lg:grid-cols-5">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 lg:col-span-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold sm:text-base">Funnel over time</h2>
                <span className="text-xs text-zinc-500">{data.trend.length} days</span>
              </div>
              <TrendChart data={data.trend} />
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold sm:text-base">Top campaigns by read rate</h2>
                <span className="text-xs text-zinc-500">top {Math.min(8, data.performance.length)}</span>
              </div>
              <PerformanceChart data={data.performance} />
            </section>
          </div>

          <CampaignsTable rows={data.performance.slice(0, 10)} />
        </div>
      )}
    </main>
  );
}

function DateRange({
  days,
  setDays,
}: {
  days: number;
  setDays: (d: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <Calendar className="ml-1.5 h-3.5 w-3.5 text-zinc-500" />
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => setDays(r.value)}
          className={cn(
            "rounded-lg px-2.5 py-1 font-medium transition",
            days === r.value
              ? "bg-brand-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function CampaignsTable({ rows }: { rows: CampaignPerf[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold sm:text-base">Recent campaigns</h2>
        <span className="text-xs text-zinc-500">latest {rows.length}</span>
      </div>
      <div className="-mx-1 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
              <th className="px-2 py-2 font-medium">Campaign</th>
              <th className="px-2 py-2 text-right font-medium">Audience</th>
              <th className="px-2 py-2 text-right font-medium">Delivered</th>
              <th className="px-2 py-2 text-right font-medium">Read</th>
              <th className="px-2 py-2 text-right font-medium">CTR</th>
              <th className="px-2 py-2 text-right font-medium">Reply</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="max-w-[12rem] truncate px-2 py-2 font-medium">
                  {r.name}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                  {r.audience_size.toLocaleString()}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{r.deliveryRate}%</td>
                <td className="px-2 py-2 text-right tabular-nums">{r.readRate}%</td>
                <td className="px-2 py-2 text-right tabular-nums">{r.ctr}%</td>
                <td className="px-2 py-2 text-right tabular-nums">{r.replyRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
