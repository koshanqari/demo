"use client";

import { Fragment, useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignRow } from "./CampaignFormDialog";

const SOURCE_STYLE: Record<string, string> = {
  manual: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  csv: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  webhook: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

export function CampaignsTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: CampaignRow[];
  onEdit: (row: CampaignRow) => void;
  onDelete: (row: CampaignRow) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        No campaigns yet. Add one manually, upload a CSV, or seed demo data.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
            <th className="w-8 px-2 py-2.5"></th>
            <th className="px-3 py-2.5 font-medium">Campaign</th>
            <th className="px-3 py-2.5 font-medium">Sent</th>
            <th className="px-3 py-2.5 text-right font-medium">Audience</th>
            <th className="px-3 py-2.5 text-right font-medium">Delivered</th>
            <th className="px-3 py-2.5 text-right font-medium">Read</th>
            <th className="px-3 py-2.5 text-right font-medium">Click</th>
            <th className="px-3 py-2.5 text-right font-medium">Reply</th>
            <th className="px-3 py-2.5 text-right font-medium">Failed</th>
            <th className="px-3 py-2.5 font-medium">Source</th>
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
                  <td className="max-w-[14rem] truncate px-3 py-2 font-medium">
                    {r.name}
                    {r.template_name && (
                      <div className="truncate font-mono text-[10px] text-zinc-500">
                        {r.template_name}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(r.sent_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.audience_size.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.delivered.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.read_count.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.clicked.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.replied.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-rose-600">
                    {r.failed.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        SOURCE_STYLE[r.source] ?? SOURCE_STYLE.manual,
                      )}
                    >
                      {r.source}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button
                      onClick={() => onEdit(r)}
                      aria-label="Edit"
                      className="mr-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => onDelete(r)}
                      aria-label="Delete"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="bg-zinc-50/60 dark:bg-zinc-800/30">
                    <td colSpan={11} className="px-4 py-3">
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
