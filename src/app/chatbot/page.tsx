"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadCard } from "@/components/chatbot/UploadCard";
import { ChatPanel } from "@/components/chatbot/ChatPanel";

interface Doc {
  id: string;
  title: string;
  filename: string;
  page_count: number;
  chunk_count: number;
}

export default function ChatbotPage() {
  const [docs, setDocs] = useState<Doc[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocs(data.documents ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <Link href="/" className="flex items-center gap-1.5">
          <Image
            src="/concentrix-logo.png"
            alt="Concentrix"
            width={22}
            height={22}
            className="rounded-md"
          />
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Concentrix Bot
          </span>
        </Link>
      </div>
      <div className="mt-3 flex flex-col gap-1 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">PDF Chatbot</h1>
          <p className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Upload a PDF, then ask questions. Answers come with page-level citations.
          </p>
        </div>
        <div className="hidden text-xs text-zinc-500 sm:block">
          {docs.length} document{docs.length === 1 ? "" : "s"} indexed
        </div>
      </div>

      <div className="mt-4 grid flex-1 gap-4 sm:mt-6 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-3 sm:space-y-4">
          <UploadCard onUploaded={load} />
          <DocList docs={docs} />
        </aside>
        <ChatPanel documents={docs} reloadDocs={load} />
      </div>
    </main>
  );
}

function DocList({ docs }: { docs: Doc[] }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold">Indexed documents</h3>
        <p className="mt-2 text-xs text-zinc-500">No PDFs uploaded yet.</p>
      </div>
    );
  }
  return (
    <details
      className="group rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:open:block"
      open
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        Indexed documents
        <span className="text-xs font-normal text-zinc-500 group-open:hidden">
          {docs.length} · tap to expand
        </span>
        <span className="hidden text-xs font-normal text-zinc-500 group-open:inline">
          {docs.length}
        </span>
      </summary>
      <ul className="mt-3 space-y-2">
        {docs.map((d) => (
          <li
            key={d.id}
            className="rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-800"
          >
            <div className="truncate font-medium text-zinc-800 dark:text-zinc-100">
              {d.title}
            </div>
            <div className="text-zinc-500">
              {d.page_count} pages · {d.chunk_count} chunks
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
