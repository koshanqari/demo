"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, MessageSquare, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export interface ChatCitation {
  marker: number;
  page: number;
  similarity: number;
  document_id: string;
  title: string;
  snippet: string;
}

export interface ChatLogRow {
  id: number;
  document_id: string | null;
  question: string;
  answer: string;
  citations: ChatCitation[];
  model: string;
  latency_ms: number;
  created_at: string;
  document: { title: string; filename: string } | null;
}

function truncate(s: string, n = 90) {
  return s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
}

function latencyColor(ms: number) {
  if (ms < 1500) return "text-brand-700 dark:text-brand-400";
  if (ms < 3500) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function ChatLogsTable({ rows }: { rows: ChatLogRow[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <MessageSquare className="mx-auto h-6 w-6 text-zinc-400" />
        <p className="mt-3 text-sm text-zinc-500">
          No chat logs yet. Ask a question in the chatbot — every Q&amp;A lands here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
            <th className="w-8 px-2 py-2.5"></th>
            <th className="px-3 py-2.5 font-medium">When</th>
            <th className="px-3 py-2.5 font-medium">Document</th>
            <th className="px-3 py-2.5 font-medium">Question</th>
            <th className="px-3 py-2.5 text-right font-medium">Cites</th>
            <th className="px-3 py-2.5 text-right font-medium">Latency</th>
            <th className="px-3 py-2.5 font-medium">Model</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((r) => {
            const open = expanded === r.id;
            return (
              <Fragment key={r.id}>
                <tr
                  className={cn(
                    "cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30",
                    open && "bg-zinc-50/60 dark:bg-zinc-800/30",
                  )}
                  onClick={() => setExpanded(open ? null : r.id)}
                >
                  <td className="px-2 py-2">
                    <span className="inline-flex rounded p-1 text-zinc-400">
                      {open ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(r.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2">
                    {r.document ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FileText className="h-3 w-3 shrink-0 text-zinc-400" />
                        <span className="truncate">{r.document.title}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">All documents</span>
                    )}
                  </td>
                  <td className="max-w-[28rem] px-3 py-2">
                    <div className="truncate">{truncate(r.question, 110)}</div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.citations?.length ?? 0}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular-nums",
                      latencyColor(r.latency_ms),
                    )}
                  >
                    {r.latency_ms.toLocaleString()} ms
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    {r.model}
                  </td>
                </tr>
                {open && (
                  <tr className="bg-zinc-50/60 dark:bg-zinc-800/30">
                    <td colSpan={7} className="px-4 py-4">
                      <ExpandedLog log={r} />
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

function ExpandedLog({ log }: { log: ChatLogRow }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <Section label="Question">
          <p className="text-sm">{log.question}</p>
        </Section>

        <Section label="Answer">
          <div className="prose prose-sm max-w-none break-words text-sm dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.answer}</ReactMarkdown>
          </div>
        </Section>
      </div>

      <div className="space-y-3">
        <Section label="Citations">
          {log.citations?.length ? (
            <ul className="space-y-2">
              {log.citations.map((c) => (
                <li
                  key={c.marker}
                  className="rounded-md border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex items-start gap-2 text-xs">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand-600 text-[10px] font-semibold text-white">
                      {c.marker}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{c.title}</span>
                        <span className="text-zinc-500">· page {c.page}</span>
                        <span className="text-zinc-400">· sim {c.similarity}</span>
                      </div>
                      {c.snippet && (
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {c.snippet}
                          {c.snippet.length === 240 && "…"}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">No citations.</p>
          )}
        </Section>

        <Section label="Raw row">
          <pre className="overflow-x-auto rounded-md bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-100">
            <code>{JSON.stringify(log, null, 2)}</code>
          </pre>
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}
