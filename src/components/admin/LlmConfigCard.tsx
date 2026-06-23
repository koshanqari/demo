"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, RotateCcw, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Active {
  api_key_masked: string;
  chat_model: string;
  embed_model: string;
  source: "db" | "env" | "mixed";
}

interface Config {
  active: Active;
  has_db_key: boolean;
  has_db_chat_model: boolean;
  has_db_embed_model: boolean;
  updated_at: string | null;
  options: { chat_models: string[]; embed_models: string[] };
}

const SOURCE_LABEL: Record<Active["source"], { text: string; tone: string }> = {
  db: { text: "DB override", tone: "bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300" },
  mixed: { text: "Mixed (DB + env)", tone: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  env: { text: "From .env.local", tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function LlmConfigCard({ onSaved }: { onSaved?: () => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [chatModel, setChatModel] = useState("");
  const [embedModel, setEmbedModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings/llm");
    const data: Config = await res.json();
    setConfig(data);
    setChatModel(data.active.chat_model);
    setEmbedModel(data.active.embed_model);
    setApiKey("");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(kind: "ok" | "err", text: string) {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const payload: Record<string, string> = {
        chat_model: chatModel,
        embed_model: embedModel,
      };
      if (apiKey.trim()) payload.api_key = apiKey.trim();
      const res = await fetch("/api/admin/settings/llm", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      flash("ok", "Saved. Active config updated.");
      await load();
      onSaved?.();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetToEnv() {
    if (!confirm("Reset stored config? The app will fall back to .env.local values.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/settings/llm", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      flash("ok", "Reset. Now using .env.local values.");
      await load();
      onSaved?.();
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  if (!config) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> loading config…
        </div>
      </div>
    );
  }

  const sourceBadge = SOURCE_LABEL[config.active.source];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Gemini configuration
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Bring your own API key and pick which models the app uses. Falls back to{" "}
            <code className="font-mono">.env.local</code> when fields are empty.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
            sourceBadge.tone,
          )}
        >
          Active: {sourceBadge.text}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field
          label="Gemini API key"
          hint={
            config.has_db_key
              ? `Currently using stored key (${config.active.api_key_masked}). Leave blank to keep it.`
              : `Using env key (${config.active.api_key_masked || "none set"}). Paste a key to override.`
          }
        >
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config.has_db_key ? "•••• stored ••••" : "AIza…"}
              autoComplete="off"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-brand-500 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              aria-label={showKey ? "Hide" : "Show"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </Field>

        <Field
          label="Chat model"
          hint="Used by the chatbot and the AI summary."
        >
          <select
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {config.options.chat_models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Embedding model"
          hint="Used during PDF upload to vectorize chunks."
        >
          <select
            value={embedModel}
            onChange={(e) => setEmbedModel(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            {config.options.embed_models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:row-start-2">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            Changing the embed model affects new uploads only. Existing chunks were embedded with
            the model they were uploaded with.
          </p>
        </div>
      </div>

      {msg && (
        <p
          className={cn(
            "mt-4 text-sm",
            msg.kind === "ok" ? "text-brand-700 dark:text-brand-400" : "text-rose-600",
          )}
        >
          {msg.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="text-xs text-zinc-500">
          {config.updated_at
            ? `Last saved ${new Date(config.updated_at).toLocaleString()}`
            : "No DB override saved yet."}
        </div>
        <div className="flex flex-wrap gap-2">
          {(config.has_db_key || config.has_db_chat_model || config.has_db_embed_model) && (
            <button
              onClick={resetToEnv}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Reset to env
            </button>
          )}
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save configuration
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-500 break-words">{hint}</span>
      )}
    </label>
  );
}
