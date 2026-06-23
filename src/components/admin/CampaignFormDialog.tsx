"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Dialog } from "./Dialog";

export interface CampaignRow {
  id: string;
  name: string;
  template_name: string | null;
  sent_at: string;
  audience_size: number;
  delivered: number;
  read_count: number;
  clicked: number;
  replied: number;
  failed: number;
  source: "manual" | "csv" | "webhook";
  created_at: string;
}

type FormState = {
  name: string;
  template_name: string;
  sent_at: string; // datetime-local string
  audience_size: string;
  delivered: string;
  read_count: string;
  clicked: string;
  replied: string;
  failed: string;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyState(): FormState {
  return {
    name: "",
    template_name: "",
    sent_at: toLocalInput(new Date().toISOString()),
    audience_size: "10000",
    delivered: "9500",
    read_count: "7000",
    clicked: "1200",
    replied: "300",
    failed: "200",
  };
}

function fromRow(r: CampaignRow): FormState {
  return {
    name: r.name,
    template_name: r.template_name ?? "",
    sent_at: toLocalInput(r.sent_at),
    audience_size: String(r.audience_size),
    delivered: String(r.delivered),
    read_count: String(r.read_count),
    clicked: String(r.clicked),
    replied: String(r.replied),
    failed: String(r.failed),
  };
}

export function CampaignFormDialog({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: CampaignRow | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editing ? fromRow(editing) : emptyState());
      setError(null);
    }
  }, [open, editing]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        template_name: form.template_name.trim() || null,
        sent_at: new Date(form.sent_at).toISOString(),
        audience_size: Number(form.audience_size),
        delivered: Number(form.delivered),
        read_count: Number(form.read_count),
        clicked: Number(form.clicked),
        replied: Number(form.replied),
        failed: Number(form.failed),
        source: editing?.source ?? "manual",
      };
      const url = editing
        ? `/api/admin/campaigns/${editing.id}`
        : "/api/admin/campaigns";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit campaign" : "Add campaign"}
      description={
        editing
          ? `Editing ${editing.name}`
          : "Manually record a WhatsApp campaign and its funnel metrics."
      }
      size="lg"
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Campaign name" required>
            <input
              value={form.name}
              onChange={set("name")}
              required
              placeholder="Diwali Sale 2025"
              className="input"
            />
          </Field>
          <Field label="Template">
            <input
              value={form.template_name}
              onChange={set("template_name")}
              placeholder="festive_offer_v3"
              className="input"
            />
          </Field>
          <Field label="Sent at" required>
            <input
              type="datetime-local"
              value={form.sent_at}
              onChange={set("sent_at")}
              required
              className="input"
            />
          </Field>
          <Field label="Audience size" required>
            <input
              type="number"
              min={0}
              value={form.audience_size}
              onChange={set("audience_size")}
              required
              className="input"
            />
          </Field>
        </div>
        <fieldset className="grid gap-3 rounded-xl border border-zinc-200 p-3 sm:grid-cols-3 dark:border-zinc-800">
          <legend className="px-1 text-xs font-medium text-zinc-500">Funnel</legend>
          <Field label="Delivered">
            <input
              type="number"
              min={0}
              value={form.delivered}
              onChange={set("delivered")}
              className="input"
            />
          </Field>
          <Field label="Read">
            <input
              type="number"
              min={0}
              value={form.read_count}
              onChange={set("read_count")}
              className="input"
            />
          </Field>
          <Field label="Clicked">
            <input
              type="number"
              min={0}
              value={form.clicked}
              onChange={set("clicked")}
              className="input"
            />
          </Field>
          <Field label="Replied">
            <input
              type="number"
              min={0}
              value={form.replied}
              onChange={set("replied")}
              className="input"
            />
          </Field>
          <Field label="Failed">
            <input
              type="number"
              min={0}
              value={form.failed}
              onChange={set("failed")}
              className="input"
            />
          </Field>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Save changes" : "Create campaign"}
          </button>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border-width: 1px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background-color: white;
          border-color: #e4e4e7;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #00BBB4;
        }
        @media (prefers-color-scheme: dark) {
          :global(.input) {
            background-color: #18181b;
            border-color: #3f3f46;
            color: #fafafa;
          }
        }
      `}</style>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
