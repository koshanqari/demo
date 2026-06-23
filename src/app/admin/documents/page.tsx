"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Database, Loader2, RefreshCcw, Upload } from "lucide-react";
import {
  DocumentsTable,
  type DocumentRow,
} from "@/components/admin/DocumentsTable";
import { SchemaDialog } from "@/components/admin/SchemaDialog";
import { DOCUMENTS_SCHEMA } from "@/lib/schemas";

export default function AdminDocumentsPage() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaOpen, setSchemaOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents");
      const data = await res.json();
      setRows(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(row: DocumentRow) {
    if (
      !confirm(
        `Delete "${row.title}"? This removes the PDF, all ${row.chunk_count.toLocaleString()} chunks, and the stored file. Cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/documents/${row.id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Delete failed");
    }
  }

  const stats = useMemo(() => {
    const pages = rows.reduce((a, r) => a + r.page_count, 0);
    const chunks = rows.reduce((a, r) => a + r.chunk_count, 0);
    const models = new Set(rows.map((r) => r.embed_model));
    return { count: rows.length, pages, chunks, models: models.size };
  }, [rows]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
            Data
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Documents</h1>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Indexed PDFs with their chunk counts and embed model.
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link
            href="/chatbot"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Upload className="h-3.5 w-3.5" /> Upload PDF
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4">
        <StatCard label="Total documents" value={stats.count.toLocaleString()} />
        <StatCard label="Pages indexed" value={stats.pages.toLocaleString()} />
        <StatCard
          label="Chunks (vectors)"
          value={stats.chunks.toLocaleString()}
          accent="text-brand-600"
        />
        <StatCard
          label="Embed models"
          value={String(stats.models)}
          accent="text-zinc-700"
        />
      </div>

      <div className="mt-5 sm:mt-6">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> loading…
          </div>
        ) : (
          <DocumentsTable rows={rows} onDelete={handleDelete} />
        )}
      </div>

      <SchemaDialog
        open={schemaOpen}
        onClose={() => setSchemaOpen(false)}
        schema={DOCUMENTS_SCHEMA}
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
