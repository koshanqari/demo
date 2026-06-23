import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Send,
  Activity,
  ArrowUpRight,
} from "lucide-react";

const sections = [
  {
    href: "/admin/documents",
    icon: FileText,
    title: "Documents",
    desc: "Browse indexed PDFs and re-index when source content changes.",
  },
  {
    href: "/admin/chats",
    icon: MessageSquare,
    title: "Chat logs",
    desc: "Every Q&A with the chatbot — question, answer, citations, latency.",
  },
  {
    href: "/admin/campaigns",
    icon: Send,
    title: "Campaigns",
    desc: "Manual entry, CSV upload, and schema reference for WhatsApp metrics.",
  },
  {
    href: "/admin/system",
    icon: Activity,
    title: "System",
    desc: "Health checks, demo seed, and danger-zone resets.",
  },
];

export default function AdminHome() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          Admin
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Overview</h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
          Operational console for the demo product. Pick a section from the sidebar or below.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-brand-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <s.icon className="mt-0.5 h-5 w-5 text-brand-600" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{s.title}</h2>
                <ArrowUpRight className="h-4 w-4 text-zinc-400 transition group-hover:text-brand-600" />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
