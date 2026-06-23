"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DocumentRow {
  id: string;
  title: string;
  filename: string;
  storage_path: string;
  page_count: number;
  chunk_count: number;
  embed_model: string;
  status: string;
  created_at: string;
}

export function DocumentsTable({
  rows,
  onDelete,
}: {
  rows: DocumentRow[];
  onDelete: (row: DocumentRow) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        No PDFs indexed yet. Upload one from the chatbot to populate this list.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
            <th className="w-8 px-2 py-2.5"></th>
            <th className="px-3 py-2.5 font-medium">Document</th>
            <th className="px-3 py-2.5 text-right font-medium">Pages</th>
            <th className="px-3 py-2.5 text-right font-medium">Chunks</th>
            <th className="px-3 py-2.5 font-medium">Embed model</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Uploaded</th>
            <th className="px-3 py-2.5 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => {
            const open = expanded === r.id;
            return (
              <Fragment key={r.id}>
                <tr
                  className={cn(
                    "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30",
                    open && "bg-zinc-50/60 dark:bg-zinc-800/30",
                  )}
                >
                  <td className="px-2 py-2">
                    <button
                      onClick={() => setExpanded(open ? null : r.id)}
                      aria-label={open ? "Collapse" : "Expand"}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    >
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="max-w-[18rem] truncate px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.title}</div>
                        <div className="truncate font-mono text-[10px] text-zinc-500">
                          {r.filename}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.page_count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.chunk_count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    {r.embed_model}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        r.status === "ready"
                          ? "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(r.created_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      onClick={() => onDelete(r)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="bg-zinc-50/60 dark:bg-zinc-800/30">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        Raw row (as stored in Postgres)
                      </div>
                      <pre className="mt-1.5 overflow-x-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
                        <code>{JSON.stringify(r, null, 2)}</code>
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
