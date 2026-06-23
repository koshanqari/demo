"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

interface Props {
  onUploaded: () => void;
}

export function UploadCard({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setStatus(`Parsing & embedding ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStatus(
        `✓ "${data.title}" — ${data.pages} pages, ${data.chunks} chunks indexed.`,
      );
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed bg-white p-4 text-center transition sm:p-6 dark:bg-zinc-900 ${
        dragging
          ? "border-brand-500 bg-brand-50/40 dark:bg-brand-950/20"
          : "border-zinc-300 hover:border-brand-400 dark:border-zinc-700"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? "Indexing…" : "Upload PDF"}
      </button>
      <p className="mt-2 text-xs text-zinc-500">or drag &amp; drop a PDF here</p>
      {status && (
        <p className="mt-3 break-words text-sm text-brand-600">{status}</p>
      )}
      {error && <p className="mt-3 break-words text-sm text-red-600">{error}</p>}
    </div>
  );
}
