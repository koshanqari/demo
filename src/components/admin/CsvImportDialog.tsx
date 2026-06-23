"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Dialog } from "./Dialog";

const SAMPLE_CSV = `name,template_name,sent_at,audience_size,delivered,read_count,clicked,replied,failed
Diwali Sale 2025,festive_offer_v3,2025-10-21,42000,40900,29800,5200,1200,800
Welcome Onboarding,welcome_v2,2025-10-22,8500,8410,7300,2200,500,90
Cart Abandonment,cart_v4,2025-10-23,15000,14100,9800,1600,400,520
`;

interface Result {
  inserted: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  headers_detected: string[];
}

export function CsvImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setResult(null);
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/campaigns/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaigns-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Upload CSV"
      description="Bulk-import WhatsApp campaign metrics. Headers are auto-mapped (case-insensitive)."
      size="lg"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Expected columns</div>
          <div className="mt-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
            name, template_name, sent_at, audience_size, delivered, read_count, clicked, replied,
            failed
          </div>
          <div className="mt-2 text-zinc-500">
            Only <code className="font-mono">name</code> is required. Aliases like{" "}
            <code>read</code>, <code>opens</code>, <code>clicks</code>, <code>replies</code> are
            auto-detected.
          </div>
          <button
            onClick={downloadSample}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
          >
            <Download className="h-3.5 w-3.5" /> Download sample CSV
          </button>
        </div>

        <input
          ref={ref}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
            setError(null);
            e.target.value = "";
          }}
        />
        <div
          className="rounded-xl border-2 border-dashed border-zinc-300 p-5 text-center dark:border-zinc-700"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) {
              setFile(f);
              setResult(null);
              setError(null);
            }
          }}
        >
          {file ? (
            <div>
              <div className="text-sm font-medium">{file.name}</div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={() => setFile(null)}
                className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                choose another
              </button>
            </div>
          ) : (
            <button
              onClick={() => ref.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Upload className="h-4 w-4" /> Choose CSV
            </button>
          )}
          <p className="mt-2 text-xs text-zinc-500">or drag &amp; drop a CSV here</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm dark:border-brand-900/50 dark:bg-brand-950/30">
            <div className="font-medium text-brand-800 dark:text-brand-300">
              Imported {result.inserted} campaign{result.inserted === 1 ? "" : "s"}
              {result.skipped > 0 && ` · skipped ${result.skipped}`}
            </div>
            <div className="mt-1 text-xs text-brand-700/80 dark:text-brand-400/80">
              Detected columns:{" "}
              <code className="font-mono">{result.headers_detected.join(", ")}</code>
            </div>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-amber-700 dark:text-amber-400">
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li>…and {result.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {result ? "Done" : "Cancel"}
          </button>
          <button
            onClick={upload}
            disabled={!file || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import
          </button>
        </div>
      </div>
    </Dialog>
  );
}
