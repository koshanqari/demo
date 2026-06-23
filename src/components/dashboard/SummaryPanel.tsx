"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Tone = "executive" | "detailed" | "casual";

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "executive", label: "Executive", hint: "Boardroom" },
  { value: "detailed", label: "Detailed", hint: "Analyst" },
  { value: "casual", label: "Casual", hint: "Slack" },
];

export function SummaryPanel({ days }: { days: number }) {
  const [tone, setTone] = useState<Tone>("executive");
  const [summary, setSummary] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(t: Tone = tone) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tone: t, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold sm:text-base">AI performance summary</h2>
        </div>
        {summary && (
          <button
            onClick={() => generate()}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline disabled:opacity-50 dark:text-brand-400"
          >
            <RefreshCcw className={cn("h-3 w-3", busy && "animate-spin")} /> Regenerate
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TONES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTone(t.value)}
            disabled={busy}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              tone === t.value
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300",
            )}
          >
            {t.label}
            <span className="ml-1 text-[10px] text-zinc-500">· {t.hint}</span>
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mt-4 min-h-[7rem] rounded-xl p-3.5 text-sm leading-relaxed",
          summary || busy || error
            ? "bg-zinc-50 dark:bg-zinc-800/60"
            : "bg-gradient-to-br from-brand-50 via-white to-brand-50/60 dark:from-brand-950/30 dark:via-zinc-900 dark:to-brand-950/20",
        )}
      >
        {busy ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> generating…
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : summary ? (
          <div className="prose prose-sm max-w-none break-words dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-4 text-center sm:py-6">
            <button
              onClick={() => generate()}
              className="animate-brand-pulse group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 sm:text-base"
            >
              <span
                aria-hidden
                className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 -inset-x-1 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              />
              <Sparkles className="relative h-4 w-4 sm:h-5 sm:w-5" />
              <span className="relative">Generate AI summary</span>
            </button>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Gemini will read the last {days} days of campaigns and write a plain-English
              summary in your selected tone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
