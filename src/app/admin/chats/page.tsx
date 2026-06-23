"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, FileText, Loader2, RefreshCcw } from "lucide-react";
import { ChatLogsTable, type ChatLogRow } from "@/components/admin/ChatLogsTable";
import { SchemaDialog } from "@/components/admin/SchemaDialog";
import { CHAT_LOGS_SCHEMA } from "@/lib/schemas";

interface DocOpt {
  id: string;
  title: string;
}

export default function AdminChatsPage() {
  const [rows, setRows] = useState<ChatLogRow[]>([]);
  const [docs, setDocs] = useState<DocOpt[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter && filter !== "all") params.set("document_id", filter);
      const [logsRes, docsRes] = await Promise.all([
        fetch(`/api/admin/chats?${params.toString()}`),
        fetch("/api/admin/documents"),
      ]);
      const logsJson = await logsRes.json();
      const docsJson = await docsRes.json();
      setRows(logsJson.logs ?? []);
      setDocs(
        (docsJson.documents ?? []).map((d: { id: string; title: string }) => ({
          id: d.id,
          title: d.title,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    if (!rows.length) {
      return { count: 0, avg: 0, totalCites: 0, uniqueDocs: 0 };
    }
    const total = rows.reduce((a, r) => a + r.latency_ms, 0);
    const totalCites = rows.reduce((a, r) => a + (r.citations?.length ?? 0), 0);
    const uniqueDocs = new Set(rows.map((r) => r.document_id).filter(Boolean)).size;
    return {
      count: rows.length,
      avg: Math.round(total / rows.length),
      totalCites,
      uniqueDocs,
    };
  }, [rows]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Chat logs</h1>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Every Q&amp;A with the chatbot — useful for evaluating retrieval quality.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
            <FileText className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-xs outline-none"
            >
              <option value="all">All conversations</option>
              <option value="none">Cross-document only</option>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSchemaOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <Database className="h-3.5 w-3.5" /> Schema
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4">
        <StatCard label="Conversations" value={stats.count.toLocaleString()} />
        <StatCard
          label="Avg latency"
          value={`${stats.avg.toLocaleString()} ms`}
          accent="text-brand-600"
        />
        <StatCard label="Total citations" value={stats.totalCites.toLocaleString()} />
        <StatCard
          label="Documents touched"
          value={String(stats.uniqueDocs)}
          accent="text-zinc-700"
        />
      </div>

      <div className="mt-5 sm:mt-6">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> loading…
          </div>
        ) : (
          <ChatLogsTable rows={rows} />
        )}
      </div>

      <SchemaDialog
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        schema={CHAT_LOGS_SCHEMA}
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
