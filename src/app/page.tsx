import Image from "next/image";
import Link from "next/link";
import { FileText, BarChart3, Settings } from "lucide-react";

const tiles = [
  {
    href: "/chatbot",
    icon: FileText,
    title: "PDF Chatbot",
    desc: "Upload a brochure or policy doc and ask questions with source citations.",
  },
  {
    href: "/dashboard",
    icon: BarChart3,
    title: "Campaign Dashboard",
    desc: "WhatsApp campaign KPIs with an LLM-generated performance summary.",
  },
  {
    href: "/admin",
    icon: Settings,
    title: "Admin",
    desc: "Manage documents, chat logs, campaigns, and model settings.",
  },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="flex items-center gap-3">
          <Image
            src="/concentrix-logo.png"
            alt="Concentrix"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 sm:text-sm">
            Concentrix · Koshan Qari
          </p>
        </div>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Conversational answers. Campaign insight.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600 sm:mt-4 sm:text-lg dark:text-zinc-400">
          Ask questions of any uploaded PDF and get answers with source citations.
          Track WhatsApp campaign delivery, reads and clicks with an AI-written
          performance summary.
        </p>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition active:scale-[0.98] hover:border-brand-400 hover:shadow-md sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Icon className="h-6 w-6 text-brand-600" />
              <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
              <span className="mt-3 inline-block text-sm font-medium text-brand-600 group-hover:underline">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
