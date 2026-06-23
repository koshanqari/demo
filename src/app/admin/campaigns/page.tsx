"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  Loader2,
  Plus,
  RefreshCcw,
  Sprout,
  Upload,
} from "lucide-react";
import { CampaignFormDialog, type CampaignRow } from "@/components/admin/CampaignFormDialog";
import { CsvImportDialog } from "@/components/admin/CsvImportDialog";
import { SchemaDialog } from "@/components/admin/SchemaDialog";
import { CampaignsTable } from "@/components/admin/CampaignsTable";
import { CAMPAIGNS_SCHEMA } from "@/lib/schemas";

export default function AdminCampaignsPage() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [editing, setEditing] = useState<CampaignRow | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      setRows(data.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row: CampaignRow) {
    if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/campaigns/${row.id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Delete failed");
    }
  }

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

  const stats = useMemo(() => {
    const bySource: Record<string, number> = { manual: 0, csv: 0, webhook: 0 };
    let audience = 0;
    for (const r of rows) {
      bySource[r.source] = (bySource[r.source] ?? 0) + 1;
      audience += r.audience_size;
    }
    return { count: rows.length, bySource, audience };
  }, [rows]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Campaigns</h1>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            View, edit, and ingest WhatsApp campaign data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSchemaOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <Database className="h-3.5 w-3.5" /> Schema
          </button>
          <button
            onClick={load}
            disabled={loading}
            aria-label="Refresh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setCsvOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <Upload className="h-3.5 w-3.5" /> Upload CSV
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add campaign
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4">
        <StatCard label="Total campaigns" value={stats.count.toLocaleString()} />
        <StatCard
          label="Total audience"
          value={stats.audience.toLocaleString()}
        />
        <StatCard label="Manual" value={String(stats.bySource.manual ?? 0)} accent="text-zinc-700" />
        <StatCard
          label="CSV ingested"
          value={String(stats.bySource.csv ?? 0)}
          accent="text-sky-600"
        />
      </div>

      <div className="mt-5 sm:mt-6">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Sprout className="mx-auto h-7 w-7 text-brand-600" />
            <h2 className="mt-3 text-base font-semibold">No campaigns yet</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Add manually, upload a CSV, or seed 24 demo campaigns to get started.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add manually
              </button>
              <button
                onClick={() => setCsvOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              >
                <Upload className="h-3.5 w-3.5" /> Upload CSV
              </button>
              <button
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-600"
              >
                {seeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sprout className="h-3.5 w-3.5" />
                )}{" "}
                Seed demo
              </button>
            </div>
          </div>
        ) : (
          <CampaignsTable
            rows={rows}
            onEdit={(r) => {
              setEditing(r);
              setFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      <CampaignFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSaved={load}
      />
      <CsvImportDialog
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImported={load}
      />
      <SchemaDialog
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        schema={CAMPAIGNS_SCHEMA}
      />
    </main>
  );
}

function StatCard({
  label,
  value,
  accent = "text-zinc-900 dark:text-zinc-100",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold sm:text-2xl ${accent}`}>{value}</div>
    </div>
  );
}
