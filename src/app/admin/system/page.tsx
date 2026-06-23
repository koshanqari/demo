"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCcw,
  Sparkles,
  Sprout,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusResp {
  checked_at: string;
  all_ok: boolean;
  db: {
    ok: boolean;
    ms: number;
    error?: string;
    counts: Record<string, number>;
    total: number;
  };
  gemini: {
    ok: boolean;
    ms: number;
    error?: string;
    chat_model: string;
    embed_model: string;
  };
  storage: {
    ok: boolean;
    ms: number;
    error?: string;
    bucket_exists: boolean;
    object_count: number | null;
  };
}

type ResetTarget = "campaigns" | "documents" | "chat_logs" | "all";

export default function SystemPage() {
  const [status, setStatus] = useState<StatusResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedCount, setSeedCount] = useState(24);
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState<ResetTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system/status");
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function seed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count: seedCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      flash(`✓ Inserted ${data.inserted} demo campaigns.`);
      await refresh();
    } catch (e) {
      flash(`✗ ${e instanceof Error ? e.message : "Seed failed"}`);
    } finally {
      setSeeding(false);
    }
  }

  async function reset(target: ResetTarget, confirmText: string) {
    if (!confirm(confirmText)) return;
    setResetting(target);
    try {
      const res = await fetch("/api/admin/system/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      const cleared = Object.entries(data.cleared)
        .filter(([k]) => k !== "storage_purged")
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
      flash(`✓ Cleared ${cleared || "nothing (already empty)"}.`);
      await refresh();
    } catch (e) {
      flash(`✗ ${e instanceof Error ? e.message : "Reset failed"}`);
    } finally {
      setResetting(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Configuration
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">System</h1>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Connection health, demo seed, and danger-zone resets.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 sm:self-auto"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Re-run checks
        </button>
      </div>

      {toast && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {toast}
        </div>
      )}

      {/* Health checks */}
      <section className="mt-6">
        <SectionTitle icon={<Activity className="h-4 w-4" />}>Health</SectionTitle>
        {!status ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white py-12 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <Loader2 className="h-4 w-4 animate-spin" /> running checks…
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <HealthCard
              title="Supabase Postgres"
              ok={status.db.ok}
              ms={status.db.ms}
              error={status.db.error}
              detail={
                <div className="space-y-1">
                  {Object.entries(status.db.counts).map(([k, v]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-zinc-500">{k}</span>
                      <span>{v.toLocaleString()} rows</span>
                    </div>
                  ))}
                </div>
              }
            />
            <HealthCard
              title="Gemini AI"
              ok={status.gemini.ok}
              ms={status.gemini.ms}
              error={status.gemini.error}
              detail={
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">chat</span>
                    <span className="truncate">{status.gemini.chat_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">embed</span>
                    <span className="truncate">{status.gemini.embed_model}</span>
                  </div>
                </div>
              }
            />
            <HealthCard
              title="Storage bucket"
              ok={status.storage.ok}
              ms={status.storage.ms}
              error={status.storage.error}
              detail={
                <div className="font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">bucket</span>
                    <span>documents · public</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">objects</span>
                    <span>{status.storage.object_count ?? "—"}</span>
                  </div>
                </div>
              }
            />
          </div>
        )}
      </section>

      {/* Seed */}
      <section className="mt-8">
        <SectionTitle icon={<Sparkles className="h-4 w-4" />}>Demo data</SectionTitle>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <h3 className="text-sm font-semibold">Seed WhatsApp campaigns</h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Inserts realistic campaigns spread across the last 60 days with promo,
                transactional and engagement templates.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-zinc-500">Count</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={seedCount}
                  onChange={(e) =>
                    setSeedCount(Math.max(5, Math.min(60, Number(e.target.value))))
                  }
                  className="w-16 bg-transparent text-right tabular-nums outline-none"
                />
              </label>
              <button
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {seeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sprout className="h-3.5 w-3.5" />
                )}
                {seeding ? "Seeding…" : "Seed campaigns"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-8">
        <SectionTitle icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}>
          Danger zone
        </SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white dark:border-rose-900/40 dark:bg-zinc-900">
          <DangerRow
            title="Reset campaigns"
            desc="Delete every row from the campaigns table."
            buttonLabel="Reset campaigns"
            busy={resetting === "campaigns"}
            onClick={() =>
              reset(
                "campaigns",
                "Delete ALL campaigns? This cannot be undone.",
              )
            }
          />
          <DangerRow
            title="Reset documents"
            desc="Delete every PDF, all chunk embeddings, and purge the storage bucket."
            buttonLabel="Reset documents"
            busy={resetting === "documents"}
            onClick={() =>
              reset(
                "documents",
                "Delete ALL documents, their chunks, and the stored PDFs from Supabase Storage? This cannot be undone.",
              )
            }
          />
          <DangerRow
            title="Reset chat logs"
            desc="Delete every Q&A recorded by the chatbot."
            buttonLabel="Reset chat logs"
            busy={resetting === "chat_logs"}
            onClick={() =>
              reset(
                "chat_logs",
                "Delete ALL chat logs? This cannot be undone.",
              )
            }
          />
          <DangerRow
            title="Nuke everything"
            desc="Reset all four tables and purge storage. Useful before a fresh demo run."
            buttonLabel="Nuke everything"
            busy={resetting === "all"}
            destructive
            onClick={() =>
              reset(
                "all",
                "DELETE EVERYTHING — campaigns, documents, chunks, chat logs, and stored PDFs?",
              )
            }
          />
        </div>
      </section>
    </main>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
      {icon} {children}
    </h2>
  );
}

function HealthCard({
  title,
  ok,
  ms,
  error,
  detail,
}: {
  title: string;
  ok: boolean;
  ms: number;
  error?: string;
  detail: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1 text-xs font-medium",
              ok
                ? "text-brand-700 dark:text-brand-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {ok ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {ok ? "Connected" : "Error"} · {ms} ms
          </div>
        </div>
        <Database className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="mt-3 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
        {ok ? detail : <p className="break-words text-rose-600">{error}</p>}
      </div>
    </div>
  );
}

function DangerRow({
  title,
  desc,
  buttonLabel,
  busy,
  destructive,
  onClick,
}: {
  title: string;
  desc: string;
  buttonLabel: string;
  busy: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-rose-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/30">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h4>
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
      </div>
      <button
        onClick={onClick}
        disabled={busy}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50",
          destructive
            ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
            : "border-rose-200 bg-white text-rose-700 hover:border-rose-400 dark:border-rose-900/50 dark:bg-zinc-950 dark:text-rose-400 dark:hover:border-rose-700",
        )}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        {busy ? "Working…" : buttonLabel}
      </button>
    </div>
  );
}
