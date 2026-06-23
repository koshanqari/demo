"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Citation {
  marker: number;
  page: number;
  similarity: number;
  document_id: string;
  title: string;
  snippet: string;
}

interface Doc {
  id: string;
  title: string;
  filename: string;
  page_count: number;
  chunk_count: number;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  latency?: number;
}

export function ChatPanel({
  documents,
  reloadDocs,
}: {
  documents: Doc[];
  reloadDocs: () => void;
}) {
  const [docId, setDocId] = useState<string | "">("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, documentId: docId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          latency: data.latency_ms,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `**Error:** ${e instanceof Error ? e.message : "Something went wrong"}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[70dvh] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:h-[calc(100dvh-12rem)]">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2.5 sm:px-4 sm:py-3 dark:border-zinc-800">
        <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
        <select
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          className="min-w-0 flex-1 truncate rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">All documents</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title} ({d.page_count}p)
            </option>
          ))}
        </select>
        <button
          onClick={reloadDocs}
          className="shrink-0 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          refresh
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4 sm:py-4"
      >
        {messages.length === 0 && (
          <div className="mx-auto mt-8 max-w-md px-2 text-center text-sm text-zinc-500 sm:mt-12">
            Ask a question about your uploaded document. Try{" "}
            <em>&quot;summarize the key points&quot;</em> or{" "}
            <em>&quot;what does it say about pricing?&quot;</em>
          </div>
        )}
        <div className="space-y-3 sm:space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> thinking…
            </div>
          )}
        </div>
      </div>

      <form
        className="flex gap-2 border-t border-zinc-200 p-2.5 pb-safe sm:p-3 dark:border-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={documents.length ? "Ask a question…" : "Upload a PDF first"}
          disabled={busy || documents.length === 0}
          enterKeyHint="send"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none focus:border-brand-500 disabled:opacity-50 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:px-4"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[85%] sm:px-4 sm:py-3",
          isUser
            ? "bg-brand-600 text-white"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        )}
      >
        <div className="prose prose-sm max-w-none break-words dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
        </div>
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-2.5 border-t border-zinc-300/50 pt-2 dark:border-zinc-700">
            <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Sources
            </div>
            <ul className="mt-1 space-y-1">
              {msg.citations.map((c) => (
                <li
                  key={c.marker}
                  className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand-600 text-[10px] font-semibold text-white">
                    {c.marker}
                  </span>
                  <span className="min-w-0 break-words">
                    <span className="font-medium">{c.title}</span> · p.{c.page} ·{" "}
                    <span className="text-zinc-400">sim {c.similarity}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {msg.latency !== undefined && (
          <div className="mt-1.5 text-[10px] text-zinc-400">{msg.latency} ms</div>
        )}
      </div>
    </div>
  );
}
